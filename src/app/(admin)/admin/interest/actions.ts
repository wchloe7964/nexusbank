'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

export async function updateInterestRate(
  configId: string,
  updates: {
    annual_rate?: number
    is_active?: boolean
    description?: string
  }
): Promise<{ success: boolean }> {
  const adminUserId = await requireSuperAdmin()
  const admin = createAdminClient()

  const { data: oldConfig } = await admin
    .from('interest_config')
    .select('*')
    .eq('id', configId)
    .single()

  if (!oldConfig) throw new Error('Interest config not found')

  const cleanUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.annual_rate !== undefined) cleanUpdates.annual_rate = updates.annual_rate
  if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active
  if (updates.description !== undefined) cleanUpdates.description = updates.description?.trim() || null

  const { error } = await admin
    .from('interest_config')
    .update(cleanUpdates)
    .eq('id', configId)

  if (error) {
    console.error('Interest rate update error:', error.message)
    throw new Error('Failed to update interest rate')
  }

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'super_admin',
    targetTable: 'interest_config',
    targetId: configId,
    action: 'interest_rate_updated',
    details: {
      account_type: oldConfig.account_type,
      old_rate: oldConfig.annual_rate,
      new_rate: updates.annual_rate,
      old_active: oldConfig.is_active,
      new_active: updates.is_active,
    },
  })

  revalidatePath('/admin/interest')
  return { success: true }
}
