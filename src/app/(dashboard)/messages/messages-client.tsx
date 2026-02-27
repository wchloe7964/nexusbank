'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  MessageSquare,
  Plus,
  Send,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Inbox,
  Search,
  CreditCard,
  Wallet,
  ShieldAlert,
  HelpCircle,
  Wrench,
  Receipt,
  Banknote,
  MoreHorizontal,
  Paperclip,
  X,
  Headphones,
  Bot,
  CheckCheck,
  Archive,
} from 'lucide-react'
import { createConversation, sendMessage, markMessagesRead, closeConversation } from './actions'
import type { Conversation, SecureMessage, ConversationCategory } from '@/lib/types'

/* ─── Category config ─────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: typeof HelpCircle; color: string; bg: string }
> = {
  general: { label: 'General enquiry', icon: HelpCircle, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  payment: { label: 'Payments & transfers', icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
  account: { label: 'My account', icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  card: { label: 'Cards', icon: CreditCard, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30' },
  loan: { label: 'Loans & borrowing', icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  dispute: { label: 'Transaction dispute', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  fraud: { label: 'Fraud concern', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  technical: { label: 'Technical issue', icon: Wrench, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30' },
  other: { label: 'Other', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-950/30' },
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([value, config]) => ({
  value: value as ConversationCategory,
  ...config,
}))

/* ─── Status config ───────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', icon: Clock },
  awaiting_customer: { label: 'Reply needed', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30', icon: AlertCircle },
  awaiting_bank: { label: 'Awaiting reply', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-green-600 bg-green-50 dark:bg-green-950/30', icon: CheckCircle },
  closed: { label: 'Closed', color: 'text-muted-foreground bg-muted', icon: CheckCircle },
}

type TabFilter = 'all' | 'active' | 'resolved'

interface Props {
  conversations: Conversation[]
}

export function MessagesClient({ conversations: initialConversations }: Props) {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'compose' | 'thread'>('list')
  const [conversations] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SecureMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  // Filter / search state
  const [tab, setTab] = useState<TabFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Compose state
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState<ConversationCategory>('general')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [composeStep, setComposeStep] = useState<'category' | 'form'>('category')

  // Reply state
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    let result = conversations

    if (tab === 'active') {
      result = result.filter((c) => !['resolved', 'closed'].includes(c.status))
    } else if (tab === 'resolved') {
      result = result.filter((c) => ['resolved', 'closed'].includes(c.status))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.subject.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.latest_message as any)?.body?.toLowerCase().includes(q),
      )
    }

    return result
  }, [conversations, tab, searchQuery])

  // Counts for tabs
  const activeCount = conversations.filter((c) => !['resolved', 'closed'].includes(c.status)).length
  const resolvedCount = conversations.filter((c) => ['resolved', 'closed'].includes(c.status)).length
  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  const openThread = useCallback(async (conv: Conversation) => {
    setSelectedId(conv.id)
    setSelectedConversation(conv)
    setView('thread')
    setMessagesLoading(true)

    const res = await fetch(`/api/messages/${conv.id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(data.messages || [])
    }
    setMessagesLoading(false)

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
      setComposeStep('category')
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

  const handleClose = useCallback(async () => {
    if (!selectedId) return
    const result = await closeConversation(selectedId)
    if (!result.error) {
      setSelectedConversation((prev) => prev ? { ...prev, status: 'closed' } : prev)
      router.refresh()
    }
  }, [selectedId, router])

  const resetCompose = useCallback(() => {
    setView('list')
    setSubject('')
    setBody('')
    setCategory('general')
    setComposeStep('category')
    setError(null)
  }, [])

  /* ─── Helper: format relative time ──────────────────────────── */
  function formatRelativeTime(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  function formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = date.toDateString() === yesterday.toDateString()

    const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    if (isToday) return time
    if (isYesterday) return `Yesterday, ${time}`
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + `, ${time}`
  }

  /* ════════════════════════════════════════════════════════════════ */
  /*  COMPOSE — Category Selection                                   */
  /* ════════════════════════════════════════════════════════════════ */
  if (view === 'compose' && composeStep === 'category') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={resetCompose} className="rounded-full h-9 w-9 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">New Message</h1>
            <p className="text-xs text-muted-foreground">What do you need help with?</p>
          </div>
        </div>

        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((opt) => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setCategory(opt.value)
                  setComposeStep('form')
                }}
                className="w-full text-left"
              >
                <Card variant="raised" interactive>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`shrink-0 rounded-xl p-2.5 ${opt.bg}`}>
                      <Icon className={`h-4 w-4 ${opt.color}`} />
                    </div>
                    <span className="flex-1 text-sm font-medium">{opt.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════ */
  /*  COMPOSE — Message Form                                         */
  /* ════════════════════════════════════════════════════════════════ */
  if (view === 'compose' && composeStep === 'form') {
    const catConfig = CATEGORY_CONFIG[category]
    const CatIcon = catConfig?.icon || HelpCircle

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setComposeStep('category')} className="rounded-full h-9 w-9 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight">New Message</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`rounded-md p-0.5 ${catConfig?.bg}`}>
                <CatIcon className={`h-3 w-3 ${catConfig?.color}`} />
              </div>
              <span className="text-xs text-muted-foreground">{catConfig?.label}</span>
            </div>
          </div>
        </div>

        <Card variant="raised">
          <CardContent className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your enquiry"
                maxLength={200}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={6}
                maxLength={5000}
                className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Attachments coming soon"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Attach file</span>
                </button>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {body.length}/5000
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={resetCompose} className="rounded-xl">
                Cancel
              </Button>
              <Button
                className="flex-1 gap-2 rounded-xl"
                onClick={handleCompose}
                disabled={!subject.trim() || !body.trim()}
                loading={sending}
              >
                <Send className="h-4 w-4" /> Send message
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-4">
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>Expected response time:</strong> We aim to respond within 24 hours. For urgent matters such as fraud or lost cards, please call us on <strong>0800 123 4567</strong> or WhatsApp <strong>+44 7365 192524</strong>.
          </p>
        </div>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════ */
  /*  THREAD VIEW                                                    */
  /* ════════════════════════════════════════════════════════════════ */
  if (view === 'thread' && selectedConversation) {
    const status = STATUS_CONFIG[selectedConversation.status] || STATUS_CONFIG.open
    const StatusIcon = status.icon
    const catConfig = CATEGORY_CONFIG[selectedConversation.category] || CATEGORY_CONFIG.general
    const isClosed = selectedConversation.status === 'closed'
    const isResolved = selectedConversation.status === 'resolved'

    return (
      <div className="flex flex-col h-[calc(100vh-180px)] lg:h-[calc(100vh-140px)]">
        {/* Thread header */}
        <div className="shrink-0 pb-3">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setView('list'); setSelectedId(null); router.refresh() }}
              className="rounded-full h-9 w-9 p-0 shrink-0 mt-0.5"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold truncate leading-tight">{selectedConversation.subject}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                  <StatusIcon className="h-3 w-3" /> {status.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {catConfig.label}
                </span>
              </div>
            </div>
            {!isClosed && !isResolved && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="rounded-full h-9 w-9 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                title="Close conversation"
              >
                <Archive className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <Card variant="raised" className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-1">
            {messagesLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <div className="h-8 w-8 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <p className="text-xs mt-3">Loading messages...</p>
              </div>
            ) : (
              <>
                {/* Date header for first message */}
                {messages.length > 0 && (
                  <div className="flex justify-center py-3">
                    <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                      {new Date(messages[0].created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                )}

                {messages.map((msg, index) => {
                  const isCustomer = msg.sender_role === 'customer'
                  const isSystem = msg.sender_role === 'system'
                  const isLast = index === messages.length - 1

                  // Date separator
                  const prevMsg = index > 0 ? messages[index - 1] : null
                  const showDateSep =
                    prevMsg &&
                    new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()

                  return (
                    <div key={msg.id}>
                      {showDateSep && (
                        <div className="flex justify-center py-3">
                          <span className="text-[11px] text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
                            {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                      )}

                      {/* System message */}
                      {isSystem && (
                        <div className="flex justify-center py-2">
                          <div className="max-w-[90%] rounded-xl bg-muted/50 border border-border/30 px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <Bot className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">System</span>
                            </div>
                            <p className="text-[13px] text-muted-foreground leading-relaxed">{msg.body}</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-2">
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Customer message (right) */}
                      {isCustomer && !isSystem && (
                        <div className="flex justify-end py-1">
                          <div className="max-w-[85%] lg:max-w-[70%]">
                            <div className="bg-[#0676b6] text-white rounded-2xl rounded-br-md px-4 py-3">
                              <p className="text-[13px] whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                            </div>
                            <div className="flex items-center justify-end gap-1 mt-1 px-1">
                              <span className="text-[10px] text-muted-foreground/60">
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isLast && <CheckCheck className="h-3 w-3 text-[#0676b6]" />}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Advisor message (left) */}
                      {!isCustomer && !isSystem && (
                        <div className="flex gap-2.5 py-1">
                          <div className="shrink-0 mt-1">
                            <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                              <Headphones className="h-4 w-4 text-emerald-600" />
                            </div>
                          </div>
                          <div className="max-w-[85%] lg:max-w-[70%]">
                            <p className="text-[11px] font-semibold text-emerald-600 mb-1 px-1">NexusBank Advisor</p>
                            <div className="bg-accent border border-border/30 rounded-2xl rounded-bl-md px-4 py-3">
                              <p className="text-[13px] whitespace-pre-wrap leading-relaxed text-foreground">{msg.body}</p>
                            </div>
                            <p className="text-[10px] text-muted-foreground/60 mt-1 px-1">
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Reply box */}
          {!isClosed && !isResolved ? (
            <div className="shrink-0 border-t border-border/40 p-3 lg:p-4 bg-card">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type a message..."
                    rows={1}
                    maxLength={5000}
                    className="w-full rounded-2xl border border-input bg-muted/30 pl-4 pr-10 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 resize-none leading-relaxed max-h-32 overflow-y-auto"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleReply()
                      }
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                    }}
                  />
                  <button
                    type="button"
                    className="absolute right-3 bottom-3 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                    title="Attach file (coming soon)"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  className="rounded-full h-10 w-10 p-0 shrink-0"
                  onClick={handleReply}
                  disabled={!reply.trim()}
                  loading={replying}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1.5 px-1">
                Press Enter to send &middot; Shift + Enter for new line
              </p>
            </div>
          ) : (
            <div className="shrink-0 border-t border-border/40 p-4 bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                This conversation has been {isClosed ? 'closed' : 'resolved'}.{' '}
                <button
                  type="button"
                  className="text-primary font-medium hover:underline"
                  onClick={() => { resetCompose(); setView('compose') }}
                >
                  Start a new conversation
                </button>
              </p>
            </div>
          )}
        </Card>
      </div>
    )
  }

  /* ════════════════════════════════════════════════════════════════ */
  /*  INBOX LIST VIEW                                                */
  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Secure messages with NexusBank
            {totalUnread > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                {totalUnread}
              </span>
            )}
          </p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={() => setView('compose')}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      {/* Search bar */}
      {conversations.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl bg-card"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Tabs */}
      {conversations.length > 0 && (
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {([
            { key: 'all' as TabFilter, label: 'All', count: conversations.length },
            { key: 'active' as TabFilter, label: 'Active', count: activeCount },
            { key: 'resolved' as TabFilter, label: 'Resolved', count: resolvedCount },
          ]).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 tabular-nums ${tab === t.key ? 'text-muted-foreground' : ''}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Conversation list */}
      {conversations.length === 0 ? (
        <Card variant="raised">
          <CardContent className="p-10 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
              <Inbox className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold">No messages yet</h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-[240px] mx-auto leading-relaxed">
              Start a conversation with our team. We&apos;re here to help with anything you need.
            </p>
            <Button className="mt-5 gap-2 rounded-xl" onClick={() => setView('compose')}>
              <MessageSquare className="h-4 w-4" /> Start a conversation
            </Button>
          </CardContent>
        </Card>
      ) : filteredConversations.length === 0 ? (
        <Card variant="raised">
          <CardContent className="p-5 lg:p-8 text-center">
            <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No matching conversations</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => {
            const status = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open
            const catConfig = CATEGORY_CONFIG[conv.category] || CATEGORY_CONFIG.general
            const CatIcon = catConfig.icon
            const hasUnread = (conv.unread_count || 0) > 0
            const latestBody = (conv.latest_message as any)?.body || ''
            const latestRole = (conv.latest_message as any)?.sender_role || ''
            const preview = latestBody.length > 80 ? latestBody.slice(0, 80) + '...' : latestBody

            return (
              <button
                key={conv.id}
                type="button"
                onClick={() => openThread(conv)}
                className="w-full text-left"
              >
                <Card variant="raised" interactive className={hasUnread ? 'border-l-[3px] border-l-[#0676b6]' : ''}>
                  <CardContent className="flex items-start gap-3.5 p-4">
                    {/* Category icon */}
                    <div className={`shrink-0 rounded-xl p-2.5 mt-0.5 ${catConfig.bg}`}>
                      <CatIcon className={`h-4 w-4 ${catConfig.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm truncate ${hasUnread ? 'font-bold' : 'font-semibold'}`}>
                          {conv.subject}
                        </span>
                        {hasUnread && (
                          <span className="shrink-0 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#0676b6] text-white text-[10px] font-bold px-1">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>

                      {/* Preview */}
                      {preview && (
                        <p className={`text-xs mt-1 truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {latestRole === 'customer' ? 'You: ' : latestRole === 'system' ? '' : 'Advisor: '}
                          {preview}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          <status.icon className="h-2.5 w-2.5" />
                          {status.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">&middot;</span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatRelativeTime(conv.last_message_at)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-2" />
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
