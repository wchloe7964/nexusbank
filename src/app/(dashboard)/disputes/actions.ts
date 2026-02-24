'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDispute(data: {
  transactionId: string
  reason: string
  description?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check for existing active dispute on this transaction
  const { data: existing } = await supabase
    .from('disputes')
    .select('id')
    .eq('transaction_id', data.transactionId)
    .not('status', 'in', '("closed","resolved_denied")')
    .limit(1)
    .maybeSingle()

  if (existing) throw new Error('An active dispute already exists for this transaction')

  const { error } = await supabase.from('disputes').insert({
    user_id: user.id,
    transaction_id: data.transactionId,
    reason: data.reason,
    description: data.description || null,
  })

  if (error) throw new Error(error.message)

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('disputes')
    .update({
      description,
      status: 'under_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', disputeId)

  if (error) throw new Error(error.message)

  revalidatePath('/disputes')
  revalidatePath(`/disputes/${disputeId}`)
}
