'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatGBP } from '@/lib/utils/currency'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function SavingsCalculatorClient() {
  const [initialDeposit, setInitialDeposit] = useState(5000)
  const [monthlyContribution, setMonthlyContribution] = useState(200)
  const [rate, setRate] = useState(4.5)
  const [years, setYears] = useState(10)

  const results = useMemo(() => {
    const monthlyRate = rate / 100 / 12
    let balance = initialDeposit
    let totalContributions = initialDeposit
    const chartData = [{ year: 'Now', balance: Math.round(balance), contributions: Math.round(totalContributions) }]

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution
        totalContributions += monthlyContribution
      }
      chartData.push({
        year: `Year ${y}`,
        balance: Math.round(balance),
        contributions: Math.round(totalContributions),
      })
    }

    const totalInterest = balance - totalContributions
    return { finalBalance: balance, totalContributions, totalInterest, chartData }
  }, [initialDeposit, monthlyContribution, rate, years])

  return (
    <div className="space-y-6">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Savings Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Initial Deposit</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Monthly Contribution</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Annual Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="15"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={rate}
                onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Time Period (years)</label>
              <input
                type="number"
                min="1"
                max="50"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={years}
                onChange={(e) => setYears(Math.max(1, Math.min(50, Number(e.target.value))))}
              />
              <input
                type="range"
                min="1"
                max="50"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Final Balance</p>
                <p className="text-xl font-bold text-success mt-1">{formatGBP(results.finalBalance)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Contributions</p>
                <p className="text-xl font-bold text-primary mt-1">{formatGBP(results.totalContributions)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Interest Earned</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">{formatGBP(results.totalInterest)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={results.chartData}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorContrib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `£${(v / 1000).toFixed(0)}k`} />
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Tooltip formatter={(value: any, name: any) => [formatGBP(value), name === 'balance' ? 'Total Balance' : 'Contributions']} />
                  <Area type="monotone" dataKey="contributions" stroke="#3b82f6" fill="url(#colorContrib)" strokeWidth={2} />
                  <Area type="monotone" dataKey="balance" stroke="#10b981" fill="url(#colorBalance)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
