'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const VALID_REPORT_TYPES = [
  'sar', 'str', 'ctr', 'annual_aml', 'quarterly_fca',
  'pci_dss_saq', 'data_retention', 'risk_assessment', 'custom',
]

const VALID_STATUSES = [
  'draft', 'in_progress', 'pending_review', 'approved', 'submitted', 'rejected',
]

export async function generateComplianceReport(
  reportType: string,
  title: string,
  description?: string
): Promise<{ id: string }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!VALID_REPORT_TYPES.includes(reportType)) {
    throw new Error('Invalid report type')
  }
  if (!title || typeof title !== 'string' || title.length > 200) {
    throw new Error('Invalid title')
  }

  // Calculate reporting period (current quarter)
  const now = new Date()
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)

  const { data, error } = await admin
    .from('compliance_reports')
    .insert({
      report_type: reportType,
      title,
      description: description?.trim() || null,
      status: 'draft',
      generated_by: adminUserId,
      reporting_period_start: quarterStart.toISOString().split('T')[0],
      reporting_period_end: quarterEnd.toISOString().split('T')[0],
      data: {},
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'compliance_reports',
    targetId: data.id,
    action: 'compliance_report_created',
    details: { report_type: reportType, title },
  })

  revalidatePath('/admin/compliance')
  return { id: data.id }
}

export async function updateComplianceReportStatus(
  reportId: string,
  newStatus: string,
  notes?: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!reportId || typeof reportId !== 'string') {
    throw new Error('Invalid report ID')
  }
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error('Invalid status')
  }

  const updateData: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() }
  if (notes?.trim()) {
    updateData.notes = notes.trim()
  }
  if (newStatus === 'submitted') {
    updateData.submitted_at = new Date().toISOString()
  }
  if (newStatus === 'approved' || newStatus === 'pending_review') {
    updateData.reviewed_by = adminUserId
  }

  const { error } = await admin
    .from('compliance_reports')
    .update(updateData)
    .eq('id', reportId)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'compliance_reports',
    targetId: reportId,
    action: 'compliance_report_status_updated',
    details: { new_status: newStatus, notes: notes?.trim() || null },
  })

  revalidatePath('/admin/compliance')
  return { success: true }
}
