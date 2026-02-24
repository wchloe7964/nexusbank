'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPayee(data: {
  name: string
  sortCode: string
  accountNumber: string
  reference?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.from('payees').insert({
    user_id: user.id,
    name: data.name,
    sort_code: data.sortCode,
    account_number: data.accountNumber,
    reference: data.reference || null,
    is_favourite: false,
  })

  if (error) throw error
  revalidatePath('/payees')
}

export async function togglePayeeFavourite(payeeId: string, isFavourite: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('payees')
    .update({ is_favourite: isFavourite })
    .eq('id', payeeId)

  if (error) throw error
  revalidatePath('/payees')
}

export async function deletePayee(payeeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('payees')
    .delete()
    .eq('id', payeeId)

  if (error) throw error
  revalidatePath('/payees')
}
