import { createClient } from '@/lib/supabase/server'
import type { OpenBankingConsent, ThirdPartyProvider } from '@/lib/types'

export async function getConsents(): Promise<OpenBankingConsent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('open_banking_consents')
    .select('*, provider:third_party_providers!provider_id(id, name, provider_type, fca_reference, logo_url, website, contact_email, status)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (data as OpenBankingConsent[]) || []
}

export async function getActiveConsents(): Promise<OpenBankingConsent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('open_banking_consents')
    .select('*, provider:third_party_providers!provider_id(id, name, provider_type, fca_reference, logo_url, website, contact_email, status)')
    .eq('user_id', user.id)
    .eq('status', 'authorised')
    .order('created_at', { ascending: false })

  return (data as OpenBankingConsent[]) || []
}

export async function getProviders(): Promise<ThirdPartyProvider[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('third_party_providers')
    .select('id, name, provider_type, fca_reference, logo_url, website, contact_email, status, created_at')
    .eq('status', 'active')
    .order('name')

  return (data as ThirdPartyProvider[]) || []
}
