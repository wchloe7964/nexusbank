'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/validation'

export async function createDispute(data: {
  transactionId: string
  reason: string
  description?: string
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Verify the transaction belongs to the user (via their account)
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .select('id, account_id, accounts!inner(user_id)')
    .eq('id', data.transactionId)
    .single()

  if (txError || !transaction) throw new Error('Transaction not found or access denied')

  // Check for existing active dispute on this transaction
  const { data: existing } = await supabase
    .from('disputes')
    .select('id')
    .eq('transaction_id', data.transactionId)
    .eq('user_id', userId)
    .not('status', 'in', '("closed","resolved_denied")')
    .limit(1)
    .maybeSingle()

  if (existing) throw new Error('An active dispute already exists for this transaction')

  const validReasons = ['unauthorized', 'duplicate', 'wrong_amount', 'not_received', 'defective', 'cancelled', 'other']
  if (!validReasons.includes(data.reason)) throw new Error('Invalid dispute reason')

  const { error } = await supabase.from('disputes').insert({
    user_id: userId,
    transaction_id: data.transactionId,
    reason: data.reason,
    description: data.description?.trim() || null,
  })

  if (error) throw new Error(error.message)

  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Dispute Filed',
    message: 'Your dispute has been submitted and is under review. We aim to resolve disputes within 15 working days.',
    type: 'account',
    action_url: '/disputes',
  })

  revalidatePath('/disputes')
  revalidatePath('/transactions')
  return { success: true }
}

export async function addDisputeInfo(disputeId: string, description: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  if (!description.trim()) throw new Error('Description is required')

  const { error } = await supabase
    .from('disputes')
    .update({
      description: description.trim(),
      status: 'under_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/disputes')
  revalidatePath(`/disputes/${disputeId}`)
}
