import { createClient } from '@/lib/supabase/server'
import { toPence, fromPence, escapeIlike } from '@/lib/validation'
import type { Transaction } from '@/lib/types'

interface TransactionFilters {
  accountId?: string
  category?: string
  type?: 'credit' | 'debit'
  search?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

interface PaginatedTransactions {
  data: Transaction[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export async function getTransactions(filters: TransactionFilters = {}): Promise<PaginatedTransactions> {
  const supabase = await createClient()
  const { page = 1, pageSize = 20, accountId, category, type, search, startDate, endDate } = filters

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .order('transaction_date', { ascending: false })

  if (accountId) query = query.eq('account_id', accountId)
  if (category) query = query.eq('category', category)
  if (type) query = query.eq('type', type)
  if (search) query = query.ilike('description', `%${escapeIlike(search)}%`)
  if (startDate) query = query.gte('transaction_date', startDate)
  if (endDate) query = query.lte('transaction_date', endDate)

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('getTransactions error:', error.message)
    return { data: [], total: 0, page, pageSize, totalPages: 0 }
  }

  return {
    data: data as Transaction[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getRecentTransactions(accountId?: string, limit = 5): Promise<Transaction[]> {
  const supabase = await createClient()

  let query = supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(limit)

  if (accountId) query = query.eq('account_id', accountId)

  const { data, error } = await query
  if (error) {
    console.error('getRecentTransactions error:', error.message)
    return []
  }
  return data as Transaction[]
}

export async function getSpendingByCategory(accountId?: string): Promise<{ category: string; total: number }[]> {
  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  let query = supabase
    .from('transactions')
    .select('category, amount')
    .eq('type', 'debit')
    .gte('transaction_date', thirtyDaysAgo.toISOString())

  if (accountId) query = query.eq('account_id', accountId)

  const { data, error } = await query
  if (error) {
    console.error('getSpendingByCategory error:', error.message)
    return []
  }

  // Use pence arithmetic to avoid floating-point drift
  const grouped: Record<string, number> = {}
  for (const t of data) {
    grouped[t.category] = (grouped[t.category] || 0) + toPence(t.amount)
  }

  return Object.entries(grouped)
    .map(([category, totalPence]) => ({ category, total: fromPence(totalPence) }))
    .sort((a, b) => b.total - a.total)
}

export async function getDailySpending(accountId?: string, days = 30): Promise<{ date: string; amount: number }[]> {
  const supabase = await createClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let query = supabase
    .from('transactions')
    .select('transaction_date, amount')
    .eq('type', 'debit')
    .gte('transaction_date', startDate.toISOString())
    .order('transaction_date', { ascending: true })

  if (accountId) query = query.eq('account_id', accountId)

  const { data, error } = await query
  if (error) {
    console.error('getDailySpending error:', error.message)
    return []
  }

  const grouped: Record<string, number> = {}
  for (const t of data) {
    const day = t.transaction_date.split('T')[0]
    grouped[day] = (grouped[day] || 0) + toPence(t.amount)
  }

  const result: { date: string; amount: number }[] = []
  const current = new Date(startDate)
  const today = new Date()
  while (current <= today) {
    const key = current.toISOString().split('T')[0]
    result.push({ date: key, amount: fromPence(grouped[key] || 0) })
    current.setDate(current.getDate() + 1)
  }

  return result
}

export async function getMonthlyComparison(accountId?: string): Promise<{
  currentMonth: number
  previousMonth: number
  currentMonthIncome: number
  previousMonthIncome: number
}> {
  const supabase = await createClient()

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  let query = supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .gte('transaction_date', previousMonthStart.toISOString())

  if (accountId) query = query.eq('account_id', accountId)

  const { data, error } = await query
  if (error) {
    console.error('getMonthlyComparison error:', error.message)
    return { currentMonth: 0, previousMonth: 0, currentMonthIncome: 0, previousMonthIncome: 0 }
  }

  let currentMonthPence = 0, previousMonthPence = 0
  let currentMonthIncomePence = 0, previousMonthIncomePence = 0

  for (const t of data) {
    const txDate = new Date(t.transaction_date)
    const isCurrentMonth = txDate >= currentMonthStart
    const amountPence = toPence(t.amount)

    if (t.type === 'debit') {
      if (isCurrentMonth) currentMonthPence += amountPence
      else previousMonthPence += amountPence
    } else {
      if (isCurrentMonth) currentMonthIncomePence += amountPence
      else previousMonthIncomePence += amountPence
    }
  }

  return {
    currentMonth: fromPence(currentMonthPence),
    previousMonth: fromPence(previousMonthPence),
    currentMonthIncome: fromPence(currentMonthIncomePence),
    previousMonthIncome: fromPence(previousMonthIncomePence),
  }
}

export async function getIncomeVsExpenses(accountId?: string, months = 6): Promise<{
  month: string
  income: number
  expenses: number
}[]> {
  const supabase = await createClient()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months + 1)
  startDate.setDate(1)

  let query = supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .gte('transaction_date', startDate.toISOString())
    .order('transaction_date', { ascending: true })

  if (accountId) query = query.eq('account_id', accountId)

  const { data, error } = await query
  if (error) {
    console.error('getIncomeVsExpenses error:', error.message)
    return []
  }

  const grouped: Record<string, { income: number; expenses: number }> = {}

  for (let i = 0; i < months; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - (months - 1 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    grouped[key] = { income: 0, expenses: 0 }
  }

  for (const t of data) {
    const d = new Date(t.transaction_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = { income: 0, expenses: 0 }

    if (t.type === 'credit') {
      grouped[key].income += toPence(t.amount)
    } else {
      grouped[key].expenses += toPence(t.amount)
    }
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, vals]) => ({
      month,
      income: fromPence(vals.income),
      expenses: fromPence(vals.expenses),
    }))
}

export async function getMonthlyStatementData(accountId: string, year: number, month: number): Promise<Transaction[]> {
  const supabase = await createClient()
  const startDate = new Date(year, month - 1, 1)
  // End of month inclusive — use 23:59:59.999
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .gte('transaction_date', startDate.toISOString())
    .lte('transaction_date', endDate.toISOString())
    .order('transaction_date', { ascending: true })

  if (error) {
    console.error('getMonthlyStatementData error:', error.message)
    return []
  }
  return data as Transaction[]
}

export async function getStatementSummaries(accountId: string, months = 12): Promise<{
  month: string
  year: number
  monthNum: number
  transactionCount: number
  totalIn: number
  totalOut: number
}[]> {
  const supabase = await createClient()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months + 1)
  startDate.setDate(1)

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount, transaction_date')
    .eq('account_id', accountId)
    .gte('transaction_date', startDate.toISOString())
    .order('transaction_date', { ascending: true })

  if (error) {
    console.error('getStatementSummaries error:', error.message)
    return []
  }

  const grouped: Record<string, { count: number; totalInPence: number; totalOutPence: number }> = {}

  for (const t of data) {
    const d = new Date(t.transaction_date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!grouped[key]) grouped[key] = { count: 0, totalInPence: 0, totalOutPence: 0 }
    grouped[key].count++
    if (t.type === 'credit') grouped[key].totalInPence += toPence(t.amount)
    else grouped[key].totalOutPence += toPence(t.amount)
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December']

  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, vals]) => {
      const [y, m] = key.split('-').map(Number)
      return {
        month: monthNames[m - 1],
        year: y,
        monthNum: m,
        transactionCount: vals.count,
        totalIn: fromPence(vals.totalInPence),
        totalOut: fromPence(vals.totalOutPence),
      }
    })
}
