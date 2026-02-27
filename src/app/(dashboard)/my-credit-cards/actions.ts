'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership } from '@/lib/validation'

export async function makeCreditCardPayment(data: {
  creditCardId: string
  fromAccountId: string
  amount: number
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.amount, 'Payment amount')

  // Verify the account belongs to the user
  await verifyAccountOwnership(supabase, data.fromAccountId, userId)

  // Verify the credit card belongs to the user
  const { data: card, error: cardError } = await supabase
    .from('credit_cards')
    .select('id, user_id')
    .eq('id', data.creditCardId)
    .eq('user_id', userId)
    .single()

  if (cardError || !card) throw new Error('Credit card not found or access denied')

  // RPC handles locking, balance checks, and atomicity
  const { error } = await supabase.rpc('make_credit_card_payment', {
    p_credit_card_id: data.creditCardId,
    p_from_account_id: data.fromAccountId,
    p_amount: data.amount,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/my-credit-cards')
  revalidatePath(`/my-credit-cards/${data.creditCardId}`)
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleCreditCardFreeze(cardId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { data: card, error: fetchError } = await supabase
    .from('credit_cards')
    .select('status')
    .eq('id', cardId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !card) throw new Error('Credit card not found or access denied')

  const newStatus = card.status === 'frozen' ? 'active' : 'frozen'

  const { error } = await supabase
    .from('credit_cards')
    .update({ status: newStatus })
    .eq('id', cardId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  // Audit log — credit card freeze is a security event
  await supabase.from('login_activity').insert({
    user_id: userId,
    event_type: 'suspicious_activity',
    metadata: {
      action: newStatus === 'frozen' ? 'credit_card_frozen' : 'credit_card_unfrozen',
      credit_card_id: cardId,
    },
  })

  revalidatePath('/my-credit-cards')
  revalidatePath(`/my-credit-cards/${cardId}`)
  return { success: true, newStatus }
}
