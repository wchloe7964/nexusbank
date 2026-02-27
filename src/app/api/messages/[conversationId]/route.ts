import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/messages/:conversationId
 * Returns messages for a conversation (client-side fetch from thread view).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Verify the conversation belongs to this user
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('customer_id', user.id)
    .single()

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from('secure_messages')
    .select('id, conversation_id, sender_id, sender_role, body, attachments, is_read, read_at, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ messages: messages || [] })
}
