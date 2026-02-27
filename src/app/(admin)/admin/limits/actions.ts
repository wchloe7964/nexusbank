'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireSuperAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

export async function updateTransactionLimit(
  limitId: string,
  updates: {
    single_transaction_limit?: number
    daily_limit?: number
    monthly_limit?: number
    is_active?: boolean
  }
): Promise<{ success: boolean }> {
  const adminUserId = await requireSuperAdmin()
  const admin = createAdminClient()

  const { data: oldLimit } = await admin
    .from('transaction_limits')
    .select('*')
    .eq('id', limitId)
    .single()

  if (!oldLimit) throw new Error('Limit not found')

  const cleanUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.single_transaction_limit !== undefined) cleanUpdates.single_transaction_limit = updates.single_transaction_limit
  if (updates.daily_limit !== undefined) cleanUpdates.daily_limit = updates.daily_limit
  if (updates.monthly_limit !== undefined) cleanUpdates.monthly_limit = updates.monthly_limit
  if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active

  const { error } = await admin
    .from('transaction_limits')
    .update(cleanUpdates)
    .eq('id', limitId)

  if (error) {
    console.error('Limit update error:', error.message)
    throw new Error('Failed to update transaction limit')
  }

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'super_admin',
    targetTable: 'transaction_limits',
    targetId: limitId,
    action: 'transaction_limit_updated',
    details: {
      kyc_level: oldLimit.kyc_level,
      old_values: {
        single: oldLimit.single_transaction_limit,
        daily: oldLimit.daily_limit,
        monthly: oldLimit.monthly_limit,
        is_active: oldLimit.is_active,
      },
      new_values: updates,
    },
  })

  revalidatePath('/admin/limits')
  return { success: true }
}

export async function updateCoolingPeriod(
  configId: string,
  updates: {
    cooling_hours?: number
    is_active?: boolean
  }
): Promise<{ success: boolean }> {
  const adminUserId = await requireSuperAdmin()
  const admin = createAdminClient()

  const { data: oldConfig } = await admin
    .from('cooling_period_config')
    .select('*')
    .eq('id', configId)
    .single()

  if (!oldConfig) throw new Error('Cooling period config not found')

  const cleanUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.cooling_hours !== undefined) cleanUpdates.cooling_hours = updates.cooling_hours
  if (updates.is_active !== undefined) cleanUpdates.is_active = updates.is_active

  const { error } = await admin
    .from('cooling_period_config')
    .update(cleanUpdates)
    .eq('id', configId)

  if (error) {
    console.error('Cooling period update error:', error.message)
    throw new Error('Failed to update cooling period')
  }

  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'super_admin',
    targetTable: 'cooling_period_config',
    targetId: configId,
    action: 'cooling_period_updated',
    details: {
      payment_rail: oldConfig.payment_rail,
      old_hours: oldConfig.cooling_hours,
      new_hours: updates.cooling_hours,
      old_active: oldConfig.is_active,
      new_active: updates.is_active,
    },
  })

  revalidatePath('/admin/limits')
  return { success: true }
}
