import { createClient } from '@/lib/supabase/server'
import type { Account } from '@/lib/types'

const OVERDRAFT_EAR = 0.1 // 10% EAR
const DAILY_RATE = OVERDRAFT_EAR / 365

export interface OverdraftUsage {
  accountId: string
  accountName: string
  accountType: string
  balance: number
  overdraftLimit: number
  usedAmount: number
  availableOverdraft: number
  usagePercentage: number
  isInOverdraft: boolean
  dailyInterestCost: number
  monthlyInterestCost: number
  daysUntilOverdraft: number | null
}

export async function getOverdraftUsage(): Promise<OverdraftUsage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .gt('overdraft_limit', 0)
    .order('is_primary', { ascending: false })

  if (error) {
    console.error('getOverdraftUsage error:', error.message)
    return []
  }

  const accounts = (data ?? []) as Account[]

  return accounts.map((account) => {
    const isInOverdraft = account.balance < 0
    const usedAmount = isInOverdraft ? Math.abs(account.balance) : 0
    const availableOverdraft = account.overdraft_limit - usedAmount
    const usagePercentage = account.overdraft_limit > 0
      ? (usedAmount / account.overdraft_limit) * 100
      : 0
    const dailyInterestCost = usedAmount * DAILY_RATE
    const monthlyInterestCost = dailyInterestCost * 30

    return {
      accountId: account.id,
      accountName: account.account_name,
      accountType: account.account_type,
      balance: account.balance,
      overdraftLimit: account.overdraft_limit,
      usedAmount,
      availableOverdraft,
      usagePercentage,
      isInOverdraft,
      dailyInterestCost,
      monthlyInterestCost,
      daysUntilOverdraft: null, // Will be calculated separately
    }
  })
}

export async function projectOverdraftDate(accountId: string): Promise<number | null> {
  const supabase = await createClient()

  // Fetch the account
  const { data: account } = await supabase
    .from('accounts')
    .select('balance')
    .eq('id', accountId)
    .single()

  if (!account || account.balance <= 0) return account?.balance === 0 ? 0 : null

  // Fetch last 30 days of debit transactions
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('account_id', accountId)
    .gte('transaction_date', thirtyDaysAgo.toISOString())

  if (!transactions || transactions.length === 0) return null

  const totalDebits = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalCredits = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const netDailyOutflow = (totalDebits - totalCredits) / 30

  if (netDailyOutflow <= 0) return null // Net positive, won't hit overdraft

  const daysUntilZero = account.balance / netDailyOutflow
  return Math.round(daysUntilZero)
}
