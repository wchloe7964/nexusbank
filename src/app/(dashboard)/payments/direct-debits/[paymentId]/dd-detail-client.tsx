'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate, formatTransactionDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { Building2, ArrowLeft, Pause, Play, XCircle, Shield, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import type { ScheduledPayment, Transaction } from '@/lib/types'
import { togglePaymentPause, cancelScheduledPayment } from '../../actions'

interface DDDetailClientProps {
  directDebit: ScheduledPayment
  history: Transaction[]
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'destructive',
}

const transactionStatusConfig: Record<string, { icon: typeof CheckCircle; color: string }> = {
  completed: { icon: CheckCircle, color: 'text-emerald-500' },
  pending: { icon: AlertCircle, color: 'text-amber-500' },
  failed: { icon: XCircle, color: 'text-red-500' },
  cancelled: { icon: XCircle, color: 'text-muted-foreground' },
}

export function DDDetailClient({ directDebit, history }: DDDetailClientProps) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(directDebit.status)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [error, setError] = useState('')

  const payeeName = directDebit.payee?.name || directDebit.description || 'Direct Debit'
  const totalPaid = history.reduce((sum, t) => sum + Number(t.amount), 0)

  function handleTogglePause() {
    const newStatus = status === 'active' ? 'paused' as const : 'active' as const
    const prevStatus = status
    setStatus(newStatus)

    startTransition(async () => {
      try {
        await togglePaymentPause(directDebit.id, newStatus)
      } catch {
        setStatus(prevStatus)
        setError('Failed to update status')
      }
    })
  }

  function handleCancel() {
    const prevStatus = status
    setStatus('cancelled')
    setShowCancelDialog(false)

    startTransition(async () => {
      try {
        await cancelScheduledPayment(directDebit.id)
      } catch {
        setStatus(prevStatus)
        setError('Failed to cancel direct debit')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link
        href="/payments/direct-debits"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Direct Debits
      </Link>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-orange-500/10 p-3">
                <Building2 className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{payeeName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">Direct Debit</Badge>
                  <Badge variant={statusVariant[status]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums">{formatGBP(Number(directDebit.amount))}</p>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Frequency</span>
              <span className="font-medium capitalize">{directDebit.frequency}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Next Payment</span>
              <span className="font-medium">{formatUKDate(directDebit.next_payment_date)}</span>
            </div>
            {directDebit.reference && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium font-mono text-xs">{directDebit.reference}</span>
              </div>
            )}
            {directDebit.payee?.sort_code && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Payee Sort Code</span>
                <span className="font-medium font-mono text-xs">{directDebit.payee.sort_code}</span>
              </div>
            )}
            {directDebit.payee?.account_number && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Payee Account</span>
                <span className="font-medium font-mono text-xs">{directDebit.payee.account_number}</span>
              </div>
            )}
            {directDebit.end_date && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{formatUKDate(directDebit.end_date)}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatUKDate(directDebit.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* From Account */}
      {directDebit.from_account && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Paying From</p>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/[0.08] p-2">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{directDebit.from_account.account_name}</p>
                <p className="text-xs text-muted-foreground">
                  {directDebit.from_account.sort_code} &middot; {directDebit.from_account.account_number}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {status !== 'cancelled' && (
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleTogglePause}
            disabled={isPending}
          >
            {status === 'active' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause Direct Debit
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume Direct Debit
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowCancelDialog(true)}
            disabled={isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Direct Debit
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} title="Cancel Direct Debit">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel the direct debit to <strong>{payeeName}</strong>?
          This will stop all future payments. You may need to contact the company directly to avoid any missed payment fees.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" className="flex-1" onClick={() => setShowCancelDialog(false)}>
            Keep Active
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={isPending}>
            {isPending ? 'Cancelling...' : 'Cancel Direct Debit'}
          </Button>
        </div>
      </Dialog>

      {/* DD Guarantee */}
      <Card className="border-blue-500/20 bg-blue-500/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Direct Debit Guarantee</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This payment is protected by the Direct Debit Guarantee. If an error is made in the payment of your direct debit, you are entitled to a full and immediate refund from your bank.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Payment History</h3>
            {history.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {history.length} payment{history.length !== 1 ? 's' : ''} &middot; Total: {formatGBP(totalPaid)}
              </p>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No payment history found for this direct debit.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {history.map((txn) => {
                const statusCfg = transactionStatusConfig[txn.status] || transactionStatusConfig.completed
                const StatusIcon = statusCfg.icon
                return (
                  <div key={txn.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={cn('h-4 w-4', statusCfg.color)} />
                      <div>
                        <p className="text-sm font-medium">{formatTransactionDate(txn.transaction_date)}</p>
                        {txn.reference && (
                          <p className="text-xs text-muted-foreground">{txn.reference}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatGBP(Number(txn.amount))}</p>
                      <Badge variant={statusVariant[txn.status] || 'secondary'} className="text-[10px]">
                        {txn.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
