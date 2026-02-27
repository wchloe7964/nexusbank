'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { transactionCategories } from '@/lib/constants/categories'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from 'recharts'
import { TrendingUp, Repeat, AlertTriangle, Users, Hash } from 'lucide-react'
import type { MerchantSpending, DetectedSubscription, SpendingForecast, PeerComparison } from '@/lib/types'

const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#f97316', '#10b981', '#a855f7',
  '#06b6d4', '#ec4899', '#f59e0b', '#ef4444', '#6366f1',
]

interface AnalyticsClientProps {
  merchants: MerchantSpending[]
  subscriptions: DetectedSubscription[]
  forecast: SpendingForecast[]
  categoryTrends: { month: string; [key: string]: string | number }[]
  peerComparison: PeerComparison[]
}

function getCategoryLabel(category: string): string {
  const cat = transactionCategories[category as keyof typeof transactionCategories]
  return cat?.label || category.charAt(0).toUpperCase() + category.slice(1)
}

function getCategoryColor(category: string): string {
  const cats = Object.keys(transactionCategories)
  const index = cats.indexOf(category)
  return CHART_COLORS[index >= 0 ? index : CHART_COLORS.length - 1]
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-GB', { month: 'short' })
}

const frequencyLabels: Record<string, string> = {
  monthly: 'Monthly',
  weekly: 'Weekly',
  annual: 'Annual',
}

export function AnalyticsClient({ merchants, subscriptions, forecast, categoryTrends, peerComparison }: AnalyticsClientProps) {
  const totalSubscriptionCost = subscriptions
    .filter(s => s.frequency === 'monthly')
    .reduce((sum, s) => sum + s.amount, 0) +
    subscriptions
      .filter(s => s.frequency === 'weekly')
      .reduce((sum, s) => sum + s.amount * 4.33, 0) +
    subscriptions
      .filter(s => s.frequency === 'annual')
      .reduce((sum, s) => sum + s.amount / 12, 0)

  // Prepare forecast chart data (show every 3rd date label)
  const forecastData = forecast.map((f, i) => ({
    date: i % 3 === 0 ? formatShortDate(f.date) : '',
    actual: f.actual !== null ? Number(f.actual.toFixed(2)) : undefined,
    forecast: Number(f.forecast.toFixed(2)),
    rawDate: f.date,
  }))

  // Get top categories for stacked chart
  const topCategories = categoryTrends.length > 0
    ? Object.keys(categoryTrends[0]).filter(k => k !== 'month')
    : []

  // Peer comparison chart data
  const peerData = peerComparison.slice(0, 8).map(p => ({
    category: getCategoryLabel(p.category),
    you: Number(p.userAmount.toFixed(2)),
    average: Number(p.averageAmount.toFixed(2)),
  }))

  return (
    <div className="space-y-6">
      {/* Merchant Spending Ranking */}
      {merchants.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base tracking-tight">Top Merchants</CardTitle>
              <Badge variant="default">{merchants.length} merchants</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {merchants.map((merchant, index) => {
                const cat = transactionCategories[merchant.category as keyof typeof transactionCategories]
                const Icon = cat?.icon
                return (
                  <div key={merchant.counterparty_name} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className={`rounded-xl p-2 ${cat?.bg || 'bg-gray-50 dark:bg-gray-950'}`}>
                        {Icon && <Icon className={`h-3.5 w-3.5 ${cat?.color || 'text-gray-500'}`} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{merchant.counterparty_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {merchant.count} transactions &middot; {getCategoryLabel(merchant.category)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">
                      {formatGBP(merchant.total)}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detected Subscriptions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base tracking-tight">Detected Subscriptions</CardTitle>
            {subscriptions.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Monthly cost</p>
                <p className="text-sm font-bold tabular-nums text-amber-500">{formatGBP(totalSubscriptionCost)}</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-4">
              <Repeat className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recurring payments detected yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => {
                const cat = transactionCategories[sub.category as keyof typeof transactionCategories]
                const Icon = cat?.icon || Repeat
                return (
                  <div key={sub.counterparty_name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${cat?.bg || 'bg-gray-50 dark:bg-gray-950'}`}>
                        <Icon className={`h-4 w-4 ${cat?.color || 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{sub.counterparty_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Next: {new Date(sub.nextExpectedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{formatGBP(sub.amount)}</p>
                      <Badge variant="default" className="mt-0.5">
                        {frequencyLabels[sub.frequency] || sub.frequency}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending Forecast */}
      {forecastData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base tracking-tight">Spending Forecast</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value: number) => `£${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      `£${Number(value ?? 0).toFixed(2)}`,
                      name === 'actual' ? 'Actual' : 'Forecast',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    connectNulls={false}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="#a855f7"
                    fill="#a855f7"
                    fillOpacity={0.05}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs">{value === 'actual' ? 'Actual' : 'Forecast'}</span>
                    )}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Based on 60-day spending patterns. Dashed line shows projected spending.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Category Trends */}
      {categoryTrends.length > 0 && topCategories.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base tracking-tight">Category Trends (6 months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryTrends.map(d => ({ ...d, month: formatMonth(d.month as string) }))}
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value: number) => `£${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      `£${Number(value ?? 0).toFixed(2)}`,
                      getCategoryLabel(String(name)),
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs">{getCategoryLabel(value)}</span>
                    )}
                  />
                  {topCategories.map((cat, i) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="categories"
                      fill={getCategoryColor(cat)}
                      radius={i === topCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Peer Comparison */}
      {peerData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base tracking-tight">You vs UK Average</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={peerData}
                  layout="vertical"
                  margin={{ top: 5, right: 5, bottom: 5, left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value: number) => `£${value}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={75}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [
                      `£${Number(value ?? 0).toFixed(2)}`,
                      name === 'you' ? 'You' : 'UK Average',
                    ]}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs">{value === 'you' ? 'You' : 'UK Average'}</span>
                    )}
                  />
                  <Bar dataKey="you" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                  <Bar dataKey="average" fill="#6b7280" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Based on your last month&apos;s spending compared to UK household averages.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-purple-500/20 bg-purple-500/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-purple-500/10 p-2 shrink-0">
              <AlertTriangle className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">About These Analytics</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Subscription detection uses pattern matching on your transaction history. Forecasts are based on linear regression of your 60-day spending. UK averages are indicative estimates. All data is calculated in real-time from your transaction history.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
