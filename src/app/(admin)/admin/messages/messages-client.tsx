'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  MessageSquare,
  Send,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  User,
  Bot,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  getConversationMessages,
  replyToConversation,
  updateConversationStatus,
  updateConversationPriority,
} from './actions'
import Link from 'next/link'
import type { Conversation, SecureMessage, ConversationStatus } from '@/lib/types'

type ConversationRow = Conversation & { profile?: { full_name: string; email: string } }

interface MessagesClientProps {
  data: ConversationRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  status: string
  category: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'open': return 'default'
    case 'awaiting_bank': return 'destructive'
    case 'awaiting_customer': return 'warning'
    case 'resolved': return 'success'
    case 'closed': return 'secondary'
    default: return 'secondary'
  }
}

const priorityVariant = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'destructive'
    case 'high': return 'warning'
    default: return 'secondary'
  }
}

export function MessagesClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  status,
  category,
}: MessagesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Thread view state
  const [threadConversation, setThreadConversation] = useState<ConversationRow | null>(null)
  const [threadMessages, setThreadMessages] = useState<SecureMessage[]>([])
  const [replyText, setReplyText] = useState('')
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/messages?${params.toString()}`)
    },
    [router, searchParams]
  )

  async function openThread(conversationId: string) {
    setIsLoadingThread(true)
    try {
      const result = await getConversationMessages(conversationId)
      setThreadConversation(result.conversation as ConversationRow)
      setThreadMessages(result.messages)
      setReplyText('')
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Failed to load conversation')
    } finally {
      setIsLoadingThread(false)
    }
  }

  function handleReply() {
    if (!threadConversation || !replyText.trim()) return
    startTransition(async () => {
      try {
        await replyToConversation(threadConversation.id, replyText)
        showFeedback('success', 'Reply sent successfully')
        // Reload thread
        const result = await getConversationMessages(threadConversation.id)
        setThreadConversation(result.conversation as ConversationRow)
        setThreadMessages(result.messages)
        setReplyText('')
        router.refresh()
      } catch (err) {
        showFeedback('error', err instanceof Error ? err.message : 'Failed to send reply')
      }
    })
  }

  function handleStatusChange(newStatus: ConversationStatus) {
    if (!threadConversation) return
    startTransition(async () => {
      try {
        await updateConversationStatus(threadConversation.id, newStatus)
        showFeedback('success', `Conversation ${newStatus}`)
        const result = await getConversationMessages(threadConversation.id)
        setThreadConversation(result.conversation as ConversationRow)
        setThreadMessages(result.messages)
        router.refresh()
      } catch (err) {
        showFeedback('error', err instanceof Error ? err.message : 'Failed to update status')
      }
    })
  }

  function handlePriorityChange(priority: 'low' | 'normal' | 'high' | 'urgent') {
    if (!threadConversation) return
    startTransition(async () => {
      try {
        await updateConversationPriority(threadConversation.id, priority)
        showFeedback('success', `Priority set to ${priority}`)
        const result = await getConversationMessages(threadConversation.id)
        setThreadConversation(result.conversation as ConversationRow)
        router.refresh()
      } catch (err) {
        showFeedback('error', err instanceof Error ? err.message : 'Failed to update priority')
      }
    })
  }

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  const columns: Column<ConversationRow>[] = [
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={statusVariant(row.status) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) =>
        row.priority === 'low' || row.priority === 'normal' ? (
          <span className="text-[12px] text-muted-foreground capitalize">{row.priority}</span>
        ) : (
          <Badge variant={priorityVariant(row.priority) as 'secondary' | 'warning' | 'destructive'}>
            {row.priority}
          </Badge>
        ),
    },
    {
      key: 'profile',
      label: 'Customer',
      render: (row) => (
        <div>
          <Link href={`/admin/customers/${row.customer_id}`} className="text-[#00AEEF] hover:underline text-[13px] font-medium">
            {row.profile?.full_name || 'Unknown'}
          </Link>
          <p className="text-[11px] text-muted-foreground">{row.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium text-foreground truncate max-w-[250px]">{row.subject}</p>
          <Badge variant="secondary" className="mt-0.5 text-[10px]">{row.category}</Badge>
        </div>
      ),
    },
    {
      key: 'last_message_at',
      label: 'Last Activity',
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          {new Date(row.last_message_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-[11px]"
          onClick={() => openThread(row.id)}
          disabled={isLoadingThread}
        >
          <Eye className="h-3 w-3" /> View
        </Button>
      ),
    },
  ]

  // ─── Thread View ──────────────────────────────────────────────────────────

  if (threadConversation) {
    return (
      <div className="space-y-4">
        {/* Feedback Toast */}
        {feedback && (
          <div className={cn(
            'fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-top-2 text-[13px] font-medium',
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
          )}>
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {feedback.message}
          </div>
        )}

        {/* Thread Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => setThreadConversation(null)}
              className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to inbox
            </button>
            <h2 className="text-[16px] font-bold text-foreground">{threadConversation.subject}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Link href={`/admin/customers/${threadConversation.customer_id}`} className="text-[#00AEEF] hover:underline text-[13px]">
                {threadConversation.profile?.full_name || 'Unknown'}
              </Link>
              <Badge variant="secondary">{threadConversation.category}</Badge>
              <Badge variant={statusVariant(threadConversation.status) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>
                {threadConversation.status.replace(/_/g, ' ')}
              </Badge>
              {(threadConversation.priority === 'high' || threadConversation.priority === 'urgent') && (
                <Badge variant={priorityVariant(threadConversation.priority) as 'warning' | 'destructive'}>
                  {threadConversation.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              className={selectClass}
              value={threadConversation.priority}
              onChange={(e) => handlePriorityChange(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
              disabled={isPending}
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            {threadConversation.status !== 'resolved' && threadConversation.status !== 'closed' && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-[11px]"
                onClick={() => handleStatusChange('resolved')}
                disabled={isPending}
              >
                <CheckCircle2 className="h-3 w-3" /> Resolve
              </Button>
            )}
            {threadConversation.status === 'resolved' && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-[11px]"
                onClick={() => handleStatusChange('closed')}
                disabled={isPending}
              >
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto rounded-lg border border-border bg-muted/10 p-4">
          {threadMessages.map((msg) => {
            const isAdvisor = msg.sender_role === 'advisor'
            const isSystem = msg.sender_role === 'system'
            return (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg p-3 max-w-[80%]',
                  isSystem
                    ? 'mx-auto max-w-full bg-muted/40 border border-border/40 text-center'
                    : isAdvisor
                    ? 'ml-auto bg-[#00AEEF]/10 border border-[#00AEEF]/20'
                    : 'mr-auto bg-card border border-border'
                )}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {isSystem ? (
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  ) : isAdvisor ? (
                    <Bot className="h-3 w-3 text-[#00AEEF]" />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {isSystem ? 'System' : isAdvisor ? 'Advisor' : threadConversation.profile?.full_name || 'Customer'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[13px] text-foreground whitespace-pre-wrap">{msg.body}</p>
              </div>
            )
          })}
        </div>

        {/* Reply Composer */}
        {threadConversation.status !== 'closed' && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <textarea
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF] resize-none h-24"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                className="gap-1 bg-[#00AEEF] hover:bg-[#0098d1] text-white"
                onClick={handleReply}
                disabled={!replyText.trim() || isPending}
                loading={isPending}
              >
                <Send className="h-3 w-3" /> Send Reply
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Inbox View ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className={cn(
          'fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-top-2 text-[13px] font-medium',
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
        )}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {feedback.message}
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={MessageSquare}
        emptyTitle="No conversations"
        emptyDescription="No customer messages match the current filter."
        filters={
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="awaiting_bank">Awaiting Response</option>
              <option value="awaiting_customer">Awaiting Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select
              value={category}
              onChange={(e) => updateParams({ category: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="payment">Payment</option>
              <option value="account">Account</option>
              <option value="card">Card</option>
              <option value="loan">Loan</option>
              <option value="dispute">Dispute</option>
              <option value="complaint">Complaint</option>
              <option value="fraud">Fraud</option>
              <option value="technical">Technical</option>
              <option value="other">Other</option>
            </select>
          </div>
        }
      />
    </div>
  )
}
