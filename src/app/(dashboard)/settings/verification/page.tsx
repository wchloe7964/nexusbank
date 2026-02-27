import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import {
  ShieldCheck,
  Clock,
  XCircle,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  ChevronRight,
  FileText,
  Fingerprint,
} from 'lucide-react'
import { getProfile } from '@/lib/queries/profile'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { KycWizard } from './kyc-wizard'

const STATUS_CONFIG: Record<
  string,
  { icon: typeof ShieldCheck; title: string; description: string; color: string; bg: string; border: string }
> = {
  verified: {
    icon: ShieldCheck,
    title: 'Identity Verified',
    description: 'Your identity has been verified and all features are unlocked.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/40',
  },
  not_started: {
    icon: AlertTriangle,
    title: 'Verification Required',
    description: 'Complete identity verification to unlock transfers, payments and all banking features. It only takes a few minutes.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900/40',
  },
  pending: {
    icon: Clock,
    title: 'Under Review',
    description: 'Your application has been submitted and is being reviewed. This usually takes up to 24 hours.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    border: 'border-blue-200 dark:border-blue-900/40',
  },
  failed: {
    icon: XCircle,
    title: 'Verification Unsuccessful',
    description: 'Your identity verification was unsuccessful. You can resubmit your application below or contact support for help.',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-900/40',
  },
  expired: {
    icon: AlertTriangle,
    title: 'Verification Expired',
    description: 'Your identity verification has expired. Please resubmit your details below to regain full access.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-900/40',
  },
}

export default async function VerificationPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const kycStatus = profile.kyc_status ?? 'not_started'
  const config = STATUS_CONFIG[kycStatus] || STATUS_CONFIG.not_started
  const StatusIcon = config.icon
  const isVerified = kycStatus === 'verified'
  const isPending = kycStatus === 'pending'
  const needsAction = ['not_started', 'failed', 'expired'].includes(kycStatus)

  // Fetch KYC verification record and documents if exists
  const supabase = await createClient()
  const { data: kycRecord } = await supabase
    .from('kyc_verifications')
    .select('id, verification_level, status, identity_verified, address_verified, next_review_date, notes, created_at, updated_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Fetch documents for the latest KYC record
  let documents: Array<{ document_type: string; document_category: string; status: string; rejection_reason: string | null; created_at: string }> = []
  if (kycRecord) {
    const { data: docs } = await supabase
      .from('kyc_documents')
      .select('document_type, document_category, status, rejection_reason, created_at')
      .eq('kyc_id', kycRecord.id)
      .order('document_category')

    documents = docs ?? []
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

  const DOC_STATUS_COLORS: Record<string, { text: string; bg: string; label: string }> = {
    uploaded: { text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/20', label: 'Submitted' },
    reviewing: { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/20', label: 'Reviewing' },
    accepted: { text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/20', label: 'Accepted' },
    rejected: { text: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-950/20', label: 'Rejected' },
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 lg:space-y-8">
      <PageHeader
        title="Identity Verification"
        description="Verify your identity online to unlock all banking features"
      />

      {/* ── Status Card ───────────────────────────────────────── */}
      <Card variant="raised" className={`border ${config.border}`}>
        <CardContent className="p-5 lg:p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 rounded-xl p-3 ${config.bg}`}>
              <StatusIcon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h2 className={`text-base font-bold ${config.color}`}>{config.title}</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{config.description}</p>

              {isVerified && profile.kyc_verified_at && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Verified on {new Date(profile.kyc_verified_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  {profile.kyc_next_review && (
                    <p className="text-xs text-muted-foreground">
                      Next review: {new Date(profile.kyc_next_review).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

              {isPending && kycRecord?.created_at && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Submitted on {new Date(kycRecord.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Application Tracker (pending / verified) ──────────── */}
      {(isPending || isVerified) && kycRecord && (
        <div>
          <h3 className="text-sm font-semibold mb-3 px-1">Verification Progress</h3>
          <Card variant="raised">
            <CardContent className="p-5">
              <div className="space-y-4">
                {/* Step 1: Application */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="w-px h-5 bg-emerald-200 dark:bg-emerald-900/40 mt-1" />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium">Application submitted</p>
                    <p className="text-xs text-muted-foreground">Your details and documents have been received</p>
                  </div>
                </div>

                {/* Step 2: Identity Check */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      kycRecord.identity_verified
                        ? 'bg-emerald-100 dark:bg-emerald-950/30'
                        : isPending
                          ? 'bg-blue-100 dark:bg-blue-950/30'
                          : 'bg-muted'
                    }`}>
                      {kycRecord.identity_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : isPending ? (
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`w-px h-5 mt-1 ${
                      kycRecord.identity_verified ? 'bg-emerald-200 dark:bg-emerald-900/40' : 'bg-border'
                    }`} />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium">Identity check</p>
                    <p className="text-xs text-muted-foreground">
                      {kycRecord.identity_verified ? 'Your photo ID has been verified' : 'Reviewing your photo ID document'}
                    </p>
                  </div>
                </div>

                {/* Step 3: Address Check */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      kycRecord.address_verified
                        ? 'bg-emerald-100 dark:bg-emerald-950/30'
                        : isPending && kycRecord.identity_verified
                          ? 'bg-blue-100 dark:bg-blue-950/30'
                          : 'bg-muted'
                    }`}>
                      {kycRecord.address_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : isPending && kycRecord.identity_verified ? (
                        <Clock className="h-3.5 w-3.5 text-blue-600" />
                      ) : (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className={`w-px h-5 mt-1 ${
                      kycRecord.address_verified ? 'bg-emerald-200 dark:bg-emerald-900/40' : 'bg-border'
                    }`} />
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium">Address check</p>
                    <p className="text-xs text-muted-foreground">
                      {kycRecord.address_verified ? 'Your address has been confirmed' : 'Verifying your proof of address'}
                    </p>
                  </div>
                </div>

                {/* Step 4: Complete */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      isVerified ? 'bg-emerald-100 dark:bg-emerald-950/30' : 'bg-muted'
                    }`}>
                      {isVerified ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="pt-0.5">
                    <p className="text-sm font-medium">
                      {isVerified ? 'Verification complete' : 'Account fully verified'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isVerified ? 'All banking features are unlocked' : 'All features will be unlocked'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Document Status (for pending/verified) ────────────── */}
      {documents.length > 0 && (isPending || isVerified) && (
        <div>
          <h3 className="text-sm font-semibold mb-3 px-1">Submitted Documents</h3>
          <Card variant="raised">
            <CardContent className="p-0 divide-y divide-border/40">
              {documents.map((doc) => {
                const statusStyle = DOC_STATUS_COLORS[doc.status] ?? DOC_STATUS_COLORS.uploaded
                return (
                  <div key={doc.document_type} className="flex items-center gap-4 px-5 py-4">
                    <div className="shrink-0 rounded-xl bg-muted p-2.5">
                      {doc.document_category === 'identity' ? (
                        <Fingerprint className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{DOC_TYPE_LABELS[doc.document_type] ?? doc.document_type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{doc.document_category} document</p>
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">{doc.rejection_reason}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                      {statusStyle.label}
                    </span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Online KYC Wizard (for users who need to submit) ──── */}
      {needsAction && (
        <div>
          <h3 className="text-sm font-semibold mb-3 px-1">Verify Online</h3>
          <KycWizard userName={profile.full_name ?? ''} />
        </div>
      )}

      {/* ── Contact support ───────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-semibold mb-3 px-1">Need help?</h3>
        <div className="space-y-2">
          <Link href="/messages">
            <Card variant="raised" interactive>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="shrink-0 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-2.5">
                  <Mail className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Send us a message</p>
                  <p className="text-xs text-muted-foreground mt-0.5">We respond within 24 hours</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </CardContent>
            </Card>
          </Link>
          <Link href="/support">
            <Card variant="raised" interactive>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="shrink-0 rounded-xl bg-blue-50 dark:bg-blue-950/30 p-2.5">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Call us</p>
                  <p className="text-xs text-muted-foreground mt-0.5">0800 123 4567 &middot; Mon-Fri 8am-8pm</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
