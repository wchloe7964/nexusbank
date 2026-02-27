import { createAdminClient } from '@/lib/supabase/admin'
import type { FraudScore, FraudRule, FraudCase, FraudDashboardStats } from '@/lib/types/fraud'

// ─── Fraud Scores ──────────────────────────────────────

interface FraudScoreFilters {
  decision?: string
  page?: number
  pageSize?: number
}

export async function getFraudScores(filters: FraudScoreFilters = {}): Promise<{
  data: FraudScore[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const admin = createAdminClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('fraud_scores')
    .select('*, profile:profiles!fraud_scores_profile_fkey(full_name, email)', { count: 'exact' })

  if (filters.decision && filters.decision !== 'all') {
    query = query.eq('decision', filters.decision)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as FraudScore[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ─── Fraud Rules ───────────────────────────────────────

export async function getFraudRules(): Promise<FraudRule[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('fraud_rules')
    .select('*')
    .order('weight', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as FraudRule[]
}

// ─── Fraud Cases ───────────────────────────────────────

interface FraudCaseFilters {
  status?: string
  priority?: string
  page?: number
  pageSize?: number
}

export async function getFraudCases(filters: FraudCaseFilters = {}): Promise<{
  data: FraudCase[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const admin = createAdminClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('fraud_cases')
    .select('*, profile:profiles!fraud_cases_profile_fkey(full_name, email)', { count: 'exact' })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as FraudCase[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ─── Dashboard Stats ───────────────────────────────────

export async function getFraudDashboardStats(): Promise<FraudDashboardStats> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('fraud_dashboard_stats')
  if (error) throw new Error(error.message)
  return data as FraudDashboardStats
}
