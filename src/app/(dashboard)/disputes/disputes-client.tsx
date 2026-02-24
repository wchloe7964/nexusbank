'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { formatRelativeTime } from '@/lib/utils/dates'
import { disputeReasons, disputeStatusConfig } from '@/lib/constants/disputes'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import type { Dispute } from '@/lib/types'

interface DisputesClientProps {
  disputes: Dispute[]
}

export function DisputesClient({ disputes }: DisputesClientProps) {
  const openDisputes = disputes.filter((d) =>
    ['submitted', 'under_review', 'information_requested'].includes(d.status)
  )
  const resolvedDisputes = disputes.filter((d) =>
    ['resolved_refunded', 'resolved_denied', 'closed'].includes(d.status)
  )

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Disputes</p>
            <p className="mt-1 text-2xl font-bold">{disputes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Open</p>
            <p className="mt-1 text-2xl font-bold text-amber-500">{openDisputes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Resolved</p>
            <p className="mt-1 text-2xl font-bold text-emerald-500">{resolvedDisputes.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes List */}
      {disputes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No disputes filed</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You can dispute a transaction from the Transactions page by clicking the shield icon on any debit transaction.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {disputes.map((dispute) => {
                const reasonConfig = disputeReasons[dispute.reason as keyof typeof disputeReasons]
                const statusConfig = disputeStatusConfig[dispute.status]
                const ReasonIcon = reasonConfig?.icon || ShieldAlert

                return (
                  <Link
                    key={dispute.id}
                    href={`/disputes/${dispute.id}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-red-500/10 p-2.5">
                        <ReasonIcon className="h-4 w-4 text-red-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {dispute.transaction?.description || 'Transaction Dispute'}
                          </p>
                          <Badge variant={statusConfig?.variant || 'default'} className="text-[10px] px-1.5 py-0">
                            {statusConfig?.label || dispute.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {reasonConfig?.label || dispute.reason} &middot; {formatRelativeTime(dispute.created_at)}
                        </p>
                      </div>
                    </div>
                    {dispute.transaction && (
                      <p className="text-sm font-semibold tabular-nums text-red-500">
                        -{formatGBP(dispute.transaction.amount)}
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
