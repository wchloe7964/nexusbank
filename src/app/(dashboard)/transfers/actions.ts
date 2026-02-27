'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership, verifyPayeeOwnership } from '@/lib/validation'
import { scoreFraud } from '@/lib/fraud/scoring-engine'
import { checkTransaction } from '@/lib/kyc/aml-monitor'
import { logAuditEvent } from '@/lib/audit'
import { checkTransactionLimits, getUserKycLevel } from '@/lib/limits/check-limits'
import { validatePinForUser } from '@/lib/pin/pin-service'
import { modulusCheck, validateSortCode, validateAccountNumber } from '@/lib/payments/modulus-check'
import { confirmPayee, getCopMessage } from '@/lib/payments/cop'
import { selectPaymentRail } from '@/lib/payments/rail-selector'
import { checkCoolingPeriod, markPayeeFirstUsed } from '@/lib/limits/cooling-period'

export async function executeTransfer(data: {
  fromAccountId: string
  toAccountId: string
  amount: number
  reference?: string
  pin: string
}): Promise<{
  success: boolean
  fraudScore?: number
  fraudDecision?: string
  amlAlerts?: number
  blocked?: boolean
  blockReason?: string
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // ── Validate transfer PIN ──
  const pinValid = await validatePinForUser(userId, data.pin)
  if (!pinValid) {
    return {
      success: false,
      blocked: true,
      blockReason: 'Incorrect transfer PIN.',
    }
  }

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
    console.error('Transfer RPC error:', rpcError.message)
    throw new Error('Transfer could not be completed. Please try again or contact support.')
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

// ─── Lightweight CoP + modulus check (called on blur) ────────────────────

export async function checkRecipient(data: {
  name: string
  sortCode: string
  accountNumber: string
}): Promise<{
  valid: boolean
  copResult?: string
  copMessage?: string
  copSeverity?: string
  canProceed?: boolean
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { valid: false, error: 'Not authenticated' }

  const modCheck = modulusCheck(data.sortCode, data.accountNumber)
  if (!modCheck.valid) {
    return { valid: false, error: modCheck.error }
  }

  const copCheck = confirmPayee(data.sortCode, data.accountNumber, data.name)
  const copMsg = getCopMessage(copCheck.result, copCheck.matchedName)

  return {
    valid: true,
    copResult: copCheck.result,
    copMessage: copMsg.description,
    copSeverity: copMsg.severity,
    canProceed: copMsg.canProceed,
  }
}

// ─── Payment rail preview (called when amount changes) ───────────────────

export async function previewPaymentRail(amount: number): Promise<{
  rail: string
  displayName: string
  estimatedSettlement: string
  fee: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const result = selectPaymentRail(amount, { isInternal: false })
  return {
    rail: result.rail,
    displayName: result.displayName,
    estimatedSettlement: result.estimatedSettlement,
    fee: result.fee,
  }
}

// ─── Send money to someone else ──────────────────────────────────────────

export async function sendToSomeone(data: {
  fromAccountId: string
  recipientName: string
  sortCode: string
  accountNumber: string
  amount: number
  reference?: string
  payeeId?: string
  pin: string
}): Promise<{
  success: boolean
  blocked?: boolean
  blockReason?: string
  rail?: string
  railDisplayName?: string
  railFee?: number
  railSettlement?: string
  copResult?: string
  copMessage?: string
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // ── Validate transfer PIN ──
  const pinValid = await validatePinForUser(userId, data.pin)
  if (!pinValid) {
    return {
      success: false,
      blocked: true,
      blockReason: 'Incorrect transfer PIN.',
    }
  }

  // ── Validate inputs ──
  validateAmount(data.amount, 'Payment amount')

  if (!data.recipientName || !data.recipientName.trim()) {
    throw new Error('Recipient name is required')
  }

  // ── Modulus check ──
  const sc = validateSortCode(data.sortCode)
  if (!sc.valid) throw new Error(sc.error || 'Invalid sort code')

  const an = validateAccountNumber(data.accountNumber)
  if (!an.valid) throw new Error(an.error || 'Invalid account number')

  const formattedSortCode = sc.formatted
  const formattedAccountNumber = an.formatted

  const modCheck = modulusCheck(data.sortCode, data.accountNumber)
  if (!modCheck.valid) {
    return { success: false, blocked: true, blockReason: modCheck.error || 'Invalid bank details' }
  }

  // ── CoP check ──
  const copCheck = confirmPayee(formattedSortCode, formattedAccountNumber, data.recipientName.trim())
  const copMsg = getCopMessage(copCheck.result, copCheck.matchedName)

  if (!copMsg.canProceed) {
    await logAuditEvent({
      eventType: 'payment_event',
      actorId: userId,
      actorRole: 'customer',
      targetTable: 'payees',
      targetId: null,
      action: 'payment_blocked_cop',
      details: {
        recipientName: data.recipientName,
        copResult: copCheck.result,
        sortCode: formattedSortCode,
      },
    })
    return {
      success: false,
      blocked: true,
      blockReason: copMsg.description,
      copResult: copCheck.result,
      copMessage: copMsg.title,
    }
  }

  // ── Verify from-account belongs to user ──
  const fromAccount = await verifyAccountOwnership(supabase, data.fromAccountId, userId)

  if (Number(fromAccount.available_balance) < data.amount) {
    throw new Error('Insufficient funds')
  }

  // ── Transaction limits ──
  const kycLevel = await getUserKycLevel(userId)
  const limitCheck = await checkTransactionLimits(userId, data.amount, kycLevel)

  if (!limitCheck.allowed) {
    return { success: false, blocked: true, blockReason: limitCheck.reason }
  }

  // ── Detect internal transfer (recipient is also a NexusBank customer) ──
  const { data: internalAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('sort_code', formattedSortCode)
    .eq('account_number', formattedAccountNumber)
    .eq('is_active', true)
    .maybeSingle()

  const isInternal = !!internalAccount

  // ── Select payment rail ──
  const rail = selectPaymentRail(data.amount, { isInternal, isUrgent: false })

  // ── Find or create payee ──
  let payeeId = data.payeeId || null
  let isNewPayee = false

  if (payeeId) {
    // Saved payee selected — verify ownership
    const payee = await verifyPayeeOwnership(supabase, payeeId, userId)
    isNewPayee = !payee.first_used_at
  } else {
    // Check for existing payee with matching bank details
    const { data: existingPayee } = await supabase
      .from('payees')
      .select('id, first_used_at')
      .eq('user_id', userId)
      .eq('sort_code', formattedSortCode)
      .eq('account_number', formattedAccountNumber)
      .maybeSingle()

    if (existingPayee) {
      payeeId = existingPayee.id
      isNewPayee = !existingPayee.first_used_at
    } else {
      // Create new payee
      const { data: newPayee, error: insertError } = await supabase
        .from('payees')
        .insert({
          user_id: userId,
          name: data.recipientName.trim(),
          sort_code: formattedSortCode,
          account_number: formattedAccountNumber,
          reference: data.reference?.trim() || null,
          is_favourite: false,
        })
        .select('id')
        .single()

      if (insertError || !newPayee) throw new Error('Failed to save recipient details')
      payeeId = newPayee.id
      isNewPayee = true
    }
  }

  if (!payeeId) throw new Error('Failed to resolve payee')

  // ── Cooling period ──
  const coolingCheck = await checkCoolingPeriod(payeeId, rail.rail)
  if (!coolingCheck.allowed) {
    return { success: false, blocked: true, blockReason: coolingCheck.reason }
  }

  // ── Fraud scoring ──
  const fraudResult = await scoreFraud({
    userId,
    amount: data.amount,
    counterpartyName: data.recipientName,
    isNewPayee,
  })

  if (fraudResult.decision === 'block') {
    await logAuditEvent({
      eventType: 'fraud_event',
      actorId: userId,
      actorRole: 'customer',
      targetTable: 'transactions',
      targetId: null,
      action: 'send_payment_blocked_fraud',
      details: {
        amount: data.amount,
        recipientName: data.recipientName,
        score: fraudResult.score,
        isNewPayee,
        factors: fraudResult.factors.map((f) => f.rule),
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
    counterpartyName: data.recipientName,
    type: 'debit',
  })

  if (!amlResult.passed) {
    return {
      success: false,
      blocked: true,
      blockReason: 'This payment requires additional verification. Our compliance team will be in touch.',
    }
  }

  // ── Execute payment ──
  const { error: rpcError } = await supabase.rpc('execute_payee_payment', {
    p_from_account_id: data.fromAccountId,
    p_payee_id: payeeId,
    p_amount: data.amount,
    p_reference: data.reference?.trim() || null,
  })

  if (rpcError) {
    console.error('Payment RPC error:', rpcError.message)
    throw new Error('Payment could not be completed. Please try again or contact support.')
  }

  // ── Post-payment housekeeping ──
  await markPayeeFirstUsed(payeeId)

  revalidatePath('/transfers')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/payees')

  return {
    success: true,
    rail: rail.rail,
    railDisplayName: rail.displayName,
    railFee: rail.fee,
    railSettlement: rail.estimatedSettlement,
    copResult: copCheck.result,
  }
}
