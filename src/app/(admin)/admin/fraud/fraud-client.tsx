'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { ShieldBan, Eye, ShieldCheck, AlertTriangle, BanknoteIcon, Undo2 } from 'lucide-react'
import { formatGBP } from '@/lib/utils/currency'
import Link from 'next/link'
import type { FraudScore, FraudDashboardStats } from '@/lib/types/fraud'

interface FraudClientProps {
  data: FraudScore[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: FraudDashboardStats
  decision: string
}

const decisionVariant = (d: string) => {
  switch (d) {
    case 'allow': return 'success'
    case 'review': return 'warning'
    case 'block': return 'destructive'
    default: return 'secondary'
  }
}

export function FraudClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  stats,
  decision,
}: FraudClientProps) {
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
      router.push(`/admin/fraud?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<FraudScore>[] = [
    {
      key: 'profile',
      label: 'Customer',
      render: (row) => (
        <div>
          <Link href={`/admin/customers/${row.user_id}`} className="text-[13px] font-medium text-[#00AEEF] hover:underline">
            {row.profile?.full_name || 'Unknown'}
          </Link>
          <p className="text-[11px] text-muted-foreground">{row.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      render: (row) => {
        const color = row.score >= 61 ? 'text-[#D4351C]' : row.score >= 31 ? 'text-[#F47738]' : 'text-[#00703C]'
        return <span className={`text-[16px] font-bold tabular-nums ${color}`}>{row.score}</span>
      },
    },
    {
      key: 'decision',
      label: 'Decision',
      render: (row) => (
        <Badge variant={decisionVariant(row.decision) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>
          {row.decision}
        </Badge>
      ),
    },
    {
      key: 'factors',
      label: 'Factors',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.factors.length} rule{row.factors.length !== 1 ? 's' : ''} triggered
        </span>
      ),
    },
    {
      key: 'review_decision',
      label: 'Review',
      render: (row) => (
        row.review_decision
          ? <Badge variant={row.review_decision === 'approved' ? 'success' : 'destructive'}>{row.review_decision}</Badge>
          : row.decision !== 'allow'
            ? <Badge variant="secondary">pending</Badge>
            : <span className="text-[12px] text-muted-foreground">{'\u2014'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Time',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Open Cases" value={stats.open_cases} icon={AlertTriangle} variant="warning" />
        <StatCard title="Blocked Today" value={stats.blocked_today} icon={ShieldBan} variant="destructive" />
        <StatCard title="Pending Review" value={stats.review_pending} icon={Eye} />
        <StatCard title="Confirmed Fraud" value={stats.confirmed_fraud} icon={ShieldCheck} variant="destructive" />
        <StatCard title="At Risk" value={formatGBP(stats.total_at_risk)} icon={BanknoteIcon} variant="warning" />
        <StatCard title="Recovered" value={formatGBP(stats.total_recovered)} icon={Undo2} variant="success" />
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={ShieldCheck}
        emptyTitle="No fraud scores"
        emptyDescription="Transaction scoring data will appear here."
        filters={
          <select value={decision} onChange={(e) => updateParams({ decision: e.target.value })} className={selectClass}>
            <option value="all">All Decisions</option>
            <option value="block">Blocked</option>
            <option value="review">Review</option>
            <option value="allow">Allowed</option>
          </select>
        }
      />
    </div>
  )
}
