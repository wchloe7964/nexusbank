'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleCardFreeze(cardId: string, isFrozen: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({ is_frozen: isFrozen, status: isFrozen ? 'frozen' : 'active' })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function toggleCardContactless(cardId: string, isEnabled: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({ is_contactless_enabled: isEnabled })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function toggleOnlinePayments(cardId: string, isEnabled: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({ online_payments_enabled: isEnabled })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function toggleATMWithdrawals(cardId: string, isEnabled: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({ atm_withdrawals_enabled: isEnabled })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function updateSpendingLimits(cardId: string, limits: { daily: number; monthly: number }) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({
      spending_limit_daily: limits.daily,
      spending_limit_monthly: limits.monthly,
    })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function reportCardLost(cardId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({
      status: 'reported_lost',
      is_frozen: true,
    })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}
