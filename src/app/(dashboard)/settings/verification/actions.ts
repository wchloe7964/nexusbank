'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/validation'
import { revalidatePath } from 'next/cache'

interface SubmitKycPayload {
  documentType: 'passport' | 'driving_licence' | 'national_id'
  documentNumber: string
  expiryDate: string
  addressDocumentType: 'utility_bill' | 'bank_statement' | 'council_tax'
  fullName: string
  dateOfBirth: string
  addressLine1: string
  addressLine2?: string
  city: string
  postcode: string
}

export async function submitKycApplication(payload: SubmitKycPayload) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Check if user already has an active application
  const { data: existing } = await supabase
    .from('kyc_verifications')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ['pending', 'under_review'])
    .limit(1)
    .maybeSingle()

  if (existing) {
    return { error: 'You already have a verification application in progress.' }
  }

  // Create KYC verification record
  const { data: kycRecord, error: kycError } = await supabase
    .from('kyc_verifications')
    .insert({
      user_id: userId,
      verification_level: 'standard',
      status: 'pending',
      risk_rating: 'low',
      identity_verified: false,
      address_verified: false,
      notes: `Online submission — ID: ${payload.documentType} (${payload.documentNumber}), Address proof: ${payload.addressDocumentType}`,
    })
    .select('id')
    .single()

  if (kycError || !kycRecord) {
    console.error('KYC creation error:', kycError?.message)
    return { error: 'Failed to submit your application. Please try again.' }
  }

  // Create document records — identity document
  const { error: idDocError } = await supabase
    .from('kyc_documents')
    .insert({
      kyc_id: kycRecord.id,
      user_id: userId,
      document_type: payload.documentType,
      document_category: 'identity',
      file_name: `${payload.documentType}_${payload.documentNumber}`,
      status: 'uploaded',
      expires_at: payload.expiryDate || null,
    })

  if (idDocError) {
    console.error('ID doc error:', idDocError.message)
  }

  // Create document records — address document
  const { error: addrDocError } = await supabase
    .from('kyc_documents')
    .insert({
      kyc_id: kycRecord.id,
      user_id: userId,
      document_type: payload.addressDocumentType,
      document_category: 'address',
      file_name: `${payload.addressDocumentType}_proof`,
      status: 'uploaded',
    })

  if (addrDocError) {
    console.error('Address doc error:', addrDocError.message)
  }

  // Update profile kyc_status to pending
  await supabase
    .from('profiles')
    .update({ kyc_status: 'pending' })
    .eq('id', userId)

  revalidatePath('/settings/verification')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function cancelKycApplication() {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  // Find active application
  const { data: existing } = await supabase
    .from('kyc_verifications')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['pending', 'documents_required'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!existing) {
    return { error: 'No active application found.' }
  }

  // Update status to failed (withdrawn)
  await supabase
    .from('kyc_verifications')
    .update({ status: 'failed', notes: 'Application withdrawn by customer' })
    .eq('id', existing.id)

  // Reset profile status
  await supabase
    .from('profiles')
    .update({ kyc_status: 'not_started' })
    .eq('id', userId)

  revalidatePath('/settings/verification')
  revalidatePath('/dashboard')

  return { success: true }
}
