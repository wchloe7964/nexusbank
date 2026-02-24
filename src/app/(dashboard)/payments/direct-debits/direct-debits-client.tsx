'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate } from '@/lib/utils/dates'
import { cn } from '@/lib/utils/cn'
import { Building2, Shield } from 'lucide-react'
import Link from 'next/link'
import type { ScheduledPayment } from '@/lib/types'

interface DirectDebitsClientProps {
  directDebits: ScheduledPayment[]
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
  active: 'success',
  paused: 'warning',
  cancelled: 'destructive',
}

export function DirectDebitsClient({ directDebits }: DirectDebitsClientProps) {
  const activeDebits = directDebits.filter((dd) => dd.status === 'active')
  const pausedDebits = directDebits.filter((dd) => dd.status === 'paused')
  const cancelledDebits = directDebits.filter((dd) => dd.status === 'cancelled')

  const totalMonthly = activeDebits
    .filter((dd) => dd.frequency === 'monthly')
    .reduce((sum, dd) => sum + Number(dd.amount), 0)

  function getPaymentName(payment: ScheduledPayment): string {
    if (payment.payee?.name) return payment.payee.name
    if (payment.description) return payment.description
    return 'Direct Debit'
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Direct Debits</p>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{formatGBP(totalMonthly)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{activeDebits.length} active</p>
              {pausedDebits.length > 0 && <p>{pausedDebits.length} paused</p>}
              {cancelledDebits.length > 0 && <p>{cancelledDebits.length} cancelled</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DD Guarantee Info */}
      <Card className="border-blue-500/20 bg-blue-500/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-500/10 p-2 shrink-0">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Direct Debit Guarantee</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All direct debits are covered by the Direct Debit Guarantee. If there is a change in the amount, date, or frequency of your direct debit, the organisation will notify you in advance. If an error is made by the organisation or your bank, you are guaranteed a full and immediate refund.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Direct Debits */}
      {directDebits.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No direct debits</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Direct debits you set up with companies will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active */}
          {activeDebits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Active ({activeDebits.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {activeDebits.map((dd) => (
                      <DDRow key={dd.id} payment={dd} getName={getPaymentName} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paused */}
          {pausedDebits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Paused ({pausedDebits.length})</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {pausedDebits.map((dd) => (
                      <DDRow key={dd.id} payment={dd} getName={getPaymentName} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cancelled */}
          {cancelledDebits.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Cancelled ({cancelledDebits.length})</h3>
              <Card className="opacity-60">
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {cancelledDebits.map((dd) => (
                      <DDRow key={dd.id} payment={dd} getName={getPaymentName} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DDRow({
  payment,
  getName,
}: {
  payment: ScheduledPayment
  getName: (p: ScheduledPayment) => string
}) {
  return (
    <Link
      href={`/payments/direct-debits/${payment.id}`}
      className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-orange-500/10 p-2.5">
          <Building2 className="h-4 w-4 text-orange-500" />
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
