'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAuditEvent } from '@/lib/audit'
import type { ConversationCategory } from '@/lib/types'

export async function createConversation(
  subject: string,
  category: ConversationCategory,
  body: string
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!subject.trim()) return { error: 'Subject is required' }
  if (!body.trim()) return { error: 'Message is required' }

  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      customer_id: user.id,
      subject: subject.trim(),
      category,
      status: 'open',
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (convError || !conversation) {
    return { error: 'Failed to create conversation' }
  }

  const { error: msgError } = await supabase
    .from('secure_messages')
    .insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      sender_role: 'customer',
      body: body.trim(),
    })

  if (msgError) {
    return { error: 'Conversation created but failed to send message' }
  }

  // Create auto-response from system
  const admin = createAdminClient()
  await admin.from('secure_messages').insert({
    conversation_id: conversation.id,
    sender_id: user.id, // system message
    sender_role: 'system',
    body: 'Thank you for your message. A member of our team will respond within 24 hours. For urgent matters, please reach us on WhatsApp at +44 7365 192524.',
    is_read: false,
  })

  await admin.from('conversations')
    .update({ status: 'awaiting_bank', last_message_at: new Date().toISOString() })
    .eq('id', conversation.id)

  await logAuditEvent({
    eventType: 'data_change',
    actorId: user.id,
    actorRole: 'customer',
    targetTable: 'conversations',
    targetId: conversation.id,
    action: 'conversation_created',
    details: { subject, category },
  })

  return { id: conversation.id }
}

export async function sendMessage(
  conversationId: string,
  body: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (!body.trim()) return { error: 'Message cannot be empty' }

  const { error: msgError } = await supabase
    .from('secure_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_role: 'customer',
      body: body.trim(),
    })

  if (msgError) return { error: 'Failed to send message' }

  // Update conversation timestamp and status
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      status: 'awaiting_bank',
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  return {}
}

export async function markMessagesRead(conversationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('secure_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false)
}

export async function closeConversation(conversationId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Only allow closing conversations owned by the authenticated user
  const { error } = await supabase
    .from('conversations')
    .update({ status: 'closed', updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('customer_id', user.id)

  if (error) return { error: 'Failed to close conversation' }
  return {}
}
