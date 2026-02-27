import { createAdminClient } from '@/lib/supabase/admin'
import type { PciAccessType } from '@/lib/types/pci'

/**
 * Log PCI-DSS compliant access to card data.
 * Uses SECURITY DEFINER RPC for append-only writes.
 */
export async function logPciAccess(params: {
  actorId: string | null
  actorRole: string
  accessType: PciAccessType
  cardId?: string | null
  tokenId?: string | null
  reason?: string | null
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.rpc('insert_pci_access_log', {
      p_actor_id: params.actorId,
      p_actor_role: params.actorRole,
      p_access_type: params.accessType,
      p_card_id: params.cardId || null,
      p_token_id: params.tokenId || null,
      p_reason: params.reason || null,
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
    })
  } catch {
    console.error('[PCI] Failed to log access:', params.accessType)
  }
}
