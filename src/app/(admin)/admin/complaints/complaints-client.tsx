'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import Link from 'next/link'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Clock, AlertTriangle, Scale, Banknote, TrendingUp } from 'lucide-react'
import type { Complaint, ComplaintsDashboardStats } from '@/lib/types/regulatory'
import { getCategoryLabel, getStatusLabel, getDeadlineUrgency } from '@/lib/regulatory/complaints'

interface ComplaintsClientProps {
  complaints: Complaint[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: ComplaintsDashboardStats
  statusFilter: string
  categoryFilter: string
  priorityFilter: string
}

export function ComplaintsClient({
  complaints, total, page, pageSize, totalPages,
  stats, statusFilter, categoryFilter, priorityFilter,
}: ComplaintsClientProps) {
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
      router.push(`/admin/complaints?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<Complaint>[] = [
    {
      key: 'reference',
      label: 'Reference',
      render: (row) => (
        <Link href={`/admin/complaints/${row.id}`} className="text-[12px] font-mono font-medium text-[#00AEEF] hover:underline">
          {row.reference}
        </Link>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">{getCategoryLabel(row.category)}</span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (
        <span className="text-[12px] text-foreground truncate max-w-[200px] block">{row.subject}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isEscalated = row.status === 'escalated_fos'
        const isResolved = ['resolved', 'closed'].includes(row.status)
        return (
          <Badge variant={isEscalated ? 'destructive' : isResolved ? 'secondary' : 'default'}>
            {getStatusLabel(row.status)}
          </Badge>
        )
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => {
        const isVulnerable = row.priority === 'vulnerable_customer'
        const isUrgent = row.priority === 'urgent'
        return (
          <Badge variant={isVulnerable ? 'destructive' : isUrgent ? 'default' : 'secondary'}>
            {isVulnerable ? 'Vulnerable' : isUrgent ? 'Urgent' : 'Standard'}
          </Badge>
        )
      },
    },
    {
      key: 'deadline_at',
      label: 'Deadline',
      sortable: true,
      render: (row) => {
        const urgency = getDeadlineUrgency(row.deadline_at, row.status)
        return <Badge variant={urgency.variant}>{urgency.label}</Badge>
      },
    },
    {
      key: 'profiles',
      label: 'Customer',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.profiles?.full_name || row.profiles?.email || '\u2014'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Received',
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
        <StatCard title="Total Complaints" value={stats.total} icon={MessageSquare} />
        <StatCard title="Open" value={stats.open} icon={Clock} variant={stats.open > 0 ? 'warning' : 'default'} />
        <StatCard title="Overdue" value={stats.overdue} icon={AlertTriangle} variant={stats.overdue > 0 ? 'destructive' : 'default'} />
        <StatCard title="Escalated (FOS)" value={stats.escalated_fos} icon={Scale} variant={stats.escalated_fos > 0 ? 'destructive' : 'default'} />
        <StatCard title="Avg Resolution" value={`${stats.avg_resolution_days}d`} icon={TrendingUp} />
        <StatCard title="Compensation" value={`£${Number(stats.compensation_total).toLocaleString()}`} icon={Banknote} />
      </div>

      <DataTable
        columns={columns}
        data={complaints}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={MessageSquare}
        emptyTitle="No complaints"
        emptyDescription="Customer complaints will appear here."
        filters={
          <div className="flex flex-wrap gap-2">
            <select value={statusFilter} onChange={(e) => updateParams({ status: e.target.value })} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="received">Received</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="response_issued">Response Issued</option>
              <option value="resolved">Resolved</option>
              <option value="escalated_fos">Escalated (FOS)</option>
              <option value="closed">Closed</option>
            </select>
            <select value={categoryFilter} onChange={(e) => updateParams({ category: e.target.value })} className={selectClass}>
              <option value="all">All Categories</option>
              <option value="service_quality">Service Quality</option>
              <option value="fees_charges">Fees &amp; Charges</option>
              <option value="product_performance">Product Performance</option>
              <option value="mis_selling">Mis-selling</option>
              <option value="data_privacy">Data Privacy</option>
              <option value="fraud_scam">Fraud / Scam</option>
              <option value="accessibility">Accessibility</option>
              <option value="account_management">Account Management</option>
              <option value="payment_issues">Payment Issues</option>
              <option value="other">Other</option>
            </select>
            <select value={priorityFilter} onChange={(e) => updateParams({ priority: e.target.value })} className={selectClass}>
              <option value="all">All Priorities</option>
              <option value="standard">Standard</option>
              <option value="urgent">Urgent</option>
              <option value="vulnerable_customer">Vulnerable Customer</option>
            </select>
          </div>
        }
      />
    </div>
  )
}
