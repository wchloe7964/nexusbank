'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/validation/admin'
import { logAuditEvent } from '@/lib/audit'
import type { ReturnStatus, ReturnType as RegReturnType } from '@/lib/types/regulatory'

export async function generateRegulatoryReturn(input: {
  returnType: RegReturnType
  periodStart: string
  periodEnd: string
  submissionDeadline: string
  data?: Record<string, unknown>
  notes?: string
}) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('regulatory_returns')
    .insert({
      return_type: input.returnType,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      submission_deadline: input.submissionDeadline,
      status: 'draft',
      data: input.data || {},
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (error) throw error

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'regulatory_returns',
    targetId: data.id,
    action: 'generate_regulatory_return',
    details: {
      return_type: input.returnType,
      period: `${input.periodStart} - ${input.periodEnd}`,
    },
  })

  revalidatePath('/admin/regulatory')
}

export async function updateRegulatoryReturnStatus(
  returnId: string,
  status: ReturnStatus,
  gabrielReference?: string
) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const { data: current } = await admin
    .from('regulatory_returns')
    .select('status, return_type')
    .eq('id', returnId)
    .single()

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === 'submitted') {
    updates.submitted_at = new Date().toISOString()
    updates.submitted_by = adminUserId
    if (gabrielReference) updates.gabriel_reference = gabrielReference
  }

  if (status === 'approved') {
    updates.approved_by = adminUserId
  }

  const { error } = await admin
    .from('regulatory_returns')
    .update(updates)
    .eq('id', returnId)

  if (error) throw error

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'regulatory_returns',
    targetId: returnId,
    action: 'update_regulatory_return_status',
    details: {
      return_type: current?.return_type,
      old_status: current?.status,
      new_status: status,
      gabriel_reference: gabrielReference,
    },
  })

  revalidatePath('/admin/regulatory')
}

export async function updateCapitalAdequacy(input: {
  reportingDate: string
  tier1Capital: number
  tier2Capital: number
  riskWeightedAssets: number
  liquidityCoverageRatio?: number
  leverageRatio?: number
  notes?: string
}) {
  const adminUserId = await requireAdmin()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('capital_adequacy')
    .insert({
      reporting_date: input.reportingDate,
      tier1_capital: input.tier1Capital,
      tier2_capital: input.tier2Capital,
      risk_weighted_assets: input.riskWeightedAssets,
      liquidity_coverage_ratio: input.liquidityCoverageRatio || null,
      leverage_ratio: input.leverageRatio || null,
      notes: input.notes || null,
      recorded_by: adminUserId,
    })
    .select('id')
    .single()

  if (error) throw error

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: adminUserId,
    actorRole: 'admin',
    targetTable: 'capital_adequacy',
    targetId: data.id,
    action: 'record_capital_adequacy',
    details: {
      reporting_date: input.reportingDate,
      tier1_capital: input.tier1Capital,
      total_capital: input.tier1Capital + input.tier2Capital,
      rwa: input.riskWeightedAssets,
    },
  })

  revalidatePath('/admin/regulatory')
}
