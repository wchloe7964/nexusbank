'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatGBP } from '@/lib/utils/currency'
import { ArrowLeft, Banknote } from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function LoanCalculatorClient() {
  const [loanAmount, setLoanAmount] = useState(15000)
  const [rate, setRate] = useState(5.9)
  const [termYears, setTermYears] = useState(4)

  const results = useMemo(() => {
    const monthlyRate = rate / 100 / 12
    const totalMonths = termYears * 12
    if (monthlyRate === 0) {
      const monthly = loanAmount / totalMonths
      return { monthly, totalInterest: 0, totalCost: loanAmount, chartData: [] }
    }
    const monthly = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
    const totalCost = monthly * totalMonths
    const totalInterest = totalCost - loanAmount

    // Chart data: yearly breakdown
    const chartData = []
    let balance = loanAmount
    for (let year = 1; year <= termYears; year++) {
      let yearPrincipal = 0
      let yearInterest = 0
      for (let m = 0; m < 12; m++) {
        if (balance <= 0) break
        const interestPayment = balance * monthlyRate
        const principalPayment = Math.min(monthly - interestPayment, balance)
        yearInterest += interestPayment
        yearPrincipal += principalPayment
        balance -= principalPayment
      }
      chartData.push({
        year: `Year ${year}`,
        Principal: Math.round(yearPrincipal),
        Interest: Math.round(yearInterest),
      })
    }

    return { monthly, totalInterest, totalCost, chartData }
  }, [loanAmount, rate, termYears])

  return (
    <div className="space-y-6">
      <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Tools
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Loan Amount</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                />
              </div>
              <input
                type="range"
                min="1000"
                max="500000"
                step="1000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={rate}
                onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
              />
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Term (years)</label>
              <input
                type="number"
                min="1"
                max="35"
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={termYears}
                onChange={(e) => setTermYears(Math.max(1, Math.min(35, Number(e.target.value))))}
              />
              <input
                type="range"
                min="1"
                max="35"
                value={termYears}
                onChange={(e) => setTermYears(Number(e.target.value))}
                className="w-full mt-2 accent-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Monthly Payment</p>
                <p className="text-xl font-bold text-primary mt-1">{formatGBP(results.monthly)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Interest</p>
                <p className="text-xl font-bold text-destructive mt-1">{formatGBP(results.totalInterest)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Total Cost</p>
                <p className="text-xl font-bold mt-1">{formatGBP(results.totalCost)}</p>
              </CardContent>
            </Card>
          </div>

          {results.chartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Annual Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: any) => `£${(v / 1000).toFixed(0)}k`} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip formatter={(value: any, name: any) => [formatGBP(value), name]} />
                    <Legend />
                    <Bar dataKey="Principal" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="Interest" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
