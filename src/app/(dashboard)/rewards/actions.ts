'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function redeemRewards(data: {
  amount: number
  method: 'cash' | 'charity'
  accountId?: string
}) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Verify balance
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('rewards_balance')
    .single()

  if (profileError || !profile) throw new Error('Could not load profile')

  const balance = Number(profile.rewards_balance)
  if (data.amount > balance) throw new Error('Insufficient rewards balance')
  if (data.amount <= 0) throw new Error('Amount must be greater than 0')

  if (data.method === 'cash') {
    if (!data.accountId) throw new Error('Please select an account')

    // Verify account exists and belongs to user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, balance, available_balance')
      .eq('id', data.accountId)
      .single()

    if (accountError || !account) throw new Error('Account not found')

    // Credit the account
    const newBalance = Number(account.balance) + data.amount
    const newAvailable = Number(account.available_balance) + data.amount

    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        balance: newBalance,
        available_balance: newAvailable,
      })
      .eq('id', data.accountId)

    if (updateError) throw new Error('Failed to credit account')

    // Create a credit transaction
    const { error: txError } = await supabase.from('transactions').insert({
      account_id: data.accountId,
      type: 'credit',
      category: 'other',
      amount: data.amount,
      description: 'Cashback Rewards Redemption',
      counterparty_name: 'NexusBank Rewards',
      balance_after: newBalance,
      status: 'completed',
      transaction_date: new Date().toISOString(),
    })

    if (txError) console.error('Transaction insert error:', txError.message)
  }

  // Mark rewards as redeemed (batch update earned rewards up to amount)
  const { data: earnedRewards, error: rewardsError } = await supabase
    .from('rewards')
    .select('id, amount')
    .eq('status', 'earned')
    .order('created_at', { ascending: true })

  if (!rewardsError && earnedRewards) {
    let remaining = data.amount
    const idsToRedeem: string[] = []

    for (const reward of earnedRewards) {
      if (remaining <= 0) break
      idsToRedeem.push(reward.id)
      remaining -= Number(reward.amount)
    }

    if (idsToRedeem.length > 0) {
      await supabase
        .from('rewards')
        .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
        .in('id', idsToRedeem)
    }
  }

  // Update rewards balance on profile
  const newRewardsBalance = Math.max(0, balance - data.amount)
  await supabase
    .from('profiles')
    .update({ rewards_balance: newRewardsBalance })
    .eq('id', user.id)

  // Create notification
  const methodLabel = data.method === 'cash' ? 'transferred to your account' : 'donated to charity'
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Rewards Redeemed',
    message: `£${data.amount.toFixed(2)} cashback ${methodLabel}`,
    type: 'account',
    action_url: '/rewards',
  })

  revalidatePath('/rewards')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}
