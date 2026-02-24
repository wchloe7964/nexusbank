'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createScheduledPayment(data: {
  accountId: string
  payeeName: string
  sortCode: string
  accountNumber: string
  amount: number
  frequency: string
  paymentType: string
  reference?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if payee already exists, or create one
  let payeeId: string | null = null
  const { data: existingPayee } = await supabase
    .from('payees')
    .select('id')
    .eq('user_id', user.id)
    .eq('sort_code', data.sortCode)
    .eq('account_number', data.accountNumber)
    .single()

  if (existingPayee) {
    payeeId = existingPayee.id
  } else {
    const { data: newPayee, error: payeeError } = await supabase
      .from('payees')
      .insert({
        user_id: user.id,
        name: data.payeeName,
        sort_code: data.sortCode,
        account_number: data.accountNumber,
        reference: data.reference || null,
        is_favourite: false,
      })
      .select('id')
      .single()

    if (payeeError) throw payeeError
    payeeId = newPayee.id
  }

  // Calculate next payment date (tomorrow for simplicity)
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + 1)

  const { error } = await supabase.from('scheduled_payments').insert({
    user_id: user.id,
    from_account_id: data.accountId,
    payee_id: payeeId,
    payment_type: data.paymentType,
    amount: data.amount,
    currency_code: 'GBP',
    reference: data.reference || null,
    description: `Payment to ${data.payeeName}`,
    frequency: data.frequency,
    next_payment_date: nextDate.toISOString().split('T')[0],
    status: 'active',
  })

  if (error) throw error
  revalidatePath('/payments')
  revalidatePath('/payees')
  return { success: true }
}
