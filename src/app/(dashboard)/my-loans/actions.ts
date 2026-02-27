'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount, verifyAccountOwnership } from '@/lib/validation'

export async function makeLoanOverpayment(data: {
  loanId: string
  fromAccountId: string
  amount: number
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.amount, 'Overpayment amount')

  // Verify the account belongs to the user
  await verifyAccountOwnership(supabase, data.fromAccountId, userId)

  // Verify the loan belongs to the user
  const { data: loan, error: loanError } = await supabase
    .from('loans')
    .select('id, user_id')
    .eq('id', data.loanId)
    .eq('user_id', userId)
    .single()

  if (loanError || !loan) throw new Error('Loan not found or access denied')

  // RPC handles locking, balance checks, and atomicity
  const { error } = await supabase.rpc('make_loan_overpayment', {
    p_loan_id: data.loanId,
    p_from_account_id: data.fromAccountId,
    p_amount: data.amount,
  })

  if (error) throw new Error(error.message)

  revalidatePath('/my-loans')
  revalidatePath(`/my-loans/${data.loanId}`)
  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  return { success: true }
}
