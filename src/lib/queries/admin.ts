import { createAdminClient } from '@/lib/supabase/admin'
import type {
  AdminDashboardStats,
  CustomerListItem,
  Profile,
  Account,
  Transaction,
  Card,
  Dispute,
  LoginActivity,
} from '@/lib/types'

// ─── Dashboard ───────────────────────────────────────────

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('admin_dashboard_stats')
  if (error) throw new Error(error.message)
  return data as AdminDashboardStats
}

export async function getRecentSignups(limit = 10): Promise<Profile[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as Profile[]
}

export async function getRecentSuspiciousActivity(limit = 10): Promise<LoginActivity[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('login_activity')
    .select('*')
    .eq('is_suspicious', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data ?? []) as LoginActivity[]
}

// ─── Customers ───────────────────────────────────────────

interface CustomerFilters {
  search?: string
  role?: string
  page?: number
  pageSize?: number
}

export async function getCustomers(filters: CustomerFilters = {}): Promise<{
  data: CustomerListItem[]
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
    .from('profiles')
    .select('id, email, full_name, role, created_at, phone_number, city, postcode, two_factor_enabled, membership_number, date_of_birth, country, security_score', { count: 'exact' })

  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }

  if (filters.search) {
    const term = `%${filters.search}%`
    query = query.or(`full_name.ilike.${term},email.ilike.${term},membership_number.ilike.${term}`)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0

  return {
    data: (data ?? []) as CustomerListItem[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── Customer Detail ─────────────────────────────────────

export async function getCustomerDetail(userId: string): Promise<{
  profile: Profile
  accounts: Account[]
  recentTransactions: Transaction[]
  cards: Card[]
  loginActivity: LoginActivity[]
  disputes: Dispute[]
}> {
  const admin = createAdminClient()

  // Parallel fetches for speed
  const [profileRes, accountsRes, cardsRes, activityRes, disputesRes] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).single(),
    admin.from('accounts').select('*').eq('user_id', userId).order('is_primary', { ascending: false }),
    admin.from('cards').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    admin
      .from('login_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
    admin
      .from('disputes')
      .select('*, transaction:transactions(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (profileRes.error) throw new Error('Customer not found')

  // Get account IDs for transaction query
  const accountIds = (accountsRes.data ?? []).map((a: Account) => a.id)

  let recentTransactions: Transaction[] = []
  if (accountIds.length > 0) {
    const { data: txData } = await admin
      .from('transactions')
      .select('*')
      .in('account_id', accountIds)
      .order('transaction_date', { ascending: false })
      .limit(50)
    recentTransactions = (txData ?? []) as Transaction[]
  }

  return {
    profile: profileRes.data as Profile,
    accounts: (accountsRes.data ?? []) as Account[],
    recentTransactions,
    cards: (cardsRes.data ?? []) as Card[],
    loginActivity: (activityRes.data ?? []) as LoginActivity[],
    disputes: (disputesRes.data ?? []) as Dispute[],
  }
}

// ─── All Transactions ────────────────────────────────────

interface AdminTransactionFilters {
  search?: string
  category?: string
  type?: 'credit' | 'debit'
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export async function getAdminTransactions(filters: AdminTransactionFilters = {}): Promise<{
  data: (Transaction & { account?: { user_id: string; account_name: string } })[]
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
    .from('transactions')
    .select('*, account:accounts!inner(user_id, account_name)', { count: 'exact' })

  if (filters.search) {
    const term = `%${filters.search}%`
    query = query.or(`description.ilike.${term},counterparty_name.ilike.${term}`)
  }
  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters.type && filters.type !== ('all' as string)) {
    query = query.eq('type', filters.type)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.startDate) {
    query = query.gte('transaction_date', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('transaction_date', filters.endDate)
  }

  query = query.order('transaction_date', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0

  return {
    data: (data ?? []) as (Transaction & { account?: { user_id: string; account_name: string } })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── Disputes ────────────────────────────────────────────

interface AdminDisputeFilters {
  status?: string
  page?: number
  pageSize?: number
}

export async function getAdminDisputes(filters: AdminDisputeFilters = {}): Promise<{
  data: (Dispute & { profile?: { full_name: string; email: string } })[]
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
    .from('disputes')
    .select('*, transaction:transactions(*), profile:profiles!disputes_profile_fk(full_name, email)', { count: 'exact' })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0

  return {
    data: (data ?? []) as (Dispute & { profile?: { full_name: string; email: string } })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── Security / Login Activity ───────────────────────────

interface AdminSecurityFilters {
  eventType?: string
  isSuspicious?: boolean
  page?: number
  pageSize?: number
}

export async function getAdminLoginActivity(filters: AdminSecurityFilters = {}): Promise<{
  data: (LoginActivity & { profile?: { full_name: string; email: string } })[]
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
    .from('login_activity')
    .select('*, profile:profiles!login_activity_profile_fk(full_name, email)', { count: 'exact' })

  if (filters.eventType && filters.eventType !== 'all') {
    query = query.eq('event_type', filters.eventType)
  }
  if (filters.isSuspicious) {
    query = query.eq('is_suspicious', true)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0

  return {
    data: (data ?? []) as (LoginActivity & { profile?: { full_name: string; email: string } })[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}
