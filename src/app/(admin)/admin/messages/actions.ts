'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import type { Conversation, SecureMessage, ConversationStatus } from '@/lib/types'

// ─── Fetch all conversations for admin inbox ────────────────────────────────

interface AdminConversationFilters {
  status?: string
  category?: string
  page?: number
  pageSize?: number
}

export async function getAdminConversations(filters: AdminConversationFilters = {}): Promise<{
  data: (Conversation & { profile?: { full_name: string; email: string } })[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  await requireAdmin()
  const admin = createAdminClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // conversations.customer_id → auth.users(id), no direct FK to profiles
  // so we fetch conversations + profiles separately and merge
  let query = admin
    .from('conversations')
    .select('*', { count: 'exact' })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  query = query.order('last_message_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Admin conversations query error:', error.message)
    throw new Error('Failed to load conversations')
  }

  const conversations = (data ?? []) as Conversation[]

  // Fetch profiles for all customer_ids in this page
  const customerIds = [...new Set(conversations.map((c) => c.customer_id))]
  let profileMap: Record<string, { full_name: string; email: string }> = {}

  if (customerIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', customerIds)

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p: { id: string; full_name: string; email: string }) => [p.id, { full_name: p.full_name, email: p.email }])
      )
    }
  }

  const merged = conversations.map((c) => ({
    ...c,
    profile: profileMap[c.customer_id] ?? undefined,
  }))

  return {
    data: merged,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ─── Get messages for a conversation ─────────────────────────────────────────

export async function getConversationMessages(conversationId: string): Promise<{
  conversation: Conversation & { profile?: { full_name: string; email: string } }
  messages: SecureMessage[]
}> {
  await requireAdmin()
  const admin = createAdminClient()

  const [convResult, msgResult] = await Promise.all([
    admin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single(),
    admin
      .from('secure_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true }),
  ])

  if (convResult.error || !convResult.data) {
    throw new Error('Conversation not found')
  }

  const conversation = convResult.data as Conversation

  // Fetch the customer profile separately (no direct FK to profiles)
  const { data: profileData } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', conversation.customer_id)
    .single()

  return {
    conversation: {
      ...conversation,
      profile: profileData ? { full_name: profileData.full_name, email: profileData.email } : undefined,
    },
    messages: (msgResult.data ?? []) as SecureMessage[],
  }
}

// ─── Reply to conversation ──────────────────────────────────────────────────

export async function replyToConversation(
  conversationId: string,
  body: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!body?.trim()) throw new Error('Reply message is required')

  const { data: conversation } = await admin
    .from('conversations')
    .select('id, customer_id, subject, status')
    .eq('id', conversationId)
    .single()

  if (!conversation) throw new Error('Conversation not found')

  // Insert message as advisor
  const { error: msgError } = await admin.from('secure_messages').insert({
    conversation_id: conversationId,
    sender_id: adminUserId,
    sender_role: 'advisor',
    body: body.trim(),
    attachments: [],
    is_read: false,
  })

  if (msgError) {
    console.error('Reply insert error:', msgError.message)
    throw new Error('Failed to send reply')
  }

  // Update conversation status to awaiting_customer
  await admin
    .from('conversations')
    .update({
      status: 'awaiting_customer',
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)

  // Notify customer
  await admin.from('notifications').insert({
    user_id: conversation.customer_id,
    title: 'New message from NexusBank',
    message: `You have a new reply in your conversation: "${conversation.subject}"`,
    type: 'info',
    is_read: false,
  })

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'secure_messages',
    targetId: conversationId,
    action: 'admin_message_reply',
    details: { conversation_subject: conversation.subject },
  })

  revalidatePath('/admin/messages')
  return { success: true }
}

// ─── Update conversation status ─────────────────────────────────────────────

const VALID_STATUSES: ConversationStatus[] = ['open', 'awaiting_customer', 'awaiting_bank', 'resolved', 'closed']

export async function updateConversationStatus(
  conversationId: string,
  newStatus: ConversationStatus
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!VALID_STATUSES.includes(newStatus)) throw new Error('Invalid status')

  const { data: conversation } = await admin
    .from('conversations')
    .select('id, customer_id, subject, status')
    .eq('id', conversationId)
    .single()

  if (!conversation) throw new Error('Conversation not found')

  const { error } = await admin
    .from('conversations')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) {
    console.error('Conversation status update error:', error.message)
    throw new Error('Failed to update conversation status')
  }

  if (newStatus === 'resolved' || newStatus === 'closed') {
    await admin.from('notifications').insert({
      user_id: conversation.customer_id,
      title: `Conversation ${newStatus}`,
      message: `Your conversation "${conversation.subject}" has been ${newStatus}.`,
      type: 'info',
      is_read: false,
    })
  }

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'conversations',
    targetId: conversationId,
    action: 'conversation_status_updated',
    details: {
      old_status: conversation.status,
      new_status: newStatus,
    },
  })

  revalidatePath('/admin/messages')
  return { success: true }
}

// ─── Update conversation priority ───────────────────────────────────────────

export async function updateConversationPriority(
  conversationId: string,
  priority: 'low' | 'normal' | 'high' | 'urgent'
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('conversations')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) {
    console.error('Priority update error:', error.message)
    throw new Error('Failed to update priority')
  }

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'conversations',
    targetId: conversationId,
    action: 'conversation_priority_updated',
    details: { new_priority: priority },
  })

  revalidatePath('/admin/messages')
  return { success: true }
}
