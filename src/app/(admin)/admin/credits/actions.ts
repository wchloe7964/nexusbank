'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { validateAmount } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

const VALID_REASONS = [
  'refund',
  'goodwill',
  'correction',
  'promotional',
  'compensation',
  'interest_adjustment',
  'fee_reversal',
  'other',
] as const

type CreditReason = (typeof VALID_REASONS)[number]

// ─── Credit Customer Account ────────────────────────────

interface CreditInput {
  accountId: string
  amount: number
  reason: CreditReason
  note: string
  reference?: string
}

export async function creditCustomerAccount(data: CreditInput): Promise<{
  success: boolean
  newBalance: number
  transactionId: string
}> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  // Validate inputs
  if (!data.accountId || typeof data.accountId !== 'string') {
    throw new Error('Please select a valid account')
  }

  validateAmount(data.amount)

  if (!VALID_REASONS.includes(data.reason)) {
    throw new Error('Invalid credit reason')
  }

  if (!data.note || data.note.trim().length < 5) {
    throw new Error('Note must be at least 5 characters')
  }

  // Fetch account + owner profile for audit context
  const { data: account, error: accountError } = await admin
    .from('accounts')
    .select('id, user_id, account_name, balance, available_balance, is_active')
    .eq('id', data.accountId)
    .single()

  if (accountError || !account) {
    throw new Error('Account not found')
  }

  const { data: ownerProfile } = await admin
    .from('profiles')
    .select('full_name, email, membership_number')
    .eq('id', account.user_id)
    .single()

  // Build customer-facing description (clean, professional — no internal admin terminology)
  const reasonLabel = data.reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  const customerDescriptionMap: Record<string, string> = {
    refund: 'Refund',
    goodwill: 'Goodwill Payment',
    correction: 'Balance Correction',
    promotional: 'Promotional Credit',
    compensation: 'Compensation Payment',
    interest_adjustment: 'Interest Adjustment',
    fee_reversal: 'Fee Reversal',
    other: 'Account Credit',
  }
  const customerReason = customerDescriptionMap[data.reason] || 'Account Credit'
  const description = data.note.trim()
    ? `${customerReason} – ${data.note.trim()}`
    : customerReason

  // Call atomic RPC
  const { data: result, error: rpcError } = await admin.rpc('admin_credit_account', {
    p_account_id: data.accountId,
    p_amount: data.amount,
    p_description: description,
    p_reference: data.reference?.trim() || null,
  })

  if (rpcError) {
    console.error('Admin credit RPC error:', rpcError.message)
    throw new Error('Failed to credit account. Please try again.')
  }

  const rpcResult = result as { new_balance: number; new_available_balance: number; transaction_id: string }

  // Notify the customer (professional, no internal jargon)
  await admin.from('notifications').insert({
    user_id: account.user_id,
    title: 'Account Credited',
    message: `£${data.amount.toFixed(2)} has been credited to your ${account.account_name} account (${customerReason}).`,
    type: 'account',
    is_read: false,
  })

  // Audit log
  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'accounts',
    targetId: data.accountId,
    action: 'admin_credit_applied',
    details: {
      customer_user_id: account.user_id,
      customer_name: ownerProfile?.full_name || 'Unknown',
      customer_email: ownerProfile?.email || 'Unknown',
      membership_number: ownerProfile?.membership_number || null,
      account_name: account.account_name,
      amount: data.amount,
      reason: data.reason,
      note: data.note.trim(),
      reference: data.reference?.trim() || null,
      old_balance: account.balance,
      new_balance: rpcResult.new_balance,
      transaction_id: rpcResult.transaction_id,
    },
  })

  revalidatePath('/admin/credits')
  revalidatePath('/admin/customers')
  revalidatePath('/admin/transactions')
  revalidatePath(`/admin/customers/${account.user_id}`)

  return {
    success: true,
    newBalance: rpcResult.new_balance,
    transactionId: rpcResult.transaction_id,
  }
}

// ─── Search Customers ───────────────────────────────────

export async function searchCustomers(term: string): Promise<
  { id: string; full_name: string; email: string; membership_number: string | null }[]
> {
  await requireAdmin()
  const admin = createAdminClient()

  if (!term || term.trim().length < 2) return []

  const searchTerm = `%${term.trim()}%`

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email, membership_number')
    .eq('role', 'customer')
    .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm},membership_number.ilike.${searchTerm}`)
    .order('full_name')
    .limit(10)

  if (error) throw new Error(error.message)

  return (data ?? []) as { id: string; full_name: string; email: string; membership_number: string | null }[]
}

// ─── Get Customer Accounts ──────────────────────────────

export async function getCustomerAccountsAction(userId: string): Promise<{
  success: boolean
  accounts: { id: string; account_name: string; account_type: string; balance: number; is_active: boolean }[]
  error?: string
}> {
  try {
    await requireAdmin()
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Auth check failed'
    console.error('[getCustomerAccountsAction] requireAdmin failed:', msg)
    return { success: false, accounts: [], error: msg }
  }

  const admin = createAdminClient()

  if (!userId || typeof userId !== 'string') {
    return { success: false, accounts: [], error: 'Invalid user ID' }
  }

  const { data, error } = await admin
    .from('accounts')
    .select('id, account_name, account_type, balance, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('is_primary', { ascending: false })

  if (error) {
    console.error('[getCustomerAccountsAction] Supabase error:', error.message)
    return { success: false, accounts: [], error: error.message }
  }

  return {
    success: true,
    accounts: (data ?? []) as { id: string; account_name: string; account_type: string; balance: number; is_active: boolean }[],
  }
}
