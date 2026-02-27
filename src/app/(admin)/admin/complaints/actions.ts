'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import type { ComplaintStatus } from '@/lib/types/regulatory'

export async function updateComplaintStatus(complaintId: string, status: ComplaintStatus) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  // Fetch current state for audit
  const { data: current } = await admin
    .from('complaints')
    .select('status, reference')
    .eq('id', complaintId)
    .single()

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'acknowledged' && !current?.status?.includes('acknowledged')) {
    updates.acknowledged_at = new Date().toISOString()
  }

  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
  }

  const { error } = await admin
    .from('complaints')
    .update(updates)
    .eq('id', complaintId)

  if (error) throw error

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'complaints',
    targetId: complaintId,
    action: 'update_complaint_status',
    details: {
      reference: current?.reference,
      old_status: current?.status,
      new_status: status,
    },
  })

  revalidatePath('/admin/complaints')
  revalidatePath(`/admin/complaints/${complaintId}`)
}

export async function respondToComplaint(
  complaintId: string,
  input: {
    response: string
    rootCause?: string
    remediation?: string
    compensationAmount?: number
  }
) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('complaints')
    .update({
      response: input.response,
      root_cause: input.rootCause || null,
      remediation: input.remediation || null,
      compensation_amount: input.compensationAmount || 0,
      status: 'response_issued',
      updated_at: new Date().toISOString(),
    })
    .eq('id', complaintId)

  if (error) throw error

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'complaints',
    targetId: complaintId,
    action: 'respond_to_complaint',
    details: {
      has_compensation: (input.compensationAmount ?? 0) > 0,
      compensation_amount: input.compensationAmount,
    },
  })

  revalidatePath('/admin/complaints')
  revalidatePath(`/admin/complaints/${complaintId}`)
}

export async function escalateToFos(
  complaintId: string,
  fosReference: string
) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('complaints')
    .update({
      status: 'escalated_fos',
      fos_reference: fosReference,
      fos_escalated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', complaintId)

  if (error) throw error

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'complaints',
    targetId: complaintId,
    action: 'escalate_to_fos',
    details: { fos_reference: fosReference },
  })

  revalidatePath('/admin/complaints')
  revalidatePath(`/admin/complaints/${complaintId}`)
}
