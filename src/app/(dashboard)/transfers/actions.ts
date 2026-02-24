'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function executeTransfer(data: {
  fromAccountId: string
  toAccountId: string
  amount: number
  reference?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate accounts belong to user
  const { data: fromAccount, error: fromError } = await supabase
    .from('accounts')
    .select('id, balance, account_name')
    .eq('id', data.fromAccountId)
    .single()

  if (fromError || !fromAccount) throw new Error('Source account not found')

  const { data: toAccount, error: toError } = await supabase
    .from('accounts')
    .select('id, account_name')
    .eq('id', data.toAccountId)
    .single()

  if (toError || !toAccount) throw new Error('Destination account not found')

  if (Number(fromAccount.balance) < data.amount) {
    throw new Error('Insufficient funds')
  }

  // Debit from source
  const { error: debitError } = await supabase.rpc('transfer_between_accounts', {
    p_from_account_id: data.fromAccountId,
    p_to_account_id: data.toAccountId,
    p_amount: data.amount,
    p_reference: data.reference || 'Internal Transfer',
  })

  // If RPC doesn't exist, do manual update
  if (debitError) {
    // Manual transfer fallback
    const { error: e1 } = await supabase
      .from('accounts')
      .update({ balance: Number(fromAccount.balance) - data.amount, available_balance: Number(fromAccount.balance) - data.amount })
      .eq('id', data.fromAccountId)

    if (e1) throw e1

    const { data: destBalance } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', data.toAccountId)
      .single()

    const newBalance = Number(destBalance?.balance || 0) + data.amount
    const { error: e2 } = await supabase
      .from('accounts')
      .update({ balance: newBalance, available_balance: newBalance })
      .eq('id', data.toAccountId)

    if (e2) throw e2

    // Create transaction records
    await supabase.from('transactions').insert([
      {
        account_id: data.fromAccountId,
        type: 'debit',
        amount: data.amount,
        currency_code: 'GBP',
        description: `Transfer to ${toAccount.account_name}`,
        reference: data.reference || 'Internal Transfer',
        category: 'transfer',
        status: 'completed',
        transaction_date: new Date().toISOString(),
      },
      {
        account_id: data.toAccountId,
        type: 'credit',
        amount: data.amount,
        currency_code: 'GBP',
        description: `Transfer from ${fromAccount.account_name}`,
        reference: data.reference || 'Internal Transfer',
        category: 'transfer',
        status: 'completed',
        transaction_date: new Date().toISOString(),
      },
    ])
  }

  revalidatePath('/transfers')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')

  return { success: true }
}
