'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStandingOrder(data: {
  fromAccountId: string
  payeeId: string
  amount: number
  reference?: string
  frequency: string
  nextPaymentDate: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('scheduled_payments').insert({
    user_id: user.id,
    from_account_id: data.fromAccountId,
    payee_id: data.payeeId,
    payment_type: 'standing_order',
    amount: data.amount,
    reference: data.reference || null,
    description: null,
    frequency: data.frequency,
    next_payment_date: data.nextPaymentDate,
    status: 'active',
  })

  if (error) throw new Error(error.message)

  revalidatePath('/payments')
  revalidatePath('/payments/standing-orders')
}

export async function updateStandingOrder(
  paymentId: string,
  data: {
    amount: number
    frequency: string
    nextPaymentDate: string
    reference?: string
  },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('scheduled_payments')
    .update({
      amount: data.amount,
      frequency: data.frequency,
      next_payment_date: data.nextPaymentDate,
      reference: data.reference || null,
    })
    .eq('id', paymentId)

  if (error) throw new Error(error.message)

  revalidatePath('/payments')
  revalidatePath('/payments/standing-orders')
  revalidatePath(`/payments/standing-orders/${paymentId}`)
}
