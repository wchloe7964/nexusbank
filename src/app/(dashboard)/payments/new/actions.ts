'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership } from '@/lib/validation'
import { confirmPayee, getCopMessage } from '@/lib/payments/cop'
import { modulusCheck } from '@/lib/payments/modulus-check'
import { scoreFraud } from '@/lib/fraud/scoring-engine'
import { checkTransaction } from '@/lib/kyc/aml-monitor'
import { selectPaymentRail } from '@/lib/payments/rail-selector'
import { logAuditEvent } from '@/lib/audit'
import { checkTransactionLimits, getUserKycLevel } from '@/lib/limits/check-limits'
import { checkCoolingPeriod } from '@/lib/limits/cooling-period'
import { requiresSca, isScaChallengeVerified } from '@/lib/sca/sca-service'

const VALID_FREQUENCIES = ['weekly', 'fortnightly', 'monthly', 'quarterly', 'annually']
const VALID_PAYMENT_TYPES = ['standing_order', 'direct_debit', 'one_off']

export async function createScheduledPayment(data: {
  accountId: string
  payeeName: string
  sortCode: string
  accountNumber: string
  amount: number
  frequency: string
  paymentType: string
  reference?: string
  scaChallengeId?: string
}): Promise<{
  success: boolean
  blocked?: boolean
  blockReason?: string
  copResult?: string
  copMessage?: string
  rail?: string
  requiresSca?: boolean
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.amount, 'Payment amount')

  if (!VALID_PAYMENT_TYPES.includes(data.paymentType)) {
    throw new Error('Invalid payment type')
  }

  if (data.paymentType !== 'one_off' && !VALID_FREQUENCIES.includes(data.frequency)) {
    throw new Error('Invalid payment frequency')
  }

  // Trim and validate payee name
  const payeeName = data.payeeName.trim()
  if (!payeeName) throw new Error('Payee name is required')

  // Verify account belongs to user
  await verifyAccountOwnership(supabase, data.accountId, userId)

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

  // ── Modulus check (sort code / account number validation) ──
  const modCheck = modulusCheck(data.sortCode, data.accountNumber)
  if (!modCheck.valid) {
    throw new Error(modCheck.error || 'Invalid sort code or account number')
  }

  // ── Confirmation of Payee ──
  const copCheck = confirmPayee(data.sortCode, data.accountNumber, payeeName)
  const copMsg = getCopMessage(copCheck.result, copCheck.matchedName)

  if (!copMsg.canProceed) {
    return {
      success: false,
      blocked: true,
      blockReason: copMsg.description,
      copResult: copCheck.result,
      copMessage: copMsg.title,
    }
  }

  // ── Select payment rail ──
  const rail = selectPaymentRail(data.amount, {
    isInternal: data.sortCode.startsWith('20-'),
    isUrgent: false,
  })

  // ── Check if this is a new payee ──
  const { data: existingPayee } = await supabase
    .from('payees')
    .select('id, first_used_at')
    .eq('user_id', userId)
    .eq('sort_code', data.sortCode)
    .eq('account_number', data.accountNumber)
    .maybeSingle()

  const isNewPayee = !existingPayee

  // ── Cooling period (for existing payees that haven't been used yet) ──
  if (existingPayee && !existingPayee.first_used_at) {
    const coolingCheck = await checkCoolingPeriod(existingPayee.id, rail.rail)
    if (!coolingCheck.allowed) {
      return {
        success: false,
        blocked: true,
        blockReason: coolingCheck.reason,
      }
    }
  }

  // ── Fraud scoring ──
  const fraudResult = await scoreFraud({
    userId,
    amount: data.amount,
    counterpartyName: payeeName,
    isNewPayee,
  })

  if (fraudResult.decision === 'block') {
    await logAuditEvent({
      eventType: 'fraud_event',
      actorId: userId,
      actorRole: 'customer',
      targetTable: 'scheduled_payments',
      targetId: null,
      action: 'payment_blocked_fraud',
      details: {
        amount: data.amount,
        payee: payeeName,
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
    counterpartyName: payeeName,
    type: 'debit',
  })

  if (!amlResult.passed) {
    return {
      success: false,
      blocked: true,
      blockReason: 'This payment requires additional verification. Our compliance team will be in touch.',
    }
  }

  // ── Create payee if new ──
  let payeeId: string | null = null
  if (existingPayee) {
    payeeId = existingPayee.id
  } else {
    const { data: newPayee, error: payeeError } = await supabase
      .from('payees')
      .insert({
        user_id: userId,
        name: payeeName,
        sort_code: data.sortCode,
        account_number: data.accountNumber,
        reference: data.reference?.trim() || null,
        is_favourite: false,
      })
      .select('id')
      .single()

    if (payeeError) throw payeeError
    payeeId = newPayee.id
  }

  // Calculate next payment date (tomorrow for simplicity)
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + 1)

  const { error } = await supabase.from('scheduled_payments').insert({
    user_id: userId,
    from_account_id: data.accountId,
    payee_id: payeeId,
    payment_type: data.paymentType,
    amount: data.amount,
    currency_code: 'GBP',
    reference: data.reference?.trim() || null,
    description: `Payment to ${payeeName}`,
    frequency: data.frequency,
    next_payment_date: nextDate.toISOString().split('T')[0],
    status: 'active',
  })

  if (error) throw error

  revalidatePath('/payments')
  revalidatePath('/payees')

  return {
    success: true,
    copResult: copCheck.result,
    rail: rail.rail,
  }
}
