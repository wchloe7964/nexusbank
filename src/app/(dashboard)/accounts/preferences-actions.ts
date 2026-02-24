'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateAccountPreferences(
  accountId: string,
  data: {
    nickname?: string | null
    color?: string
    icon?: string
    hideFromDashboard?: boolean
  }
) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Verify the account belongs to user
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .single()

  if (accountError || !account) throw new Error('Account not found')

  // Clean nickname
  const nickname = data.nickname?.trim() || null

  if (nickname && nickname.length > 30) throw new Error('Nickname must be 30 characters or less')

  const { error: updateError } = await supabase
    .from('accounts')
    .update({
      nickname,
      color: data.color ?? 'blue',
      icon: data.icon ?? 'wallet',
      hide_from_dashboard: data.hideFromDashboard ?? false,
    })
    .eq('id', accountId)

  if (updateError) throw new Error('Failed to update account preferences')

  revalidatePath('/accounts')
  revalidatePath(`/accounts/${accountId}`)
  revalidatePath('/dashboard')
}
