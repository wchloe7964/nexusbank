'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function makeCreditCardPayment(data: {
  creditCardId: string
  fromAccountId: string
  amount: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.rpc('make_credit_card_payment', {
    p_credit_card_id: data.creditCardId,
    p_from_account_id: data.fromAccountId,
    p_amount: data.amount,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/my-credit-cards')
  revalidatePath(`/credit-cards/${data.creditCardId}`)
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function toggleCreditCardFreeze(cardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get current status
  const { data: card, error: fetchError } = await supabase
    .from('credit_cards')
    .select('status')
    .eq('id', cardId)
    .single()

  if (fetchError || !card) throw new Error('Credit card not found')

  const newStatus = card.status === 'frozen' ? 'active' : 'frozen'

  const { error } = await supabase
    .from('credit_cards')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', cardId)

  if (error) throw new Error(error.message)

  revalidatePath('/my-credit-cards')
  revalidatePath(`/credit-cards/${cardId}`)
  return { success: true, newStatus }
}
