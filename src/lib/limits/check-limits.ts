'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { KycVerificationLevel } from '@/lib/types/kyc'
import type { LimitCheckResult } from '@/lib/types/limits'

/**
 * Check whether a transaction is within the user's KYC-level limits.
 * Queries daily and monthly totals from completed transactions.
 */
export async function checkTransactionLimits(
  userId: string,
  amount: number,
  kycLevel: KycVerificationLevel = 'basic'
): Promise<LimitCheckResult> {
  const admin = createAdminClient()

  // Fetch limits for user's KYC level
  const { data: limits } = await admin
    .from('transaction_limits')
    .select('*')
    .eq('kyc_level', kycLevel)
    .eq('is_active', true)
    .maybeSingle()

  // If no limits configured, allow by default
  if (!limits) {
    return {
      allowed: true,
      dailyUsed: 0,
      dailyLimit: 999999,
      monthlyUsed: 0,
      monthlyLimit: 999999,
      singleLimit: 999999,
    }
  }

  // Check single transaction limit
  if (amount > Number(limits.single_transaction_limit)) {
    return {
      allowed: false,
      reason: `This transaction exceeds your single payment limit of £${Number(limits.single_transaction_limit).toLocaleString()}. Please contact us to increase your limits.`,
      dailyUsed: 0,
      dailyLimit: Number(limits.daily_limit),
      monthlyUsed: 0,
      monthlyLimit: Number(limits.monthly_limit),
      singleLimit: Number(limits.single_transaction_limit),
    }
  }

  // Get today's start (UTC)
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  // Get this month's start (UTC)
  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  // Get all user accounts first
  const { data: userAccounts } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', userId)

  const accountIds = (userAccounts ?? []).map((a) => a.id)

  if (accountIds.length === 0) {
    return {
      allowed: true,
      dailyUsed: 0,
      dailyLimit: Number(limits.daily_limit),
      monthlyUsed: 0,
      monthlyLimit: Number(limits.monthly_limit),
      singleLimit: Number(limits.single_transaction_limit),
    }
  }

  // Daily total
  const { data: dailyTxns } = await admin
    .from('transactions')
    .select('amount')
    .eq('type', 'debit')
    .eq('status', 'completed')
    .in('account_id', accountIds)
    .gte('transaction_date', todayStart.toISOString())

  const dailyUsed = (dailyTxns ?? []).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  // Monthly total
  const { data: monthlyTxns } = await admin
    .from('transactions')
    .select('amount')
    .eq('type', 'debit')
    .eq('status', 'completed')
    .in('account_id', accountIds)
    .gte('transaction_date', monthStart.toISOString())

  const monthlyUsed = (monthlyTxns ?? []).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

  // Check daily limit
  if (dailyUsed + amount > Number(limits.daily_limit)) {
    return {
      allowed: false,
      reason: `This transaction would exceed your daily limit of £${Number(limits.daily_limit).toLocaleString()}. You have used £${dailyUsed.toLocaleString()} today.`,
      dailyUsed,
      dailyLimit: Number(limits.daily_limit),
      monthlyUsed,
      monthlyLimit: Number(limits.monthly_limit),
      singleLimit: Number(limits.single_transaction_limit),
    }
  }

  // Check monthly limit
  if (monthlyUsed + amount > Number(limits.monthly_limit)) {
    return {
      allowed: false,
      reason: `This transaction would exceed your monthly limit of £${Number(limits.monthly_limit).toLocaleString()}. You have used £${monthlyUsed.toLocaleString()} this month.`,
      dailyUsed,
      dailyLimit: Number(limits.daily_limit),
      monthlyUsed,
      monthlyLimit: Number(limits.monthly_limit),
      singleLimit: Number(limits.single_transaction_limit),
    }
  }

  return {
    allowed: true,
    dailyUsed,
    dailyLimit: Number(limits.daily_limit),
    monthlyUsed,
    monthlyLimit: Number(limits.monthly_limit),
    singleLimit: Number(limits.single_transaction_limit),
  }
}

/**
 * Get the user's KYC verification level for limit lookup.
 * Falls back to 'basic' if no KYC record exists.
 */
export async function getUserKycLevel(userId: string): Promise<KycVerificationLevel> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('kyc_verifications')
    .select('verification_level')
    .eq('user_id', userId)
    .eq('status', 'verified')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (data?.verification_level as KycVerificationLevel) || 'basic'
}
