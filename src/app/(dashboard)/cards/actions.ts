'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, verifyCardOwnership, validateAmount } from '@/lib/validation'

export async function toggleCardFreeze(cardId: string, isFrozen: boolean) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)
  await verifyCardOwnership(supabase, cardId, userId)

  const { error } = await supabase
    .from('cards')
    .update({ is_frozen: isFrozen, status: isFrozen ? 'frozen' : 'active' })
    .eq('id', cardId)
    .eq('user_id', userId)

  if (error) throw error

  // Audit log — card freeze is a security event
  await supabase.from('login_activity').insert({
    user_id: userId,
    event_type: 'suspicious_activity',
    metadata: { action: isFrozen ? 'card_frozen' : 'card_unfrozen', card_id: cardId },
  })

  revalidatePath('/cards')
}

export async function toggleCardContactless(cardId: string, isEnabled: boolean) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)
  await verifyCardOwnership(supabase, cardId, userId)

  const { error } = await supabase
    .from('cards')
    .update({ is_contactless_enabled: isEnabled })
    .eq('id', cardId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function toggleOnlinePayments(cardId: string, isEnabled: boolean) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)
  await verifyCardOwnership(supabase, cardId, userId)

  const { error } = await supabase
    .from('cards')
    .update({ online_payments_enabled: isEnabled })
    .eq('id', cardId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function toggleATMWithdrawals(cardId: string, isEnabled: boolean) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)
  await verifyCardOwnership(supabase, cardId, userId)

  const { error } = await supabase
    .from('cards')
    .update({ atm_withdrawals_enabled: isEnabled })
    .eq('id', cardId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function updateSpendingLimits(cardId: string, limits: { daily: number; monthly: number }) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)
  await verifyCardOwnership(supabase, cardId, userId)

  validateAmount(limits.daily, 'Daily spending limit')
  validateAmount(limits.monthly, 'Monthly spending limit')

  if (limits.daily > limits.monthly) {
    throw new Error('Daily limit cannot exceed monthly limit')
  }

  const { error } = await supabase
    .from('cards')
    .update({
      spending_limit_daily: limits.daily,
      spending_limit_monthly: limits.monthly,
    })
    .eq('id', cardId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function reportCardLost(cardId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)
  await verifyCardOwnership(supabase, cardId, userId)

  const { error } = await supabase
    .from('cards')
    .update({
      status: 'reported_lost',
      is_frozen: true,
    })
    .eq('id', cardId)
    .eq('user_id', userId)

  if (error) throw error

  // Audit log — card reported lost is a critical security event
  await supabase.from('login_activity').insert({
    user_id: userId,
    event_type: 'suspicious_activity',
    metadata: { action: 'card_reported_lost', card_id: cardId },
  })

  revalidatePath('/cards')
}
