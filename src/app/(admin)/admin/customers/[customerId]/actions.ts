'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, requireSuperAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

// ─── Account Operations ─────────────────────────────────────────────────

const VALID_ACCOUNT_STATUSES = ['active', 'frozen', 'suspended', 'closed'] as const
type AccountStatus = (typeof VALID_ACCOUNT_STATUSES)[number]

export async function updateAccountStatus(
  accountId: string,
  newStatus: AccountStatus,
  reason: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!VALID_ACCOUNT_STATUSES.includes(newStatus)) throw new Error('Invalid account status')
  if (!reason?.trim() || reason.trim().length < 5) throw new Error('Reason is required (min 5 characters)')

  const { data: account } = await admin
    .from('accounts')
    .select('id, user_id, account_name, account_type, is_active')
    .eq('id', accountId)
    .single()

  if (!account) throw new Error('Account not found')

  const isActive = newStatus === 'active'

  const { error } = await admin
    .from('accounts')
    .update({ is_active: isActive, status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', accountId)

  if (error) throw new Error('Failed to update account status')

  // Notify the customer
  await admin.from('notifications').insert({
    user_id: account.user_id,
    title: `Account ${newStatus === 'active' ? 'Reactivated' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    message: `Your ${account.account_name} has been ${newStatus}. ${newStatus !== 'active' ? 'Please contact us for more information.' : ''}`,
    type: 'account',
    is_read: false,
  })

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'accounts',
    targetId: accountId,
    action: `account_${newStatus}`,
    details: {
      reason: reason.trim(),
      account_name: account.account_name,
      previous_active: account.is_active,
      new_active: isActive,
      target_user_id: account.user_id,
    },
  })

  revalidatePath(`/admin/customers/${account.user_id}`)
  return { success: true }
}

// ─── Card Operations ─────────────────────────────────────────────────────

const VALID_CARD_STATUSES = ['active', 'frozen', 'cancelled', 'reported_lost'] as const
type CardStatus = (typeof VALID_CARD_STATUSES)[number]

export async function updateCardStatus(
  cardId: string,
  newStatus: CardStatus,
  reason: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!VALID_CARD_STATUSES.includes(newStatus)) throw new Error('Invalid card status')
  if (!reason?.trim()) throw new Error('Reason is required')

  const { data: card } = await admin
    .from('cards')
    .select('id, user_id, card_type, card_number_last_four, status')
    .eq('id', cardId)
    .single()

  if (!card) throw new Error('Card not found')

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  if (newStatus === 'frozen') updateData.is_frozen = true
  if (newStatus === 'active') updateData.is_frozen = false

  const { error } = await admin.from('cards').update(updateData).eq('id', cardId)
  if (error) throw new Error('Failed to update card status')

  await admin.from('notifications').insert({
    user_id: card.user_id,
    title: `Card ${newStatus === 'active' ? 'Unblocked' : newStatus.replace('_', ' ')}`,
    message: `Your ${card.card_type} card ending ${card.card_number_last_four} has been ${newStatus.replace('_', ' ')}.`,
    type: 'account',
    is_read: false,
  })

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'cards',
    targetId: cardId,
    action: `card_${newStatus}`,
    details: {
      reason: reason.trim(),
      old_status: card.status,
      new_status: newStatus,
      card_type: card.card_type,
      last_four: card.card_number_last_four,
      target_user_id: card.user_id,
    },
  })

  revalidatePath(`/admin/customers/${card.user_id}`)
  return { success: true }
}

// ─── Customer Profile Management ─────────────────────────────────────────

export async function updateCustomerProfile(
  customerId: string,
  updates: {
    full_name?: string
    phone_number?: string
    address_line_1?: string
    address_line_2?: string
    city?: string
    postcode?: string
  }
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const { data: oldProfile } = await admin
    .from('profiles')
    .select('full_name, phone_number, address_line_1, address_line_2, city, postcode')
    .eq('id', customerId)
    .single()

  if (!oldProfile) throw new Error('Customer not found')

  const cleanUpdates: Record<string, string | null> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      cleanUpdates[key] = value?.trim() || null
    }
  }

  if (Object.keys(cleanUpdates).length === 0) throw new Error('No changes provided')

  const { error } = await admin
    .from('profiles')
    .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
    .eq('id', customerId)

  if (error) throw new Error('Failed to update customer profile')

  // Build change summary for audit
  const changes: Record<string, { from: unknown; to: unknown }> = {}
  for (const [key, value] of Object.entries(cleanUpdates)) {
    const oldVal = (oldProfile as Record<string, unknown>)[key]
    if (oldVal !== value) {
      changes[key] = { from: oldVal, to: value }
    }
  }

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'profiles',
    targetId: customerId,
    action: 'customer_profile_updated',
    details: { changes },
  })

  revalidatePath(`/admin/customers/${customerId}`)
  return { success: true }
}

// ─── Force Password Reset ────────────────────────────────────────────────

export async function forcePasswordReset(customerId: string): Promise<{ success: boolean }> {
  const adminUserId = await requireSuperAdmin()
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', customerId)
    .single()

  if (!profile) throw new Error('Customer not found')

  // Reset password via Supabase admin API
  const { error } = await admin.auth.admin.updateUserById(customerId, {
    password: undefined, // Clears session, forces re-auth
  })

  if (error) throw new Error('Failed to force password reset')

  // Sign out all sessions for this user
  await admin.auth.admin.signOut(customerId, 'global')

  await admin.from('notifications').insert({
    user_id: customerId,
    title: 'Password Reset Required',
    message: 'Your password has been reset for security reasons. Please use the "Forgot Password" link to set a new password.',
    type: 'security',
    is_read: false,
  })

  await admin.from('login_activity').insert({
    user_id: customerId,
    event_type: 'admin_password_reset',
    metadata: { initiated_by: adminUserId },
  })

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'super_admin',
    targetTable: 'profiles',
    targetId: customerId,
    action: 'force_password_reset',
    details: { target_email: profile.email },
  })

  revalidatePath(`/admin/customers/${customerId}`)
  return { success: true }
}

// ─── Send Manual Notification ────────────────────────────────────────────

export async function sendAdminNotification(
  customerId: string,
  title: string,
  message: string,
  type: 'info' | 'account' | 'security' | 'payment' = 'info'
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!title?.trim()) throw new Error('Title is required')
  if (!message?.trim()) throw new Error('Message is required')

  const { error } = await admin.from('notifications').insert({
    user_id: customerId,
    title: title.trim(),
    message: message.trim(),
    type,
    is_read: false,
  })

  if (error) throw new Error('Failed to send notification')

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'notifications',
    targetId: customerId,
    action: 'admin_notification_sent',
    details: { title: title.trim(), type },
  })

  revalidatePath(`/admin/customers/${customerId}`)
  return { success: true }
}

// ─── Process Banking Operation (credit/debit via proper banking channels) ──

const CREDIT_OPERATIONS = [
  'bacs_credit',
  'faster_payment_in',
  'chaps_credit',
  'wire_transfer_in',
  'refund',
  'compensation',
  'interest_payment',
  'direct_credit',
  'settlement',
] as const

const DEBIT_OPERATIONS = [
  'chargeback',
  'bank_fee',
  'correction',
  'recovery',
  'regulatory_levy',
] as const

type CreditOperation = (typeof CREDIT_OPERATIONS)[number]
type DebitOperation = (typeof DEBIT_OPERATIONS)[number]

const OPERATION_LABELS: Record<string, { category: string; defaultDescription: string }> = {
  bacs_credit: { category: 'transfer', defaultDescription: 'BACS Credit' },
  faster_payment_in: { category: 'transfer', defaultDescription: 'Faster Payment' },
  chaps_credit: { category: 'transfer', defaultDescription: 'CHAPS Payment' },
  wire_transfer_in: { category: 'transfer', defaultDescription: 'International Wire Transfer' },
  refund: { category: 'payment', defaultDescription: 'Refund' },
  compensation: { category: 'payment', defaultDescription: 'Compensation Payment' },
  interest_payment: { category: 'interest', defaultDescription: 'Interest Payment' },
  direct_credit: { category: 'transfer', defaultDescription: 'Direct Credit' },
  settlement: { category: 'payment', defaultDescription: 'Settlement Payment' },
  chargeback: { category: 'payment', defaultDescription: 'Chargeback' },
  bank_fee: { category: 'fee', defaultDescription: 'Bank Charge' },
  correction: { category: 'other', defaultDescription: 'Balance Correction' },
  recovery: { category: 'payment', defaultDescription: 'Debt Recovery' },
  regulatory_levy: { category: 'fee', defaultDescription: 'Regulatory Levy' },
}

export async function processBankingOperation(
  accountId: string,
  data: {
    direction: 'credit' | 'debit'
    operationType: string
    amount: number
    counterpartyName: string
    reference: string
    narrative: string
    internalReason: string
  }
): Promise<{ success: boolean }> {
  const adminUserId = await requireSuperAdmin()
  const admin = createAdminClient()

  const { direction, operationType, amount, counterpartyName, reference, narrative, internalReason } = data

  // Validate
  if (!amount || amount <= 0) throw new Error('Amount must be positive')
  if (!counterpartyName?.trim()) throw new Error('Originator/counterparty name is required')
  if (!narrative?.trim()) throw new Error('Transaction description is required')
  if (!internalReason?.trim() || internalReason.trim().length < 10) throw new Error('Internal reason required (min 10 characters)')

  const validOps = direction === 'credit' ? CREDIT_OPERATIONS : DEBIT_OPERATIONS
  if (!validOps.includes(operationType as CreditOperation & DebitOperation)) {
    throw new Error('Invalid operation type')
  }

  const opConfig = OPERATION_LABELS[operationType]
  if (!opConfig) throw new Error('Unknown operation type')

  const { data: account } = await admin
    .from('accounts')
    .select('id, user_id, balance, available_balance, account_name, currency_code')
    .eq('id', accountId)
    .single()

  if (!account) throw new Error('Account not found')

  const adjustment = direction === 'credit' ? amount : -amount
  const newBalance = Number(account.balance) + adjustment
  const newAvailable = Number(account.available_balance) + adjustment

  if (newAvailable < 0 && direction === 'debit') {
    throw new Error('Operation would result in negative available balance')
  }

  const { error: updateError } = await admin
    .from('accounts')
    .update({
      balance: newBalance,
      available_balance: newAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)

  if (updateError) throw new Error('Failed to process banking operation')

  // Create a proper banking transaction visible to the customer
  await admin.from('transactions').insert({
    account_id: accountId,
    type: direction,
    category: opConfig.category,
    amount: Math.abs(amount),
    currency_code: account.currency_code || 'GBP',
    description: narrative.trim(),
    reference: reference?.trim() || null,
    counterparty_name: counterpartyName.trim(),
    balance_after: newBalance,
    status: 'completed',
    transaction_date: new Date().toISOString(),
  })

  // Customer notification uses banking language
  const notifTitle = direction === 'credit'
    ? `Payment received — £${amount.toFixed(2)}`
    : `${opConfig.defaultDescription} — £${amount.toFixed(2)}`

  const notifMessage = direction === 'credit'
    ? `You received £${amount.toFixed(2)} from ${counterpartyName.trim()} into your ${account.account_name}.`
    : `A ${opConfig.defaultDescription.toLowerCase()} of £${amount.toFixed(2)} has been applied to your ${account.account_name}.`

  await admin.from('notifications').insert({
    user_id: account.user_id,
    title: notifTitle,
    message: notifMessage,
    type: 'payment',
    is_read: false,
  })

  // Audit log keeps the full internal context (admin-only)
  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'super_admin',
    targetTable: 'accounts',
    targetId: accountId,
    action: `banking_operation_${direction}`,
    details: {
      internal_reason: internalReason.trim(),
      operation_type: operationType,
      amount,
      direction,
      counterparty_name: counterpartyName.trim(),
      reference: reference?.trim() || null,
      narrative: narrative.trim(),
      old_balance: account.balance,
      new_balance: newBalance,
      target_user_id: account.user_id,
    },
  })

  revalidatePath(`/admin/customers/${account.user_id}`)
  revalidatePath('/admin/transactions')
  return { success: true }
}

// ─── Trigger KYC Re-verification ─────────────────────────────────────────

export async function triggerKycReverification(customerId: string, reason: string): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!reason?.trim()) throw new Error('Reason is required')

  const { error } = await admin.from('kyc_verifications').insert({
    user_id: customerId,
    verification_level: 'enhanced',
    status: 'pending',
    initiated_by: adminUserId,
    notes: `Re-verification requested: ${reason.trim()}`,
    requested_at: new Date().toISOString(),
  })

  if (error) throw new Error('Failed to trigger KYC re-verification')

  await admin.from('notifications').insert({
    user_id: customerId,
    title: 'Identity Verification Required',
    message: 'We need to re-verify your identity. Please update your identification documents in Settings.',
    type: 'security',
    is_read: false,
  })

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'kyc_verifications',
    targetId: customerId,
    action: 'kyc_reverification_triggered',
    details: { reason: reason.trim() },
  })

  revalidatePath(`/admin/customers/${customerId}`)
  return { success: true }
}
