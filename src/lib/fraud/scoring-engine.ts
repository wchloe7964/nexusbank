import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'
import type { FraudDecision } from '@/lib/types/fraud'

interface ScoringInput {
  userId: string
  transactionId?: string
  amount: number
  counterpartyName?: string
  isNewPayee?: boolean
}

interface ScoringResult {
  score: number
  decision: FraudDecision
  factors: { rule: string; points: number; description: string }[]
}

/**
 * Score a transaction against active fraud rules.
 * Score 0–100: 0–30 = allow, 31–60 = review, 61+ = block
 */
export async function scoreFraud(input: ScoringInput): Promise<ScoringResult> {
  const admin = createAdminClient()
  const factors: ScoringResult['factors'] = []
  let score = 0

  // Fetch active rules
  const { data: rules } = await admin
    .from('fraud_rules')
    .select('*')
    .eq('is_active', true)

  if (!rules) return { score: 0, decision: 'allow', factors: [] }

  // Get user's accounts for queries
  const { data: accounts } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', input.userId)

  const accountIds = (accounts ?? []).map((a: { id: string }) => a.id)

  for (const rule of rules) {
    const conditions = rule.conditions as Record<string, number>

    if (rule.rule_type === 'velocity' && accountIds.length > 0) {
      const windowMinutes = conditions.window_minutes || 60
      const maxTx = conditions.max_transactions || 5
      const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()

      const { count } = await admin
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .in('account_id', accountIds)
        .gte('created_at', since)

      if ((count ?? 0) >= maxTx) {
        score += rule.weight
        factors.push({
          rule: rule.name,
          points: rule.weight,
          description: `${(count ?? 0) + 1} transactions in ${windowMinutes} minutes (limit: ${maxTx})`,
        })
      }
    }

    if (rule.rule_type === 'amount' && conditions.threshold) {
      if (input.amount >= conditions.threshold) {
        score += rule.weight
        factors.push({
          rule: rule.name,
          points: rule.weight,
          description: `Amount £${input.amount.toLocaleString()} exceeds £${conditions.threshold.toLocaleString()} threshold`,
        })
      }
    }

    if (rule.rule_type === 'amount' && conditions.multiplier && accountIds.length > 0) {
      const { data: avgData } = await admin
        .from('transactions')
        .select('amount')
        .in('account_id', accountIds)
        .eq('type', 'debit')
        .order('created_at', { ascending: false })
        .limit(50)

      if (avgData && avgData.length > 0) {
        const avg = avgData.reduce((s: number, t: { amount: number }) => s + t.amount, 0) / avgData.length
        if (input.amount > avg * conditions.multiplier) {
          score += rule.weight
          factors.push({
            rule: rule.name,
            points: rule.weight,
            description: `Amount £${input.amount.toLocaleString()} is ${(input.amount / avg).toFixed(1)}x average (£${avg.toFixed(0)})`,
          })
        }
      }
    }

    if (rule.rule_type === 'behavioural' && input.isNewPayee && conditions.amount_threshold) {
      if (input.amount >= conditions.amount_threshold) {
        score += rule.weight
        factors.push({
          rule: rule.name,
          points: rule.weight,
          description: `Large payment of £${input.amount.toLocaleString()} to new payee`,
        })
      }
    }

    if (rule.rule_type === 'time_based') {
      const hour = new Date().getHours()
      if (hour >= (conditions.start_hour || 1) && hour < (conditions.end_hour || 5)) {
        score += rule.weight
        factors.push({
          rule: rule.name,
          points: rule.weight,
          description: `Transaction at unusual hour (${hour}:00)`,
        })
      }
    }
  }

  score = Math.min(score, 100)
  const decision: FraudDecision = score >= 61 ? 'block' : score >= 31 ? 'review' : 'allow'

  // Persist the score
  await admin.from('fraud_scores').insert({
    transaction_id: input.transactionId || null,
    user_id: input.userId,
    score,
    decision,
    factors,
  })

  // Create case if blocked
  if (decision === 'block') {
    await admin.from('fraud_cases').insert({
      user_id: input.userId,
      status: 'open',
      priority: score >= 80 ? 'critical' : 'high',
      description: `Auto-blocked transaction of £${input.amount.toLocaleString()}. Score: ${score}/100.`,
      amount_at_risk: input.amount,
    })
  }

  if (decision !== 'allow') {
    await logAuditEvent({
      eventType: 'fraud_event',
      actorId: input.userId,
      actorRole: 'customer',
      targetTable: 'transactions',
      targetId: input.transactionId || null,
      action: decision === 'block' ? 'transaction_blocked' : 'transaction_flagged',
      details: { score, decision, factor_count: factors.length, amount: input.amount },
    })
  }

  return { score, decision, factors }
}
