import { createClient } from '@/lib/supabase/server'
import type { ScheduledPayment } from '@/lib/types'

export async function getScheduledPayments(): Promise<ScheduledPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*')
    .order('next_payment_date')

  if (error) throw error
  return data as ScheduledPayment[]
}
