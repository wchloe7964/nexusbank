import { createAdminClient } from '@/lib/supabase/admin'
import type { TransactionLimit, CoolingPeriodConfig } from '@/lib/types/limits'

export async function getTransactionLimits() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('transaction_limits')
    .select('*')
    .order('kyc_level')

  if (error) throw error
  return (data ?? []) as TransactionLimit[]
}

export async function getCoolingPeriodConfigs() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('cooling_period_config')
    .select('*')
    .order('payment_rail')

  if (error) throw error
  return (data ?? []) as CoolingPeriodConfig[]
}

export async function getScaConfigRows() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('sca_config')
    .select('*')
    .order('config_key')

  if (error) throw error
  return data ?? []
}
