import { createClient } from '@/lib/supabase/server'
import type { InsurancePolicy, InsuranceClaim } from '@/lib/types'

export async function getInsurancePolicies(): Promise<InsurancePolicy[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('insurance_policies')
    .select('*, claims:insurance_claims(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInsurancePolicies error:', error.message)
    const { data: fallback, error: fbErr } = await supabase
      .from('insurance_policies')
      .select('*')
      .order('created_at', { ascending: false })

    if (fbErr) return []
    return (fallback ?? []) as InsurancePolicy[]
  }

  return (data ?? []) as InsurancePolicy[]
}

export async function getInsurancePolicyById(id: string): Promise<InsurancePolicy | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('insurance_policies')
    .select('*, claims:insurance_claims(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getInsurancePolicyById error:', error.message)
    return null
  }

  return data as InsurancePolicy
}

export async function getInsuranceClaims(): Promise<InsuranceClaim[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('insurance_claims')
    .select('*, policy:insurance_policies(*)')
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('getInsuranceClaims error:', error.message)
    const { data: fallback, error: fbErr } = await supabase
      .from('insurance_claims')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (fbErr) return []
    return (fallback ?? []) as InsuranceClaim[]
  }

  return (data ?? []) as InsuranceClaim[]
}
