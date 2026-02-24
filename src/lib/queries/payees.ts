import { createClient } from '@/lib/supabase/server'
import type { Payee } from '@/lib/types'

export async function getPayees(): Promise<Payee[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .order('is_favourite', { ascending: false })
    .order('name')

  if (error) throw error
  return data as Payee[]
}
