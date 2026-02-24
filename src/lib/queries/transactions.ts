import { createClient } from '@/lib/supabase/server'
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
  if (search) query = query.ilike('description', `%${search}%`)
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

  const grouped: Record<string, number> = {}
  for (const t of data) {
    grouped[t.category] = (grouped[t.category] || 0) + Number(t.amount)
  }

  return Object.entries(grouped)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}
