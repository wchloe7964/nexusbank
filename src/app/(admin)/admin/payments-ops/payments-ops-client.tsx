'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { Zap, Clock, XCircle, BanknoteIcon, ArrowUpRight, Timer, Building2 } from 'lucide-react'
import { formatGBP } from '@/lib/utils/currency'
import Link from 'next/link'
import type { PaymentSubmission, PaymentSchemeConfig, PaymentRailsStats } from '@/lib/types/payments'

interface PaymentsOpsClientProps {
  data: PaymentSubmission[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  schemeConfigs: PaymentSchemeConfig[]
  stats: PaymentRailsStats
  rail: string
  railStatus: string
}

const railBadge = (rail: string) => {
  switch (rail) {
    case 'fps': return 'success'
    case 'bacs': return 'default'
    case 'chaps': return 'warning'
    case 'internal': return 'secondary'
    default: return 'secondary'
  }
}

const statusBadge = (s: string) => {
  switch (s) {
    case 'initiated': return 'secondary'
    case 'submitted': return 'default'
    case 'processing': return 'warning'
    case 'settled': return 'success'
    case 'failed': return 'destructive'
    case 'returned': return 'destructive'
    default: return 'secondary'
  }
}

export function PaymentsOpsClient({
  data, total, page, pageSize, totalPages, schemeConfigs, stats, rail, railStatus,
}: PaymentsOpsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showSchemes, setShowSchemes] = useState(false)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') params.set(key, value)
        else params.delete(key)
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/payments-ops?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<PaymentSubmission>[] = [
    {
      key: 'id',
      label: 'Ref',
      render: (row) => <span className="text-[11px] font-mono text-muted-foreground">{row.id.slice(0, 8)}</span>,
    },
    {
      key: 'profile',
      label: 'Customer',
      render: (row) => (
        <div>
          <Link href={`/admin/customers/${row.user_id}`} className="text-[13px] font-medium text-[#00AEEF] hover:underline">
            {row.profile?.full_name || 'Unknown'}
          </Link>
        </div>
      ),
    },
    {
      key: 'rail',
      label: 'Rail',
      render: (row) => <Badge variant={railBadge(row.rail) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>{row.rail.toUpperCase()}</Badge>,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => <span className="text-[13px] font-mono font-medium">{formatGBP(row.amount)}</span>,
    },
    {
      key: 'payee_name',
      label: 'Payee',
      render: (row) => (
        <div className="text-[12px]">
          <p className="truncate max-w-[150px]">{row.payee_name || '\u2014'}</p>
          {row.payee_sort_code && (
            <p className="text-muted-foreground font-mono text-[10px]">{row.payee_sort_code} / {row.payee_account_number}</p>
          )}
        </div>
      ),
    },
    {
      key: 'cop_result',
      label: 'CoP',
      render: (row) => {
        if (!row.cop_result) return <span className="text-[12px] text-muted-foreground">{'\u2014'}</span>
        const variant = row.cop_result === 'match' ? 'success' : row.cop_result === 'close_match' ? 'warning' : row.cop_result === 'no_match' ? 'destructive' : 'secondary'
        return <Badge variant={variant as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>{row.cop_result.replace(/_/g, ' ')}</Badge>
      },
    },
    {
      key: 'rail_status',
      label: 'Status',
      render: (row) => <Badge variant={statusBadge(row.rail_status) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>{row.rail_status}</Badge>,
    },
    {
      key: 'created_at',
      label: 'Submitted',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard title="Pending" value={stats.pending} icon={Clock} variant="warning" />
        <StatCard title="Settled Today" value={stats.settled_today} icon={Zap} variant="success" />
        <StatCard title="Failed (7d)" value={stats.failed_7d} icon={XCircle} variant="destructive" />
        <StatCard title="Volume Today" value={formatGBP(stats.volume_today)} icon={BanknoteIcon} />
        <StatCard title="FPS Today" value={stats.fps_today} icon={ArrowUpRight} variant="success" />
        <StatCard title="BACS Processing" value={stats.bacs_processing} icon={Timer} />
        <StatCard title="CHAPS Today" value={stats.chaps_today} icon={Building2} variant="warning" />
      </div>

      {/* Scheme Configs Toggle */}
      <button onClick={() => setShowSchemes(!showSchemes)} className="text-[13px] text-[#00AEEF] hover:underline font-medium">
        {showSchemes ? 'Hide' : 'Show'} Payment Scheme Configuration
      </button>

      {showSchemes && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Scheme</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Amount</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Clearing</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cutoff</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fee</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {schemeConfigs.map((s) => (
                <tr key={s.id} className="border-b border-border/20">
                  <td className="px-4 py-2.5 font-medium">{s.display_name}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{formatGBP(s.max_amount)}</td>
                  <td className="px-4 py-2.5 text-[12px]">{s.clearing_days === 0 ? 'Instant' : `${s.clearing_days} days`}</td>
                  <td className="px-4 py-2.5 text-[12px]">{s.cutoff_time || 'N/A'}</td>
                  <td className="px-4 py-2.5 text-[12px]">{s.fee > 0 ? formatGBP(s.fee) : 'Free'}</td>
                  <td className="px-4 py-2.5"><Badge variant={s.is_active ? 'success' : 'secondary'}>{s.is_active ? 'Active' : 'Inactive'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DataTable
        columns={columns} data={data} total={total} page={page} pageSize={pageSize} totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={Zap} emptyTitle="No payment submissions" emptyDescription="Payment submissions will appear here as payments are processed."
        filters={
          <div className="flex items-center gap-2">
            <select value={rail} onChange={(e) => updateParams({ rail: e.target.value })} className={selectClass}>
              <option value="all">All Rails</option>
              <option value="fps">FPS</option>
              <option value="bacs">BACS</option>
              <option value="chaps">CHAPS</option>
              <option value="internal">Internal</option>
            </select>
            <select value={railStatus} onChange={(e) => updateParams({ railStatus: e.target.value })} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="initiated">Initiated</option>
              <option value="submitted">Submitted</option>
              <option value="processing">Processing</option>
              <option value="settled">Settled</option>
              <option value="failed">Failed</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        }
      />
    </div>
  )
}
