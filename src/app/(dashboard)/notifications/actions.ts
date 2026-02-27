'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/validation'

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/notifications')
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) throw error
  revalidatePath('/notifications')
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/notifications')
}
