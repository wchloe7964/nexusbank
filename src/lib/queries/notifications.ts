import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/lib/types'

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('getNotifications error:', error.message)
    return []
  }
  return data as Notification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  if (error) {
    console.error('getUnreadCount error:', error.message)
    return 0
  }
  return count ?? 0
}
