import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'

interface TransactionCheck {
  userId: string
  transactionId?: string
  amount: number
  counterpartyName?: string
  type: 'credit' | 'debit'
}

interface AmlCheckResult {
  passed: boolean
  alerts: {
    alertType: string
    severity: string
    reason: string
  }[]
}

/**
 * AML rule checks run before payments/transfers.
 * Creates AML alerts for any triggered rules.
 */
export async function checkTransaction(tx: TransactionCheck): Promise<AmlCheckResult> {
  const alerts: AmlCheckResult['alerts'] = []

  // Rule 1: Large transaction (>£10,000 — UK threshold)
  if (tx.amount >= 10000) {
    alerts.push({
      alertType: 'large_transaction',
      severity: tx.amount >= 50000 ? 'critical' : 'high',
      reason: `Transaction of £${tx.amount.toLocaleString()} exceeds £10,000 reporting threshold`,
    })
  }

  // Rule 2: Velocity check (>5 transactions in 1 hour)
  const admin = createAdminClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data: accountData } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', tx.userId)

  if (accountData && accountData.length > 0) {
    const accountIds = accountData.map((a: { id: string }) => a.id)
    const { count: recentTxCount } = await admin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .in('account_id', accountIds)
      .gte('created_at', oneHourAgo)

    if ((recentTxCount ?? 0) >= 5) {
      alerts.push({
        alertType: 'velocity',
        severity: 'medium',
        reason: `${(recentTxCount ?? 0) + 1} transactions in the last hour (threshold: 5)`,
      })
    }
  }

  // Rule 3: Structuring detection (multiple transactions just under £10k)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  if (accountData && accountData.length > 0 && tx.amount >= 8000 && tx.amount < 10000) {
    const accountIds = accountData.map((a: { id: string }) => a.id)
    const { count: nearThresholdCount } = await admin
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .in('account_id', accountIds)
      .gte('amount', 8000)
      .lt('amount', 10000)
      .gte('created_at', oneDayAgo)

    if ((nearThresholdCount ?? 0) >= 2) {
      alerts.push({
        alertType: 'structuring',
        severity: 'high',
        reason: `Possible structuring: ${(nearThresholdCount ?? 0) + 1} transactions between £8k-£10k in 24 hours`,
      })
    }
  }

  // Persist alerts to database
  if (alerts.length > 0) {
    for (const alert of alerts) {
      await admin.from('aml_alerts').insert({
        user_id: tx.userId,
        transaction_id: tx.transactionId || null,
        alert_type: alert.alertType,
        severity: alert.severity,
        trigger_amount: tx.amount,
        trigger_data: {
          counterparty: tx.counterpartyName,
          type: tx.type,
          reason: alert.reason,
        },
        status: 'new',
      })
    }

    await logAuditEvent({
      eventType: 'compliance_event',
      actorId: tx.userId,
      actorRole: 'customer',
      targetTable: 'aml_alerts',
      targetId: tx.transactionId || null,
      action: 'aml_alerts_triggered',
      details: {
        alert_count: alerts.length,
        amount: tx.amount,
        types: alerts.map((a) => a.alertType),
      },
    })
  }

  return {
    // Block only on critical severity
    passed: !alerts.some((a) => a.severity === 'critical'),
    alerts,
  }
}
