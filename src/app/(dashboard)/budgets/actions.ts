'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBudget(data: {
  category: string
  monthlyLimit: number
  alertThreshold: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('budgets').insert({
    user_id: user.id,
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('budgets')
    .update({
      monthly_limit: data.monthlyLimit,
      alert_threshold: data.alertThreshold,
      updated_at: new Date().toISOString(),
    })
    .eq('id', budgetId)

  if (error) throw new Error(error.message)

  revalidatePath('/budgets')
  return { success: true }
}

export async function deleteBudget(budgetId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)

  if (error) throw new Error(error.message)

  revalidatePath('/budgets')
  return { success: true }
}
