import { createAdminClient } from '@/lib/supabase/admin'
import type { PaymentSubmission, PaymentSchemeConfig, PaymentRailsStats } from '@/lib/types/payments'

interface PaymentSubmissionFilters {
  rail?: string
  railStatus?: string
  page?: number
  pageSize?: number
}

export async function getPaymentSubmissions(filters: PaymentSubmissionFilters = {}): Promise<{
  data: PaymentSubmission[]
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
    .from('payment_submissions')
    .select('*, profile:profiles!payment_submissions_profile_fkey(full_name, email)', { count: 'exact' })

  if (filters.rail && filters.rail !== 'all') {
    query = query.eq('rail', filters.rail)
  }
  if (filters.railStatus && filters.railStatus !== 'all') {
    query = query.eq('rail_status', filters.railStatus)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as PaymentSubmission[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getPaymentSchemeConfigs(): Promise<PaymentSchemeConfig[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('payment_scheme_config')
    .select('*')
    .order('rail')

  if (error) throw new Error(error.message)
  return (data ?? []) as PaymentSchemeConfig[]
}

export async function getPaymentRailsStats(): Promise<PaymentRailsStats> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('payment_rails_stats')
  if (error) throw new Error(error.message)
  return data as PaymentRailsStats
}
