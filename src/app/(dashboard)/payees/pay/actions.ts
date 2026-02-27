'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership, verifyPayeeOwnership } from '@/lib/validation'
import { scoreFraud } from '@/lib/fraud/scoring-engine'
import { checkTransaction } from '@/lib/kyc/aml-monitor'
import { logAuditEvent } from '@/lib/audit'
import { checkTransactionLimits, getUserKycLevel } from '@/lib/limits/check-limits'
import { checkCoolingPeriod, markPayeeFirstUsed } from '@/lib/limits/cooling-period'
import { requiresSca, isScaChallengeVerified } from '@/lib/sca/sca-service'
import { selectPaymentRail } from '@/lib/payments/rail-selector'

export async function executePayeePayment(data: {
  fromAccountId: string
  payeeId: string
  amount: number
  reference?: string
  scaChallengeId?: string
}): Promise<{
  success: boolean
  blocked?: boolean
  blockReason?: string
  requiresSca?: boolean
  rail?: string
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Validate amount
  validateAmount(data.amount, 'Payment amount')

  // Verify ownership of both account and payee
  const fromAccount = await verifyAccountOwnership(supabase, data.fromAccountId, userId)
  const payee = await verifyPayeeOwnership(supabase, data.payeeId, userId)

  // Check available balance (respects overdraft)
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

  // ── Select payment rail ──
  const isInternal = payee.sort_code.startsWith('20-')
  const rail = selectPaymentRail(data.amount, { isInternal, isUrgent: false })

  // ── Cooling period ──
  const coolingCheck = await checkCoolingPeriod(data.payeeId, rail.rail)
  if (!coolingCheck.allowed) {
    return {
      success: false,
      blocked: true,
      blockReason: coolingCheck.reason,
    }
  }

  // ── SCA check ──
  const needsSca = await requiresSca(data.amount, 'large_payment')
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
  const isNewPayee = !payee.first_used_at
  const fraudResult = await scoreFraud({
    userId,
    amount: data.amount,
    counterpartyName: payee.name,
    isNewPayee,
  })

  if (fraudResult.decision === 'block') {
    await logAuditEvent({
      eventType: 'fraud_event',
      actorId: userId,
      actorRole: 'customer',
      targetTable: 'transactions',
      targetId: null,
      action: 'payee_payment_blocked_fraud',
      details: {
        amount: data.amount,
        payee: payee.name,
        score: fraudResult.score,
        is_new_payee: isNewPayee,
      },
    })
    return {
      success: false,
      blocked: true,
      blockReason: 'This payment has been blocked by our fraud detection system. Please contact us if you believe this is an error.',
    }
  }

  // ── AML monitoring ──
  const amlResult = await checkTransaction({
    userId,
    amount: data.amount,
    counterpartyName: payee.name,
    type: 'debit',
  })

  if (!amlResult.passed) {
    return {
      success: false,
      blocked: true,
      blockReason: 'This payment requires additional verification. Our compliance team will be in touch.',
    }
  }

  // ── Execute the payment ──
  const { error: rpcError } = await supabase.rpc('execute_payee_payment', {
    p_from_account_id: data.fromAccountId,
    p_payee_id: data.payeeId,
    p_amount: data.amount,
    p_reference: data.reference || null,
  })

  if (rpcError) {
    throw new Error('Payment failed: ' + rpcError.message)
  }

  // Mark payee as used (for cooling period tracking)
  await markPayeeFirstUsed(data.payeeId)

  revalidatePath('/payees')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')

  return { success: true, rail: rail.rail }
}
