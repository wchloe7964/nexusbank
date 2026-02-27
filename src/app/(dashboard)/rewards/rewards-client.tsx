'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { rewardMultipliers, rewardCategoryIcons, redemptionOptions } from '@/lib/constants/rewards'
import { transactionCategories } from '@/lib/constants/categories'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Gift, ArrowDownRight, TrendingUp, Star, Coins } from 'lucide-react'
import type { Account, Reward, RewardsSummary } from '@/lib/types'
import { redeemRewards } from './actions'

interface RewardsClientProps {
  summary: RewardsSummary
  recentRewards: Reward[]
  accounts: Account[]
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-')
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-GB', { month: 'short' })
}

function getCategoryLabel(category: string): string {
  const cat = transactionCategories[category as keyof typeof transactionCategories]
  return cat?.label || category.charAt(0).toUpperCase() + category.slice(1)
}

export function RewardsClient({ summary, recentRewards, accounts }: RewardsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [redeemMethod, setRedeemMethod] = useState<'cash' | 'charity'>('cash')
  const [redeemAmount, setRedeemAmount] = useState('')
  const [redeemAccountId, setRedeemAccountId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const chartData = summary.monthlyEarnings.map(m => ({
    month: formatMonth(m.month),
    amount: Number(m.amount.toFixed(2)),
  }))

  const multiplierCategories = Object.entries(rewardMultipliers)
    .filter(([, config]) => config.rate > 0)
    .sort((a, b) => b[1].rate - a[1].rate)

  function openRedeemDialog() {
    setRedeemAmount(summary.totalBalance.toFixed(2))
    setRedeemAccountId(accounts[0]?.id || '')
    setRedeemMethod('cash')
    setError('')
    setSuccess(false)
    setShowRedeemDialog(true)
  }

  function handleRedeem() {
    setError('')
    const amount = parseFloat(redeemAmount)
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amount > summary.totalBalance) {
      setError('Amount exceeds your rewards balance')
      return
    }
    if (redeemMethod === 'cash' && !redeemAccountId) {
      setError('Please select an account')
      return
    }

    startTransition(async () => {
      try {
        await redeemRewards({
          amount,
          method: redeemMethod,
          accountId: redeemMethod === 'cash' ? redeemAccountId : undefined,
        })
        setSuccess(true)
        setTimeout(() => {
          setShowRedeemDialog(false)
          setSuccess(false)
        }, 2000)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to redeem rewards')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Balance Hero Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-6 relative">
          <div className="accent-bar mb-4" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Cashback Balance</p>
              <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-emerald-500">
                {formatGBP(summary.totalBalance)}
              </p>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Total earned: <span className="font-medium text-foreground tabular-nums">{formatGBP(summary.totalEarned)}</span>
                </span>
                <span className="text-muted-foreground">
                  Redeemed: <span className="font-medium text-foreground tabular-nums">{formatGBP(summary.totalRedeemed)}</span>
                </span>
              </div>
            </div>
            <Button size="sm" onClick={openRedeemDialog} disabled={summary.totalBalance <= 0}>
              <Gift className="mr-2 h-3.5 w-3.5" />
              Redeem
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Earnings Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base tracking-tight">Monthly Cashback Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
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
                    formatter={(value: any) => [`£${Number(value ?? 0).toFixed(2)}`, 'Cashback']}
                  />
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cashback Rates Grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base tracking-tight">Cashback Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {multiplierCategories.map(([category, config]) => {
              const iconConfig = rewardCategoryIcons[category]
              const Icon = iconConfig?.icon || Star
              return (
                <div
                  key={category}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className={`rounded-xl p-2.5 ${iconConfig?.bg || 'bg-gray-500/10'}`}>
                    <Icon className={`h-4 w-4 ${iconConfig?.color || 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getCategoryLabel(category)}</p>
                    <Badge variant="success" className="mt-0.5">
                      {config.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {summary.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base tracking-tight">Earnings by Category</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {summary.categoryBreakdown.map((item) => {
                const iconConfig = rewardCategoryIcons[item.category]
                const Icon = iconConfig?.icon || Star
                return (
                  <div key={item.category} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2 ${iconConfig?.bg || 'bg-gray-500/10'}`}>
                        <Icon className={`h-3.5 w-3.5 ${iconConfig?.color || 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{getCategoryLabel(item.category)}</p>
                        <p className="text-xs text-muted-foreground">{item.count} transactions</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-emerald-500">
                      +{formatGBP(item.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Rewards */}
      {recentRewards.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base tracking-tight">Recent Cashback</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentRewards.slice(0, 15).map((reward) => {
                const iconConfig = rewardCategoryIcons[reward.category]
                const Icon = iconConfig?.icon || Coins
                return (
                  <div key={reward.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2 ${iconConfig?.bg || 'bg-gray-500/10'}`}>
                        <Icon className={`h-3.5 w-3.5 ${iconConfig?.color || 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{getCategoryLabel(reward.category)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reward.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold tabular-nums text-emerald-500">
                        +{formatGBP(reward.amount)}
                      </p>
                      <ArrowDownRight className="h-3 w-3 text-emerald-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How It Works Info Card */}
      <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2 shrink-0">
              <Gift className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium">How NexusBank Rewards Works</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Earn cashback automatically on every card purchase. Dining earns 3%, shopping 2%, subscriptions 1.5%, and everything else 0.5-1%. Redeem your cashback as cash to any account or donate to charity. Rewards never expire while your account is active.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onClose={() => setShowRedeemDialog(false)} title="Redeem Cashback">
        {success ? (
          <div className="text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-3">
              <Gift className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-sm font-medium">Rewards Redeemed!</p>
            <p className="text-xs text-muted-foreground mt-1">
              {redeemMethod === 'cash'
                ? 'Cashback has been transferred to your account.'
                : 'Your donation has been processed. Thank you!'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold tabular-nums text-emerald-500">{formatGBP(summary.totalBalance)}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Redemption Method</label>
              <Select value={redeemMethod} onChange={(e) => setRedeemMethod(e.target.value as 'cash' | 'charity')} className="mt-1">
                {redemptionOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {redemptionOptions.find(o => o.id === redeemMethod)?.description}
              </p>
            </div>

            {redeemMethod === 'cash' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">To Account</label>
                <Select value={redeemAccountId} onChange={(e) => setRedeemAccountId(e.target.value)} className="mt-1">
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount (£)</label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={summary.totalBalance}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRedeemAmount(summary.totalBalance.toFixed(2))}
                >
                  All
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowRedeemDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleRedeem} disabled={isPending}>
                {isPending ? 'Redeeming...' : `Redeem ${redeemAmount ? formatGBP(parseFloat(redeemAmount) || 0) : '£0.00'}`}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
