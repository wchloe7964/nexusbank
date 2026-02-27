import { createAdminClient } from '@/lib/supabase/admin'
import type { SuspiciousActivityReport, SarDashboardStats } from '@/lib/types/limits'

interface GetSarsParams {
  status?: string
  page?: number
  pageSize?: number
}

export async function getSars({
  status,
  page = 1,
  pageSize = 20,
}: GetSarsParams = {}) {
  const admin = createAdminClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('suspicious_activity_reports')
    .select('*, profiles!suspicious_activity_reports_user_id_fkey(full_name, email)', { count: 'exact' })

  if (status && status !== 'all') query = query.eq('status', status)

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, count, error } = await query
  if (error) throw error

  return {
    sars: (data ?? []) as SuspiciousActivityReport[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getSarDetail(sarId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('suspicious_activity_reports')
    .select('*, profiles!suspicious_activity_reports_user_id_fkey(full_name, email)')
    .eq('id', sarId)
    .single()

  if (error) throw error
  return data as SuspiciousActivityReport
}

export async function getSarDashboardStats(): Promise<SarDashboardStats> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('sar_dashboard_stats')
  if (error) throw error
  return data as SarDashboardStats
}
