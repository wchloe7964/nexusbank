'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { MessageSquare, Plus } from 'lucide-react'
import type { Complaint, ComplaintCategory } from '@/lib/types/regulatory'
import { getCategoryLabel, getStatusLabel, getDeadlineUrgency } from '@/lib/regulatory/complaints'
import { submitComplaint } from './actions'

interface Props {
  complaints: Complaint[]
}

export function CustomerComplaintsClient({ complaints }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState<ComplaintCategory>('service_quality')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await submitComplaint({ category, subject, description })
      setShowForm(false)
      setSubject('')
      setDescription('')
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full rounded-md border border-border/60 bg-background px-3 py-2 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"
  const btnPrimary = "rounded-md bg-[#00AEEF] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#009BD6] disabled:opacity-50 transition-colors"
  const btnSecondary = "rounded-md border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-muted/50 transition-colors"

  return (
    <div className="space-y-4">
      {/* Submit button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)} className={btnPrimary}>
          <span className="flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Submit a Complaint
          </span>
        </button>
      )}

      {/* Submit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 space-y-4">
          <h2 className="text-[15px] font-semibold text-foreground">Submit a Complaint</h2>
          <p className="text-[12px] text-muted-foreground">
            We take all complaints seriously and aim to resolve them within 8 weeks per FCA requirements.
            If we are unable to resolve your complaint within this time, you have the right to refer it to the
            Financial Ombudsman Service (FOS).
          </p>

          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as ComplaintCategory)} className={inputClass}>
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
          </div>

          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your complaint"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your complaint in detail, including dates and any relevant reference numbers..."
              required
              rows={5}
              className={inputClass}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={submitting || !subject.trim() || !description.trim()} className={btnPrimary}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Complaints List */}
      {complaints.length === 0 && !showForm ? (
        <EmptyState
          icon={MessageSquare}
          title="No complaints"
          description="You haven't submitted any complaints. If you're unhappy with our service, we want to hear about it."
        />
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const urgency = getDeadlineUrgency(c.deadline_at, c.status)
            return (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[13px] font-medium text-foreground">{c.subject}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">{c.reference}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <Badge variant={urgency.variant}>{urgency.label}</Badge>
                    <Badge variant="secondary">{getStatusLabel(c.status)}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{getCategoryLabel(c.category)}</span>
                  <span>\u00b7</span>
                  <span>Submitted {new Date(c.created_at).toLocaleDateString('en-GB')}</span>
                  {c.resolved_at && (
                    <>
                      <span>\u00b7</span>
                      <span>Resolved {new Date(c.resolved_at).toLocaleDateString('en-GB')}</span>
                    </>
                  )}
                </div>
                {c.response && (
                  <div className="mt-2 rounded-md bg-muted/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Our Response</p>
                    <p className="text-[12px] text-foreground whitespace-pre-wrap">{c.response}</p>
                  </div>
                )}
                {c.status === 'escalated_fos' && c.fos_reference && (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    FOS Reference: <span className="font-mono">{c.fos_reference}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
