'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import type { Complaint, ComplaintStatus } from '@/lib/types/regulatory'
import {
  getCategoryLabel,
  getStatusLabel,
  getDeadlineUrgency,
  daysUntilDeadline,
} from '@/lib/regulatory/complaints'
import { updateComplaintStatus, respondToComplaint } from '../actions'

interface Props {
  complaint: Complaint
}

export function ComplaintDetailClient({ complaint }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(complaint.status)
  const [response, setResponse] = useState(complaint.response ?? '')
  const [rootCause, setRootCause] = useState(complaint.root_cause ?? '')
  const [remediation, setRemediation] = useState(complaint.remediation ?? '')
  const [compensation, setCompensation] = useState(String(complaint.compensation_amount || '0'))
  const [saving, setSaving] = useState(false)

  const urgency = getDeadlineUrgency(complaint.deadline_at, complaint.status)
  const daysLeft = daysUntilDeadline(complaint.deadline_at)
  const isClosed = ['resolved', 'closed'].includes(complaint.status)

  async function handleStatusUpdate() {
    setSaving(true)
    try {
      await updateComplaintStatus(complaint.id, status as Complaint['status'])
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleRespond() {
    setSaving(true)
    try {
      await respondToComplaint(complaint.id, {
        response,
        rootCause: rootCause || undefined,
        remediation: remediation || undefined,
        compensationAmount: Number(compensation) || 0,
      })
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const labelClass = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
  const valueClass = "text-[13px] text-foreground mt-0.5"
  const inputClass = "w-full rounded-md border border-border/60 bg-background px-3 py-2 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"
  const btnPrimary = "rounded-md bg-[#00AEEF] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#009BD6] disabled:opacity-50 transition-colors"
  const btnSecondary = "rounded-md border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"

  return (
    <div className="space-y-6">
      {/* Status & Deadline Banner */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <Badge variant={urgency.variant}>{urgency.label}</Badge>
        <Badge variant={complaint.priority === 'vulnerable_customer' ? 'destructive' : complaint.priority === 'urgent' ? 'default' : 'secondary'}>
          {complaint.priority === 'vulnerable_customer' ? 'Vulnerable Customer' : complaint.priority === 'urgent' ? 'Urgent' : 'Standard'}
        </Badge>
        <Badge variant="secondary">{getStatusLabel(complaint.status)}</Badge>
        <Badge variant="outline">{getCategoryLabel(complaint.category)}</Badge>
        {!isClosed && (
          <span className="ml-auto text-[12px] text-muted-foreground">
            FCA deadline: {new Date(complaint.deadline_at).toLocaleDateString('en-GB')}
            {daysLeft > 0 ? ` (${daysLeft} days remaining)` : ` (${Math.abs(daysLeft)} days overdue)`}
          </span>
        )}
      </div>

      {/* Complaint Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-[15px] font-semibold text-foreground">Complaint Details</h2>

          <div>
            <p className={labelClass}>Reference</p>
            <p className={`${valueClass} font-mono`}>{complaint.reference}</p>
          </div>
          <div>
            <p className={labelClass}>Customer</p>
            <p className={valueClass}>{complaint.profiles?.full_name || complaint.profiles?.email || '\u2014'}</p>
          </div>
          <div>
            <p className={labelClass}>Description</p>
            <p className={`${valueClass} whitespace-pre-wrap`}>{complaint.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={labelClass}>Received</p>
              <p className={valueClass}>{new Date(complaint.created_at).toLocaleDateString('en-GB')}</p>
            </div>
            <div>
              <p className={labelClass}>Acknowledged</p>
              <p className={valueClass}>
                {complaint.acknowledged_at
                  ? new Date(complaint.acknowledged_at).toLocaleDateString('en-GB')
                  : 'Not yet'}
              </p>
            </div>
          </div>
          {complaint.fos_reference && (
            <div>
              <p className={labelClass}>FOS Reference</p>
              <p className={`${valueClass} font-mono`}>{complaint.fos_reference}</p>
            </div>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          {/* Status Update */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h2 className="text-[15px] font-semibold text-foreground">Update Status</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
              className={inputClass}
              disabled={isClosed}
            >
              <option value="received">Received</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="response_issued">Response Issued</option>
              <option value="resolved">Resolved</option>
              <option value="escalated_fos">Escalated to FOS</option>
              <option value="closed">Closed</option>
            </select>
            <button onClick={handleStatusUpdate} disabled={saving || status === complaint.status} className={btnPrimary}>
              {saving ? 'Updating...' : 'Update Status'}
            </button>
          </div>

          {/* Response */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h2 className="text-[15px] font-semibold text-foreground">Issue Response</h2>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Final response to the customer..."
              rows={4}
              className={inputClass}
              disabled={isClosed}
            />
            <input
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Root cause (internal)"
              className={inputClass}
              disabled={isClosed}
            />
            <input
              value={remediation}
              onChange={(e) => setRemediation(e.target.value)}
              placeholder="Remediation steps"
              className={inputClass}
              disabled={isClosed}
            />
            <div>
              <label className={labelClass}>Compensation (£)</label>
              <input
                type="number"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                min="0"
                step="0.01"
                className={`${inputClass} mt-1`}
                disabled={isClosed}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleRespond} disabled={saving || !response.trim() || isClosed} className={btnPrimary}>
                {saving ? 'Saving...' : 'Save Response'}
              </button>
              <button onClick={() => router.push('/admin/complaints')} className={btnSecondary}>
                Back to List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Response */}
      {complaint.response && (
        <div className="rounded-lg border border-border bg-card p-5 space-y-3">
          <h2 className="text-[15px] font-semibold text-foreground">Response Issued</h2>
          <p className="text-[13px] text-foreground whitespace-pre-wrap">{complaint.response}</p>
          {complaint.root_cause && (
            <div>
              <p className={labelClass}>Root Cause</p>
              <p className={valueClass}>{complaint.root_cause}</p>
            </div>
          )}
          {complaint.remediation && (
            <div>
              <p className={labelClass}>Remediation</p>
              <p className={valueClass}>{complaint.remediation}</p>
            </div>
          )}
          {Number(complaint.compensation_amount) > 0 && (
            <div>
              <p className={labelClass}>Compensation</p>
              <p className={valueClass}>£{Number(complaint.compensation_amount).toFixed(2)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
