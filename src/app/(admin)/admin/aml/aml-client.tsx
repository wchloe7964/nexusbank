'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Shield, FileWarning, Pencil, Clock, UserCheck, Users } from 'lucide-react'
import Link from 'next/link'
import { updateAmlAlertStatus } from '../kyc/actions'
import { formatGBP } from '@/lib/utils/currency'
import type { AmlAlert, AmlDashboardStats } from '@/lib/types/kyc'

interface AmlClientProps {
  data: AmlAlert[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: AmlDashboardStats
  status: string
  severity: string
  alertType: string
}

const severityVariant = (sev: string) => {
  switch (sev) {
    case 'low': return 'secondary'
    case 'medium': return 'warning'
    case 'high': return 'destructive'
    case 'critical': return 'destructive'
    default: return 'secondary'
  }
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'new': return 'warning'
    case 'investigating': return 'default'
    case 'escalated': return 'destructive'
    case 'dismissed': return 'secondary'
    case 'reported': return 'success'
    default: return 'secondary'
  }
}

export function AmlClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  stats,
  status,
  severity,
  alertType,
}: AmlClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [sarRef, setSarRef] = useState('')
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
      router.push(`/admin/aml?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleUpdate = async () => {
    if (!editingId || !newStatus) return
    setIsSubmitting(true)
    try {
      await updateAmlAlertStatus(editingId, newStatus, notes, sarRef)
      setEditingId(null)
      setNewStatus('')
      setNotes('')
      setSarRef('')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update alert')
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<AmlAlert>[] = [
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
      key: 'alert_type',
      label: 'Type',
      render: (row) => (
        <span className="text-[13px] font-medium capitalize">{row.alert_type.replace(/_/g, ' ')}</span>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (row) => (
        <Badge variant={severityVariant(row.severity) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>
          {row.severity}
        </Badge>
      ),
    },
    {
      key: 'trigger_amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-[13px] font-mono">
          {row.trigger_amount ? formatGBP(row.trigger_amount) : '\u2014'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Badge variant={statusVariant(row.status) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>
            {row.status}
          </Badge>
          {row.sar_filed && <Badge variant="success">SAR</Badge>}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
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
        <div className="flex items-center gap-1">
          {(row.severity === 'critical' || row.severity === 'high' || row.status === 'escalated') && !row.sar_filed && (
            <Link
              href={`/admin/sar?from_aml=${row.id}&user=${row.user_id}`}
              className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-500/20 transition-colors"
            >
              <FileWarning className="h-3 w-3" />
              File SAR
            </Link>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => {
              setEditingId(row.id)
              setNewStatus(row.status)
              setNotes(row.resolution_notes || '')
              setSarRef(row.sar_reference || '')
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"
  const inputClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="New Alerts" value={stats.new_alerts} icon={AlertTriangle} variant="destructive" />
        <StatCard title="Investigating" value={stats.investigating} icon={Shield} />
        <StatCard title="Critical" value={stats.critical_alerts} icon={FileWarning} variant="destructive" />
        <StatCard title="SARs Filed" value={stats.sars_filed} icon={UserCheck} variant="success" />
        <StatCard title="Pending KYC" value={stats.pending_kyc} icon={Clock} variant="warning" />
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
        emptyIcon={AlertTriangle}
        emptyTitle="No AML alerts"
        emptyDescription="No suspicious activity alerts to review."
        filters={
          <div className="flex items-center gap-2">
            <select value={status} onChange={(e) => updateParams({ status: e.target.value })} className={selectClass}>
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="escalated">Escalated</option>
              <option value="dismissed">Dismissed</option>
              <option value="reported">Reported</option>
            </select>
            <select value={severity} onChange={(e) => updateParams({ severity: e.target.value })} className={selectClass}>
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={alertType} onChange={(e) => updateParams({ alertType: e.target.value })} className={selectClass}>
              <option value="all">All Types</option>
              <option value="large_transaction">Large Transaction</option>
              <option value="velocity">Velocity</option>
              <option value="structuring">Structuring</option>
              <option value="pattern">Pattern</option>
              <option value="sanctions_hit">Sanctions Hit</option>
              <option value="pep_activity">PEP Activity</option>
              <option value="unusual_activity">Unusual Activity</option>
            </select>
          </div>
        }
      />

      {/* Update Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingId(null)}>
          <div
            className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-[16px] font-semibold text-foreground">Update AML Alert</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Ref: {editingId.slice(0, 8)}</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[13px] font-medium text-foreground">Status</span>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className={inputClass}>
                  <option value="new">New</option>
                  <option value="investigating">Investigating</option>
                  <option value="escalated">Escalated</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="reported">Reported (SAR Filed)</option>
                </select>
              </label>

              {newStatus === 'reported' && (
                <label className="block">
                  <span className="text-[13px] font-medium text-foreground">SAR Reference</span>
                  <input
                    type="text"
                    value={sarRef}
                    onChange={(e) => setSarRef(e.target.value)}
                    placeholder="SAR-2026-XXXXX"
                    className={inputClass}
                  />
                </label>
              )}

              <label className="block">
                <span className="text-[13px] font-medium text-foreground">Notes</span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Investigation notes..."
                  className={`${inputClass} resize-none`}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isSubmitting}
                className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
              >
                {isSubmitting ? 'Updating...' : 'Update Alert'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
