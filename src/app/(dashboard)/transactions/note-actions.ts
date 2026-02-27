'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveTransactionNote(data: {
  transactionId: string
  note?: string
  tags?: string[]
}) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const note = data.note?.trim() || null
  const tags = (data.tags ?? []).slice(0, 10)

  if (note && note.length > 500) throw new Error('Note must be 500 characters or less')

  // Verify the transaction belongs to an account owned by the user
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('id, account_id, accounts!inner(user_id)')
    .eq('id', data.transactionId)
    .eq('accounts.user_id', user.id)
    .single()

  if (txError || !transaction) throw new Error('Transaction not found or access denied')

  // Upsert: insert or update based on unique constraint
  const { error } = await supabase
    .from('transaction_notes')
    .upsert(
      {
        user_id: user.id,
        transaction_id: data.transactionId,
        note,
        tags,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,transaction_id' }
    )

  if (error) throw new Error('Failed to save note: ' + error.message)

  revalidatePath('/transactions')
}

export async function deleteTransactionNote(transactionId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('transaction_notes')
    .delete()
    .eq('transaction_id', transactionId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to delete note')

  revalidatePath('/transactions')
}
