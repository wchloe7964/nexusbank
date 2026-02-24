'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { investmentAccountTypeConfigs } from '@/lib/constants/investments'
import { ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Link from 'next/link'
import type { InvestmentAccount } from '@/lib/types'

interface Props {
  accounts: InvestmentAccount[]
}

export function InvestmentsClient({ accounts }: Props) {
  const totalValue = accounts.reduce((sum, a) => sum + Number(a.total_value), 0)
  const totalInvested = accounts.reduce((sum, a) => sum + Number(a.total_invested), 0)
  const totalGainLoss = accounts.reduce((sum, a) => sum + Number(a.total_gain_loss), 0)
  const totalGainLossPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0
  const isPositive = totalGainLoss >= 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Portfolio Value</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatGBP(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Invested</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatGBP(totalInvested)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Gain/Loss</p>
            <div className="flex items-center gap-2 mt-1">
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
              <p className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{formatGBP(totalGainLoss)}
              </p>
              <Badge variant={isPositive ? 'success' : 'destructive'} className="text-xs">
                {isPositive ? '+' : ''}{totalGainLossPct.toFixed(2)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Cards */}
      <div className="grid gap-4">
        {accounts.map((account) => {
          const typeCfg = investmentAccountTypeConfigs[account.account_type as keyof typeof investmentAccountTypeConfigs]
          const TypeIcon = typeCfg?.icon ?? TrendingUp
          const gainLoss = Number(account.total_gain_loss)
          const gainLossPct = Number(account.total_invested) > 0
            ? (gainLoss / Number(account.total_invested)) * 100
            : 0
          const isPos = gainLoss >= 0
          const topHoldings = account.holdings?.slice(0, 3) ?? []

          return (
            <Link key={account.id} href={`/investments/${account.id}`}>
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2.5 ${typeCfg?.bg ?? 'bg-gray-50'}`}>
                        <TypeIcon className={`h-4 w-4 ${typeCfg?.color ?? 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{account.account_name}</p>
                        <p className="text-xs text-muted-foreground">{typeCfg?.label ?? account.account_type}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-semibold">{formatGBP(Number(account.total_value))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invested</p>
                      <p className="font-semibold">{formatGBP(Number(account.total_invested))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gain/Loss</p>
                      <p className={`font-semibold ${isPos ? 'text-success' : 'text-destructive'}`}>
                        {isPos ? '+' : ''}{formatGBP(gainLoss)} ({isPos ? '+' : ''}{gainLossPct.toFixed(2)}%)
                      </p>
                    </div>
                  </div>

                  {topHoldings.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Top Holdings</p>
                      <div className="flex flex-wrap gap-1.5">
                        {topHoldings.map((h) => (
                          <Badge key={h.id} variant="outline" className="text-xs">
                            {h.ticker ?? h.asset_name.slice(0, 10)}
                          </Badge>
                        ))}
                        {(account.holdings?.length ?? 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(account.holdings?.length ?? 0) - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
