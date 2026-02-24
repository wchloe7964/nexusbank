'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { formatGBP } from '@/lib/utils/currency'
import { policyTypeConfigs, policyStatusConfigs, claimStatusConfigs, claimTypes } from '@/lib/constants/insurance'
import { Shield, FileText, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import type { InsurancePolicy, InsuranceClaim } from '@/lib/types'
import { submitInsuranceClaim, toggleAutoRenew } from './actions'

interface Props {
  policies: InsurancePolicy[]
  claims: InsuranceClaim[]
}

export function InsuranceClient({ policies: initialPolicies, claims: initialClaims }: Props) {
  const [policies, setPolicies] = useState(initialPolicies)
  const [claims, setClaims] = useState(initialClaims)
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<'policies' | 'claims'>('policies')

  // Claim dialog
  const [showClaimDialog, setShowClaimDialog] = useState(false)
  const [claimPolicyId, setClaimPolicyId] = useState(policies[0]?.id ?? '')
  const [claimType, setClaimType] = useState('')
  const [claimDescription, setClaimDescription] = useState('')
  const [claimAmount, setClaimAmount] = useState('')
  const [claimError, setClaimError] = useState('')

  const activePolicies = policies.filter((p) => p.status === 'active')
  const totalPremiums = activePolicies.reduce((sum, p) => sum + Number(p.premium_monthly), 0)

  function handleToggleAutoRenew(policyId: string) {
    startTransition(async () => {
      try {
        const result = await toggleAutoRenew(policyId)
        setPolicies((prev) =>
          prev.map((p) => (p.id === policyId ? { ...p, auto_renew: result.newValue } : p))
        )
      } catch {
        // silent
      }
    })
  }

  function handleSubmitClaim() {
    const amount = parseFloat(claimAmount)
    if (!claimPolicyId || !claimType || !claimDescription || isNaN(amount) || amount <= 0) {
      setClaimError('Please fill in all fields')
      return
    }
    if (claimDescription.length < 10) {
      setClaimError('Description must be at least 10 characters')
      return
    }

    startTransition(async () => {
      try {
        const result = await submitInsuranceClaim({
          policyId: claimPolicyId,
          claimType,
          description: claimDescription,
          amountClaimed: amount,
        })
        // Add to local claims
        setClaims((prev) => [{
          id: crypto.randomUUID(),
          policy_id: claimPolicyId,
          user_id: '',
          claim_reference: result.claimReference,
          claim_type: claimType,
          description: claimDescription,
          amount_claimed: amount,
          amount_approved: null,
          status: 'submitted' as const,
          submitted_at: new Date().toISOString(),
          resolved_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev])
        setShowClaimDialog(false)
        setClaimType('')
        setClaimDescription('')
        setClaimAmount('')
        setTab('claims')
      } catch (err) {
        setClaimError(err instanceof Error ? err.message : 'Failed to submit claim')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Active Policies</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{activePolicies.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Monthly Premiums</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatGBP(totalPremiums)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Open Claims</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {claims.filter((c) => ['submitted', 'under_review'].includes(c.status)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b">
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'policies' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('policies')}
        >
          <Shield className="inline mr-1.5 h-3.5 w-3.5" />
          Policies ({policies.length})
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'claims' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setTab('claims')}
        >
          <FileText className="inline mr-1.5 h-3.5 w-3.5" />
          Claims ({claims.length})
        </button>
        <div className="flex-1" />
        <Button size="sm" onClick={() => { setShowClaimDialog(true); setClaimError('') }}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Submit Claim
        </Button>
      </div>

      {/* Policies Tab */}
      {tab === 'policies' && (
        <div className="grid gap-4">
          {policies.map((policy) => {
            const typeCfg = policyTypeConfigs[policy.policy_type as keyof typeof policyTypeConfigs]
            const statusCfg = policyStatusConfigs[policy.status as keyof typeof policyStatusConfigs]
            const TypeIcon = typeCfg?.icon ?? Shield
            const daysUntilRenewal = Math.ceil(
              (new Date(policy.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )

            return (
              <Card key={policy.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2.5 ${typeCfg?.bg ?? 'bg-gray-50'}`}>
                        <TypeIcon className={`h-4 w-4 ${typeCfg?.color ?? 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{policy.policy_name}</p>
                        <p className="text-xs text-muted-foreground">{policy.provider} · {policy.policy_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`${statusCfg?.bg ?? ''} ${statusCfg?.color ?? ''} border-0`}>
                        {statusCfg?.label ?? policy.status}
                      </Badge>
                      <Link href={`/insurance/${policy.id}`}>
                        <Button variant="ghost" size="sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Premium</p>
                      <p className="font-semibold">{formatGBP(Number(policy.premium_monthly))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Coverage</p>
                      <p className="font-semibold">{formatGBP(Number(policy.coverage_amount))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Excess</p>
                      <p className="font-semibold">{formatGBP(Number(policy.excess_amount))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Renewal</p>
                      <p className={`font-semibold ${daysUntilRenewal < 30 ? 'text-amber-600' : ''}`}>
                        {daysUntilRenewal > 0 ? `${daysUntilRenewal} days` : 'Expired'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <RefreshCw className={`h-3.5 w-3.5 ${policy.auto_renew ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    <Switch
                      checked={policy.auto_renew}
                      onCheckedChange={() => handleToggleAutoRenew(policy.id)}
                      disabled={isPending}
                    />
                    <span className="text-xs text-muted-foreground">Auto-renew</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Claims Tab */}
      {tab === 'claims' && (
        <div className="grid gap-3">
          {claims.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No claims submitted yet</p>
              </CardContent>
            </Card>
          ) : (
            claims.map((claim) => {
              const statusCfg = claimStatusConfigs[claim.status as keyof typeof claimStatusConfigs]
              const StatusIcon = statusCfg?.icon
              return (
                <Card key={claim.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold">{claim.claim_reference}</p>
                          <Badge variant="outline" className={`${statusCfg?.bg ?? ''} ${statusCfg?.color ?? ''} border-0 text-xs`}>
                            {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                            {statusCfg?.label ?? claim.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {claim.claim_type} · Submitted {new Date(claim.submitted_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatGBP(Number(claim.amount_claimed))}</p>
                        {claim.amount_approved !== null && (
                          <p className="text-xs text-success">Approved: {formatGBP(Number(claim.amount_approved))}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Submit Claim Dialog */}
      <Dialog open={showClaimDialog} onClose={() => setShowClaimDialog(false)} title="Submit a Claim">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Policy</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={claimPolicyId}
              onChange={(e) => setClaimPolicyId(e.target.value)}
            >
              {activePolicies.map((p) => {
                const typeCfg = policyTypeConfigs[p.policy_type as keyof typeof policyTypeConfigs]
                return (
                  <option key={p.id} value={p.id}>
                    {p.policy_name} ({typeCfg?.label ?? p.policy_type})
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Claim Type</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={claimType}
              onChange={(e) => setClaimType(e.target.value)}
            >
              <option value="">Select type...</option>
              {claimTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
              value={claimDescription}
              onChange={(e) => setClaimDescription(e.target.value)}
              placeholder="Describe what happened..."
              maxLength={1000}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Amount Claimed</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                value={claimAmount}
                onChange={(e) => setClaimAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {claimError && <p className="text-sm text-destructive">{claimError}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowClaimDialog(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleSubmitClaim} disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
