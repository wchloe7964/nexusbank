'use client'

import { useState, useTransition } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Fingerprint,
  Loader2,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import type { KycVerification, KycDocument } from '@/lib/types/kyc'
import { updateKycStatus, reviewKycDocument } from './actions'

interface KycReviewDialogProps {
  kyc: KycVerification & { documents?: KycDocument[] }
  open: boolean
  onClose: () => void
}

const DOC_TYPE_LABELS: Record<string, string> = {
  passport: 'Passport',
  driving_licence: 'Driving Licence',
  national_id: 'National ID Card',
  utility_bill: 'Utility Bill',
  bank_statement: 'Bank Statement',
  council_tax: 'Council Tax Bill',
  tax_return: 'Tax Return',
}

const DOC_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  uploaded: { label: 'Submitted', variant: 'default' },
  reviewing: { label: 'Reviewing', variant: 'warning' },
  accepted: { label: 'Accepted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' },
}

const KYC_STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pending: { label: 'Pending', variant: 'warning' },
  documents_required: { label: 'Docs Required', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'default' },
  verified: { label: 'Verified', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  expired: { label: 'Expired', variant: 'secondary' },
}

export function KycReviewDialog({ kyc, open, onClose }: KycReviewDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState(kyc.notes ?? '')
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const documents = kyc.documents ?? []
  const statusConfig = KYC_STATUS_CONFIG[kyc.status] ?? KYC_STATUS_CONFIG.pending

  const canApprove = kyc.status !== 'verified'
  const canReject = kyc.status !== 'failed' && kyc.status !== 'verified'

  function handleApproveApplication() {
    setActionInProgress('approve')
    startTransition(async () => {
      try {
        await updateKycStatus(kyc.id, 'verified', notes || undefined)
        onClose()
      } catch {
        setActionInProgress(null)
      }
    })
  }

  function handleRejectApplication() {
    setActionInProgress('reject')
    startTransition(async () => {
      try {
        await updateKycStatus(kyc.id, 'failed', notes || 'Application rejected by admin')
        onClose()
      } catch {
        setActionInProgress(null)
      }
    })
  }

  function handleRequestDocs() {
    setActionInProgress('request_docs')
    startTransition(async () => {
      try {
        await updateKycStatus(kyc.id, 'documents_required', notes || 'Additional documents required')
        onClose()
      } catch {
        setActionInProgress(null)
      }
    })
  }

  function handleAcceptDocument(docId: string) {
    setActionInProgress(`doc-accept-${docId}`)
    startTransition(async () => {
      try {
        await reviewKycDocument(docId, 'accepted')
        setActionInProgress(null)
      } catch {
        setActionInProgress(null)
      }
    })
  }

  function handleRejectDocument(docId: string) {
    setActionInProgress(`doc-reject-${docId}`)
    startTransition(async () => {
      try {
        await reviewKycDocument(docId, 'rejected', rejectionReason || 'Document rejected')
        setRejectingDocId(null)
        setRejectionReason('')
        setActionInProgress(null)
      } catch {
        setActionInProgress(null)
      }
    })
  }

  return (
    <Dialog open={open} onClose={onClose} title="Review KYC Application">
      <div className="space-y-5 max-h-[70vh] overflow-y-auto -mx-6 px-6">
        {/* ── Customer & Status ────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold">{kyc.profile?.full_name ?? 'Unknown'}</p>
              <p className="text-[11px] text-muted-foreground">{kyc.profile?.email}</p>
            </div>
          </div>
          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
        </div>

        {/* ── Application Details ─────────────────────────── */}
        <div className="rounded-lg border border-border/60 p-4 space-y-2.5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Application Details</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Level</span>
              <p className="font-medium capitalize">{kyc.verification_level}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Risk Rating</span>
              <p className="font-medium capitalize">{kyc.risk_rating.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Identity</span>
              <p className={`font-medium flex items-center gap-1 ${kyc.identity_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                {kyc.identity_verified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {kyc.identity_verified ? 'Verified' : 'Pending'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Address</span>
              <p className={`font-medium flex items-center gap-1 ${kyc.address_verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                {kyc.address_verified ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                {kyc.address_verified ? 'Verified' : 'Pending'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">PEP Status</span>
              <p className="font-medium">{kyc.pep_status ? <Badge variant="destructive">Yes</Badge> : 'No'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Submitted</span>
              <p className="font-medium">
                {new Date(kyc.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          {kyc.notes && (
            <div className="pt-2 border-t border-border/40">
              <span className="text-muted-foreground text-xs">Notes</span>
              <p className="text-sm mt-0.5">{kyc.notes}</p>
            </div>
          )}
        </div>

        {/* ── Documents ──────────────────────────────────── */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Submitted Documents ({documents.length})
          </h4>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => {
                const docStatusConfig = DOC_STATUS_CONFIG[doc.status] ?? DOC_STATUS_CONFIG.uploaded
                const isRejecting = rejectingDocId === doc.id
                return (
                  <div key={doc.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        {doc.document_category === 'identity'
                          ? <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                          : <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}</p>
                          <Badge variant={docStatusConfig.variant} className="text-[10px]">{docStatusConfig.label}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 capitalize">{doc.document_category} document</p>
                        {doc.file_name && (
                          <p className="text-[11px] text-muted-foreground font-mono">{doc.file_name}</p>
                        )}
                        {doc.rejection_reason && (
                          <p className="text-[11px] text-red-600 mt-1">Reason: {doc.rejection_reason}</p>
                        )}
                        {doc.expires_at && (
                          <p className="text-[11px] text-muted-foreground">
                            Expires: {new Date(doc.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Document actions */}
                    {doc.status !== 'accepted' && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/30">
                        {isRejecting ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Rejection reason..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full rounded-md border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleRejectDocument(doc.id)}
                                disabled={isPending}
                                className="text-xs h-7"
                              >
                                {actionInProgress === `doc-reject-${doc.id}` ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : null}
                                Confirm Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setRejectingDocId(null); setRejectionReason('') }}
                                className="text-xs h-7"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAcceptDocument(doc.id)}
                              disabled={isPending}
                              className="text-xs h-7 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              {actionInProgress === `doc-accept-${doc.id}` ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectingDocId(doc.id)}
                              disabled={isPending}
                              className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-center">
              <p className="text-sm text-muted-foreground">No documents submitted yet</p>
            </div>
          )}
        </div>

        {/* ── Admin Notes ────────────────────────────────── */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Admin Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this application..."
            rows={3}
            className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none resize-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"
          />
        </div>
      </div>

      {/* ── Application Actions ─────────────────────────── */}
      <div className="mt-5 pt-4 border-t border-border/40 flex flex-wrap items-center gap-2">
        {canApprove && (
          <Button
            onClick={handleApproveApplication}
            disabled={isPending}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          >
            {actionInProgress === 'approve' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="h-3.5 w-3.5" />
            )}
            Approve
          </Button>
        )}
        {canReject && (
          <Button
            variant="destructive"
            onClick={handleRejectApplication}
            disabled={isPending}
            className="gap-1.5"
          >
            {actionInProgress === 'reject' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            Reject
          </Button>
        )}
        {kyc.status === 'pending' && (
          <Button
            variant="outline"
            onClick={handleRequestDocs}
            disabled={isPending}
            className="gap-1.5"
          >
            {actionInProgress === 'request_docs' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            Request Docs
          </Button>
        )}
        <div className="flex-1" />
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          Close
        </Button>
      </div>
    </Dialog>
  )
}
