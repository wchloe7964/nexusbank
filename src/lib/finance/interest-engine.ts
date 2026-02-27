import { createAdminClient } from '@/lib/supabase/admin'
import type { InterestSummary } from '@/lib/types/limits'

/**
 * Calculate daily interest for a given balance and annual rate.
 * Uses actual/365 day count convention (standard for UK banking).
 */
export function calculateDailyInterest(balance: number, annualRate: number): number {
  if (balance <= 0 || annualRate <= 0) return 0
  return (balance * annualRate) / 365
}

/**
 * Accrue daily interest for a specific account.
 * Fetches the current balance and applicable interest rate,
 * then inserts a daily accrual record.
 */
export async function accrueInterestForAccount(
  accountId: string,
  accrualDate?: string
): Promise<{ accrued: boolean; amount?: number; error?: string }> {
  const admin = createAdminClient()
  const date = accrualDate || new Date().toISOString().split('T')[0]

  // Get account details
  const { data: account, error: accErr } = await admin
    .from('accounts')
    .select('balance, account_type')
    .eq('id', accountId)
    .single()

  if (accErr || !account) {
    return { accrued: false, error: 'Account not found' }
  }

  // Get interest rate for account type
  const { data: config } = await admin
    .from('interest_config')
    .select('annual_rate')
    .eq('account_type', account.account_type)
    .eq('is_active', true)
    .maybeSingle()

  if (!config) {
    return { accrued: false, error: 'No interest config for account type' }
  }

  const balance = Number(account.balance)
  const rate = Number(config.annual_rate)
  const dailyAmount = calculateDailyInterest(balance, rate)

  if (dailyAmount <= 0) {
    return { accrued: false, error: 'No interest to accrue (zero balance or rate)' }
  }

  // Insert accrual record (upsert to avoid duplicates)
  const { error: insertErr } = await admin
    .from('interest_accruals')
    .upsert(
      {
        account_id: accountId,
        accrual_date: date,
        balance_snapshot: balance,
        annual_rate: rate,
        daily_amount: dailyAmount,
      },
      { onConflict: 'account_id,accrual_date' }
    )

  if (insertErr) {
    return { accrued: false, error: insertErr.message }
  }

  return { accrued: true, amount: dailyAmount }
}

/**
 * Get the interest summary for an account over a given period.
 */
export async function getAccruedInterest(
  accountId: string,
  periodDays: number = 30
): Promise<InterestSummary> {
  const admin = createAdminClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  // Get accruals in the period
  const { data: accruals } = await admin
    .from('interest_accruals')
    .select('daily_amount, is_paid')
    .eq('account_id', accountId)
    .gte('accrual_date', startDate.toISOString().split('T')[0])

  const totalAccrued = (accruals ?? []).reduce((sum, a) => sum + Number(a.daily_amount), 0)
  const totalPaid = (accruals ?? []).reduce(
    (sum, a) => sum + (a.is_paid ? Number(a.daily_amount) : 0),
    0
  )

  // Get current rate
  const { data: account } = await admin
    .from('accounts')
    .select('account_type')
    .eq('id', accountId)
    .single()

  let currentRate = 0
  if (account) {
    const { data: config } = await admin
      .from('interest_config')
      .select('annual_rate')
      .eq('account_type', account.account_type)
      .eq('is_active', true)
      .maybeSingle()
    currentRate = Number(config?.annual_rate ?? 0)
  }

  return {
    accountId,
    totalAccrued: Math.round(totalAccrued * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    pendingAmount: Math.round((totalAccrued - totalPaid) * 100) / 100,
    currentRate,
    dayCount: (accruals ?? []).length,
  }
}
