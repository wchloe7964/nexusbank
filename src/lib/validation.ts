/**
 * Shared validation utilities for server actions.
 * Centralizes amount validation, ownership checks, and safe money arithmetic.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Amount / money validation
// ---------------------------------------------------------------------------

const MAX_TRANSACTION_AMOUNT = 250_000 // £250,000 per transaction
const MAX_DECIMAL_PLACES = 2

/**
 * Validates that a monetary amount is positive, within bounds,
 * and has at most 2 decimal places.
 */
export function validateAmount(amount: number, label = 'Amount'): void {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new Error(`${label} must be a valid number`)
  }
  if (amount <= 0) {
    throw new Error(`${label} must be greater than zero`)
  }
  if (amount > MAX_TRANSACTION_AMOUNT) {
    throw new Error(`${label} exceeds the maximum of £${MAX_TRANSACTION_AMOUNT.toLocaleString()}`)
  }
  // Check decimal precision (avoid floating-point issues by rounding)
  const rounded = Math.round(amount * 100) / 100
  if (Math.abs(amount - rounded) > Number.EPSILON) {
    throw new Error(`${label} cannot have more than ${MAX_DECIMAL_PLACES} decimal places`)
  }
}

// ---------------------------------------------------------------------------
// Safe money arithmetic — avoids floating-point drift by working in pence
// ---------------------------------------------------------------------------

/**
 * Converts a database NUMERIC string/number to an integer (pence/cents).
 * Avoids IEEE 754 precision loss.
 */
export function toPence(value: string | number): number {
  const str = String(value)
  const [whole = '0', frac = ''] = str.split('.')
  const paddedFrac = (frac + '00').slice(0, 2)
  return parseInt(whole, 10) * 100 + parseInt(paddedFrac, 10) * (str.startsWith('-') ? -1 : 1)
}

/**
 * Converts pence back to a pounds number (2dp).
 */
export function fromPence(pence: number): number {
  return Math.round(pence) / 100
}

/**
 * Sums an array of NUMERIC values safely via integer arithmetic.
 */
export function safeSum(values: (string | number)[]): number {
  const totalPence = values.reduce((sum: number, v) => sum + toPence(v), 0)
  return fromPence(totalPence)
}

// ---------------------------------------------------------------------------
// Ownership helpers — verify a resource belongs to the authenticated user
// ---------------------------------------------------------------------------

export async function requireAuth(supabase: SupabaseClient): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

/**
 * Verify a single account belongs to the authenticated user.
 * Returns the account row (selected columns).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyAccountOwnership(
  supabase: SupabaseClient,
  accountId: string,
  userId: string,
  select = 'id, balance, available_balance, account_name, is_active, status',
): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('accounts')
    .select(select)
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new Error('Account not found or access denied')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as Record<string, any>

  // Block operations on frozen / suspended / closed accounts
  if (row.is_active === false || (row.status && row.status !== 'active')) {
    const label = row.status === 'frozen' ? 'frozen' : row.status === 'closed' ? 'closed' : 'restricted'
    throw new Error(`This account is ${label}. Transactions are not permitted.`)
  }

  return row
}

/**
 * Verify a payee belongs to the authenticated user.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyPayeeOwnership(
  supabase: SupabaseClient,
  payeeId: string,
  userId: string,
): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('payees')
    .select('id, name, sort_code, account_number, first_used_at')
    .eq('id', payeeId)
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new Error('Payee not found or access denied')
  return data as Record<string, any>
}

/**
 * Verify a card belongs to the authenticated user.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function verifyCardOwnership(
  supabase: SupabaseClient,
  cardId: string,
  userId: string,
): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('cards')
    .select('id, status')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single()

  if (error || !data) throw new Error('Card not found or access denied')
  return data as Record<string, any>
}

// ---------------------------------------------------------------------------
// KYC verification — ensures the user has completed identity verification
// ---------------------------------------------------------------------------

/**
 * Verifies the user's KYC status is 'verified'.
 * Blocks all financial operations (transfers, payments, account opening)
 * when KYC is not complete.
 */
export async function requireKycVerified(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw new Error('Unable to verify your identity status. Please try again.')
  }

  const status = (profile as Record<string, unknown>).kyc_status as string | null

  if (status !== 'verified') {
    const messages: Record<string, string> = {
      not_started: 'You must complete identity verification before making transactions. Go to Settings → Verification to get started.',
      pending: 'Your identity verification is still being reviewed. You will be able to make transactions once it has been approved.',
      failed: 'Your identity verification was unsuccessful. Please contact support or resubmit your documents in Settings → Verification.',
      expired: 'Your identity verification has expired. Please update your documents in Settings → Verification to continue making transactions.',
    }

    throw new Error(messages[status ?? 'not_started'] || messages.not_started)
  }
}

/**
 * Escape special characters in ILIKE patterns to prevent wildcard injection.
 */
export function escapeIlike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&')
}
