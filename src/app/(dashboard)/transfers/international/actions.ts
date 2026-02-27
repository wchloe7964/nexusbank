'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireKycVerified } from '@/lib/validation'
import { logAuditEvent } from '@/lib/audit'
import { getFxQuote, estimateDelivery } from '@/lib/payments/fx-rates'
import { validateIban, validateSwiftBic, suggestPaymentMethod } from '@/lib/payments/iban-validator'
import { sendTemplatedNotification } from '@/lib/notifications/email-service'
import { randomInt } from 'crypto'
import type { InternationalPaymentMethod } from '@/lib/types'

interface InternationalTransferInput {
  fromAccountId: string
  beneficiaryName: string
  beneficiaryIban: string
  beneficiarySwiftBic: string
  beneficiaryBankName: string
  beneficiaryBankCountry: string
  beneficiaryAddress: string
  amount: number
  targetCurrency: string
  chargeType: 'shared' | 'our' | 'beneficiary'
  purposeCode: string
  reference: string
  sourceOfFunds: string
}

function generateTrackingRef(): string {
  return `NXB${Date.now().toString(36).toUpperCase()}${randomInt(1000, 9999)}`
}

export async function submitInternationalPayment(
  input: InternationalTransferInput
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // ── KYC verification ──
  await requireKycVerified(supabase, user.id)

  // Validate IBAN
  if (input.beneficiaryIban) {
    const ibanResult = validateIban(input.beneficiaryIban)
    if (!ibanResult.valid) return { error: ibanResult.error }
  }

  // Validate SWIFT/BIC
  if (input.beneficiarySwiftBic) {
    const bicResult = validateSwiftBic(input.beneficiarySwiftBic)
    if (!bicResult.valid) return { error: bicResult.error }
  }

  // Get source account
  const admin = createAdminClient()
  const { data: account } = await admin
    .from('accounts')
    .select('id, balance, currency_code, user_id')
    .eq('id', input.fromAccountId)
    .eq('user_id', user.id)
    .single()

  if (!account) return { error: 'Source account not found' }

  // Determine payment method
  const paymentMethod: InternationalPaymentMethod = suggestPaymentMethod('GB', input.beneficiaryBankCountry)

  // Get FX quote
  const quote = await getFxQuote(input.amount, account.currency_code, input.targetCurrency, paymentMethod)
  const totalDebit = quote.totalCost

  // Check balance
  if (account.balance < totalDebit) {
    return { error: `Insufficient funds. You need ${totalDebit} ${account.currency_code} (including ${quote.fee} fee).` }
  }

  const trackingRef = generateTrackingRef()
  const eta = estimateDelivery(paymentMethod)

  // Create international payment record
  const { data: payment, error: paymentError } = await admin
    .from('international_payments')
    .insert({
      user_id: user.id,
      from_account_id: input.fromAccountId,
      beneficiary_name: input.beneficiaryName,
      beneficiary_iban: input.beneficiaryIban || null,
      beneficiary_swift_bic: input.beneficiarySwiftBic || null,
      beneficiary_bank_name: input.beneficiaryBankName,
      beneficiary_bank_country: input.beneficiaryBankCountry,
      beneficiary_address: input.beneficiaryAddress || null,
      amount: input.amount,
      source_currency: account.currency_code,
      target_currency: input.targetCurrency,
      exchange_rate: quote.rate,
      converted_amount: quote.convertedAmount,
      fee_amount: quote.fee,
      fee_currency: account.currency_code,
      payment_method: paymentMethod,
      charge_type: input.chargeType,
      purpose_code: input.purposeCode || null,
      reference: input.reference || null,
      status: 'processing',
      tracking_reference: trackingRef,
      estimated_delivery: eta.toISOString().split('T')[0],
      source_of_funds: input.sourceOfFunds || null,
      declaration_accepted: true,
      screening_status: 'cleared',
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (paymentError || !payment) {
    return { error: 'Failed to create international payment' }
  }

  // Atomic debit: locks account row, verifies balance, debits, and creates transaction
  const { error: debitError } = await admin.rpc('debit_international_payment', {
    p_account_id: input.fromAccountId,
    p_total_debit: totalDebit,
    p_description: `International transfer to ${input.beneficiaryName}`,
    p_tracking_ref: trackingRef,
    p_beneficiary_name: input.beneficiaryName,
    p_currency_code: account.currency_code,
  })

  if (debitError) {
    console.error('International payment debit error:', debitError.message)
    return { error: 'Failed to process payment. Please try again or contact support.' }
  }

  // Audit
  await logAuditEvent({
    eventType: 'payment_event',
    actorId: user.id,
    actorRole: 'customer',
    targetTable: 'international_payments',
    targetId: payment.id,
    action: 'international_payment_submitted',
    details: {
      amount: input.amount,
      target_currency: input.targetCurrency,
      payment_method: paymentMethod,
      tracking_reference: trackingRef,
      fee: quote.fee,
    },
  })

  // Send notification
  await sendTemplatedNotification('international_payment_sent', user.id, {
    amount: `${input.amount} ${input.targetCurrency}`,
    beneficiary: input.beneficiaryName,
    tracking_ref: trackingRef,
    eta: eta.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
  })

  return { id: payment.id }
}

export async function getQuote(
  amount: number,
  sourceCurrency: string,
  targetCurrency: string,
  destinationCountry: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const method = suggestPaymentMethod('GB', destinationCountry)
  return getFxQuote(amount, sourceCurrency, targetCurrency, method)
}
