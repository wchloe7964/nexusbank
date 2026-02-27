'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { SpendingAlertType } from '@/lib/types'

const validTypes: SpendingAlertType[] = ['single_transaction', 'category_monthly', 'balance_below', 'merchant_payment', 'large_incoming']

export async function createSpendingAlert(data: {
  name: string
  alertType: SpendingAlertType
  accountId?: string
  category?: string
  merchantName?: string
  thresholdAmount: number
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  if (!validTypes.includes(data.alertType)) throw new Error('Invalid alert type')
  if (!data.name.trim()) throw new Error('Name is required')
  if (data.thresholdAmount <= 0) throw new Error('Threshold must be greater than zero')

  const { error } = await supabase.from('spending_alerts').insert({
    user_id: user.id,
    name: data.name.trim(),
    alert_type: data.alertType,
    account_id: data.accountId || null,
    category: data.category || null,
    merchant_name: data.merchantName?.trim() || null,
    threshold_amount: data.thresholdAmount,
  })

  if (error) {
    console.error('Alert creation error:', error.message)
    throw new Error('Failed to create alert. Please try again.')
  }
  revalidatePath('/settings/alerts')
}

export async function updateSpendingAlert(alertId: string, data: {
  name?: string
  thresholdAmount?: number
  accountId?: string | null
  category?: string | null
  merchantName?: string | null
}) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.name !== undefined) updates.name = data.name.trim()
  if (data.thresholdAmount !== undefined) updates.threshold_amount = data.thresholdAmount
  if (data.accountId !== undefined) updates.account_id = data.accountId
  if (data.category !== undefined) updates.category = data.category
  if (data.merchantName !== undefined) updates.merchant_name = data.merchantName?.trim() || null

  const { error } = await supabase
    .from('spending_alerts')
    .update(updates)
    .eq('id', alertId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to update alert')
  revalidatePath('/settings/alerts')
}

export async function deleteSpendingAlert(alertId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('spending_alerts')
    .delete()
    .eq('id', alertId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to delete alert')
  revalidatePath('/settings/alerts')
}

export async function toggleSpendingAlert(alertId: string, isActive: boolean) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('spending_alerts')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', alertId)
    .eq('user_id', user.id)

  if (error) throw new Error('Failed to toggle alert')
  revalidatePath('/settings/alerts')
}
