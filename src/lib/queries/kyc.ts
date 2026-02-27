import { createAdminClient } from '@/lib/supabase/admin'
import type { KycVerification, KycDocument, AmlAlert, AmlDashboardStats } from '@/lib/types/kyc'

// ─── KYC Verifications ─────────────────────────────────

interface KycFilters {
  status?: string
  riskRating?: string
  page?: number
  pageSize?: number
}

export async function getKycVerifications(filters: KycFilters = {}): Promise<{
  data: KycVerification[]
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
    .from('kyc_verifications')
    .select('*, profile:profiles!kyc_verifications_profile_fkey(full_name, email)', { count: 'exact' })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.riskRating && filters.riskRating !== 'all') {
    query = query.eq('risk_rating', filters.riskRating)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as KycVerification[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getKycDetail(userId: string): Promise<{
  verification: KycVerification | null
  documents: KycDocument[]
}> {
  const admin = createAdminClient()

  const [verRes, docsRes] = await Promise.all([
    admin
      .from('kyc_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
  ])

  if (verRes.error) throw new Error(verRes.error.message)

  return {
    verification: verRes.data as KycVerification | null,
    documents: (docsRes.data ?? []) as KycDocument[],
  }
}

// ─── AML Alerts ────────────────────────────────────────

interface AmlFilters {
  status?: string
  severity?: string
  alertType?: string
  page?: number
  pageSize?: number
}

export async function getAmlAlerts(filters: AmlFilters = {}): Promise<{
  data: AmlAlert[]
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
    .from('aml_alerts')
    .select('*, profile:profiles!aml_alerts_profile_fkey(full_name, email)', { count: 'exact' })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters.severity && filters.severity !== 'all') {
    query = query.eq('severity', filters.severity)
  }
  if (filters.alertType && filters.alertType !== 'all') {
    query = query.eq('alert_type', filters.alertType)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: (data ?? []) as AmlAlert[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getAmlDashboardStats(): Promise<AmlDashboardStats> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('aml_dashboard_stats')
  if (error) throw new Error(error.message)
  return data as AmlDashboardStats
}
