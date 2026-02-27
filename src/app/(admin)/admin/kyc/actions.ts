'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import { revalidatePath } from 'next/cache'

const VALID_KYC_STATUSES = ['pending', 'documents_required', 'under_review', 'verified', 'failed', 'expired']
const VALID_DOC_STATUSES = ['uploaded', 'reviewing', 'accepted', 'rejected']

export async function updateKycStatus(
  kycId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!kycId || !VALID_KYC_STATUSES.includes(status)) {
    throw new Error('Invalid KYC ID or status')
  }

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (notes?.trim()) updateData.notes = notes.trim()
  if (status === 'verified') {
    updateData.verified_by = adminUserId
    updateData.identity_verified = true
    updateData.address_verified = true
    // Set next review in 12 months
    const nextReview = new Date()
    nextReview.setFullYear(nextReview.getFullYear() + 1)
    updateData.next_review_date = nextReview.toISOString().split('T')[0]
  }

  const { error } = await admin
    .from('kyc_verifications')
    .update(updateData)
    .eq('id', kycId)

  if (error) throw new Error(error.message)

  // Update profile kyc_status
  const { data: kyc } = await admin
    .from('kyc_verifications')
    .select('user_id')
    .eq('id', kycId)
    .single()

  if (kyc) {
    const profileUpdate: Record<string, unknown> = {
      kyc_status: status === 'verified' ? 'verified' : status === 'failed' ? 'failed' : 'pending',
    }
    if (status === 'verified') {
      profileUpdate.kyc_verified_at = new Date().toISOString()
      profileUpdate.kyc_next_review = updateData.next_review_date
    }

    await admin
      .from('profiles')
      .update(profileUpdate)
      .eq('id', kyc.user_id)

    await admin.from('notifications').insert({
      user_id: kyc.user_id,
      title: 'KYC Verification Update',
      message: status === 'verified'
        ? 'Your identity verification has been approved.'
        : `Your verification status has been updated to: ${status.replace(/_/g, ' ')}`,
      type: 'security',
      is_read: false,
    })
  }

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'kyc_verifications',
    targetId: kycId,
    action: 'kyc_status_updated',
    details: { new_status: status, notes: notes?.trim() || null },
  })

  revalidatePath('/admin/kyc')
  return { success: true }
}

export async function reviewKycDocument(
  documentId: string,
  status: string,
  rejectionReason?: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  if (!documentId || !VALID_DOC_STATUSES.includes(status)) {
    throw new Error('Invalid document ID or status')
  }

  const updateData: Record<string, unknown> = {
    status,
    reviewed_by: adminUserId,
    updated_at: new Date().toISOString(),
  }

  if (status === 'rejected' && rejectionReason?.trim()) {
    updateData.rejection_reason = rejectionReason.trim()
  }

  const { error } = await admin
    .from('kyc_documents')
    .update(updateData)
    .eq('id', documentId)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'kyc_documents',
    targetId: documentId,
    action: 'kyc_document_reviewed',
    details: { new_status: status, rejection_reason: rejectionReason?.trim() || null },
  })

  revalidatePath('/admin/kyc')
  return { success: true }
}

export async function updateAmlAlertStatus(
  alertId: string,
  status: string,
  notes?: string,
  sarReference?: string
): Promise<{ success: boolean }> {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const validStatuses = ['new', 'investigating', 'escalated', 'dismissed', 'reported']
  if (!alertId || !validStatuses.includes(status)) {
    throw new Error('Invalid alert ID or status')
  }

  const updateData: Record<string, unknown> = {
    status,
    assigned_to: adminUserId,
    updated_at: new Date().toISOString(),
  }

  if (notes?.trim()) updateData.resolution_notes = notes.trim()
  if (status === 'reported') {
    updateData.sar_filed = true
    if (sarReference?.trim()) updateData.sar_reference = sarReference.trim()
  }

  const { error } = await admin
    .from('aml_alerts')
    .update(updateData)
    .eq('id', alertId)

  if (error) throw new Error(error.message)

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'aml_alerts',
    targetId: alertId,
    action: 'aml_alert_status_updated',
    details: {
      new_status: status,
      sar_filed: status === 'reported',
      sar_reference: sarReference?.trim() || null,
    },
  })

  revalidatePath('/admin/aml')
  return { success: true }
}
