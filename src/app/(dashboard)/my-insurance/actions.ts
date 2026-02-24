'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitInsuranceClaim(data: {
  policyId: string
  claimType: string
  description: string
  amountClaimed: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Generate claim reference
  const ref = `CLM-${Date.now().toString(36).toUpperCase()}`

  const { error } = await supabase.from('insurance_claims').insert({
    policy_id: data.policyId,
    user_id: user.id,
    claim_reference: ref,
    claim_type: data.claimType,
    description: data.description,
    amount_claimed: data.amountClaimed,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)

  revalidatePath('/my-insurance')
  revalidatePath(`/insurance/${data.policyId}`)
  return { success: true, claimReference: ref }
}

export async function toggleAutoRenew(policyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: policy, error: fetchError } = await supabase
    .from('insurance_policies')
    .select('auto_renew')
    .eq('id', policyId)
    .single()

  if (fetchError || !policy) throw new Error('Policy not found')

  const { error } = await supabase
    .from('insurance_policies')
    .update({ auto_renew: !policy.auto_renew, updated_at: new Date().toISOString() })
    .eq('id', policyId)

  if (error) throw new Error(error.message)

  revalidatePath('/my-insurance')
  revalidatePath(`/insurance/${policyId}`)
  return { success: true, newValue: !policy.auto_renew }
}
