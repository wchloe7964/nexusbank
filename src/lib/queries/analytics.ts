import { createClient } from '@/lib/supabase/server'
import type { MerchantSpending, DetectedSubscription, SpendingForecast, PeerComparison } from '@/lib/types'

export async function getMerchantSpending(months = 3): Promise<MerchantSpending[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const { data, error } = await supabase
    .from('transactions')
    .select('counterparty_name, amount, category, transaction_date')
    .eq('type', 'debit')
    .eq('status', 'completed')
    .gte('transaction_date', since.toISOString())
    .not('counterparty_name', 'is', null)
    .order('transaction_date', { ascending: false })

  if (error) {
    console.error('getMerchantSpending error:', error.message)
    return []
  }

  // Group by counterparty in JS
  const merchantMap = new Map<string, { total: number; count: number; category: string; lastDate: string }>()

  for (const tx of (data ?? [])) {
    const name = tx.counterparty_name || 'Unknown'
    const existing = merchantMap.get(name)
    if (existing) {
      existing.total += Number(tx.amount)
      existing.count += 1
      if (tx.transaction_date > existing.lastDate) {
        existing.lastDate = tx.transaction_date
      }
    } else {
      merchantMap.set(name, {
        total: Number(tx.amount),
        count: 1,
        category: tx.category || 'other',
        lastDate: tx.transaction_date,
      })
    }
  }

  return Array.from(merchantMap.entries())
    .map(([counterparty_name, data]) => ({
      counterparty_name,
      total: data.total,
      count: data.count,
      category: data.category,
      lastDate: data.lastDate,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)
}

export async function detectSubscriptions(): Promise<DetectedSubscription[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setMonth(since.getMonth() - 3)

  const { data, error } = await supabase
    .from('transactions')
    .select('counterparty_name, amount, category, transaction_date')
    .eq('type', 'debit')
    .eq('status', 'completed')
    .gte('transaction_date', since.toISOString())
    .not('counterparty_name', 'is', null)
    .order('transaction_date', { ascending: true })

  if (error) {
    console.error('detectSubscriptions error:', error.message)
    return []
  }

  // Group transactions by counterparty + similar amounts
  const groupMap = new Map<string, { amounts: number[]; dates: string[]; category: string }>()

  for (const tx of (data ?? [])) {
    const name = tx.counterparty_name || 'Unknown'
    const existing = groupMap.get(name)
    if (existing) {
      existing.amounts.push(Number(tx.amount))
      existing.dates.push(tx.transaction_date)
    } else {
      groupMap.set(name, {
        amounts: [Number(tx.amount)],
        dates: [tx.transaction_date],
        category: tx.category || 'other',
      })
    }
  }

  const subscriptions: DetectedSubscription[] = []

  for (const [name, group] of groupMap.entries()) {
    if (group.amounts.length < 2) continue

    // Check if amounts are similar (within 5% tolerance)
    const avgAmount = group.amounts.reduce((s, a) => s + a, 0) / group.amounts.length
    const allSimilar = group.amounts.every(a => Math.abs(a - avgAmount) / avgAmount <= 0.05)
    if (!allSimilar) continue

    // Check interval between payments
    const sortedDates = group.dates.sort()
    const intervals: number[] = []
    for (let i = 1; i < sortedDates.length; i++) {
      const diff = (new Date(sortedDates[i]).getTime() - new Date(sortedDates[i - 1]).getTime()) / (1000 * 60 * 60 * 24)
      intervals.push(diff)
    }

    if (intervals.length === 0) continue
    const avgInterval = intervals.reduce((s, i) => s + i, 0) / intervals.length

    let frequency: 'monthly' | 'weekly' | 'annual'
    if (avgInterval >= 25 && avgInterval <= 35) {
      frequency = 'monthly'
    } else if (avgInterval >= 5 && avgInterval <= 9) {
      frequency = 'weekly'
    } else if (avgInterval >= 350 && avgInterval <= 380) {
      frequency = 'annual'
    } else {
      continue // Not a recognizable pattern
    }

    // Calculate next expected date
    const lastDate = sortedDates[sortedDates.length - 1]
    const nextDate = new Date(lastDate)
    if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1)
    else if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7)
    else nextDate.setFullYear(nextDate.getFullYear() + 1)

    subscriptions.push({
      counterparty_name: name,
      amount: avgAmount,
      frequency,
      category: group.category,
      lastDate,
      nextExpectedDate: nextDate.toISOString().split('T')[0],
    })
  }

  return subscriptions.sort((a, b) => b.amount - a.amount)
}

export async function getSpendingForecast(days = 30): Promise<SpendingForecast[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 60)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, transaction_date')
    .eq('type', 'debit')
    .eq('status', 'completed')
    .gte('transaction_date', since.toISOString())
    .order('transaction_date', { ascending: true })

  if (error) {
    console.error('getSpendingForecast error:', error.message)
    return []
  }

  // Group by date
  const dailyMap = new Map<string, number>()
  const today = new Date()

  // Initialize last 60 days
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    dailyMap.set(d.toISOString().split('T')[0], 0)
  }

  for (const tx of (data ?? [])) {
    const date = tx.transaction_date.split('T')[0]
    dailyMap.set(date, (dailyMap.get(date) || 0) + Number(tx.amount))
  }

  const dailyData = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, amount], index) => ({ date, amount, index }))

  // Linear regression
  const n = dailyData.length
  if (n < 7) return []

  const sumX = dailyData.reduce((s, d) => s + d.index, 0)
  const sumY = dailyData.reduce((s, d) => s + d.amount, 0)
  const sumXY = dailyData.reduce((s, d) => s + d.index * d.amount, 0)
  const sumX2 = dailyData.reduce((s, d) => s + d.index * d.index, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Build result: last 30 days actual + 30 days forecast
  const result: SpendingForecast[] = []

  // Last 30 actual days
  const last30 = dailyData.slice(-30)
  for (const d of last30) {
    result.push({
      date: d.date,
      actual: d.amount,
      forecast: Math.max(0, intercept + slope * d.index),
    })
  }

  // Next N days forecast
  for (let i = 1; i <= days; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    result.push({
      date: d.toISOString().split('T')[0],
      actual: null,
      forecast: Math.max(0, intercept + slope * (n + i - 1)),
    })
  }

  return result
}

export async function getCategoryTrends(months = 6): Promise<{ month: string; [key: string]: string | number }[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setMonth(since.getMonth() - months)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category, transaction_date')
    .eq('type', 'debit')
    .eq('status', 'completed')
    .gte('transaction_date', since.toISOString())
    .order('transaction_date', { ascending: true })

  if (error) {
    console.error('getCategoryTrends error:', error.message)
    return []
  }

  // Group by month + category
  const monthCatMap = new Map<string, Map<string, number>>()

  for (const tx of (data ?? [])) {
    const date = new Date(tx.transaction_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthCatMap.has(monthKey)) monthCatMap.set(monthKey, new Map())
    const catMap = monthCatMap.get(monthKey)!
    catMap.set(tx.category, (catMap.get(tx.category) || 0) + Number(tx.amount))
  }

  // Find top 5 categories overall
  const categoryTotals = new Map<string, number>()
  for (const catMap of monthCatMap.values()) {
    for (const [cat, amount] of catMap.entries()) {
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + amount)
    }
  }
  const topCategories = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat)

  // Build chart data
  return Array.from(monthCatMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, catMap]) => {
      const row: { month: string; [key: string]: string | number } = { month }
      for (const cat of topCategories) {
        row[cat] = Number((catMap.get(cat) || 0).toFixed(2))
      }
      return row
    })
}

export async function getPeerComparison(): Promise<PeerComparison[]> {
  const supabase = await createClient()

  const since = new Date()
  since.setMonth(since.getMonth() - 1)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, category')
    .eq('type', 'debit')
    .eq('status', 'completed')
    .gte('transaction_date', since.toISOString())

  if (error) {
    console.error('getPeerComparison error:', error.message)
    return []
  }

  // User spending by category
  const userMap = new Map<string, number>()
  for (const tx of (data ?? [])) {
    userMap.set(tx.category, (userMap.get(tx.category) || 0) + Number(tx.amount))
  }

  // Simulated UK average monthly spending per category
  const ukAverages: Record<string, number> = {
    groceries: 280,
    bills: 450,
    dining: 120,
    transport: 180,
    shopping: 200,
    entertainment: 80,
    subscriptions: 65,
    health: 50,
    education: 40,
    cash: 100,
    other: 60,
  }

  const categories = new Set([...userMap.keys(), ...Object.keys(ukAverages)])
  const result: PeerComparison[] = []

  for (const category of categories) {
    if (category === 'transfer' || category === 'salary') continue
    const userAmount = userMap.get(category) || 0
    const averageAmount = ukAverages[category] || 100
    if (userAmount > 0 || averageAmount > 0) {
      result.push({ category, userAmount, averageAmount })
    }
  }

  return result.sort((a, b) => b.userAmount - a.userAmount)
}
