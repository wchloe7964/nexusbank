import { createClient } from '@/lib/supabase/server'
import type { ScheduledPayment } from '@/lib/types'

export async function getScheduledPayments(): Promise<ScheduledPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*, payee:payees(*), from_account:accounts!from_account_id(*)')
    .order('next_payment_date')

  if (error) {
    console.error('getScheduledPayments error:', error.message)
    // Fallback: try without joins in case the relationship fails
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('scheduled_payments')
      .select('*')
      .order('next_payment_date')

    if (fallbackError) {
      console.error('getScheduledPayments fallback error:', fallbackError.message)
      return []
    }
    return (fallbackData ?? []) as ScheduledPayment[]
  }
  return data as ScheduledPayment[]
}

export async function togglePaymentStatus(paymentId: string, status: 'active' | 'paused') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('scheduled_payments')
    .update({ status })
    .eq('id', paymentId)

  if (error) throw error
}

export async function cancelPayment(paymentId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('scheduled_payments')
    .update({ status: 'cancelled' })
    .eq('id', paymentId)

  if (error) throw error
}
