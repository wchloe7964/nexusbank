'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { CoolingCheckResult } from '@/lib/types/limits'

/**
 * Check whether a payee has passed its cooling period for the given payment rail.
 * New payees that have never been used must wait the configured cooling hours before
 * their first FPS payment (APP fraud prevention).
 */
export async function checkCoolingPeriod(
  payeeId: string,
  rail: string = 'fps'
): Promise<CoolingCheckResult> {
  const admin = createAdminClient()

  // Get cooling config for this rail
  const { data: config } = await admin
    .from('cooling_period_config')
    .select('cooling_hours, is_active')
    .eq('payment_rail', rail)
    .maybeSingle()

  // No config or inactive — allow
  if (!config || !config.is_active || config.cooling_hours === 0) {
    return { allowed: true }
  }

  // Get payee details
  const { data: payee } = await admin
    .from('payees')
    .select('first_used_at, created_at')
    .eq('id', payeeId)
    .single()

  if (!payee) {
    return { allowed: false, reason: 'Payee not found' }
  }

  // If the payee has been used before, cooling period is satisfied
  if (payee.first_used_at) {
    return { allowed: true }
  }

  // Check if enough time has passed since payee creation
  const createdAt = new Date(payee.created_at)
  const coolingEndTime = new Date(createdAt.getTime() + config.cooling_hours * 60 * 60 * 1000)
  const now = new Date()

  if (now >= coolingEndTime) {
    return { allowed: true }
  }

  const hoursRemaining = Math.ceil((coolingEndTime.getTime() - now.getTime()) / (60 * 60 * 1000))

  return {
    allowed: false,
    reason: `For your protection, new payees have a ${config.cooling_hours}-hour cooling period before the first Faster Payment. Please try again in ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}.`,
    hoursRemaining,
  }
}

/**
 * Mark a payee as having been used for the first time.
 * Called after a successful payment to clear the cooling period for future payments.
 */
export async function markPayeeFirstUsed(payeeId: string): Promise<void> {
  const admin = createAdminClient()
  await admin
    .from('payees')
    .update({ first_used_at: new Date().toISOString() })
    .eq('id', payeeId)
    .is('first_used_at', null)
}
