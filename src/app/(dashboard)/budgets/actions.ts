'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount } from '@/lib/validation'

export async function createBudget(data: {
  category: string
  monthlyLimit: number
  alertThreshold: number
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.monthlyLimit, 'Monthly limit')
  if (data.alertThreshold < 0 || data.alertThreshold > 1) {
    throw new Error('Alert threshold must be between 0 and 1')
  }

  const { error } = await supabase.from('budgets').insert({
    user_id: userId,
    category: data.category,
    monthly_limit: data.monthlyLimit,
    alert_threshold: data.alertThreshold,
  })

  if (error) {
    if (error.code === '23505') throw new Error('A budget for this category already exists')
    throw new Error(error.message)
  }

  revalidatePath('/budgets')
  return { success: true }
}

export async function updateBudget(budgetId: string, data: {
  monthlyLimit: number
  alertThreshold: number
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.monthlyLimit, 'Monthly limit')
  if (data.alertThreshold < 0 || data.alertThreshold > 1) {
    throw new Error('Alert threshold must be between 0 and 1')
  }

  const { error } = await supabase
    .from('budgets')
    .update({
      monthly_limit: data.monthlyLimit,
      alert_threshold: data.alertThreshold,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/budgets')
  return { success: true }
}

export async function deleteBudget(budgetId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/budgets')
  return { success: true }
}
