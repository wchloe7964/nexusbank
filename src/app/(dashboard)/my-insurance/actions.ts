'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth, validateAmount } from '@/lib/validation'

export async function submitInsuranceClaim(data: {
  policyId: string
  claimType: string
  description: string
  amountClaimed: number
}) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  validateAmount(data.amountClaimed, 'Claim amount')

  // Verify policy belongs to user
  const { data: policy, error: policyError } = await supabase
    .from('insurance_policies')
    .select('id')
    .eq('id', data.policyId)
    .eq('user_id', userId)
    .single()

  if (policyError || !policy) throw new Error('Policy not found or access denied')

  // Generate claim reference
  const ref = `CLM-${Date.now().toString(36).toUpperCase()}`

  const { error } = await supabase.from('insurance_claims').insert({
    policy_id: data.policyId,
    user_id: userId,
    claim_reference: ref,
    claim_type: data.claimType,
    description: data.description,
    amount_claimed: data.amountClaimed,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)

  revalidatePath('/my-insurance')
  revalidatePath(`/my-insurance/${data.policyId}`)
  return { success: true, claimReference: ref }
}

export async function toggleAutoRenew(policyId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Verify policy belongs to user
  const { data: policy, error: fetchError } = await supabase
    .from('insurance_policies')
    .select('auto_renew')
    .eq('id', policyId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !policy) throw new Error('Policy not found or access denied')

  const { error } = await supabase
    .from('insurance_policies')
    .update({ auto_renew: !policy.auto_renew, updated_at: new Date().toISOString() })
    .eq('id', policyId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)

  revalidatePath('/my-insurance')
  revalidatePath(`/my-insurance/${policyId}`)
  return { success: true, newValue: !policy.auto_renew }
}
