'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { AuditEventType } from '@/lib/types/audit'

interface AuditLogParams {
  eventType: AuditEventType
  actorId: string | null
  actorRole?: string | null
  targetTable?: string | null
  targetId?: string | null
  action: string
  details?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

/**
 * Core audit logging function.
 * Uses SECURITY DEFINER RPC to bypass RLS for append-only writes.
 * Call this from every server action and query that modifies or accesses data.
 */
export async function logAuditEvent({
  eventType,
  actorId,
  actorRole = null,
  targetTable = null,
  targetId = null,
  action,
  details = {},
  ipAddress = null,
  userAgent = null,
}: AuditLogParams): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.rpc('insert_audit_log', {
      p_event_type: eventType,
      p_actor_id: actorId,
      p_actor_role: actorRole,
      p_target_table: targetTable,
      p_target_id: targetId,
      p_action: action,
      p_details: details,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    })
  } catch {
    // Audit logging should never break the main operation
    console.error('[AUDIT] Failed to log event:', action)
  }
}
