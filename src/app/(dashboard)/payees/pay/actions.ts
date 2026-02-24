'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function executePayeePayment(data: {
  fromAccountId: string
  payeeId: string
  amount: number
  reference?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get source account
  const { data: fromAccount, error: fromError } = await supabase
    .from('accounts')
    .select('id, balance, account_name')
    .eq('id', data.fromAccountId)
    .single()

  if (fromError || !fromAccount) throw new Error('Source account not found')

  // Get payee details
  const { data: payee, error: payeeError } = await supabase
    .from('payees')
    .select('*')
    .eq('id', data.payeeId)
    .single()

  if (payeeError || !payee) throw new Error('Payee not found')

  // Check balance
  if (Number(fromAccount.balance) < data.amount) {
    throw new Error('Insufficient funds')
  }

  // Deduct from account
  const newBalance = Number(fromAccount.balance) - data.amount
  const { error: updateError } = await supabase
    .from('accounts')
    .update({ balance: newBalance, available_balance: newBalance })
    .eq('id', data.fromAccountId)

  if (updateError) throw updateError

  // Create transaction record
  const { error: txError } = await supabase.from('transactions').insert({
    account_id: data.fromAccountId,
    type: 'debit',
    amount: data.amount,
    currency_code: 'GBP',
    description: `Payment to ${payee.name}`,
    reference: data.reference || null,
    counterparty_name: payee.name,
    counterparty_sort_code: payee.sort_code,
    counterparty_account_number: payee.account_number,
    category: 'transfer',
    status: 'completed',
    transaction_date: new Date().toISOString(),
    balance_after: newBalance,
  })

  if (txError) {
    // Try to revert balance on transaction insert failure
    await supabase
      .from('accounts')
      .update({ balance: Number(fromAccount.balance), available_balance: Number(fromAccount.balance) })
      .eq('id', data.fromAccountId)
    throw txError
  }

  revalidatePath('/payees')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')

  return { success: true }
}
