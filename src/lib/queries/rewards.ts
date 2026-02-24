import { createClient } from '@/lib/supabase/server'
import type { Reward, RewardsSummary } from '@/lib/types'

export async function getRewardsBalance(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('rewards_balance')
    .single()

  if (error) {
    console.error('getRewardsBalance error:', error.message)
    return 0
  }
  return Number(data?.rewards_balance ?? 0)
}

export async function getRecentRewards(limit = 20): Promise<Reward[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('status', 'earned')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getRecentRewards error:', error.message)
    return []
  }
  return data as Reward[]
}

export async function getRewardsSummary(): Promise<RewardsSummary> {
  const supabase = await createClient()

  // Get all rewards
  const { data: rewards, error } = await supabase
    .from('rewards')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getRewardsSummary error:', error.message)
    return {
      totalBalance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      monthlyEarnings: [],
      categoryBreakdown: [],
    }
  }

  const allRewards = (rewards ?? []) as Reward[]
  const balance = await getRewardsBalance()

  // Calculate totals
  const totalEarned = allRewards
    .filter(r => r.status === 'earned' || r.status === 'redeemed')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  const totalRedeemed = allRewards
    .filter(r => r.status === 'redeemed')
    .reduce((sum, r) => sum + Number(r.amount), 0)

  // Monthly earnings (last 6 months)
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const monthlyMap = new Map<string, number>()

  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    monthlyMap.set(key, 0)
  }

  allRewards
    .filter(r => new Date(r.created_at) >= sixMonthsAgo)
    .forEach(r => {
      const date = new Date(r.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + Number(r.amount))
      }
    })

  const monthlyEarnings = Array.from(monthlyMap.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Category breakdown
  const categoryMap = new Map<string, { amount: number; count: number }>()
  allRewards.forEach(r => {
    const existing = categoryMap.get(r.category) || { amount: 0, count: 0 }
    categoryMap.set(r.category, {
      amount: existing.amount + Number(r.amount),
      count: existing.count + 1,
    })
  })

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, { amount, count }]) => ({ category, amount, count }))
    .sort((a, b) => b.amount - a.amount)

  return {
    totalBalance: balance,
    totalEarned,
    totalRedeemed,
    monthlyEarnings,
    categoryBreakdown,
  }
}
