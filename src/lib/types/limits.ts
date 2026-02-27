import type { KycVerificationLevel } from './kyc'

// ── Transaction Limits ──

export interface TransactionLimit {
  id: string
  kyc_level: KycVerificationLevel
  daily_limit: number
  monthly_limit: number
  single_transaction_limit: number
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LimitCheckResult {
  allowed: boolean
  reason?: string
  dailyUsed: number
  dailyLimit: number
  monthlyUsed: number
  monthlyLimit: number
  singleLimit: number
}

// ── SCA (Strong Customer Authentication) ──

export interface ScaChallenge {
  id: string
  user_id: string
  challenge_code: string
  action: string
  metadata: Record<string, unknown>
  attempts: number
  max_attempts: number
  verified: boolean
  verified_at: string | null
  expires_at: string
  created_at: string
}

export interface ScaConfig {
  amount_threshold: number
  enabled: boolean
  max_attempts: number
  expiry_seconds: number
  sensitive_actions: string[]
}

export interface ScaChallengeResult {
  challengeId: string
  expiresAt: string
}

// ── Cooling Period ──

export interface CoolingPeriodConfig {
  id: string
  payment_rail: string
  cooling_hours: number
  is_active: boolean
  description: string | null
  updated_at: string
}

export interface CoolingCheckResult {
  allowed: boolean
  reason?: string
  hoursRemaining?: number
}

// ── SAR (Suspicious Activity Reports) ──

export type SarStatus = 'draft' | 'pending_review' | 'submitted' | 'acknowledged' | 'rejected'

export interface SuspiciousActivityReport {
  id: string
  aml_alert_id: string | null
  user_id: string
  filed_by: string
  sar_reference: string | null
  status: SarStatus
  reason: string
  suspicious_activity_description: string
  transaction_ids: string[]
  total_amount: number | null
  period_start: string | null
  period_end: string | null
  nca_reference: string | null
  submitted_at: string | null
  acknowledged_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  profile?: { full_name: string; email: string } | null
  filed_by_profile?: { full_name: string; email: string } | null
}

export interface SarDashboardStats {
  total: number
  draft: number
  pending_review: number
  submitted: number
  acknowledged: number
  this_month: number
  total_amount: number
}

// ── Interest ──

export interface InterestConfig {
  id: string
  account_type: string
  annual_rate: number
  description: string | null
  is_active: boolean
  effective_from: string
  created_at: string
  updated_at: string
}

export interface InterestAccrual {
  id: string
  account_id: string
  accrual_date: string
  balance_snapshot: number
  annual_rate: number
  daily_amount: number
  is_paid: boolean
  paid_at: string | null
  created_at: string
}

export interface InterestSummary {
  accountId: string
  totalAccrued: number
  totalPaid: number
  pendingAmount: number
  currentRate: number
  dayCount: number
}
