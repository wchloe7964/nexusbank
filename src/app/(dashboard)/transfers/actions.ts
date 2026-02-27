'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership } from '@/lib/validation'
import { scoreFraud } from '@/lib/fraud/scoring-engine'
import { checkTransaction } from '@/lib/kyc/aml-monitor'
import { logAuditEvent } from '@/lib/audit'
import { checkTransactionLimits, getUserKycLevel } from '@/lib/limits/check-limits'
import { requiresSca, isScaChallengeVerified } from '@/lib/sca/sca-service'

export async function executeTransfer(data: {
  fromAccountId: string
  toAccountId: string
  amount: number
  reference?: string
  scaChallengeId?: string
}): Promise<{
  success: boolean
  fraudScore?: number
  fraudDecision?: string
  amlAlerts?: number
  blocked?: boolean
  blockReason?: string
  requiresSca?: boolean
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Validate amount
  validateAmount(data.amount, 'Transfer amount')

  if (data.fromAccountId === data.toAccountId) {
    throw new Error('Cannot transfer to the same account')
  }

  // Verify both accounts belong to the authenticated user
  const fromAccount = await verifyAccountOwnership(supabase, data.fromAccountId, userId)
  const toAccount = await verifyAccountOwnership(supabase, data.toAccountId, userId)

  if (Number(fromAccount.available_balance) < data.amount) {
    throw new Error('Insufficient funds')
  }

  // ── Transaction limits ──
  const kycLevel = await getUserKycLevel(userId)
  const limitCheck = await checkTransactionLimits(userId, data.amount, kycLevel)

  if (!limitCheck.allowed) {
    return {
      success: false,
      blocked: true,
      blockReason: limitCheck.reason,
    }
  }

  // ── SCA check ──
  const needsSca = await requiresSca(data.amount)
  if (needsSca) {
    if (!data.scaChallengeId) {
      return {
        success: false,
        requiresSca: true,
        blocked: false,
      }
    }
    const verified = await isScaChallengeVerified(data.scaChallengeId)
    if (!verified) {
      return {
        success: false,
        blocked: true,
        blockReason: 'Security verification failed or expired. Please try again.',
      }
    }
  }

  // ── Fraud scoring ──
  const fraudResult = await scoreFraud({
    userId,
    amount: data.amount,
    counterpartyName: toAccount.account_name,
    isNewPayee: false, // internal transfer
  })

  if (fraudResult.decision === 'block') {
    await logAuditEvent({
      eventType: 'fraud_event',
      actorId: userId,
      actorRole: 'customer',
      targetTable: 'transactions',
      targetId: null,
      action: 'transfer_blocked_fraud',
      details: {
        amount: data.amount,
        score: fraudResult.score,
        factors: fraudResult.factors.map((f) => f.rule),
      },
    })
    return {
      success: false,
      blocked: true,
      blockReason: 'This transfer has been blocked by our fraud detection system. Please contact us if you believe this is an error.',
      fraudScore: fraudResult.score,
      fraudDecision: fraudResult.decision,
    }
  }

  // ── AML monitoring ──
  const amlResult = await checkTransaction({
    userId,
    amount: data.amount,
    counterpartyName: toAccount.account_name,
    type: 'debit',
  })

  if (!amlResult.passed) {
    return {
      success: false,
      blocked: true,
      blockReason: 'This transfer requires additional verification. Our compliance team will be in touch.',
      amlAlerts: amlResult.alerts.length,
    }
  }

  // ── Execute the transfer ──
  const { error: rpcError } = await supabase.rpc('transfer_between_accounts', {
    p_from_account_id: data.fromAccountId,
    p_to_account_id: data.toAccountId,
    p_amount: data.amount,
    p_reference: data.reference || 'Internal Transfer',
  })

  if (rpcError) {
    throw new Error('Transfer failed: ' + rpcError.message)
  }

  revalidatePath('/transfers')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')

  return {
    success: true,
    fraudScore: fraudResult.score,
    fraudDecision: fraudResult.decision,
    amlAlerts: amlResult.alerts.length,
  }
}
