'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership, verifyPayeeOwnership } from '@/lib/validation'
import { scoreFraud } from '@/lib/fraud/scoring-engine'
import { checkTransaction } from '@/lib/kyc/aml-monitor'
import { logAuditEvent } from '@/lib/audit'
import { checkTransactionLimits, getUserKycLevel } from '@/lib/limits/check-limits'
import { checkCoolingPeriod, markPayeeFirstUsed } from '@/lib/limits/cooling-period'
import { validatePinForUser } from '@/lib/pin/pin-service'
import { selectPaymentRail } from '@/lib/payments/rail-selector'

export async function executePayeePayment(data: {
  fromAccountId: string
  payeeId: string
  amount: number
  reference?: string
  pin: string
}): Promise<{
  success: boolean
  blocked?: boolean
  blockReason?: string
  rail?: string
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // ── Transfer PIN validation ──
  const pinValid = await validatePinForUser(userId, data.pin)
  if (!pinValid) {
    return {
      success: false,
      blocked: true,
      blockReason: 'Incorrect transfer PIN. Please try again.',
    }
  }

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

  // ── Detect internal transfer (recipient is also a NexusBank customer) ──
  const { data: internalAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('sort_code', payee.sort_code)
    .eq('account_number', payee.account_number)
    .eq('is_active', true)
    .maybeSingle()

  const isInternal = !!internalAccount

  // ── Select payment rail ──
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
    console.error('Payment RPC error:', rpcError.message)
    throw new Error('Payment could not be completed. Please try again or contact support.')
  }

  // Mark payee as used (for cooling period tracking)
  await markPayeeFirstUsed(data.payeeId)

  revalidatePath('/payees')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')

  return { success: true, rail: rail.rail }
}
