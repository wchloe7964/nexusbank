'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function makeLoanOverpayment(data: {
  loanId: string
  fromAccountId: string
  amount: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase.rpc('make_loan_overpayment', {
    p_loan_id: data.loanId,
    p_from_account_id: data.fromAccountId,
    p_amount: data.amount,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/my-loans')
  revalidatePath(`/loans/${data.loanId}`)
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}
