'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserCheck, AlertTriangle, Shield, FileWarning, Clock, Users, Eye } from 'lucide-react'
import Link from 'next/link'
import type { KycVerification, KycDocument, AmlDashboardStats } from '@/lib/types/kyc'
import { KycReviewDialog } from './kyc-review-dialog'

type KycWithDocs = KycVerification & { documents?: KycDocument[] }

interface KycClientProps {
  data: KycWithDocs[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: AmlDashboardStats
  status: string
  riskRating: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'documents_required': return 'default'
    case 'under_review': return 'default'
    case 'verified': return 'success'
    case 'failed': return 'destructive'
    case 'expired': return 'secondary'
    default: return 'secondary'
  }
}

const riskVariant = (risk: string) => {
  switch (risk) {
    case 'low': return 'success'
    case 'medium': return 'warning'
    case 'high': return 'destructive'
    case 'very_high': return 'destructive'
    default: return 'secondary'
  }
}

export function KycClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  stats,
  status,
  riskRating,
}: KycClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reviewKyc, setReviewKyc] = useState<KycWithDocs | null>(null)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/kyc?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<KycWithDocs>[] = [
    {
      key: 'profile',
      label: 'Customer',
      render: (row) => (
        <div>
          <Link
            href={`/admin/customers/${row.user_id}`}
            className="text-[13px] font-medium text-[#00AEEF] hover:underline"
          >
            {row.profile?.full_name || 'Unknown'}
          </Link>
          <p className="text-[11px] text-muted-foreground">{row.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'verification_level',
      label: 'Level',
      render: (row) => (
        <Badge variant="secondary" className="capitalize">{row.verification_level}</Badge>
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
      key: 'risk_rating',
      label: 'Risk',
      render: (row) => (
        <Badge variant={riskVariant(row.risk_rating) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>
          {row.risk_rating.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'identity_verified',
      label: 'ID / Addr',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className={row.identity_verified ? 'text-[#00703C]' : 'text-[#D4351C]'}>
            {row.identity_verified ? '\u2713' : '\u2717'} ID
          </span>
          <span className={row.address_verified ? 'text-[#00703C]' : 'text-[#D4351C]'}>
            {row.address_verified ? '\u2713' : '\u2717'} Addr
          </span>
        </div>
      ),
    },
    {
      key: 'documents',
      label: 'Docs',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.documents?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            setReviewKyc(row)
          }}
          className="h-7 text-xs gap-1.5"
        >
          <Eye className="h-3 w-3" />
          Review
        </Button>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Pending KYC" value={stats.pending_kyc} icon={Clock} variant="warning" />
        <StatCard title="New Alerts" value={stats.new_alerts} icon={AlertTriangle} variant="destructive" />
        <StatCard title="Investigating" value={stats.investigating} icon={Shield} />
        <StatCard title="Critical" value={stats.critical_alerts} icon={FileWarning} variant="destructive" />
        <StatCard title="SARs Filed" value={stats.sars_filed} icon={UserCheck} variant="success" />
        <StatCard title="High Risk" value={stats.high_risk_customers} icon={Users} variant="warning" />
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={UserCheck}
        emptyTitle="No KYC verifications"
        emptyDescription="Customer verification requests will appear here."
        filters={
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="documents_required">Docs Required</option>
              <option value="under_review">Under Review</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
            <select
              value={riskRating}
              onChange={(e) => updateParams({ riskRating: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </select>
          </div>
        }
      />

      {/* Review Dialog */}
      {reviewKyc && (
        <KycReviewDialog
          kyc={reviewKyc}
          open={!!reviewKyc}
          onClose={() => setReviewKyc(null)}
        />
      )}
    </div>
  )
}
