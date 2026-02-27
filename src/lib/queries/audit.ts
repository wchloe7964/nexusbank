import { createAdminClient } from '@/lib/supabase/admin'
import type { AuditEvent, AuditStats, ComplianceReport, DataRetentionPolicy } from '@/lib/types/audit'

// ─── Audit Log ─────────────────────────────────────────

interface AuditLogFilters {
  eventType?: string
  action?: string
  actorId?: string
  targetTable?: string
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  pageSize?: number
}

export async function getAuditLog(filters: AuditLogFilters = {}): Promise<{
  data: AuditEvent[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}> {
  const admin = createAdminClient()
  const page = filters.page ?? 1
  const pageSize = filters.pageSize ?? 30
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = admin
    .from('audit_log')
    .select('*', { count: 'exact' })

  if (filters.eventType && filters.eventType !== 'all') {
    query = query.eq('event_type', filters.eventType)
  }
  if (filters.action) {
    query = query.ilike('action', `%${filters.action}%`)
  }
  if (filters.actorId) {
    query = query.eq('actor_id', filters.actorId)
  }
  if (filters.targetTable && filters.targetTable !== 'all') {
    query = query.eq('target_table', filters.targetTable)
  }
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate)
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate)
  }
  if (filters.search) {
    query = query.ilike('action', `%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0

  return {
    data: (data ?? []) as AuditEvent[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getAuditStats(days = 30): Promise<AuditStats> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('audit_stats', { p_days: days })
  if (error) throw new Error(error.message)
  return data as AuditStats
}

// ─── Compliance Reports ────────────────────────────────

interface ComplianceReportFilters {
  reportType?: string
  status?: string
  page?: number
  pageSize?: number
}

export async function getComplianceReports(filters: ComplianceReportFilters = {}): Promise<{
  data: ComplianceReport[]
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
    .from('compliance_reports')
    .select('*', { count: 'exact' })

  if (filters.reportType && filters.reportType !== 'all') {
    query = query.eq('report_type', filters.reportType)
  }
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  query = query.order('created_at', { ascending: false }).range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  const total = count ?? 0

  return {
    data: (data ?? []) as ComplianceReport[],
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// ─── Data Retention Policies ───────────────────────────

export async function getDataRetentionPolicies(): Promise<DataRetentionPolicy[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('data_retention_policies')
    .select('*')
    .order('table_name')

  if (error) throw new Error(error.message)
  return (data ?? []) as DataRetentionPolicy[]
}
