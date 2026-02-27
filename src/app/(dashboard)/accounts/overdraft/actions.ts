'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/validation'

export async function requestOverdraftIncrease(data: {
  accountId: string
  requestedLimit: number
  reason?: string
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Validate the requested limit
  if (!Number.isFinite(data.requestedLimit) || data.requestedLimit <= 0 || data.requestedLimit > 25000) {
    throw new Error('Overdraft limit must be between £1 and £25,000')
  }

  // Use the atomic RPC — handles locking, ownership verification,
  // account type check, available_balance update, and audit logging
  const { error: rpcError } = await supabase.rpc('change_overdraft_limit', {
    p_account_id: data.accountId,
    p_new_limit: data.requestedLimit,
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  // Create notification (best-effort)
  await supabase.from('notifications').insert({
    user_id: userId,
    title: 'Overdraft Increase Approved',
    message: `Your overdraft has been increased to £${data.requestedLimit.toLocaleString()}.`,
    type: 'account',
    action_url: '/accounts/overdraft',
  })

  revalidatePath('/accounts')
  revalidatePath('/accounts/overdraft')
  revalidatePath(`/accounts/${data.accountId}`)
}
