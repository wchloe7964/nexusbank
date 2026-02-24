'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate, formatRelativeTime } from '@/lib/utils/dates'
import { disputeReasons, disputeStatusConfig } from '@/lib/constants/disputes'
import { cn } from '@/lib/utils/cn'
import { ArrowLeft, ShieldAlert, CheckCircle, Clock, AlertCircle, XCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Dispute } from '@/lib/types'
import { addDisputeInfo } from '../actions'

interface DisputeDetailClientProps {
  dispute: Dispute
}

const timelineSteps = [
  { status: 'submitted', label: 'Submitted', icon: FileText },
  { status: 'under_review', label: 'Under Review', icon: Clock },
  { status: 'information_requested', label: 'Info Requested', icon: AlertCircle },
  { status: 'resolved', label: 'Resolved', icon: CheckCircle },
]

export function DisputeDetailClient({ dispute }: DisputeDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [error, setError] = useState('')

  const reasonConfig = disputeReasons[dispute.reason as keyof typeof disputeReasons]
  const statusConfig = disputeStatusConfig[dispute.status]
  const ReasonIcon = reasonConfig?.icon || ShieldAlert

  const isResolved = ['resolved_refunded', 'resolved_denied', 'closed'].includes(dispute.status)
  const needsInfo = dispute.status === 'information_requested'

  // Determine which timeline steps are active
  function getStepStatus(stepStatus: string) {
    const order = ['submitted', 'under_review', 'information_requested', 'resolved']
    const currentIdx = dispute.status.startsWith('resolved') || dispute.status === 'closed'
      ? 3
      : order.indexOf(dispute.status)
    const stepIdx = order.indexOf(stepStatus)

    if (stepIdx < currentIdx) return 'completed'
    if (stepIdx === currentIdx) return 'current'
    return 'pending'
  }

  function handleSubmitInfo() {
    if (!additionalInfo.trim()) {
      setError('Please provide additional information')
      return
    }
    setError('')

    startTransition(async () => {
      try {
        await addDisputeInfo(dispute.id, additionalInfo)
        setAdditionalInfo('')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit information')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link
        href="/disputes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Disputes
      </Link>

      {/* Transaction Info */}
      {dispute.transaction && (
        <Card>
          <CardContent className="p-6">
            <p className="text-xs text-muted-foreground mb-2">Disputed Transaction</p>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold">{dispute.transaction.description}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {dispute.transaction.counterparty_name} &middot; {formatUKDate(dispute.transaction.transaction_date)}
                </p>
              </div>
              <p className="text-2xl font-bold tabular-nums text-red-500">
                -{formatGBP(dispute.transaction.amount)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dispute Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="rounded-full bg-red-500/10 p-3">
              <ReasonIcon className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{reasonConfig?.label || dispute.reason}</h2>
                <Badge variant={statusConfig?.variant || 'default'}>
                  {statusConfig?.label || dispute.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Filed {formatRelativeTime(dispute.created_at)} &middot; {formatUKDate(dispute.created_at)}
              </p>
            </div>
          </div>

          {dispute.description && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{dispute.description}</p>
            </div>
          )}

          {dispute.resolution && (
            <div className="mt-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
              <p className="text-xs font-medium text-emerald-600 mb-1">Resolution</p>
              <p className="text-sm">{dispute.resolution}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Timeline */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold mb-6">Status Timeline</h3>
          <div className="space-y-0">
            {timelineSteps.map((step, index) => {
              const stepStatus = getStepStatus(step.status)
              const StepIcon = step.icon
              const isLast = index === timelineSteps.length - 1

              return (
                <div key={step.status} className="flex gap-4">
                  {/* Timeline Line + Dot */}
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 shrink-0',
                      stepStatus === 'completed' ? 'border-emerald-500 bg-emerald-500/10' :
                      stepStatus === 'current' ? 'border-blue-500 bg-blue-500/10' :
                      'border-border bg-muted/50'
                    )}>
                      <StepIcon className={cn(
                        'h-4 w-4',
                        stepStatus === 'completed' ? 'text-emerald-500' :
                        stepStatus === 'current' ? 'text-blue-500' :
                        'text-muted-foreground'
                      )} />
                    </div>
                    {!isLast && (
                      <div className={cn(
                        'w-0.5 h-8',
                        stepStatus === 'completed' ? 'bg-emerald-500' : 'bg-border'
                      )} />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="pb-6">
                    <p className={cn(
                      'text-sm font-medium',
                      stepStatus === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                    )}>
                      {step.label}
                    </p>
                    {stepStatus === 'current' && (
                      <p className="text-xs text-muted-foreground mt-0.5">In progress</p>
                    )}
                    {stepStatus === 'completed' && (
                      <p className="text-xs text-emerald-500 mt-0.5">Completed</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Additional Info Form (when info requested) */}
      {needsInfo && (
        <Card className="border-orange-500/20 bg-orange-500/[0.03]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-semibold">Additional Information Required</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              We need more information to continue investigating your dispute. Please provide any additional details, evidence, or context.
            </p>
            <Input
              placeholder="Enter additional information..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="mb-3"
            />
            {error && <p className="text-sm text-destructive mb-3">{error}</p>}
            <Button size="sm" onClick={handleSubmitInfo} disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Information'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Resolved Status Banner */}
      {isResolved && dispute.status === 'resolved_refunded' && (
        <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-600">Refund Processed</p>
                <p className="text-xs text-muted-foreground">
                  The disputed amount has been refunded to your account.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isResolved && dispute.status === 'resolved_denied' && (
        <Card className="border-red-500/20 bg-red-500/[0.03]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-red-600">Dispute Denied</p>
                <p className="text-xs text-muted-foreground">
                  After investigation, the transaction was found to be valid. If you disagree, you may contact the Financial Ombudsman Service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
