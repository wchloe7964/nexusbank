import { createClient } from '@/lib/supabase/server'
import type { InternationalPayment } from '@/lib/types'

export async function getInternationalPayments(): Promise<InternationalPayment[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('international_payments')
    .select('*, from_account:accounts!from_account_id(id, account_name, sort_code, account_number, currency_code, balance)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data as InternationalPayment[]) || []
}

export async function getInternationalPayment(id: string): Promise<InternationalPayment | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('international_payments')
    .select('*, from_account:accounts!from_account_id(id, account_name, sort_code, account_number, currency_code, balance)')
    .eq('id', id)
    .single()

  return data as InternationalPayment | null
}
