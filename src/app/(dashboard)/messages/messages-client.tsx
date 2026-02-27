'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  MessageSquare, Plus, Send, ArrowLeft, Clock, CheckCircle,
  AlertCircle, ChevronRight, Inbox,
} from 'lucide-react'
import { createConversation, sendMessage, markMessagesRead } from './actions'
import type { Conversation, SecureMessage, ConversationCategory } from '@/lib/types'

const CATEGORY_OPTIONS: { value: ConversationCategory; label: string }[] = [
  { value: 'general', label: 'General enquiry' },
  { value: 'payment', label: 'Payments & transfers' },
  { value: 'account', label: 'My account' },
  { value: 'card', label: 'Cards' },
  { value: 'loan', label: 'Loans & borrowing' },
  { value: 'dispute', label: 'Transaction dispute' },
  { value: 'fraud', label: 'Fraud concern' },
  { value: 'technical', label: 'Technical issue' },
  { value: 'other', label: 'Other' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'text-blue-600 bg-blue-50', icon: Clock },
  awaiting_customer: { label: 'Reply needed', color: 'text-amber-600 bg-amber-50', icon: AlertCircle },
  awaiting_bank: { label: 'Awaiting reply', color: 'text-blue-600 bg-blue-50', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-muted-foreground bg-muted', icon: CheckCircle },
}

interface Props {
  conversations: Conversation[]
}

export function MessagesClient({ conversations: initialConversations }: Props) {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'compose' | 'thread'>('list')
  const [conversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SecureMessage[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  // Compose state
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<ConversationCategory>('general')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reply state
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openThread = useCallback(async (conv: Conversation) => {
    setSelectedId(conv.id)
    setSelectedConversation(conv)
    setView('thread')

    // Fetch messages client-side
    const res = await fetch(`/api/messages/${conv.id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }

    // Mark as read
    await markMessagesRead(conv.id)
  }, [])

  const handleCompose = useCallback(async () => {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    setError(null)

    const result = await createConversation(subject.trim(), category, body.trim())
    if (result.error) {
      setError(result.error)
      setSending(false)
    } else {
      setSubject('')
      setBody('')
      setCategory('general')
      setSending(false)
      router.refresh()
      setView('list')
    }
  }, [subject, category, body, router])

  const handleReply = useCallback(async () => {
    if (!reply.trim() || !selectedId) return
    setReplying(true)

    const result = await sendMessage(selectedId, reply.trim())
    if (!result.error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversation_id: selectedId,
          sender_id: '',
          sender_role: 'customer' as const,
          body: reply.trim(),
          attachments: [],
          is_read: true,
          read_at: null,
          created_at: new Date().toISOString(),
        },
      ])
      setReply('')
    }
    setReplying(false)
  }, [reply, selectedId])

  // ── Compose View ──
  if (view === 'compose') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setView('list')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-xl font-bold">New Message</h1>
        </div>

        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ConversationCategory)}
              className="flex h-11 w-full rounded-full border border-input bg-card px-5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?"
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              maxLength={5000}
              className="flex w-full rounded-xl border border-input bg-card px-5 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setView('list')}>Cancel</Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleCompose}
              disabled={!subject.trim() || !body.trim()}
              loading={sending}
            >
              <Send className="h-4 w-4" /> Send message
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Thread View ──
  if (view === 'thread' && selectedConversation) {
    const status = STATUS_CONFIG[selectedConversation.status] || STATUS_CONFIG.open

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { setView('list'); setSelectedId(null) }}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{selectedConversation.subject}</h1>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
              <status.icon className="h-3 w-3" /> {status.label}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
          {/* Messages */}
          <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isCustomer = msg.sender_role === 'customer'
              const isSystem = msg.sender_role === 'system'

              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                      isSystem
                        ? 'bg-muted text-muted-foreground border border-border/40 w-full max-w-full'
                        : isCustomer
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-foreground border border-border/40'
                    }`}
                  >
                    {isSystem && (
                      <p className="text-[11px] font-semibold mb-1 opacity-70">System</p>
                    )}
                    {!isCustomer && !isSystem && (
                      <p className="text-[11px] font-semibold mb-1 opacity-70">NexusBank Advisor</p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                    <p className={`text-[10px] mt-1.5 ${isCustomer ? 'text-primary-foreground/60' : 'text-muted-foreground/60'}`}>
                      {new Date(msg.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply box */}
          {selectedConversation.status !== 'closed' && (
            <div className="border-t border-border/60 p-4">
              <div className="flex gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply..."
                  rows={2}
                  maxLength={5000}
                  className="flex-1 rounded-xl border border-input bg-card px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() }
                  }}
                />
                <Button
                  className="self-end"
                  onClick={handleReply}
                  disabled={!reply.trim()}
                  loading={replying}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Inbox List View ──
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Secure Messages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send and receive messages securely with NexusBank
          </p>
        </div>
        <Button className="gap-2" onClick={() => setView('compose')}>
          <Plus className="h-4 w-4" /> New message
        </Button>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm p-12 text-center">
          <Inbox className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-semibold">No messages yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start a conversation with our team — we&apos;re here to help.
          </p>
          <Button className="mt-4 gap-2" onClick={() => setView('compose')}>
            <MessageSquare className="h-4 w-4" /> Start a conversation
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden divide-y divide-border/40">
          {conversations.map((conv) => {
            const status = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open
            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => openThread(conv)}
                className="w-full text-left px-5 py-4 hover:bg-accent/50 transition-colors flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold truncate">{conv.subject}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{conv.category.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(conv.last_message_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
