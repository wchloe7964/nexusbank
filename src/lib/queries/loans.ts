import { createClient } from '@/lib/supabase/server'
import type { Loan } from '@/lib/types'

export async function getLoans(): Promise<Loan[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('loans')
    .select('*, linked_account:accounts(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getLoans error:', error.message)
    const { data: fallback, error: fbErr } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })

    if (fbErr) return []
    return (fallback ?? []) as Loan[]
  }

  return (data ?? []) as Loan[]
}

export async function getLoanById(id: string): Promise<Loan | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('loans')
    .select('*, linked_account:accounts(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getLoanById error:', error.message)
    return null
  }

  return data as Loan
}
