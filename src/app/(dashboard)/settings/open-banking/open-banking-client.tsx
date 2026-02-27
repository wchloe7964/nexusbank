'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Shield, ExternalLink, AlertTriangle, CheckCircle,
  Clock, XCircle, Info, Link2Off,
} from 'lucide-react'
import { revokeConsent } from './actions'
import type { OpenBankingConsent } from '@/lib/types'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  awaiting_authorisation: { label: 'Pending', color: 'text-amber-600 bg-amber-50', icon: Clock },
  authorised: { label: 'Active', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'text-red-600 bg-red-50', icon: XCircle },
  revoked: { label: 'Revoked', color: 'text-muted-foreground bg-muted', icon: Link2Off },
  expired: { label: 'Expired', color: 'text-orange-600 bg-orange-50', icon: Clock },
}

const CONSENT_TYPE_LABELS: Record<string, string> = {
  account_access: 'Account access (AISP)',
  payment_initiation: 'Payment initiation (PISP)',
  funds_confirmation: 'Funds confirmation (CBPII)',
}

const PERMISSION_LABELS: Record<string, string> = {
  ReadAccountsBasic: 'Basic account info',
  ReadAccountsDetail: 'Detailed account info',
  ReadBalances: 'Account balances',
  ReadTransactionsBasic: 'Basic transactions',
  ReadTransactionsDetail: 'Detailed transactions',
  ReadDirectDebits: 'Direct debits',
  ReadStandingOrders: 'Standing orders',
  ReadProducts: 'Product details',
  ReadBeneficiaries: 'Payee list',
}

interface Props {
  consents: OpenBankingConsent[]
}

export function OpenBankingClient({ consents: initialConsents }: Props) {
  const router = useRouter()
  const [consents] = useState(initialConsents)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRevoke = useCallback(async (consentId: string) => {
    setRevoking(consentId)
    setError(null)
    const result = await revokeConsent(consentId)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
    setRevoking(null)
  }, [router])

  const activeConsents = consents.filter(c => c.status === 'authorised')
  const otherConsents = consents.filter(c => c.status !== 'authorised')

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Open Banking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage third-party apps connected to your account via Open Banking
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <p className="font-medium">What is Open Banking?</p>
          <p>
            Open Banking lets you securely share your account data with authorised
            third-party apps (like budgeting tools or payment services). You can
            revoke access at any time.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Active consents */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          Active connections ({activeConsents.length})
        </h2>

        {activeConsents.length === 0 ? (
          <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm p-8 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No active connections</p>
            <p className="text-xs text-muted-foreground mt-1">
              When you connect a third-party app, it will appear here.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden divide-y divide-border/40">
            {activeConsents.map((consent) => (
              <ConsentCard
                key={consent.id}
                consent={consent}
                expanded={expandedId === consent.id}
                onToggle={() => setExpandedId(expandedId === consent.id ? null : consent.id)}
                onRevoke={() => handleRevoke(consent.id)}
                revoking={revoking === consent.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Historical consents */}
      {otherConsents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Previous connections ({otherConsents.length})
          </h2>
          <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden divide-y divide-border/40 opacity-70">
            {otherConsents.map((consent) => {
              const status = STATUS_CONFIG[consent.status] || STATUS_CONFIG.expired
              const providerName = consent.provider?.name || 'Unknown provider'
              return (
                <div key={consent.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{providerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {CONSENT_TYPE_LABELS[consent.consent_type] || consent.consent_type}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${status.color}`}>
                    <status.icon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ConsentCard({
  consent,
  expanded,
  onToggle,
  onRevoke,
  revoking,
}: {
  consent: OpenBankingConsent
  expanded: boolean
  onToggle: () => void
  onRevoke: () => void
  revoking: boolean
}) {
  const providerName = consent.provider?.name || 'Unknown provider'
  const providerWebsite = consent.provider?.website
  const fcaRef = consent.provider?.fca_reference

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-accent/50 transition-colors flex items-center gap-4"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 shrink-0">
          <Shield className="h-5 w-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold truncate">{providerName}</span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium text-green-600 bg-green-50">
              <CheckCircle className="h-3 w-3" /> Active
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {CONSENT_TYPE_LABELS[consent.consent_type] || consent.consent_type}
            {consent.authorised_at && (
              <> &middot; Since {new Date(consent.authorised_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
            )}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* Permissions */}
          {consent.permissions && consent.permissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {consent.permissions.map(p => (
                  <span key={p} className="text-[11px] px-2 py-1 rounded-md bg-accent text-foreground">
                    {PERMISSION_LABELS[p] || p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="space-y-1.5 text-xs">
            {consent.expires_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span>{new Date(consent.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}
            {consent.last_accessed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last accessed</span>
                <span>{new Date(consent.last_accessed_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {fcaRef && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">FCA reference</span>
                <span className="font-mono">{fcaRef}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {providerWebsite && (
              <a href={providerWebsite} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" /> Visit site
                </Button>
              </a>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={onRevoke}
              loading={revoking}
            >
              <Link2Off className="h-3.5 w-3.5" /> Revoke access
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
