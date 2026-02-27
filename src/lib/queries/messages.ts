import { createClient } from '@/lib/supabase/server'
import type { Conversation, SecureMessage } from '@/lib/types'

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', user.id)
    .order('last_message_at', { ascending: false })

  return (data as Conversation[]) || []
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single()

  return data as Conversation | null
}

export async function getMessages(conversationId: string): Promise<SecureMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('secure_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return (data as SecureMessage[]) || []
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { count } = await supabase
    .from('secure_messages')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
    .neq('sender_id', user.id)
    .in(
      'conversation_id',
      (await supabase.from('conversations').select('id').eq('customer_id', user.id)).data?.map(c => c.id) || []
    )

  return count || 0
}
