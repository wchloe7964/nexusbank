import { createClient } from '@/lib/supabase/server'
import type { Dispute } from '@/lib/types'

export async function getDisputes(): Promise<Dispute[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('disputes')
    .select('*, transaction:transactions(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getDisputes error:', error.message)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false })

    if (fallbackError) {
      console.error('getDisputes fallback error:', fallbackError.message)
      return []
    }
    return (fallbackData ?? []) as Dispute[]
  }
  return data as Dispute[]
}

export async function getDisputeById(disputeId: string): Promise<Dispute | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('disputes')
    .select('*, transaction:transactions(*)')
    .eq('id', disputeId)
    .single()

  if (error) {
    console.error('getDisputeById error:', error.message)
    return null
  }
  return data as Dispute
}

export async function getDisputeForTransaction(transactionId: string): Promise<Dispute | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('disputes')
    .select('id, status')
    .eq('transaction_id', transactionId)
    .not('status', 'in', '("closed","resolved_denied")')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('getDisputeForTransaction error:', error.message)
    return null
  }
  return data as Dispute | null
}
