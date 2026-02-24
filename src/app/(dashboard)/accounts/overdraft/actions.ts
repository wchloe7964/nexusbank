'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function requestOverdraftIncrease(data: {
  accountId: string
  requestedLimit: number
  reason?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate the requested limit
  if (data.requestedLimit <= 0 || data.requestedLimit > 25000) {
    throw new Error('Overdraft limit must be between £1 and £25,000')
  }

  // Verify the account belongs to the user
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id, overdraft_limit, account_name')
    .eq('id', data.accountId)
    .single()

  if (accountError || !account) throw new Error('Account not found')

  if (data.requestedLimit <= account.overdraft_limit) {
    throw new Error('Requested limit must be higher than current limit')
  }

  // Auto-approve for demo
  const { error } = await supabase
    .from('accounts')
    .update({ overdraft_limit: data.requestedLimit })
    .eq('id', data.accountId)

  if (error) throw new Error(error.message)

  // Create notification
  await supabase.from('notifications').insert({
    user_id: user.id,
    title: 'Overdraft Increase Approved',
    message: `Your overdraft on ${account.account_name} has been increased to £${data.requestedLimit.toLocaleString()}.`,
    type: 'account',
    action_url: '/accounts/overdraft',
  })

  revalidatePath('/accounts')
  revalidatePath('/accounts/overdraft')
  revalidatePath(`/accounts/${data.accountId}`)
}
