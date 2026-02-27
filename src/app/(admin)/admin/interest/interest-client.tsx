'use client'

import { Badge } from '@/components/ui/badge'
import { Percent } from 'lucide-react'
import type { InterestConfig } from '@/lib/types/limits'

interface InterestClientProps {
  configs: InterestConfig[]
}

export function InterestClient({ configs }: InterestClientProps) {
  const savingsConfigs = configs.filter((c) => !c.account_type.includes('loan') && !c.account_type.includes('mortgage'))
  const loanConfigs = configs.filter((c) => c.account_type.includes('loan') || c.account_type.includes('mortgage'))

  return (
    <div className="space-y-6">
      {/* Savings / Current Rates */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Percent className="h-4 w-4 text-[#00AEEF]" />
          <h2 className="text-[14px] font-semibold text-foreground">Deposit Rates (AER)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Account Type</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Rate</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Effective From</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {savingsConfigs.map((config) => (
                <tr key={config.id} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground capitalize">{config.account_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5 font-mono text-[#00AEEF] font-medium">
                    {(Number(config.annual_rate) * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(config.effective_from).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={config.is_active ? 'success' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{config.description || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Rates */}
      {loanConfigs.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
            <Percent className="h-4 w-4 text-orange-500" />
            <h2 className="text-[14px] font-semibold text-foreground">Lending Rates (APR)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Product</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Rate</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Effective From</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {loanConfigs.map((config) => (
                  <tr key={config.id} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground capitalize">{config.account_type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 font-mono text-orange-500 font-medium">
                      {(Number(config.annual_rate) * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {new Date(config.effective_from).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge variant={config.is_active ? 'success' : 'secondary'}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{config.description || '\u2014'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
