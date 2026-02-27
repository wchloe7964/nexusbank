'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import type { SarStatus } from '@/lib/types/limits'

export async function createSar(input: {
  amlAlertId?: string
  userId: string
  reason: string
  description: string
  totalAmount?: number
  periodStart?: string
  periodEnd?: string
}) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  // Generate SAR reference (count-based, unique per year)
  const year = new Date().getFullYear()
  const { count } = await admin
    .from('suspicious_activity_reports')
    .select('*', { count: 'exact', head: true })
  const seq = (count ?? 0) + 1
  const sarReference = `SAR-${year}-${String(seq).padStart(5, '0')}`

  const { data, error } = await admin
    .from('suspicious_activity_reports')
    .insert({
      aml_alert_id: input.amlAlertId || null,
      user_id: input.userId,
      filed_by: adminUserId,
      sar_reference: sarReference,
      status: 'draft',
      reason: input.reason,
      suspicious_activity_description: input.description,
      total_amount: input.totalAmount || null,
      period_start: input.periodStart || null,
      period_end: input.periodEnd || null,
    })
    .select('id')
    .single()

  if (error) throw error

  await logAuditEvent({
    eventType: 'sar_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'suspicious_activity_reports',
    targetId: data.id,
    action: 'create_sar',
    details: {
      sar_reference: sarReference,
      subject_user_id: input.userId,
      aml_alert_id: input.amlAlertId,
    },
  })

  revalidatePath('/admin/sar')
  revalidatePath('/admin/aml')
  return { sarReference }
}

export async function updateSarStatus(
  sarId: string,
  status: SarStatus,
  ncaReference?: string
) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'submitted') {
    updates.submitted_at = new Date().toISOString()
  }

  if (status === 'acknowledged') {
    updates.acknowledged_at = new Date().toISOString()
    if (ncaReference) updates.nca_reference = ncaReference
  }

  const { error } = await admin
    .from('suspicious_activity_reports')
    .update(updates)
    .eq('id', sarId)

  if (error) throw error

  await logAuditEvent({
    eventType: 'sar_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'suspicious_activity_reports',
    targetId: sarId,
    action: 'update_sar_status',
    details: { new_status: status, nca_reference: ncaReference },
  })

  revalidatePath('/admin/sar')
}
