'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { FileWarning, Clock, CheckCircle, Send, AlertTriangle, Banknote } from 'lucide-react'
import type { SuspiciousActivityReport, SarDashboardStats } from '@/lib/types/limits'

interface SarClientProps {
  sars: SuspiciousActivityReport[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: SarDashboardStats
  statusFilter: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary'
    case 'pending_review': return 'warning'
    case 'submitted': return 'default'
    case 'acknowledged': return 'success'
    case 'rejected': return 'destructive'
    default: return 'secondary'
  }
}

export function SarClient({
  sars, total, page, pageSize, totalPages, stats, statusFilter,
}: SarClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') params.set(key, value)
        else params.delete(key)
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/sar?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<SuspiciousActivityReport>[] = [
    {
      key: 'sar_reference',
      label: 'Reference',
      render: (row) => (
        <span className="text-[12px] font-mono font-medium text-[#00AEEF]">
          {row.sar_reference || row.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'profile',
      label: 'Subject',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.profile?.full_name || '\u2014'}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => (
        <span className="text-[12px] text-foreground truncate max-w-[200px] block">{row.reason}</span>
      ),
    },
    {
      key: 'total_amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-[12px] font-mono text-foreground">
          {row.total_amount ? `£${Number(row.total_amount).toLocaleString()}` : '\u2014'}
        </span>
      ),
    },
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
      key: 'created_at',
      label: 'Filed',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: '2-digit',
          })}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total SARs" value={stats.total} icon={FileWarning} />
        <StatCard title="Draft" value={stats.draft} icon={Clock} variant={stats.draft > 0 ? 'warning' : 'default'} />
        <StatCard title="Pending Review" value={stats.pending_review} icon={AlertTriangle} variant={stats.pending_review > 0 ? 'warning' : 'default'} />
        <StatCard title="Submitted" value={stats.submitted} icon={Send} variant="default" />
        <StatCard title="Acknowledged" value={stats.acknowledged} icon={CheckCircle} variant="success" />
        <StatCard title="Total Amount" value={`£${Number(stats.total_amount).toLocaleString()}`} icon={Banknote} />
      </div>

      <DataTable
        columns={columns}
        data={sars}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={FileWarning}
        emptyTitle="No SARs filed"
        emptyDescription="Suspicious Activity Reports will appear here when filed."
        filters={
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => updateParams({ status: e.target.value })} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        }
      />
    </div>
  )
}
