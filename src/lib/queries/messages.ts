import { createClient } from '@/lib/supabase/server'
import type { Conversation, SecureMessage } from '@/lib/types'

export async function getConversations(): Promise<Conversation[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Fetch conversations
  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', user.id)
    .order('last_message_at', { ascending: false })

  if (!conversations || conversations.length === 0) return []

  // Fetch latest message per conversation (for preview)
  const convIds = conversations.map((c) => c.id)

  const { data: latestMessages } = await supabase
    .from('secure_messages')
    .select('conversation_id, body, sender_role, created_at')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: false })

  // Fetch unread count per conversation
  const { data: unreadRows } = await supabase
    .from('secure_messages')
    .select('conversation_id')
    .in('conversation_id', convIds)
    .eq('is_read', false)
    .neq('sender_id', user.id)

  // Build lookup maps
  const latestMap: Record<string, { body: string; sender_role: string; created_at: string }> = {}
  for (const msg of latestMessages ?? []) {
    if (!latestMap[msg.conversation_id]) {
      latestMap[msg.conversation_id] = msg
    }
  }

  const unreadMap: Record<string, number> = {}
  for (const row of unreadRows ?? []) {
    unreadMap[row.conversation_id] = (unreadMap[row.conversation_id] || 0) + 1
  }

  // Merge into conversations
  return conversations.map((c) => ({
    ...c,
    latest_message: latestMap[c.id]
      ? ({
          body: latestMap[c.id].body,
          sender_role: latestMap[c.id].sender_role,
          created_at: latestMap[c.id].created_at,
        } as unknown as SecureMessage)
      : null,
    unread_count: unreadMap[c.id] || 0,
  })) as Conversation[]
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
