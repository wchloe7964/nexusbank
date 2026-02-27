'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/validation'

export async function togglePaymentPause(paymentId: string, newStatus: 'active' | 'paused') {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('scheduled_payments')
    .update({ status: newStatus })
    .eq('id', paymentId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/payments')
}

export async function cancelScheduledPayment(paymentId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('scheduled_payments')
    .update({ status: 'cancelled' })
    .eq('id', paymentId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/payments')
}
