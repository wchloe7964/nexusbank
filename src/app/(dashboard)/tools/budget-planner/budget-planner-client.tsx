'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatGBP } from '@/lib/utils/currency'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const defaultCategories = [
  { name: 'Housing', amount: 1200, color: '#3b82f6' },
  { name: 'Bills & Utilities', amount: 250, color: '#f59e0b' },
  { name: 'Groceries', amount: 400, color: '#10b981' },
  { name: 'Transport', amount: 150, color: '#06b6d4' },
  { name: 'Entertainment', amount: 100, color: '#ec4899' },
  { name: 'Dining Out', amount: 120, color: '#f97316' },
  { name: 'Shopping', amount: 200, color: '#8b5cf6' },
  { name: 'Savings', amount: 300, color: '#14b8a6' },
  { name: 'Other', amount: 100, color: '#6b7280' },
]

export function BudgetPlannerClient() {
  const [income, setIncome] = useState(3500)
  const [categories, setCategories] = useState(defaultCategories)

  const results = useMemo(() => {
    const totalExpenses = categories.reduce((sum, c) => sum + c.amount, 0)
    const surplus = income - totalExpenses
    const savingsRate = income > 0 ? (Math.max(0, surplus) / income) * 100 : 0
    const pieData = categories
      .filter((c) => c.amount > 0)
      .map((c) => ({ name: c.name, value: c.amount, color: c.color }))

    return { totalExpenses, surplus, savingsRate, pieData }
  }, [income, categories])

  function updateCategory(index: number, amount: number) {
    setCategories((prev) =>
      prev.map((c, i) => (i === index ? { ...c, amount: Math.max(0, amount) } : c))
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Monthly Income</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={income}
                  onChange={(e) => setIncome(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="border-t pt-3 space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Expenses</p>
              {categories.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs flex-1 min-w-0 truncate">{cat.name}</span>
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">£</span>
                    <input
                      type="number"
                      className="w-full rounded border border-input bg-background pl-5 pr-1 py-1 text-xs text-right"
                      value={cat.amount}
                      onChange={(e) => updateCategory(i, Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Income</p>
                <p className="text-lg font-bold text-success mt-1">{formatGBP(income)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Expenses</p>
                <p className="text-lg font-bold mt-1">{formatGBP(results.totalExpenses)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">{results.surplus >= 0 ? 'Surplus' : 'Deficit'}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {results.surplus >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <p className={`text-lg font-bold ${results.surplus >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatGBP(Math.abs(results.surplus))}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Savings Rate</p>
                <p className={`text-lg font-bold mt-1 ${results.savingsRate >= 20 ? 'text-success' : results.savingsRate >= 10 ? 'text-amber-600' : 'text-destructive'}`}>
                  {results.savingsRate.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {results.pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Spending Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={results.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={100}
                        dataKey="value"
                        stroke="none"
                      >
                        {results.pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Tooltip formatter={(value: any) => formatGBP(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 min-w-[130px]">
                    {results.pieData.map((entry) => {
                      const pct = results.totalExpenses > 0 ? (entry.value / results.totalExpenses) * 100 : 0
                      return (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground flex-1 truncate">{entry.name}</span>
                          <span className="font-medium tabular-nums">{pct.toFixed(0)}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
