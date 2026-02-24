'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('savings_goals').insert({
    user_id: user.id,
    account_id: data.accountId,
    name: data.name,
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('savings_goals')
    .update({
      name: data.name,
      goal_type: data.goalType,
      target_amount: data.targetAmount,
      target_date: data.targetDate || null,
      color: data.color,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)

  if (error) throw new Error(error.message)

  revalidatePath('/savings-goals')
  revalidatePath(`/savings-goals/${goalId}`)
  return { success: true }
}

export async function deleteSavingsGoal(goalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get the goal first to return funds to account
  const { data: goal } = await supabase
    .from('savings_goals')
    .select('current_amount, account_id')
    .eq('id', goalId)
    .single()

  if (goal && Number(goal.current_amount) > 0) {
    // Return funds to the linked account
    const { data: account } = await supabase
      .from('accounts')
      .select('balance, available_balance')
      .eq('id', goal.account_id)
      .single()

    if (account) {
      const newBalance = Number(account.balance) + Number(goal.current_amount)
      await supabase
        .from('accounts')
        .update({ balance: newBalance, available_balance: newBalance })
        .eq('id', goal.account_id)
    }
  }

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', goalId)

  if (error) throw new Error(error.message)

  revalidatePath('/savings-goals')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function adjustSavingsGoal(goalId: string, amount: number, isDeposit: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const adjustedAmount = isDeposit ? amount : -amount
  const description = isDeposit ? `Savings deposit to goal` : `Withdrawal from savings goal`

  // Try RPC first
  const { error: rpcError } = await supabase.rpc('adjust_savings_goal', {
    p_goal_id: goalId,
    p_amount: adjustedAmount,
    p_description: description,
  })

  if (rpcError) {
    // Manual fallback
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('*, account:accounts(*)')
      .eq('id', goalId)
      .single()

    if (!goal) throw new Error('Goal not found')

    const newGoalAmount = Number(goal.current_amount) + adjustedAmount
    if (newGoalAmount < 0) throw new Error('Cannot withdraw more than current balance')

    const account = goal.account
    if (!account) throw new Error('Linked account not found')

    const newAccountBalance = Number(account.balance) - adjustedAmount
    if (isDeposit && newAccountBalance < 0) throw new Error('Insufficient funds in account')

    // Update account balance
    const { error: acctErr } = await supabase
      .from('accounts')
      .update({
        balance: newAccountBalance,
        available_balance: newAccountBalance,
      })
      .eq('id', goal.account_id)

    if (acctErr) throw new Error(acctErr.message)

    // Update goal
    const isCompleted = newGoalAmount >= Number(goal.target_amount)
    const { error: goalErr } = await supabase
      .from('savings_goals')
      .update({
        current_amount: newGoalAmount,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)

    if (goalErr) throw new Error(goalErr.message)

    // Create transaction record
    await supabase.from('transactions').insert({
      account_id: goal.account_id,
      type: isDeposit ? 'debit' : 'credit',
      category: 'transfer',
      amount: amount,
      description: description,
      status: 'completed',
      transaction_date: new Date().toISOString(),
    })
  }

  revalidatePath('/savings-goals')
  revalidatePath(`/savings-goals/${goalId}`)
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { success: true }
}
