'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { transactionCategories } from '@/lib/constants/categories'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { TrendingDown, TrendingUp, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import type { Account } from '@/lib/types'

interface InsightsClientProps {
  initialCategorySpending: { category: string; total: number }[]
  initialDailySpending: { date: string; amount: number }[]
  initialMonthlyComparison: {
    currentMonth: number
    previousMonth: number
    currentMonthIncome: number
    previousMonthIncome: number
  }
  initialIncomeVsExpenses: { month: string; income: number; expenses: number }[]
  accounts: Account[]
}

const CHART_COLORS = [
  '#3b82f6', '#22c55e', '#f97316', '#10b981', '#a855f7',
  '#06b6d4', '#ec4899', '#f59e0b', '#ef4444', '#6366f1',
  '#8b5cf6', '#eab308', '#6b7280',
]

function getCategoryColor(category: string): string {
  const cats = Object.keys(transactionCategories)
  const index = cats.indexOf(category)
  return CHART_COLORS[index >= 0 ? index : CHART_COLORS.length - 1]
}

function getCategoryLabel(category: string): string {
  const cat = transactionCategories[category as keyof typeof transactionCategories]
  return cat?.label || category.charAt(0).toUpperCase() + category.slice(1)
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const d = new Date(Number(year), Number(month) - 1)
  return d.toLocaleDateString('en-GB', { month: 'short' })
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {formatGBP(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function InsightsClient({
  initialCategorySpending,
  initialDailySpending,
  initialMonthlyComparison,
  initialIncomeVsExpenses,
  accounts,
}: InsightsClientProps) {
  const [selectedAccount, setSelectedAccount] = useState('')
  const [categorySpending, setCategorySpending] = useState(initialCategorySpending)
  const [dailySpending, setDailySpending] = useState(initialDailySpending)
  const [monthlyComparison, setMonthlyComparison] = useState(initialMonthlyComparison)
  const [incomeVsExpenses, setIncomeVsExpenses] = useState(initialIncomeVsExpenses)
  const [isPending, startTransition] = useTransition()

  const totalSpent = categorySpending.reduce((s, c) => s + c.total, 0)
  const topCategory = categorySpending[0]

  const spendingChange = monthlyComparison.previousMonth > 0
    ? ((monthlyComparison.currentMonth - monthlyComparison.previousMonth) / monthlyComparison.previousMonth) * 100
    : 0

  const incomeChange = monthlyComparison.previousMonthIncome > 0
    ? ((monthlyComparison.currentMonthIncome - monthlyComparison.previousMonthIncome) / monthlyComparison.previousMonthIncome) * 100
    : 0

  const pieData = categorySpending.map((c) => ({
    name: getCategoryLabel(c.category),
    value: c.total,
    fill: getCategoryColor(c.category),
  }))

  async function handleAccountChange(accountId: string) {
    setSelectedAccount(accountId)
    startTransition(async () => {
      try {
        const params = accountId ? `?accountId=${accountId}` : ''
        const res = await fetch(`/api/insights${params}`)
        if (res.ok) {
          const data = await res.json()
          setCategorySpending(data.categorySpending)
          setDailySpending(data.dailySpending)
          setMonthlyComparison(data.monthlyComparison)
          setIncomeVsExpenses(data.incomeVsExpenses)
        }
      } catch {
        // Silently fail, keep current data
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Account Filter */}
      {accounts.length > 1 && (
        <Select
          value={selectedAccount}
          onChange={(e) => handleAccountChange(e.target.value)}
          className="max-w-xs"
        >
          <option value="">All accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_name}
            </option>
          ))}
        </Select>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Spent This Month</p>
            <p className="mt-1 text-2xl font-bold">{formatGBP(monthlyComparison.currentMonth)}</p>
            <div className="mt-2 flex items-center gap-1">
              {spendingChange > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
              ) : spendingChange < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={`text-xs font-medium ${spendingChange > 0 ? 'text-destructive' : spendingChange < 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {Math.abs(spendingChange).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Income This Month</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatGBP(monthlyComparison.currentMonthIncome)}
            </p>
            <div className="mt-2 flex items-center gap-1">
              {incomeChange > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : incomeChange < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span className={`text-xs font-medium ${incomeChange > 0 ? 'text-emerald-500' : incomeChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {Math.abs(incomeChange).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Top Category</p>
            <p className="mt-1 text-2xl font-bold">
              {topCategory ? getCategoryLabel(topCategory.category) : '—'}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {topCategory ? formatGBP(topCategory.total) : 'No spending data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total (30 days)</p>
            <p className="mt-1 text-2xl font-bold">{formatGBP(totalSpent)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Across {categorySpending.length} categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by Category - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const data = payload[0]
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="text-sm font-medium">{data.name}</p>
                            <p className="text-sm text-muted-foreground">{formatGBP(data.value as number)}</p>
                          </div>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expenses - Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeVsExpenses.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeVsExpenses.map(d => ({ ...d, monthLabel: formatMonthLabel(d.month) }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="monthLabel" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Spending Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Daily Spending (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySpending.length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySpending.map(d => ({ ...d, label: formatShortDate(d.date) }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="label"
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                    interval={Math.floor(dailySpending.length / 8)}
                  />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} tickFormatter={(v) => `£${v}`} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-sm font-medium">{formatGBP(payload[0].value as number)}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="amount" name="Spent" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown List */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categorySpending.map((cat) => {
              const catInfo = transactionCategories[cat.category as keyof typeof transactionCategories]
              const Icon = catInfo?.icon
              const percentage = totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0

              return (
                <div key={cat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {Icon && (
                        <div className={`rounded-xl p-1.5 ${catInfo.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${catInfo.color}`} />
                        </div>
                      )}
                      <span className="text-sm font-medium">{getCategoryLabel(cat.category)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-[10px]">
                        {percentage.toFixed(1)}%
                      </Badge>
                      <span className="text-sm font-semibold w-24 text-right">{formatGBP(cat.total)}</span>
                    </div>
                  </div>
                  <Progress
                    value={percentage}
                    max={100}
                    className="h-1.5"
                    indicatorClassName={getCategoryColor(cat.category) === '#3b82f6' ? 'bg-blue-500' :
                      getCategoryColor(cat.category) === '#22c55e' ? 'bg-green-500' :
                      getCategoryColor(cat.category) === '#f97316' ? 'bg-orange-500' :
                      getCategoryColor(cat.category) === '#10b981' ? 'bg-emerald-500' :
                      getCategoryColor(cat.category) === '#a855f7' ? 'bg-purple-500' :
                      getCategoryColor(cat.category) === '#06b6d4' ? 'bg-cyan-500' :
                      getCategoryColor(cat.category) === '#ec4899' ? 'bg-pink-500' :
                      getCategoryColor(cat.category) === '#f59e0b' ? 'bg-amber-500' :
                      getCategoryColor(cat.category) === '#ef4444' ? 'bg-red-500' :
                      getCategoryColor(cat.category) === '#6366f1' ? 'bg-indigo-500' :
                      getCategoryColor(cat.category) === '#8b5cf6' ? 'bg-violet-500' :
                      getCategoryColor(cat.category) === '#eab308' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
