'use server'

import { createClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

export async function revokeConsent(consentId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('open_banking_consents')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
    })
    .eq('id', consentId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to revoke consent' }

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: user.id,
    actorRole: 'customer',
    targetTable: 'open_banking_consents',
    targetId: consentId,
    action: 'consent_revoked',
    details: {},
  })

  return {}
}
