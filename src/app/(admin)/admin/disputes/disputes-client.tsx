'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Pencil } from 'lucide-react'
import { formatGBP } from '@/lib/utils/currency'
import { updateDisputeStatus } from '../actions'
import Link from 'next/link'
import type { Dispute } from '@/lib/types'

type DisputeRow = Dispute & { profile?: { full_name: string; email: string } }

interface DisputesClientProps {
  data: DisputeRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  status: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'submitted': return 'default'
    case 'under_review': return 'warning'
    case 'information_requested': return 'warning'
    case 'resolved_refunded': return 'success'
    case 'resolved_denied': return 'destructive'
    case 'closed': return 'secondary'
    default: return 'secondary'
  }
}

export function DisputesClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  status,
}: DisputesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [resolution, setResolution] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      router.push(`/admin/disputes?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleStatusUpdate = async () => {
    if (!editingId || !newStatus) return
    setIsSubmitting(true)
    try {
      await updateDisputeStatus(editingId, newStatus, resolution)
      setEditingId(null)
      setNewStatus('')
      setResolution('')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update dispute')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<DisputeRow>[] = [
    {
      key: 'id',
      label: 'Ref',
      render: (row) => (
        <span className="text-[11px] font-mono text-muted-foreground">{row.id.slice(0, 8)}</span>
      ),
    },
    {
      key: 'profile',
      label: 'Customer',
      render: (row) => (
        <div>
          <Link href={`/admin/customers/${row.user_id}`} className="text-[#00AEEF] hover:underline text-[13px] font-medium">
            {row.profile?.full_name || 'Unknown'}
          </Link>
          <p className="text-[11px] text-muted-foreground">{row.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => (
        <span className="text-[13px] font-medium capitalize">{row.reason.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'transaction',
      label: 'Transaction',
      render: (row) => (
        <div className="text-[13px]">
          {row.transaction ? (
            <>
              <p className="truncate max-w-[200px]">{row.transaction.description}</p>
              <p className="text-[11px] text-muted-foreground tabular-nums">{formatGBP(row.transaction.amount)}</p>
            </>
          ) : (
            <span className="text-muted-foreground">\u2014</span>
          )}
        </div>
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
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => {
            setEditingId(row.id)
            setNewStatus(row.status)
            setResolution(row.resolution || '')
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"
  const inputClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={ShieldAlert}
        emptyTitle="No disputes found"
        emptyDescription="No disputes match the current filter."
        filters={
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className={selectClass}
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="information_requested">Info Requested</option>
            <option value="resolved_refunded">Resolved (Refunded)</option>
            <option value="resolved_denied">Resolved (Denied)</option>
            <option value="closed">Closed</option>
          </select>
        }
      />

      {/* Status Update Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingId(null)}>
          <div
            className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-[16px] font-semibold text-foreground">Update Dispute Status</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Ref: {editingId.slice(0, 8)}</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[13px] font-medium text-foreground">New Status</span>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={inputClass}>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="information_requested">Information Requested</option>
                  <option value="resolved_refunded">Resolved (Refunded)</option>
                  <option value="resolved_denied">Resolved (Denied)</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[13px] font-medium text-foreground">Resolution Notes</span>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  placeholder="Optional resolution notes..."
                  className={`${inputClass} resize-none`}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleStatusUpdate}
                disabled={isSubmitting}
                className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
