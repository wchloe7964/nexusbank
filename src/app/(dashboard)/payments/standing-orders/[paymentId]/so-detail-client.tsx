'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate, formatTransactionDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { CalendarClock, ArrowLeft, Pause, Play, XCircle, Pencil, Shield, Wallet, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ScheduledPayment, Transaction } from '@/lib/types'
import { togglePaymentPause, cancelScheduledPayment } from '../../actions'
import { updateStandingOrder } from '../actions'

interface SODetailClientProps {
  standingOrder: ScheduledPayment
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

export function SODetailClient({ standingOrder, history }: SODetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(standingOrder.status)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [error, setError] = useState('')

  // Edit form state
  const [editAmount, setEditAmount] = useState(String(standingOrder.amount))
  const [editFrequency, setEditFrequency] = useState(standingOrder.frequency)
  const [editNextDate, setEditNextDate] = useState(standingOrder.next_payment_date.split('T')[0])
  const [editReference, setEditReference] = useState(standingOrder.reference || '')

  const payeeName = standingOrder.payee?.name || standingOrder.description || 'Standing Order'
  const totalPaid = history.reduce((sum, t) => sum + Number(t.amount), 0)

  function handleTogglePause() {
    const newStatus = status === 'active' ? 'paused' as const : 'active' as const
    const prevStatus = status
    setStatus(newStatus)

    startTransition(async () => {
      try {
        await togglePaymentPause(standingOrder.id, newStatus)
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
        await cancelScheduledPayment(standingOrder.id)
      } catch {
        setStatus(prevStatus)
        setError('Failed to cancel standing order')
      }
    })
  }

  function handleEdit() {
    setError('')
    const parsedAmount = parseFloat(editAmount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    startTransition(async () => {
      try {
        await updateStandingOrder(standingOrder.id, {
          amount: parsedAmount,
          frequency: editFrequency,
          nextPaymentDate: editNextDate,
          reference: editReference || undefined,
        })
        setShowEditDialog(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update standing order')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link
        href="/payments/standing-orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Standing Orders
      </Link>

      {/* Main Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-purple-500/10 p-3">
                <CalendarClock className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{payeeName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">Standing Order</Badge>
                  <Badge variant={statusVariant[status]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
            <p className="text-2xl font-bold tabular-nums">{formatGBP(Number(standingOrder.amount))}</p>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Frequency</span>
              <span className="font-medium capitalize">{standingOrder.frequency}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Next Payment</span>
              <span className="font-medium">{formatUKDate(standingOrder.next_payment_date)}</span>
            </div>
            {standingOrder.reference && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium font-mono text-xs">{standingOrder.reference}</span>
              </div>
            )}
            {standingOrder.payee?.sort_code && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Payee Sort Code</span>
                <span className="font-medium font-mono text-xs">{standingOrder.payee.sort_code}</span>
              </div>
            )}
            {standingOrder.payee?.account_number && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Payee Account</span>
                <span className="font-medium font-mono text-xs">{standingOrder.payee.account_number}</span>
              </div>
            )}
            {standingOrder.end_date && (
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">End Date</span>
                <span className="font-medium">{formatUKDate(standingOrder.end_date)}</span>
              </div>
            )}
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Created</span>
              <span className="font-medium">{formatUKDate(standingOrder.created_at)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* From Account */}
      {standingOrder.from_account && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Paying From</p>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{standingOrder.from_account.account_name}</p>
                <p className="text-xs text-muted-foreground">
                  {standingOrder.from_account.sort_code} &middot; {standingOrder.from_account.account_number}
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
            onClick={() => setShowEditDialog(true)}
            disabled={isPending}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={handleTogglePause}
            disabled={isPending}
          >
            {status === 'active' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
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
            Cancel
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onClose={() => setShowCancelDialog(false)} title="Cancel Standing Order">
        <p className="text-sm text-muted-foreground">
          Are you sure you want to cancel the standing order to <strong>{payeeName}</strong>?
          This will stop all future payments.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="ghost" className="flex-1" onClick={() => setShowCancelDialog(false)}>
            Keep Active
          </Button>
          <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={isPending}>
            {isPending ? 'Cancelling...' : 'Cancel Standing Order'}
          </Button>
        </div>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onClose={() => setShowEditDialog(false)} title="Edit Standing Order">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount (£)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Frequency</label>
            <Select value={editFrequency} onChange={(e) => setEditFrequency(e.target.value as typeof editFrequency)} className="mt-1">
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Next Payment Date</label>
            <Input
              type="date"
              value={editNextDate}
              onChange={(e) => setEditNextDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reference (optional)</label>
            <Input
              maxLength={18}
              value={editReference}
              onChange={(e) => setEditReference(e.target.value)}
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleEdit} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Standing Order Info */}
      <Card className="border-blue-500/20 bg-blue-500/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 shrink-0">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">About Standing Orders</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standing orders are instructions you give your bank to pay a fixed amount to another account on a regular basis. Unlike direct debits, you control the amount and frequency. You can change or cancel them at any time.
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
              No payment history found for this standing order.
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
