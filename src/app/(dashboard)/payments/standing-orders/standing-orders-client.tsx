'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate } from '@/lib/utils/dates'
import { CalendarClock, Plus, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ScheduledPayment, Account, Payee } from '@/lib/types'
import { createStandingOrder } from './actions'

interface StandingOrdersClientProps {
  standingOrders: ScheduledPayment[]
  accounts: Account[]
  payees: Payee[]
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'destructive',
}

export function StandingOrdersClient({ standingOrders, accounts, payees }: StandingOrdersClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [error, setError] = useState('')

  // Create form state
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '')
  const [payeeId, setPayeeId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [nextPaymentDate, setNextPaymentDate] = useState('')

  const activeOrders = standingOrders.filter((so) => so.status === 'active')
  const pausedOrders = standingOrders.filter((so) => so.status === 'paused')
  const cancelledOrders = standingOrders.filter((so) => so.status === 'cancelled')

  const totalMonthly = activeOrders
    .filter((so) => so.frequency === 'monthly')
    .reduce((sum, so) => sum + Number(so.amount), 0)

  function getPaymentName(payment: ScheduledPayment): string {
    if (payment.payee?.name) return payment.payee.name
    if (payment.description) return payment.description
    return 'Standing Order'
  }

  function handleCreate() {
    setError('')
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (!payeeId) {
      setError('Please select a payee')
      return
    }
    if (!nextPaymentDate) {
      setError('Please select a start date')
      return
    }

    startTransition(async () => {
      try {
        await createStandingOrder({
          fromAccountId,
          payeeId,
          amount: parsedAmount,
          reference: reference || undefined,
          frequency,
          nextPaymentDate,
        })
        setShowCreateDialog(false)
        setAmount('')
        setReference('')
        setPayeeId('')
        setNextPaymentDate('')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create standing order')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Standing Orders</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{formatGBP(totalMonthly)}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm text-muted-foreground">
                <p>{activeOrders.length} active</p>
                {pausedOrders.length > 0 && <p>{pausedOrders.length} paused</p>}
                {cancelledOrders.length > 0 && <p>{cancelledOrders.length} cancelled</p>}
              </div>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Banner */}
      <Card className="border-purple-500/20 bg-purple-500/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-purple-500/10 p-2 shrink-0">
              <Shield className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Standing Order Protection</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Standing orders give you full control over your payments. You can pause, edit, or cancel them at any time. Payments are guaranteed to be sent on schedule as long as you have sufficient funds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Standing Orders List */}
      {standingOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No standing orders</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Standing orders you create for recurring payments will appear here.
            </p>
            <Button size="sm" className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Standing Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active */}
          {activeOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Active ({activeOrders.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {activeOrders.map((so) => (
                      <SORow key={so.id} payment={so} getName={getPaymentName} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paused */}
          {pausedOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Paused ({pausedOrders.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pausedOrders.map((so) => (
                      <SORow key={so.id} payment={so} getName={getPaymentName} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cancelled */}
          {cancelledOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Cancelled ({cancelledOrders.length})</h3>
              <Card className="opacity-60">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {cancelledOrders.map((so) => (
                      <SORow key={so.id} payment={so} getName={getPaymentName} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} title="Create Standing Order">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">From Account</label>
            <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="mt-1">
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>{acc.account_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Payee</label>
            <Select value={payeeId} onChange={(e) => setPayeeId(e.target.value)} className="mt-1">
              <option value="">Select a payee</option>
              {payees.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount (£)</label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Frequency</label>
            <Select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="mt-1">
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">First Payment Date</label>
            <Input
              type="date"
              value={nextPaymentDate}
              onChange={(e) => setNextPaymentDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reference (optional)</label>
            <Input
              placeholder="e.g. Rent payment"
              maxLength={18}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleCreate} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Standing Order'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

function SORow({
  payment,
  getName,
}: {
  payment: ScheduledPayment
  getName: (p: ScheduledPayment) => string
}) {
  return (
    <Link
      href={`/payments/standing-orders/${payment.id}`}
      className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-purple-500/10 p-2.5">
          <CalendarClock className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{getName(payment)}</p>
            <Badge variant={statusVariant[payment.status]} className="text-[10px] px-1.5 py-0">
              {payment.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {payment.frequency} &middot; Next: {formatUKDate(payment.next_payment_date)}
          </p>
          {payment.from_account && (
            <p className="text-xs text-muted-foreground">
              From: {payment.from_account.account_name}
            </p>
          )}
        </div>
      </div>
      <p className="text-sm font-semibold tabular-nums">{formatGBP(Number(payment.amount))}</p>
    </Link>
  )
}
