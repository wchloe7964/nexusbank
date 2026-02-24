import { createClient } from '@/lib/supabase/server'
import type { ScheduledPayment, Transaction } from '@/lib/types'

export async function getStandingOrders(): Promise<ScheduledPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*, payee:payees(*), from_account:accounts!from_account_id(*)')
    .eq('payment_type', 'standing_order')
    .order('next_payment_date')

  if (error) {
    console.error('getStandingOrders error:', error.message)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('scheduled_payments')
      .select('*')
      .eq('payment_type', 'standing_order')
      .order('next_payment_date')

    if (fallbackError) {
      console.error('getStandingOrders fallback error:', fallbackError.message)
      return []
    }
    return (fallbackData ?? []) as ScheduledPayment[]
  }
  return data as ScheduledPayment[]
}

export async function getStandingOrderById(paymentId: string): Promise<ScheduledPayment | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*, payee:payees(*), from_account:accounts!from_account_id(*)')
    .eq('id', paymentId)
    .eq('payment_type', 'standing_order')
    .single()

  if (error) {
    console.error('getStandingOrderById error:', error.message)
    return null
  }
  return data as ScheduledPayment
}

export async function getStandingOrderPaymentHistory(
  counterpartyName: string,
  accountId: string,
  limit = 24,
): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .eq('type', 'debit')
    .ilike('counterparty_name', counterpartyName)
    .order('transaction_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getStandingOrderPaymentHistory error:', error.message)
    return []
  }
  return (data ?? []) as Transaction[]
}
