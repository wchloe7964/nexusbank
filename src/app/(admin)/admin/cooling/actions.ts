'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

// ─── Search customers ────────────────────────────────────────────────────────

export async function searchCustomersForCooling(query: string): Promise<{
  success: boolean
  customers: { id: string; full_name: string; email: string }[]
  error?: string
}> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, customers: [], error: 'Unauthorized' }
  }

  if (!query || query.trim().length < 2) {
    return { success: true, customers: [] }
  }

  const admin = createAdminClient()
  const q = query.trim()

  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, email')
    .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    .eq('role', 'customer')
    .limit(20)

  if (error) {
    return { success: false, customers: [], error: error.message }
  }

  return { success: true, customers: (data ?? []) as { id: string; full_name: string; email: string }[] }
}

// ─── Get payees with pending cooling periods for a customer ──────────────────

export interface CoolingPayee {
  id: string
  name: string
  sort_code: string
  account_number: string
  is_favourite: boolean
  first_used_at: string | null
  created_at: string
  cooling_status: 'active' | 'cleared' | 'waived'
  hours_remaining: number | null
}

export async function getCustomerPayeesWithCooling(userId: string): Promise<{
  success: boolean
  payees: CoolingPayee[]
  coolingHours: number
  error?: string
}> {
  try {
    await requireAdmin()
  } catch {
    return { success: false, payees: [], coolingHours: 24, error: 'Unauthorized' }
  }

  const admin = createAdminClient()

  // Get cooling config
  const { data: config } = await admin
    .from('cooling_period_config')
    .select('cooling_hours, is_active')
    .eq('payment_rail', 'fps')
    .maybeSingle()

  const coolingHours = config?.is_active ? (config.cooling_hours ?? 24) : 0

  // Get all payees for this customer
  const { data: payees, error } = await admin
    .from('payees')
    .select('id, name, sort_code, account_number, is_favourite, first_used_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return { success: false, payees: [], coolingHours, error: error.message }
  }

  const now = new Date()
  const results: CoolingPayee[] = (payees ?? []).map((p) => {
    if (p.first_used_at) {
      return { ...p, cooling_status: 'cleared' as const, hours_remaining: null }
    }

    if (coolingHours === 0) {
      return { ...p, cooling_status: 'cleared' as const, hours_remaining: null }
    }

    const createdAt = new Date(p.created_at)
    const coolingEnd = new Date(createdAt.getTime() + coolingHours * 60 * 60 * 1000)

    if (now >= coolingEnd) {
      return { ...p, cooling_status: 'cleared' as const, hours_remaining: 0 }
    }

    const hoursRemaining = Math.ceil((coolingEnd.getTime() - now.getTime()) / (60 * 60 * 1000))
    return { ...p, cooling_status: 'active' as const, hours_remaining: hoursRemaining }
  })

  return { success: true, payees: results, coolingHours }
}

// ─── Waive cooling period for a payee ────────────────────────────────────────

export async function waiveCoolingPeriod(payeeId: string, reason: string): Promise<{
  success: boolean
  error?: string
}> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!payeeId || typeof payeeId !== 'string') {
    return { success: false, error: 'Invalid payee ID' }
  }

  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'A reason is required (minimum 5 characters)' }
  }

  // Fetch the payee to confirm it exists and hasn't been used yet
  const { data: payee, error: fetchError } = await admin
    .from('payees')
    .select('id, user_id, name, sort_code, account_number, first_used_at')
    .eq('id', payeeId)
    .single()

  if (fetchError || !payee) {
    return { success: false, error: 'Payee not found' }
  }

  if (payee.first_used_at) {
    return { success: false, error: 'Cooling period has already been cleared (payee has been used)' }
  }

  // Set first_used_at to waive the cooling period
  const { error: updateError } = await admin
    .from('payees')
    .update({ first_used_at: new Date().toISOString() })
    .eq('id', payeeId)

  if (updateError) {
    return { success: false, error: 'Failed to waive cooling period: ' + updateError.message }
  }

  // Audit log
  await logAuditEvent({
    eventType: 'admin_action',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'payees',
    targetId: payeeId,
    action: 'waive_cooling_period',
    details: {
      payeeName: payee.name,
      sortCode: payee.sort_code,
      accountNumber: payee.account_number,
      customerId: payee.user_id,
      reason: reason.trim(),
    },
  })

  revalidatePath('/admin/cooling')

  return { success: true }
}
