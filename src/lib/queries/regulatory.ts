import { createAdminClient } from '@/lib/supabase/admin'
import type {
  Complaint,
  ComplaintsDashboardStats,
  RegulatoryReturn,
  CapitalAdequacy,
} from '@/lib/types/regulatory'

// ── Complaints ──

interface GetComplaintsParams {
  status?: string
  category?: string
  priority?: string
  page?: number
  pageSize?: number
}

export async function getComplaints({
  status,
  category,
  priority,
  page = 1,
  pageSize = 30,
}: GetComplaintsParams = {}) {
  const admin = createAdminClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('complaints')
    .select('*, profiles!complaints_profile_fkey(full_name, email)', { count: 'exact' })

  if (status && status !== 'all') query = query.eq('status', status)
  if (category && category !== 'all') query = query.eq('category', category)
  if (priority && priority !== 'all') query = query.eq('priority', priority)

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, count, error } = await query
  if (error) throw error

  return {
    complaints: (data ?? []) as Complaint[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getComplaintDetail(complaintId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('complaints')
    .select('*, profiles!complaints_profile_fkey(full_name, email)')
    .eq('id', complaintId)
    .single()

  if (error) throw error
  return data as Complaint
}

export async function getComplaintsDashboardStats(): Promise<ComplaintsDashboardStats> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('complaints_dashboard_stats')
  if (error) throw error
  return data as ComplaintsDashboardStats
}

// ── Regulatory Returns ──

interface GetReturnsParams {
  status?: string
  returnType?: string
  page?: number
  pageSize?: number
}

export async function getRegulatoryReturns({
  status,
  returnType,
  page = 1,
  pageSize = 20,
}: GetReturnsParams = {}) {
  const admin = createAdminClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('regulatory_returns')
    .select('*', { count: 'exact' })

  if (status && status !== 'all') query = query.eq('status', status)
  if (returnType && returnType !== 'all') query = query.eq('return_type', returnType)

  query = query.order('submission_deadline', { ascending: false }).range(from, to)

  const { data, count, error } = await query
  if (error) throw error

  return {
    returns: (data ?? []) as RegulatoryReturn[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

// ── Capital Adequacy ──

export async function getCapitalAdequacy(limit = 12) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('capital_adequacy')
    .select('*')
    .order('reporting_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as CapitalAdequacy[]
}

export async function getLatestCapitalAdequacy() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('capital_adequacy')
    .select('*')
    .order('reporting_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as CapitalAdequacy | null
}
