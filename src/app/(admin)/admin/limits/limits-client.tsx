'use client'

import { Badge } from '@/components/ui/badge'
import { Gauge, ShieldCheck, Clock } from 'lucide-react'
import type { TransactionLimit, CoolingPeriodConfig } from '@/lib/types/limits'

interface LimitsClientProps {
  limits: TransactionLimit[]
  cooling: CoolingPeriodConfig[]
  scaConfig: { config_key: string; config_value: Record<string, unknown>; description: string | null }[]
}

function formatGBP(amount: number) {
  return `£${amount.toLocaleString()}`
}

export function LimitsClient({ limits, cooling, scaConfig }: LimitsClientProps) {
  return (
    <div className="space-y-6">
      {/* Transaction Limits */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#00AEEF]" />
          <h2 className="text-[14px] font-semibold text-foreground">Transaction Limits by KYC Level</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">KYC Level</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Single Limit</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Daily Limit</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Limit</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {limits.map((limit) => (
                <tr key={limit.id} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5">
                    <div>
                      <span className="font-medium text-foreground capitalize">{limit.kyc_level}</span>
                      {limit.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{limit.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{formatGBP(Number(limit.single_transaction_limit))}</td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{formatGBP(Number(limit.daily_limit))}</td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{formatGBP(Number(limit.monthly_limit))}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={limit.is_active ? 'success' : 'secondary'}>
                      {limit.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCA Configuration */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#00AEEF]" />
          <h2 className="text-[14px] font-semibold text-foreground">Strong Customer Authentication (SCA)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Setting</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Value</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {scaConfig.map((row) => (
                <tr key={row.config_key} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.config_key.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5 font-mono text-[#00AEEF]">
                    {JSON.stringify((row.config_value as Record<string, unknown>)?.value ?? row.config_value)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.description || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cooling Period Configuration */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#00AEEF]" />
          <h2 className="text-[14px] font-semibold text-foreground">Payee Cooling Periods</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Rail</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cooling Period</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {cooling.map((config) => (
                <tr key={config.id} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground uppercase">{config.payment_rail}</td>
                  <td className="px-4 py-2.5 font-mono text-foreground">
                    {config.cooling_hours === 0 ? 'None' : `${config.cooling_hours} hours`}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={config.is_active ? 'success' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{config.description || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
