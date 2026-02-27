'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { FileText, Shield, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { RegulatoryReturn, CapitalAdequacy } from '@/lib/types/regulatory'

interface RegulatoryClientProps {
  returns: RegulatoryReturn[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  capitalHistory: CapitalAdequacy[]
  latestCapital: CapitalAdequacy | null
  statusFilter: string
  returnTypeFilter: string
}

const returnTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    capital_adequacy: 'Capital Adequacy',
    liquidity: 'Liquidity',
    large_exposures: 'Large Exposures',
    complaints_data: 'Complaints Data',
    fraud_data: 'Fraud Data',
    psd2_reporting: 'PSD2 Reporting',
    aml_returns: 'AML Returns',
    operational_risk: 'Operational Risk',
  }
  return labels[type] || type
}

const returnStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Draft',
    in_review: 'In Review',
    approved: 'Approved',
    submitted: 'Submitted',
    accepted: 'Accepted',
    rejected: 'Rejected',
  }
  return labels[status] || status
}

export function RegulatoryClient({
  returns, total, page, pageSize, totalPages,
  capitalHistory, latestCapital,
  statusFilter, returnTypeFilter,
}: RegulatoryClientProps) {
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
      router.push(`/admin/regulatory?${params.toString()}`)
    },
    [router, searchParams]
  )

  // Capital adequacy stats
  const capitalRatio = latestCapital ? (Number(latestCapital.capital_ratio) * 100).toFixed(1) : '\u2014'
  const tier1Ratio = latestCapital ? (Number(latestCapital.tier1_ratio) * 100).toFixed(1) : '\u2014'
  const isCompliant = latestCapital?.is_compliant ?? true
  const pendingReturns = returns.filter((r) => ['draft', 'in_review'].includes(r.status)).length
  const overdueReturns = returns.filter((r) =>
    new Date(r.submission_deadline) < new Date() && !['submitted', 'accepted'].includes(r.status)
  ).length

  const columns: Column<RegulatoryReturn>[] = [
    {
      key: 'return_type',
      label: 'Return Type',
      render: (row) => (
        <span className="text-[12px] font-medium text-foreground">{returnTypeLabel(row.return_type)}</span>
      ),
    },
    {
      key: 'period_start',
      label: 'Period',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {new Date(row.period_start).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
          {' \u2013 '}
          {new Date(row.period_end).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'submission_deadline',
      label: 'Deadline',
      sortable: true,
      render: (row) => {
        const isOverdue = new Date(row.submission_deadline) < new Date() && !['submitted', 'accepted'].includes(row.status)
        return (
          <span className={`text-[12px] ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
            {new Date(row.submission_deadline).toLocaleDateString('en-GB')}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const variant = row.status === 'accepted' ? 'secondary'
          : row.status === 'rejected' ? 'destructive'
          : row.status === 'submitted' ? 'default'
          : 'outline'
        return <Badge variant={variant}>{returnStatusLabel(row.status)}</Badge>
      },
    },
    {
      key: 'gabriel_reference',
      label: 'GABRIEL Ref',
      render: (row) => (
        <span className="text-[11px] font-mono text-muted-foreground">{row.gabriel_reference || '\u2014'}</span>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (row) => (
        <span className="text-[11px] text-muted-foreground">
          {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-GB') : '\u2014'}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      {/* Capital Adequacy Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Capital Ratio"
          value={`${capitalRatio}%`}
          icon={Shield}
          variant={isCompliant ? 'success' : 'destructive'}
        />
        <StatCard title="Tier 1 Ratio" value={`${tier1Ratio}%`} icon={TrendingUp} />
        <StatCard
          title="Compliant"
          value={isCompliant ? 'Yes' : 'No'}
          icon={isCompliant ? CheckCircle : AlertTriangle}
          variant={isCompliant ? 'success' : 'destructive'}
        />
        <StatCard title="Total Returns" value={total} icon={FileText} />
        <StatCard title="Pending" value={pendingReturns} icon={Clock} variant={pendingReturns > 0 ? 'warning' : 'default'} />
        <StatCard title="Overdue" value={overdueReturns} icon={AlertTriangle} variant={overdueReturns > 0 ? 'destructive' : 'default'} />
      </div>

      {/* Capital Adequacy History */}
      {capitalHistory.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
            <h3 className="text-[13px] font-semibold text-foreground">Capital Adequacy History</h3>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tier 1</th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Capital</th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">RWA</th>
                <th className="px-4 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ratio</th>
                <th className="px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {capitalHistory.map((c) => (
                <tr key={c.id} className="border-b border-border/20">
                  <td className="px-4 py-2 text-muted-foreground">{new Date(c.reporting_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-2 text-right font-mono text-[12px]">£{Number(c.tier1_capital).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono text-[12px]">£{Number(c.total_capital).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono text-[12px]">£{Number(c.risk_weighted_assets).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right font-mono text-[12px] font-medium">{(Number(c.capital_ratio) * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2 text-center">
                    <Badge variant={c.is_compliant ? 'secondary' : 'destructive'}>
                      {c.is_compliant ? 'Compliant' : 'Below Min'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Regulatory Returns Table */}
      <DataTable
        columns={columns}
        data={returns}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={FileText}
        emptyTitle="No regulatory returns"
        emptyDescription="GABRIEL submissions and regulatory returns will appear here."
        filters={
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => updateParams({ status: e.target.value })} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="submitted">Submitted</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={returnTypeFilter} onChange={(e) => updateParams({ returnType: e.target.value })} className={selectClass}>
              <option value="all">All Types</option>
              <option value="capital_adequacy">Capital Adequacy</option>
              <option value="liquidity">Liquidity</option>
              <option value="large_exposures">Large Exposures</option>
              <option value="complaints_data">Complaints Data</option>
              <option value="fraud_data">Fraud Data</option>
              <option value="psd2_reporting">PSD2 Reporting</option>
              <option value="aml_returns">AML Returns</option>
              <option value="operational_risk">Operational Risk</option>
            </select>
          </div>
        }
      />
    </div>
  )
}
