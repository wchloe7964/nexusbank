'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership } from '@/lib/validation'
import type { SavingsGoalColor, SavingsGoalType } from '@/lib/types'

export async function createSavingsGoal(data: {
  name: string
  goalType: SavingsGoalType
  targetAmount: number
  targetDate?: string
  accountId: string
  color: SavingsGoalColor
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  if (!data.name.trim()) throw new Error('Goal name is required')
  validateAmount(data.targetAmount, 'Target amount')

  // Verify the linked account belongs to the user
  await verifyAccountOwnership(supabase, data.accountId, userId)

  const { error } = await supabase.from('savings_goals').insert({
    user_id: userId,
    account_id: data.accountId,
    name: data.name.trim(),
    goal_type: data.goalType,
    target_amount: data.targetAmount,
    target_date: data.targetDate || null,
    color: data.color,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/savings-goals')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSavingsGoal(goalId: string, data: {
  name: string
  goalType: SavingsGoalType
  targetAmount: number
  targetDate?: string
  color: SavingsGoalColor
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  if (!data.name.trim()) throw new Error('Goal name is required')
  validateAmount(data.targetAmount, 'Target amount')

  const { error } = await supabase
    .from('savings_goals')
    .update({
      name: data.name.trim(),
      goal_type: data.goalType,
      target_amount: data.targetAmount,
      target_date: data.targetDate || null,
      color: data.color,
    })
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/savings-goals')
  revalidatePath(`/savings-goals/${goalId}`)
  return { success: true }
}

export async function deleteSavingsGoal(goalId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Verify the goal belongs to the user and get its data
  const { data: goal, error: goalError } = await supabase
    .from('savings_goals')
    .select('current_amount, account_id')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single()

  if (goalError || !goal) throw new Error('Savings goal not found or access denied')

  // If goal has funds, return them to the linked account atomically via RPC
  if (Number(goal.current_amount) > 0) {
    const { error: rpcError } = await supabase.rpc('adjust_savings_goal', {
      p_goal_id: goalId,
      p_amount: -Number(goal.current_amount),
      p_description: 'Savings goal closed — funds returned',
    })

    // If the atomic RPC fails, do NOT fall back to manual updates — throw instead
    if (rpcError) {
      console.error('Savings goal RPC error:', rpcError.message)
      throw new Error('Failed to return funds to account. Please try again or contact support.')
    }
  }

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/savings-goals')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function adjustSavingsGoal(goalId: string, amount: number, isDeposit: boolean) {
  const supabase = await createClient()
  await requireAuth(supabase)

  validateAmount(amount, isDeposit ? 'Deposit amount' : 'Withdrawal amount')

  const adjustedAmount = isDeposit ? amount : -amount
  const description = isDeposit ? 'Savings deposit to goal' : 'Withdrawal from savings goal'

  // Use the atomic RPC — it handles locking, ownership, and balance checks
  const { error: rpcError } = await supabase.rpc('adjust_savings_goal', {
    p_goal_id: goalId,
    p_amount: adjustedAmount,
    p_description: description,
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  revalidatePath('/savings-goals')
  revalidatePath(`/savings-goals/${goalId}`)
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { success: true }
}
