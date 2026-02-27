import { createClient } from '@/lib/supabase/server'
import { toPence, fromPence } from '@/lib/validation'
import type { Account } from '@/lib/types'

export async function getAccounts(): Promise<Account[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .order('is_primary', { ascending: false })
    .order('account_type')

  if (error) {
    console.error('getAccounts error:', error.message)
    return []
  }
  return data as Account[]
}

export async function getAccountById(accountId: string): Promise<Account | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error) return null
  return data as Account
}

export async function getTotalBalance(): Promise<number> {
  const accounts = await getAccounts()
  // Use integer pence arithmetic to avoid floating-point errors
  const totalPence = accounts.reduce((sum, acc) => sum + toPence(acc.balance), 0)
  return fromPence(totalPence)
}
