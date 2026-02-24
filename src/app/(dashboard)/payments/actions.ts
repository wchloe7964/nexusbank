'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function togglePaymentPause(paymentId: string, newStatus: 'active' | 'paused') {
  const supabase = await createClient()

  const { error } = await supabase
    .from('scheduled_payments')
    .update({ status: newStatus })
    .eq('id', paymentId)

  if (error) throw error
  revalidatePath('/payments')
}

export async function cancelScheduledPayment(paymentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('scheduled_payments')
    .update({ status: 'cancelled' })
    .eq('id', paymentId)

  if (error) throw error
  revalidatePath('/payments')
}
