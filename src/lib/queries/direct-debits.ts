import { createClient } from '@/lib/supabase/server'
import type { ScheduledPayment, Transaction } from '@/lib/types'

export async function getDirectDebits(): Promise<ScheduledPayment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*, payee:payees(*), from_account:accounts!from_account_id(*)')
    .eq('payment_type', 'direct_debit')
    .order('next_payment_date')

  if (error) {
    console.error('getDirectDebits error:', error.message)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('scheduled_payments')
      .select('*')
      .eq('payment_type', 'direct_debit')
      .order('next_payment_date')

    if (fallbackError) {
      console.error('getDirectDebits fallback error:', fallbackError.message)
      return []
    }
    return (fallbackData ?? []) as ScheduledPayment[]
  }
  return data as ScheduledPayment[]
}

export async function getDirectDebitById(paymentId: string): Promise<ScheduledPayment | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('scheduled_payments')
    .select('*, payee:payees(*), from_account:accounts!from_account_id(*)')
    .eq('id', paymentId)
    .eq('payment_type', 'direct_debit')
    .single()

  if (error) {
    console.error('getDirectDebitById error:', error.message)
    return null
  }
  return data as ScheduledPayment
}

export async function getDirectDebitPaymentHistory(
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
    console.error('getDirectDebitPaymentHistory error:', error.message)
    return []
  }
  return (data ?? []) as Transaction[]
}
