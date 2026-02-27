import { createAdminClient } from '@/lib/supabase/admin'
import type { InterestConfig, InterestAccrual } from '@/lib/types/limits'

export async function getInterestConfigs() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('interest_config')
    .select('*')
    .order('account_type')

  if (error) throw error
  return (data ?? []) as InterestConfig[]
}

export async function getInterestAccruals(accountId: string, limit = 30) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('interest_accruals')
    .select('*')
    .eq('account_id', accountId)
    .order('accrual_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as InterestAccrual[]
}

export async function getInterestStats() {
  const admin = createAdminClient()

  // Total accrued interest (unpaid)
  const { data: unpaid } = await admin
    .from('interest_accruals')
    .select('daily_amount')
    .eq('is_paid', false)

  const totalUnpaid = (unpaid ?? []).reduce((sum, a) => sum + Number(a.daily_amount), 0)

  // Total paid
  const { data: paid } = await admin
    .from('interest_accruals')
    .select('daily_amount')
    .eq('is_paid', true)

  const totalPaid = (paid ?? []).reduce((sum, a) => sum + Number(a.daily_amount), 0)

  // Count of active configs
  const { count: activeConfigs } = await admin
    .from('interest_config')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return {
    totalUnpaid: Math.round(totalUnpaid * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    totalAccrued: Math.round((totalUnpaid + totalPaid) * 100) / 100,
    activeConfigs: activeConfigs ?? 0,
  }
}
