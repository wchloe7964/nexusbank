import { createClient } from '@/lib/supabase/server'
import type { InvestmentAccount, Holding } from '@/lib/types'

export async function getInvestmentAccounts(): Promise<InvestmentAccount[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('investment_accounts')
    .select('*, holdings(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInvestmentAccounts error:', error.message)
    const { data: fallback, error: fbErr } = await supabase
      .from('investment_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (fbErr) return []
    return (fallback ?? []) as InvestmentAccount[]
  }

  return (data ?? []) as InvestmentAccount[]
}

export async function getInvestmentAccountById(id: string): Promise<InvestmentAccount | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('investment_accounts')
    .select('*, holdings(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getInvestmentAccountById error:', error.message)
    return null
  }

  return data as InvestmentAccount
}

export async function getHoldings(accountId: string): Promise<Holding[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('investment_account_id', accountId)
    .order('current_value', { ascending: false })

  if (error) {
    console.error('getHoldings error:', error.message)
    return []
  }

  return (data ?? []) as Holding[]
}
