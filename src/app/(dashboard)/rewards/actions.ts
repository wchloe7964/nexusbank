'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount } from '@/lib/validation'

export async function redeemRewards(data: {
  amount: number
  method: 'cash' | 'charity'
  accountId?: string
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.amount, 'Redemption amount')

  if (data.method === 'cash' && !data.accountId) {
    throw new Error('Please select an account')
  }

  // Use the atomic RPC — handles locking, balance checks, reward marking,
  // profile update, and transaction record creation in a single transaction
  const { data: txId, error: rpcError } = await supabase.rpc('redeem_rewards', {
    p_amount: data.amount,
    p_method: data.method,
    p_account_id: data.accountId || null,
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  // Create notification (best-effort, non-critical)
  const methodLabel = data.method === 'cash' ? 'transferred to your account' : 'donated to charity'
  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Rewards Redeemed',
    message: `£${data.amount.toFixed(2)} cashback ${methodLabel}`,
    type: 'account',
    action_url: '/rewards',
  })

  revalidatePath('/rewards')
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
}
