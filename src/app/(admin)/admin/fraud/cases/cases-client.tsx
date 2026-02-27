'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ShieldAlert, Pencil } from 'lucide-react'
import { formatGBP } from '@/lib/utils/currency'
import { updateFraudCase } from '../actions'
import Link from 'next/link'
import type { FraudCase } from '@/lib/types/fraud'

interface FraudCasesClientProps {
  data: FraudCase[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  status: string
  priority: string
}

const statusVariant = (s: string) => {
  switch (s) {
    case 'open': return 'warning'
    case 'investigating': return 'default'
    case 'confirmed_fraud': return 'destructive'
    case 'false_positive': return 'success'
    case 'closed': return 'secondary'
    default: return 'secondary'
  }
}

const priorityVariant = (p: string) => {
  switch (p) {
    case 'critical': return 'destructive'
    case 'high': return 'destructive'
    case 'medium': return 'warning'
    case 'low': return 'secondary'
    default: return 'secondary'
  }
}

export function FraudCasesClient({
  data, total, page, pageSize, totalPages, status, priority,
}: FraudCasesClientProps) {
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
        if (value && value !== 'all') params.set(key, value)
        else params.delete(key)
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/fraud/cases?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleUpdate = async () => {
    if (!editingId || !newStatus) return
    setIsSubmitting(true)
    try {
      await updateFraudCase(editingId, newStatus, resolution)
      setEditingId(null)
      setNewStatus('')
      setResolution('')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<FraudCase>[] = [
    {
      key: 'id',
      label: 'Case',
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
      key: 'priority',
      label: 'Priority',
      render: (row) => <Badge variant={priorityVariant(row.priority) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>{row.priority}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge variant={statusVariant(row.status) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>{row.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'amount_at_risk',
      label: 'At Risk',
      render: (row) => <span className="text-[13px] font-mono">{row.amount_at_risk ? formatGBP(row.amount_at_risk) : '\u2014'}</span>,
    },
    {
      key: 'amount_recovered',
      label: 'Recovered',
      render: (row) => <span className="text-[13px] font-mono text-[#00703C]">{row.amount_recovered > 0 ? formatGBP(row.amount_recovered) : '\u2014'}</span>,
    },
    {
      key: 'created_at',
      label: 'Opened',
      sortable: true,
      render: (row) => <span className="text-[12px] text-muted-foreground">{new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
          onClick={() => { setEditingId(row.id); setNewStatus(row.status); setResolution(row.resolution || '') }}>
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
        columns={columns} data={data} total={total} page={page} pageSize={pageSize} totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={ShieldAlert} emptyTitle="No fraud cases" emptyDescription="No fraud cases to investigate."
        filters={
          <div className="flex items-center gap-2">
            <select value={status} onChange={(e) => updateParams({ status: e.target.value })} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="confirmed_fraud">Confirmed Fraud</option>
              <option value="false_positive">False Positive</option>
              <option value="closed">Closed</option>
            </select>
            <select value={priority} onChange={(e) => updateParams({ priority: e.target.value })} className={selectClass}>
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        }
      />

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingId(null)}>
          <div className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-foreground">Update Fraud Case</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[13px] font-medium">Status</span>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={inputClass}>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="confirmed_fraud">Confirmed Fraud</option>
                  <option value="false_positive">False Positive</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[13px] font-medium">Resolution Notes</span>
                <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} placeholder="Resolution details..." className={`${inputClass} resize-none`} />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button size="sm" onClick={handleUpdate} disabled={isSubmitting} className="bg-[#00AEEF] hover:bg-[#0098d1] text-white">
                {isSubmitting ? 'Updating...' : 'Update Case'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
