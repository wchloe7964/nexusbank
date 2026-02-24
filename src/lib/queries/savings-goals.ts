import { createClient } from '@/lib/supabase/server'
import type { SavingsGoal } from '@/lib/types'

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*, account:accounts(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getSavingsGoals error:', error.message)
    const { data: fallback, error: fbErr } = await supabase
      .from('savings_goals')
      .select('*')
      .order('created_at', { ascending: false })

    if (fbErr) return []
    return (fallback ?? []) as SavingsGoal[]
  }
  return data as SavingsGoal[]
}

export async function getSavingsGoalById(goalId: string): Promise<SavingsGoal | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*, account:accounts(*)')
    .eq('id', goalId)
    .single()

  if (error) {
    console.error('getSavingsGoalById error:', error.message)
    return null
  }
  return data as SavingsGoal
}

export async function getTotalSaved(): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('savings_goals')
    .select('current_amount')
    .eq('is_completed', false)

  if (error) return 0
  return (data ?? []).reduce((sum, g) => sum + Number(g.current_amount), 0)
}
