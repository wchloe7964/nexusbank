'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { formatGBP } from '@/lib/utils/currency'
import { policyTypeConfigs, policyStatusConfigs, claimStatusConfigs } from '@/lib/constants/insurance'
import { ArrowLeft, Shield, Calendar, RefreshCw, FileText } from 'lucide-react'
import Link from 'next/link'
import type { InsurancePolicy } from '@/lib/types'
import { toggleAutoRenew } from '../actions'

interface Props {
  policy: InsurancePolicy
}

export function PolicyDetailClient({ policy: initialPolicy }: Props) {
  const [policy, setPolicy] = useState(initialPolicy)
  const [isPending, startTransition] = useTransition()

  const typeCfg = policyTypeConfigs[policy.policy_type as keyof typeof policyTypeConfigs]
  const statusCfg = policyStatusConfigs[policy.status as keyof typeof policyStatusConfigs]
  const TypeIcon = typeCfg?.icon ?? Shield
  const daysUntilRenewal = Math.ceil(
    (new Date(policy.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const claims = policy.claims ?? []

  function handleToggleAutoRenew() {
    startTransition(async () => {
      try {
        const result = await toggleAutoRenew(policy.id)
        setPolicy((prev) => ({ ...prev, auto_renew: result.newValue }))
      } catch {
        // silent
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link href="/my-insurance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Insurance
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`rounded-xl p-3 ${typeCfg?.bg ?? 'bg-gray-50'}`}>
              <TypeIcon className={`h-5 w-5 ${typeCfg?.color ?? 'text-gray-500'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{policy.policy_name}</h2>
              <p className="text-sm text-muted-foreground">{policy.provider} · {policy.policy_number}</p>
            </div>
            <Badge variant="outline" className={`ml-auto ${statusCfg?.bg ?? ''} ${statusCfg?.color ?? ''} border-0`}>
              {statusCfg?.label ?? policy.status}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${policy.auto_renew ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            <Switch
              checked={policy.auto_renew}
              onCheckedChange={handleToggleAutoRenew}
              disabled={isPending}
            />
            <span className="text-sm text-muted-foreground">{policy.auto_renew ? 'Auto-renew enabled' : 'Auto-renew disabled'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Coverage Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Premium</span>
              <span className="font-semibold">{formatGBP(Number(policy.premium_monthly))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Annual Premium</span>
              <span className="font-semibold">{formatGBP(Number(policy.premium_monthly) * 12)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Coverage Amount</span>
              <span className="font-semibold">{formatGBP(Number(policy.coverage_amount))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Excess</span>
              <span className="font-semibold">{formatGBP(Number(policy.excess_amount))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Policy Type</span>
              <span className="font-semibold">{typeCfg?.label ?? policy.policy_type}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Key Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-semibold">
                {new Date(policy.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-semibold">
                {new Date(policy.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Days Until Renewal</span>
              <span className={`font-semibold ${daysUntilRenewal < 30 ? 'text-amber-600' : 'text-success'}`}>
                {daysUntilRenewal > 0 ? `${daysUntilRenewal} days` : 'Expired'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims for this policy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-primary" />
            Claims History ({claims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claims.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No claims for this policy</p>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => {
                const cStatusCfg = claimStatusConfigs[claim.status as keyof typeof claimStatusConfigs]
                const StatusIcon = cStatusCfg?.icon
                return (
                  <div key={claim.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{claim.claim_reference}</p>
                        <Badge variant="outline" className={`${cStatusCfg?.bg ?? ''} ${cStatusCfg?.color ?? ''} border-0 text-xs`}>
                          {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                          {cStatusCfg?.label ?? claim.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {claim.claim_type} · {new Date(claim.submitted_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatGBP(Number(claim.amount_claimed))}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
