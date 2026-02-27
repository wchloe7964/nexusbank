'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const VALID_CASE_STATUSES = ['open', 'investigating', 'confirmed_fraud', 'false_positive', 'closed']

export async function updateFraudCase(
  caseId: string,
  status: string,
  resolution?: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!caseId || !VALID_CASE_STATUSES.includes(status)) {
    throw new Error('Invalid case ID or status')
  }

  const updateData: Record<string, unknown> = {
    status,
    assigned_to: adminUserId,
    updated_at: new Date().toISOString(),
  }
  if (resolution?.trim()) updateData.resolution = resolution.trim()

  const { error } = await admin
    .from('fraud_cases')
    .update(updateData)
    .eq('id', caseId)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    eventType: 'fraud_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'fraud_cases',
    targetId: caseId,
    action: 'fraud_case_updated',
    details: { new_status: status, resolution: resolution?.trim() || null },
  })

  revalidatePath('/admin/fraud/cases')
  return { success: true }
}

export async function toggleFraudRule(
  ruleId: string,
  isActive: boolean
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!ruleId) throw new Error('Invalid rule ID')

  const { error } = await admin
    .from('fraud_rules')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', ruleId)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'fraud_rules',
    targetId: ruleId,
    action: isActive ? 'fraud_rule_enabled' : 'fraud_rule_disabled',
  })

  revalidatePath('/admin/fraud/rules')
  return { success: true }
}
