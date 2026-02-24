import { createClient } from '@/lib/supabase/server'
import type { CreditCard } from '@/lib/types'

export async function getCreditCards(): Promise<CreditCard[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*, linked_account:accounts(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getCreditCards error:', error.message)
    const { data: fallback, error: fbErr } = await supabase
      .from('credit_cards')
      .select('*')
      .order('created_at', { ascending: false })

    if (fbErr) return []
    return (fallback ?? []) as CreditCard[]
  }

  return (data ?? []) as CreditCard[]
}

export async function getCreditCardById(id: string): Promise<CreditCard | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*, linked_account:accounts(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getCreditCardById error:', error.message)
    return null
  }

  return data as CreditCard
}
