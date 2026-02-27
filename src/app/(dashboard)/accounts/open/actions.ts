'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomInt } from 'crypto'
import type { AccountType } from '@/lib/types'
import { requireAuth, requireKycVerified } from '@/lib/validation'

function generateSortCode(): string {
  const p2 = String(randomInt(0, 100)).padStart(2, '0')
  const p3 = String(randomInt(0, 100)).padStart(2, '0')
  return `20-${p2}-${p3}`
}

function generateAccountNumber(): string {
  return String(randomInt(10000000, 100000000))
}

const VALID_ACCOUNT_TYPES: AccountType[] = ['current', 'savings', 'isa', 'business']

const ACCOUNT_DEFAULTS: Record<AccountType, {
  interestRate: number
  overdraftLimit: number
  cardRequired: boolean
}> = {
  current: { interestRate: 0, overdraftLimit: 1000, cardRequired: true },
  savings: { interestRate: 0.0415, overdraftLimit: 0, cardRequired: false },
  isa: { interestRate: 0.0375, overdraftLimit: 0, cardRequired: false },
  business: { interestRate: 0.005, overdraftLimit: 2000, cardRequired: true },
}

interface OpenAccountInput {
  accountType: AccountType
  accountName: string
  overdraftLimit: number
}

export async function openNewAccount(input: OpenAccountInput): Promise<{
  sortCode: string
  accountNumber: string
  accountId: string
  cardLast4?: string
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // ── KYC verification ──
  await requireKycVerified(supabase, userId)

  // Validate account type
  if (!VALID_ACCOUNT_TYPES.includes(input.accountType)) {
    throw new Error('Invalid account type')
  }

  // Validate account name
  const trimmedName = input.accountName.trim()
  if (!trimmedName || trimmedName.length > 100) {
    throw new Error('Account name must be between 1 and 100 characters')
  }

  const defaults = ACCOUNT_DEFAULTS[input.accountType]
  const sortCode = generateSortCode()
  const accountNumber = generateAccountNumber()

  // Determine overdraft: only for current/business, with bounds
  let overdraftLimit = 0
  if (input.accountType === 'current' || input.accountType === 'business') {
    overdraftLimit = Math.max(0, Math.min(Math.round(input.overdraftLimit), 25000))
  }

  // Insert account
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .insert({
      user_id: userId,
      account_name: trimmedName,
      account_type: input.accountType,
      sort_code: sortCode,
      account_number: accountNumber,
      balance: 0,
      available_balance: overdraftLimit,
      currency_code: 'GBP',
      interest_rate: defaults.interestRate,
      overdraft_limit: overdraftLimit,
      is_primary: false,
      is_active: true,
    })
    .select('id')
    .single()

  if (accountError) {
    console.error('openNewAccount error:', accountError.message)
    // Retry with different numbers if uniqueness violation
    if (accountError.code === '23505') {
      const retrySortCode = generateSortCode()
      const retryAccountNumber = generateAccountNumber()

      const { data: retryAccount, error: retryError } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          account_name: trimmedName,
          account_type: input.accountType,
          sort_code: retrySortCode,
          account_number: retryAccountNumber,
          balance: 0,
          available_balance: overdraftLimit,
          currency_code: 'GBP',
          interest_rate: defaults.interestRate,
          overdraft_limit: overdraftLimit,
          is_primary: false,
          is_active: true,
        })
        .select('id')
        .single()

      if (retryError) throw new Error('Failed to create account. Please try again.')

      let cardLast4: string | undefined
      if (defaults.cardRequired && retryAccount) {
        cardLast4 = await createCard(supabase, retryAccount.id, userId, trimmedName)
      }

      revalidatePath('/accounts')
      revalidatePath('/dashboard')

      return {
        sortCode: retrySortCode,
        accountNumber: retryAccountNumber,
        accountId: retryAccount!.id,
        cardLast4,
      }
    }

    throw new Error('Failed to create account')
  }

  let cardLast4: string | undefined
  if (defaults.cardRequired && account) {
    cardLast4 = await createCard(supabase, account.id, userId, trimmedName)
  }

  revalidatePath('/accounts')
  revalidatePath('/dashboard')

  return {
    sortCode,
    accountNumber,
    accountId: account!.id,
    cardLast4,
  }
}

async function createCard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  accountId: string,
  userId: string,
  accountName: string,
): Promise<string | undefined> {
  const last4 = String(randomInt(1000, 10000))
  const expiryDate = new Date()
  expiryDate.setFullYear(expiryDate.getFullYear() + 5)
  const expiryStr = `${String(expiryDate.getMonth() + 1).padStart(2, '0')}/${String(expiryDate.getFullYear()).slice(-2)}`

  const { error } = await supabase.from('cards').insert({
    account_id: accountId,
    user_id: userId,
    card_type: 'debit',
    card_number_last_four: last4,
    card_holder_name: accountName,
    expiry_date: expiryStr,
    is_frozen: false,
    is_contactless_enabled: true,
    online_payments_enabled: true,
    atm_withdrawals_enabled: true,
    spending_limit_daily: 5000,
    spending_limit_monthly: 30000,
    status: 'active',
  })

  if (error) {
    console.error('createCard error:', error.message)
    return undefined
  }

  return last4
}
