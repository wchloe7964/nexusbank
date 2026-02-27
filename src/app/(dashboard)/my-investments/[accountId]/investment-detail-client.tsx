'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { investmentAccountTypeConfigs, assetTypeColors, assetTypeLabels } from '@/lib/constants/investments'
import { ArrowLeft, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import type { InvestmentAccount } from '@/lib/types'

interface Props {
  account: InvestmentAccount
}

export function InvestmentDetailClient({ account }: Props) {
  const [sortField, setSortField] = useState<'current_value' | 'gain_loss_pct' | 'allocation_pct'>('current_value')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const typeCfg = investmentAccountTypeConfigs[account.account_type as keyof typeof investmentAccountTypeConfigs]
  const TypeIcon = typeCfg?.icon ?? TrendingUp
  const gainLoss = Number(account.total_gain_loss)
  const gainLossPct = Number(account.total_invested) > 0
    ? (gainLoss / Number(account.total_invested)) * 100
    : 0
  const isPositive = gainLoss >= 0
  const holdings = account.holdings ?? []

  // Allocation pie data
  const allocationByType = useMemo(() => {
    const map: Record<string, number> = {}
    for (const h of holdings) {
      map[h.asset_type] = (map[h.asset_type] ?? 0) + Number(h.current_value)
    }
    return Object.entries(map).map(([type, value]) => ({
      name: assetTypeLabels[type] ?? type,
      value: Math.round(value * 100) / 100,
      color: assetTypeColors[type] ?? '#6b7280',
    }))
  }, [holdings])

  // Simulated performance data (12 months)
  const performanceData = useMemo(() => {
    const months = 12
    const invested = Number(account.total_invested)
    const current = Number(account.total_value)
    const data = []
    for (let i = 0; i <= months; i++) {
      const progress = i / months
      // Simulate non-linear growth
      const noise = 1 + (Math.sin(i * 1.2) * 0.02)
      const val = invested + (current - invested) * progress * noise
      const date = new Date()
      date.setMonth(date.getMonth() - (months - i))
      data.push({
        month: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        value: Math.round(val * 100) / 100,
      })
    }
    return data
  }, [account])

  // Sorted holdings
  const sortedHoldings = useMemo(() => {
    return [...holdings].sort((a, b) => {
      const aVal = Number(a[sortField])
      const bVal = Number(b[sortField])
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })
  }, [holdings, sortField, sortDir])

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/my-investments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Investments
      </Link>

      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`rounded-xl p-3 ${typeCfg?.bg ?? 'bg-gray-50'}`}>
              <TypeIcon className={`h-5 w-5 ${typeCfg?.color ?? 'text-gray-500'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{account.account_name}</h2>
              <p className="text-sm text-muted-foreground">{typeCfg?.label ?? account.account_type}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatGBP(Number(account.total_value))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Invested</p>
              <p className="text-2xl font-bold">{formatGBP(Number(account.total_invested))}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Gain/Loss</p>
              <div className="flex items-center gap-2">
                {isPositive ? (
                  <ArrowUpRight className="h-4 w-4 text-success" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive" />
                )}
                <p className={`text-2xl font-bold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? '+' : ''}{formatGBP(gainLoss)}
                </p>
                <Badge variant={isPositive ? 'success' : 'destructive'}>
                  {isPositive ? '+' : ''}{gainLossPct.toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allocation Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {allocationByType.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={allocationByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationByType.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip formatter={(value: any) => formatGBP(value)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 min-w-[120px]">
                  {allocationByType.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}</span>
                      <span className="font-medium ml-auto">{formatGBP(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No holdings data</p>
            )}
          </CardContent>
        </Card>

        {/* Performance Area */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance (12 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `£${(v / 1000).toFixed(0)}k`} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Tooltip formatter={(value: any) => formatGBP(value)} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Table */}
      {holdings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Holdings ({holdings.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Asset</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Price</th>
                    <th
                      className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('current_value')}
                    >
                      Value {sortField === 'current_value' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th
                      className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('gain_loss_pct')}
                    >
                      Gain/Loss {sortField === 'gain_loss_pct' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                    <th
                      className="text-right py-3 px-4 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('allocation_pct')}
                    >
                      Alloc. {sortField === 'allocation_pct' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedHoldings.map((h) => {
                    const gl = Number(h.gain_loss)
                    const glPct = Number(h.gain_loss_pct)
                    const isPos = gl >= 0
                    return (
                      <tr key={h.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium">{h.asset_name}</p>
                          {h.ticker && <p className="text-xs text-muted-foreground">{h.ticker}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {assetTypeLabels[h.asset_type] ?? h.asset_type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{Number(h.quantity).toFixed(2)}</td>
                        <td className="py-3 px-4 text-right tabular-nums">{formatGBP(Number(h.current_price))}</td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">{formatGBP(Number(h.current_value))}</td>
                        <td className={`py-3 px-4 text-right tabular-nums ${isPos ? 'text-success' : 'text-destructive'}`}>
                          {isPos ? '+' : ''}{formatGBP(gl)} ({isPos ? '+' : ''}{glPct.toFixed(2)}%)
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums">{Number(h.allocation_pct).toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
