export type PaymentRail = 'fps' | 'bacs' | 'chaps' | 'internal'
export type RailStatus = 'initiated' | 'submitted' | 'processing' | 'settled' | 'failed' | 'returned'
export type CopResult = 'match' | 'close_match' | 'no_match' | 'unavailable'

export interface PaymentSubmission {
  id: string
  transaction_id: string | null
  user_id: string
  rail: PaymentRail
  rail_status: RailStatus
  amount: number
  currency_code: string
  payee_name: string | null
  payee_sort_code: string | null
  payee_account_number: string | null
  reference: string | null
  cop_result: CopResult | null
  cop_matched_name: string | null
  fraud_score_id: string | null
  aml_checked: boolean
  settlement_date: string | null
  failure_reason: string | null
  submitted_at: string | null
  settled_at: string | null
  created_at: string
  updated_at: string
  profile?: { full_name: string; email: string } | null
}

export interface PaymentSchemeConfig {
  id: string
  rail: PaymentRail
  display_name: string
  max_amount: number
  clearing_days: number
  cutoff_time: string | null
  fee: number
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface PaymentRailsStats {
  pending: number
  settled_today: number
  failed_7d: number
  volume_today: number
  fps_today: number
  bacs_processing: number
  chaps_today: number
}
