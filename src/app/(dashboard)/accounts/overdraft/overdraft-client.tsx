'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Shield, TrendingDown, AlertTriangle, ArrowUp, Gauge } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { OverdraftUsage } from '@/lib/queries/overdraft'
import { requestOverdraftIncrease } from './actions'

interface OverdraftClientProps {
  accounts: OverdraftUsage[]
}

function getGaugeColor(percentage: number): string {
  if (percentage >= 80) return '#ef4444' // red
  if (percentage >= 50) return '#f59e0b' // amber
  return '#22c55e' // green
}

function getGaugeLabel(percentage: number): string {
  if (percentage >= 80) return 'High Usage'
  if (percentage >= 50) return 'Moderate'
  return 'Healthy'
}

export function OverdraftClient({ accounts }: OverdraftClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showIncreaseDialog, setShowIncreaseDialog] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [requestedLimit, setRequestedLimit] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const totalOverdraftLimit = accounts.reduce((sum, a) => sum + a.overdraftLimit, 0)
  const totalUsed = accounts.reduce((sum, a) => sum + a.usedAmount, 0)
  const overallUsage = totalOverdraftLimit > 0 ? (totalUsed / totalOverdraftLimit) * 100 : 0

  function openIncreaseDialog(accountId: string) {
    const account = accounts.find((a) => a.accountId === accountId)
    setSelectedAccountId(accountId)
    setRequestedLimit(account ? String(account.overdraftLimit + 500) : '')
    setReason('')
    setError('')
    setShowIncreaseDialog(true)
  }

  function handleIncrease() {
    setError('')
    const parsed = parseFloat(requestedLimit)
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid amount')
      return
    }

    startTransition(async () => {
      try {
        await requestOverdraftIncrease({
          accountId: selectedAccountId,
          requestedLimit: parsed,
          reason: reason || undefined,
        })
        setShowIncreaseDialog(false)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to request increase')
      }
    })
  }

  // Gauge data (for main visualization)
  const gaugeColor = getGaugeColor(overallUsage)
  const gaugeData = [
    { name: 'Used', value: Math.min(overallUsage, 100) },
    { name: 'Available', value: Math.max(100 - overallUsage, 0) },
  ]

  return (
    <div className="space-y-6">
      {/* Gauge Visualization */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <div className="relative h-[180px] w-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    startAngle={180}
                    endAngle={0}
                    cx="50%"
                    cy="100%"
                    innerRadius={90}
                    outerRadius={120}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill={gaugeColor} />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                <p className="text-3xl font-bold tabular-nums" style={{ color: gaugeColor }}>
                  {overallUsage.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground">{getGaugeLabel(overallUsage)}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Limit</p>
                <p className="text-lg font-bold tabular-nums">{formatGBP(totalOverdraftLimit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Used</p>
                <p className="text-lg font-bold tabular-nums text-red-500">{formatGBP(totalUsed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Available</p>
                <p className="text-lg font-bold tabular-nums text-emerald-500">{formatGBP(totalOverdraftLimit - totalUsed)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Cards */}
      {accounts.map((account) => {
        const color = getGaugeColor(account.usagePercentage)
        return (
          <Card key={account.accountId}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-500/10 p-2.5">
                    <Gauge className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.accountName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{account.accountType} Account</p>
                  </div>
                </div>
                <Badge
                  variant={account.isInOverdraft ? 'destructive' : 'success'}
                >
                  {account.isInOverdraft ? 'In Overdraft' : 'Clear'}
                </Badge>
              </div>

              {/* Balance & Limit */}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Balance</p>
                  <p className={`font-semibold tabular-nums ${account.balance < 0 ? 'text-red-500' : ''}`}>
                    {formatGBP(account.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Overdraft Limit</p>
                  <p className="font-semibold tabular-nums">{formatGBP(account.overdraftLimit)}</p>
                </div>
              </div>

              {/* Usage Bar */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Usage</span>
                  <span className="font-medium" style={{ color }}>
                    {account.usagePercentage.toFixed(0)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(account.usagePercentage, 100)}
                  max={100}
                  className="h-2"
                  indicatorClassName={
                    account.usagePercentage >= 80 ? 'bg-red-500' :
                    account.usagePercentage >= 50 ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }
                />
              </div>

              {/* Interest & Projection */}
              {account.isInOverdraft && (
                <div className="grid grid-cols-2 gap-4 text-sm p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Daily Interest</p>
                      <p className="font-medium tabular-nums text-red-500">
                        {formatGBP(account.dailyInterestCost)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Estimate</p>
                      <p className="font-medium tabular-nums text-amber-500">
                        {formatGBP(account.monthlyInterestCost)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => openIncreaseDialog(account.accountId)}
                >
                  <ArrowUp className="mr-2 h-3.5 w-3.5" />
                  Request Increase
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {/* No Overdraft Accounts */}
      {accounts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Gauge className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No Overdraft Accounts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              None of your accounts have an overdraft facility enabled.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Interest Info */}
      <Card className="border-blue-500/20 bg-blue-500/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2 shrink-0">
              <Shield className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium">About Overdraft Interest</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overdraft interest is charged daily at 10% EAR (Equivalent Annual Rate). Interest accrues on the amount you are overdrawn and is applied monthly. You can reduce your interest costs by keeping your balance above zero. There are no additional fees for using your arranged overdraft.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interest Calculator */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Interest Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              If you&apos;re £500 overdrawn, the daily cost is:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-1">
              <p>£500 × (10% ÷ 365) = <span className="font-bold text-amber-500">£0.14/day</span></p>
              <p>Monthly estimate: <span className="font-bold text-amber-500">£4.11/month</span></p>
            </div>
            <p className="text-xs text-muted-foreground">
              Based on 10% EAR. Actual charges may vary depending on daily balance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Increase Dialog */}
      <Dialog open={showIncreaseDialog} onClose={() => setShowIncreaseDialog(false)} title="Request Overdraft Increase">
        <div className="space-y-4">
          {(() => {
            const selected = accounts.find((a) => a.accountId === selectedAccountId)
            return selected ? (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <p className="font-medium">{selected.accountName}</p>
                <p className="text-muted-foreground">Current limit: {formatGBP(selected.overdraftLimit)}</p>
              </div>
            ) : null
          })()}
          <div>
            <label className="text-xs font-medium text-muted-foreground">New Limit (£)</label>
            <Input
              type="number"
              step="100"
              min="1"
              max="25000"
              value={requestedLimit}
              onChange={(e) => setRequestedLimit(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
            <Input
              placeholder="e.g. Temporary increase for home renovations"
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowIncreaseDialog(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleIncrease} disabled={isPending}>
              {isPending ? 'Requesting...' : 'Request Increase'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
