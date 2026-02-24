'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate } from '@/lib/utils/dates'
import { Plus, Calendar, Repeat, Building2, Pause, Play, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { ScheduledPayment } from '@/lib/types'

const mockPayments: ScheduledPayment[] = [
  { id: '1', account_id: '1', payee_name: 'Property Mgmt Ltd', payee_sort_code: '20-00-00', payee_account_number: '12345678', amount: 850, currency_code: 'GBP', reference: 'Monthly Rent', frequency: 'monthly', next_payment_date: new Date(Date.now() + 5 * 86400000).toISOString(), end_date: null, payment_type: 'standing_order', status: 'active', created_at: '', updated_at: '' },
  { id: '2', account_id: '1', payee_name: 'British Gas', payee_sort_code: '30-90-89', payee_account_number: '87654321', amount: 65, currency_code: 'GBP', reference: 'Gas Bill', frequency: 'monthly', next_payment_date: new Date(Date.now() + 12 * 86400000).toISOString(), end_date: null, payment_type: 'direct_debit', status: 'active', created_at: '', updated_at: '' },
  { id: '3', account_id: '1', payee_name: 'London Borough Council', payee_sort_code: '08-32-00', payee_account_number: '99887766', amount: 125, currency_code: 'GBP', reference: 'Council Tax', frequency: 'monthly', next_payment_date: new Date(Date.now() + 8 * 86400000).toISOString(), end_date: '2026-03-31T00:00:00Z', payment_type: 'direct_debit', status: 'active', created_at: '', updated_at: '' },
  { id: '4', account_id: '1', payee_name: 'Sky UK', payee_sort_code: '60-00-01', payee_account_number: '11223344', amount: 43, currency_code: 'GBP', reference: 'TV Package', frequency: 'monthly', next_payment_date: new Date(Date.now() + 15 * 86400000).toISOString(), end_date: null, payment_type: 'direct_debit', status: 'active', created_at: '', updated_at: '' },
  { id: '5', account_id: '1', payee_name: 'Thames Water', payee_sort_code: '20-18-15', payee_account_number: '55667788', amount: 32, currency_code: 'GBP', reference: 'Water Bill', frequency: 'monthly', next_payment_date: new Date(Date.now() + 20 * 86400000).toISOString(), end_date: null, payment_type: 'direct_debit', status: 'paused', created_at: '', updated_at: '' },
  { id: '6', account_id: '1', payee_name: 'John Smith', payee_sort_code: '20-00-00', payee_account_number: '12345678', amount: 200, currency_code: 'GBP', reference: 'Savings Transfer', frequency: 'monthly', next_payment_date: new Date(Date.now() + 3 * 86400000).toISOString(), end_date: null, payment_type: 'standing_order', status: 'active', created_at: '', updated_at: '' },
]

const typeIcon = {
  standing_order: Repeat,
  direct_debit: Building2,
  scheduled: Calendar,
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'destructive',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState(mockPayments)

  const standingOrders = payments.filter((p) => p.payment_type === 'standing_order')
  const directDebits = payments.filter((p) => p.payment_type === 'direct_debit')
  const scheduled = payments.filter((p) => p.payment_type === 'scheduled')

  const totalMonthly = payments
    .filter((p) => p.status === 'active' && p.frequency === 'monthly')
    .reduce((sum, p) => sum + p.amount, 0)

  function togglePause(id: string) {
    setPayments((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'paused' as const : 'active' as const } : p
      )
    )
  }

  function cancelPayment(id: string) {
    setPayments((prev) => prev.filter((p) => p.id !== id))
  }

  function PaymentRow({ payment }: { payment: ScheduledPayment }) {
    const Icon = typeIcon[payment.payment_type]
    return (
      <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/[0.08] p-2.5">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{payment.payee_name}</p>
              <Badge variant={statusVariant[payment.status]} className="text-[10px] px-1.5 py-0">
                {payment.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {payment.reference} &middot; {payment.frequency}
            </p>
            <p className="text-xs text-muted-foreground">
              Next: {formatUKDate(payment.next_payment_date)}
              {payment.end_date && ` · Ends: ${formatUKDate(payment.end_date)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold tabular-nums">{formatGBP(payment.amount)}</p>
          <div className="flex gap-0.5">
            <Button variant="ghost" size="sm" onClick={() => togglePause(payment.id)}>
              {payment.status === 'active' ? (
                <Pause className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Play className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => cancelPayment(payment.id)}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
          </div>
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
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        description="Manage your regular payments and direct debits"
        action={
          <Link href="/payments/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </Link>
        }
      />

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
          <TabsTrigger value="all">All ({payments.length})</TabsTrigger>
          <TabsTrigger value="standing">Standing Orders ({standingOrders.length})</TabsTrigger>
          <TabsTrigger value="direct">Direct Debits ({directDebits.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card><CardContent className="p-0"><PaymentList items={payments} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="standing">
          <Card><CardContent className="p-0"><PaymentList items={standingOrders} /></CardContent></Card>
        </TabsContent>
        <TabsContent value="direct">
          <Card><CardContent className="p-0"><PaymentList items={directDebits} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
