'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileCheck, Plus, Database } from 'lucide-react'
import { generateComplianceReport } from './actions'
import type { ComplianceReport, DataRetentionPolicy } from '@/lib/types/audit'

interface ComplianceClientProps {
  reports: ComplianceReport[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  retentionPolicies: DataRetentionPolicy[]
  reportType: string
  status: string
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'secondary'
    case 'in_progress': return 'default'
    case 'pending_review': return 'warning'
    case 'approved': return 'success'
    case 'submitted': return 'success'
    case 'rejected': return 'destructive'
    default: return 'secondary'
  }
}

const reportTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    sar: 'SAR',
    str: 'STR',
    ctr: 'CTR',
    annual_aml: 'Annual AML',
    quarterly_fca: 'Quarterly FCA',
    pci_dss_saq: 'PCI-DSS SAQ',
    data_retention: 'Data Retention',
    risk_assessment: 'Risk Assessment',
    custom: 'Custom',
  }
  return labels[type] || type
}

export function ComplianceClient({
  reports,
  total,
  page,
  pageSize,
  totalPages,
  retentionPolicies,
  reportType,
  status,
}: ComplianceClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)
  const [newType, setNewType] = useState('quarterly_fca')
  const [newTitle, setNewTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showRetention, setShowRetention] = useState(false)

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
      router.push(`/admin/compliance?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setIsCreating(true)
    try {
      await generateComplianceReport(newType, newTitle.trim())
      setShowCreate(false)
      setNewTitle('')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create report')
    } finally {
      setIsCreating(false)
    }
  }

  const columns: Column<ComplianceReport>[] = [
    {
      key: 'report_type',
      label: 'Type',
      render: (row) => (
        <Badge variant="secondary">{reportTypeLabel(row.report_type)}</Badge>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (row) => (
        <div>
          <p className="text-[13px] font-medium">{row.title}</p>
          {row.description && (
            <p className="text-[11px] text-muted-foreground truncate max-w-[300px]">{row.description}</p>
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
      key: 'reporting_period_start',
      label: 'Period',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.reporting_period_start && row.reporting_period_end
            ? `${new Date(row.reporting_period_start).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })} - ${new Date(row.reporting_period_end).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })}`
            : '\u2014'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {row.submitted_at
            ? new Date(row.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
            : '\u2014'}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"
  const inputClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Report
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRetention(!showRetention)}
        >
          <Database className="h-3.5 w-3.5 mr-1.5" />
          Data Retention
        </Button>
      </div>

      {/* Data Retention Panel */}
      {showRetention && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 bg-muted/20 border-b border-border/60">
            <h3 className="text-[14px] font-semibold">Data Retention Policies</h3>
            <p className="text-[11px] text-muted-foreground">Configured data retention periods per table</p>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Table</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Retention</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {retentionPolicies.map((p) => (
                <tr key={p.id} className="border-b border-border/20">
                  <td className="px-4 py-2.5 font-mono text-[12px]">{p.table_name}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary">{Math.round(p.retention_days / 365)} years</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{p.description}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={p.is_active ? 'success' : 'secondary'}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reports Table */}
      <DataTable
        columns={columns}
        data={reports}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={FileCheck}
        emptyTitle="No compliance reports"
        emptyDescription="Create your first compliance report to get started."
        filters={
          <div className="flex items-center gap-2">
            <select
              value={reportType}
              onChange={(e) => updateParams({ reportType: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Types</option>
              <option value="sar">SAR</option>
              <option value="str">STR</option>
              <option value="ctr">CTR</option>
              <option value="annual_aml">Annual AML</option>
              <option value="quarterly_fca">Quarterly FCA</option>
              <option value="pci_dss_saq">PCI-DSS SAQ</option>
              <option value="data_retention">Data Retention</option>
              <option value="risk_assessment">Risk Assessment</option>
            </select>
            <select
              value={status}
              onChange={(e) => updateParams({ status: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="submitted">Submitted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        }
      />

      {/* Create Report Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div
            className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-md mx-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-[16px] font-semibold text-foreground">Generate Compliance Report</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Create a new report for regulatory submission</p>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-[13px] font-medium text-foreground">Report Type</span>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className={inputClass}>
                  <option value="quarterly_fca">Quarterly FCA Return</option>
                  <option value="annual_aml">Annual AML Report</option>
                  <option value="pci_dss_saq">PCI-DSS SAQ</option>
                  <option value="data_retention">Data Retention Audit</option>
                  <option value="risk_assessment">Risk Assessment</option>
                  <option value="sar">Suspicious Activity Report</option>
                  <option value="str">Suspicious Transaction Report</option>
                  <option value="custom">Custom Report</option>
                </select>
              </label>

              <label className="block">
                <span className="text-[13px] font-medium text-foreground">Title</span>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Q1 2026 FCA Quarterly Return"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={isCreating || !newTitle.trim()}
                className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
              >
                {isCreating ? 'Creating...' : 'Create Report'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
