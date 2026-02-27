'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership, verifyPayeeOwnership } from '@/lib/validation'

const VALID_FREQUENCIES = ['weekly', 'fortnightly', 'monthly', 'quarterly', 'annually']

export async function createStandingOrder(data: {
  fromAccountId: string
  payeeId: string
  amount: number
  reference?: string
  frequency: string
  nextPaymentDate: string
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.amount, 'Standing order amount')

  if (!VALID_FREQUENCIES.includes(data.frequency)) {
    throw new Error('Invalid payment frequency')
  }

  // Verify account and payee belong to user
  await verifyAccountOwnership(supabase, data.fromAccountId, userId)
  await verifyPayeeOwnership(supabase, data.payeeId, userId)

  const { error } = await supabase.from('scheduled_payments').insert({
    user_id: userId,
    from_account_id: data.fromAccountId,
    payee_id: data.payeeId,
    payment_type: 'standing_order',
    amount: data.amount,
    reference: data.reference?.trim() || null,
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
  const userId = await requireAuth(supabase)

  validateAmount(data.amount, 'Standing order amount')

  if (!VALID_FREQUENCIES.includes(data.frequency)) {
    throw new Error('Invalid payment frequency')
  }

  const { error } = await supabase
    .from('scheduled_payments')
    .update({
      amount: data.amount,
      frequency: data.frequency,
      next_payment_date: data.nextPaymentDate,
      reference: data.reference?.trim() || null,
    })
    .eq('id', paymentId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/payments')
  revalidatePath('/payments/standing-orders')
  revalidatePath(`/payments/standing-orders/${paymentId}`)
}
