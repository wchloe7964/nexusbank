'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { requireSuperAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const VALID_DISPUTE_STATUSES = [
  'submitted',
  'under_review',
  'information_requested',
  'resolved_refunded',
  'resolved_denied',
  'closed',
]

export async function updateDisputeStatus(
  disputeId: string,
  status: string,
  resolution?: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!disputeId || typeof disputeId !== 'string') {
    throw new Error('Invalid dispute ID')
  }

  if (!VALID_DISPUTE_STATUSES.includes(status)) {
    throw new Error('Invalid dispute status')
  }

  // Fetch dispute before update for old_values audit
  const { data: oldDispute } = await admin
    .from('disputes')
    .select('status, resolution, user_id')
    .eq('id', disputeId)
    .single()

  const updateData: Record<string, unknown> = { status }
  if (resolution?.trim()) {
    updateData.resolution = resolution.trim()
  }

  const { error } = await admin
    .from('disputes')
    .update(updateData)
    .eq('id', disputeId)

  if (error) {
    console.error('Dispute update error:', error.message)
    throw new Error('Failed to update dispute status')
  }

  if (oldDispute) {
    await admin.from('notifications').insert({
      user_id: oldDispute.user_id,
      title: 'Dispute Updated',
      message: `Your dispute status has been updated to: ${status.replace(/_/g, ' ')}`,
      type: 'account',
      is_read: false,
    })

    await logAuditEvent({
      eventType: 'admin_action',
      actorId: adminUserId,
      actorRole: 'admin',
      targetTable: 'disputes',
      targetId: disputeId,
      action: 'dispute_status_updated',
      details: {
        old_status: oldDispute.status,
        new_status: status,
        resolution: resolution?.trim() || null,
        target_user_id: oldDispute.user_id,
      },
    })
  }

  revalidatePath('/admin/disputes')
  return { success: true }
}

export async function updateCustomerRole(
  targetUserId: string,
  newRole: 'customer' | 'admin'
): Promise<{ success: boolean }> {
  const adminUserId = await requireSuperAdmin()
  const admin = createAdminClient()

  if (!targetUserId || typeof targetUserId !== 'string') {
    throw new Error('Invalid user ID')
  }

  if (newRole !== 'customer' && newRole !== 'admin') {
    throw new Error('Invalid role. Can only set to customer or admin.')
  }

  // Get old role for audit
  const { data: oldProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', targetUserId)
    .single()

  const { error } = await admin
    .from('profiles')
    .update({ role: newRole })
    .eq('id', targetUserId)

  if (error) {
    console.error('Role update error:', error.message)
    throw new Error('Failed to update customer role')
  }

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'super_admin',
    targetTable: 'profiles',
    targetId: targetUserId,
    action: 'customer_role_changed',
    details: {
      old_role: oldProfile?.role || 'unknown',
      new_role: newRole,
    },
  })

  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${targetUserId}`)
  return { success: true }
}
