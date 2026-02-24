'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatGBP } from '@/lib/utils/currency'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

export function MortgageCalculatorClient() {
  const [propertyPrice, setPropertyPrice] = useState(300000)
  const [deposit, setDeposit] = useState(60000)
  const [rate, setRate] = useState(4.5)
  const [termYears, setTermYears] = useState(25)

  const results = useMemo(() => {
    const loanAmount = Math.max(0, propertyPrice - deposit)
    const monthlyRate = rate / 100 / 12
    const totalMonths = termYears * 12
    const ltv = propertyPrice > 0 ? ((loanAmount / propertyPrice) * 100) : 0

    if (monthlyRate === 0 || loanAmount <= 0) {
      return {
        monthly: loanAmount / Math.max(1, totalMonths),
        totalRepayment: loanAmount,
        totalInterest: 0,
        loanAmount,
        ltv,
        pieData: [],
      }
    }

    const monthly = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    const totalRepayment = monthly * totalMonths
    const totalInterest = totalRepayment - loanAmount

    const pieData = [
      { name: 'Principal', value: Math.round(loanAmount), color: '#3b82f6' },
      { name: 'Interest', value: Math.round(totalInterest), color: '#ef4444' },
    ]

    return { monthly, totalRepayment, totalInterest, loanAmount, ltv, pieData }
  }, [propertyPrice, deposit, rate, termYears])

  return (
    <div className="space-y-6">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mortgage Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Property Price</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <input
                type="range"
                min="50000"
                max="2000000"
                step="10000"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Deposit</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={deposit}
                  onChange={(e) => setDeposit(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <input
                type="range"
                min="0"
                max={propertyPrice}
                step="5000"
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Interest Rate (%)</label>
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
              <label className="text-sm font-medium">Term (years)</label>
              <input
                type="number"
                min="5"
                max="40"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={termYears}
                onChange={(e) => setTermYears(Math.max(5, Math.min(40, Number(e.target.value))))}
              />
              <input
                type="range"
                min="5"
                max="40"
                value={termYears}
                onChange={(e) => setTermYears(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Monthly Payment</p>
                <p className="text-lg font-bold text-primary mt-1">{formatGBP(results.monthly)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Repayment</p>
                <p className="text-lg font-bold mt-1">{formatGBP(results.totalRepayment)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Interest</p>
                <p className="text-lg font-bold text-destructive mt-1">{formatGBP(results.totalInterest)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">LTV Ratio</p>
                <p className={`text-lg font-bold mt-1 ${results.ltv > 80 ? 'text-destructive' : results.ltv > 60 ? 'text-amber-600' : 'text-success'}`}>
                  {results.ltv.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
          </div>

          {results.pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Principal vs Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={results.pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
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
                  <div className="space-y-3 min-w-[140px]">
                    {results.pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <div>
                          <p className="text-xs text-muted-foreground">{entry.name}</p>
                          <p className="text-sm font-semibold">{formatGBP(entry.value)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">Mortgage Amount</p>
                      <p className="text-sm font-semibold">{formatGBP(results.loanAmount)}</p>
                    </div>
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
