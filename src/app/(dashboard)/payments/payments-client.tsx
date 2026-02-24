'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate } from '@/lib/utils/dates'
import { Repeat, Building2, Calendar, Pause, Play, Trash2 } from 'lucide-react'
import type { ScheduledPayment } from '@/lib/types'
import { togglePaymentPause, cancelScheduledPayment } from './actions'

interface PaymentsClientProps {
  initialPayments: ScheduledPayment[]
}

const typeIcon: Record<string, typeof Repeat> = {
  standing_order: Repeat,
  direct_debit: Building2,
  scheduled_transfer: Calendar,
  bill_payment: Building2,
}

const typeLabel: Record<string, string> = {
  standing_order: 'Standing Order',
  direct_debit: 'Direct Debit',
  scheduled_transfer: 'Scheduled Transfer',
  bill_payment: 'Bill Payment',
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'destructive',
}

export function PaymentsClient({ initialPayments }: PaymentsClientProps) {
  const [payments, setPayments] = useState(initialPayments)
  const [isPending, startTransition] = useTransition()

  const activePayments = payments.filter((p) => p.status !== 'cancelled')
  const standingOrders = activePayments.filter((p) => p.payment_type === 'standing_order')
  const directDebits = activePayments.filter((p) => p.payment_type === 'direct_debit')

  const totalMonthly = payments
    .filter((p) => p.status === 'active' && p.frequency === 'monthly')
    .reduce((sum, p) => sum + Number(p.amount), 0)

  function handleTogglePause(id: string) {
    const payment = payments.find((p) => p.id === id)
    if (!payment) return
    const newStatus = payment.status === 'active' ? 'paused' as const : 'active' as const
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p))
    startTransition(async () => {
      try {
        await togglePaymentPause(id, newStatus)
      } catch {
        const revertStatus = newStatus === 'active' ? 'paused' as const : 'active' as const
        setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: revertStatus } : p))
      }
    })
  }

  function handleCancel(id: string) {
    setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'cancelled' as const } : p))
    startTransition(async () => {
      try {
        await cancelScheduledPayment(id)
      } catch {
        setPayments((prev) => prev.map((p) => p.id === id ? { ...p, status: 'active' as const } : p))
      }
    })
  }

  function getPaymentName(payment: ScheduledPayment): string {
    if (payment.payee?.name) return payment.payee.name
    if (payment.description) return payment.description
    return typeLabel[payment.payment_type] || 'Payment'
  }

  function PaymentRow({ payment }: { payment: ScheduledPayment }) {
    const Icon = typeIcon[payment.payment_type] || Calendar
    return (
      <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/[0.08] p-2.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{getPaymentName(payment)}</p>
              <Badge variant={statusVariant[payment.status]} className="text-[10px] px-1.5 py-0">
                {payment.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {payment.reference || typeLabel[payment.payment_type]} &middot; {payment.frequency}
            </p>
            <p className="text-xs text-muted-foreground">
              Next: {formatUKDate(payment.next_payment_date)}
              {payment.end_date && ` · Ends: ${formatUKDate(payment.end_date)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold tabular-nums">{formatGBP(Number(payment.amount))}</p>
          {payment.status !== 'cancelled' && (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="sm" onClick={() => handleTogglePause(payment.id)} disabled={isPending}>
                {payment.status === 'active' ? (
                  <Pause className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleCancel(payment.id)} disabled={isPending}>
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  function PaymentList({ items }: { items: ScheduledPayment[] }) {
    if (items.length === 0) {
      return (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No payments found.
        </div>
      )
    }
    return (
      <div className="divide-y divide-border">
        {items.map((p) => <PaymentRow key={p.id} payment={p} />)}
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Monthly Outgoing</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{formatGBP(totalMonthly)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{payments.filter((p) => p.status === 'active').length} active payments</p>
              <p>{payments.filter((p) => p.status === 'paused').length} paused</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({activePayments.length})</TabsTrigger>
          <TabsTrigger value="standing">Standing Orders ({standingOrders.length})</TabsTrigger>
          <TabsTrigger value="direct">Direct Debits ({directDebits.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card><CardContent className="p-0"><PaymentList items={activePayments} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="standing">
          <Card><CardContent className="p-0"><PaymentList items={standingOrders} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="direct">
          <Card><CardContent className="p-0"><PaymentList items={directDebits} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
