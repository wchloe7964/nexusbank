export type KycVerificationLevel = 'basic' | 'standard' | 'enhanced'
export type KycStatus = 'pending' | 'documents_required' | 'under_review' | 'verified' | 'failed' | 'expired'
export type RiskRating = 'low' | 'medium' | 'high' | 'very_high'
export type CustomerCategory = 'retail' | 'business' | 'premium' | 'high_net_worth'

export type KycDocumentType = 'passport' | 'driving_licence' | 'national_id' | 'utility_bill' | 'bank_statement' | 'tax_return' | 'council_tax'
export type KycDocumentCategory = 'identity' | 'address' | 'financial'
export type KycDocumentStatus = 'uploaded' | 'reviewing' | 'accepted' | 'rejected'

export type AmlAlertType = 'large_transaction' | 'velocity' | 'pattern' | 'sanctions_hit' | 'pep_activity' | 'structuring' | 'unusual_activity'
export type AmlAlertSeverity = 'low' | 'medium' | 'high' | 'critical'
export type AmlAlertStatus = 'new' | 'investigating' | 'escalated' | 'dismissed' | 'reported'

export interface KycVerification {
  id: string
  user_id: string
  verification_level: KycVerificationLevel
  status: KycStatus
  risk_rating: RiskRating
  identity_verified: boolean
  address_verified: boolean
  source_of_funds: string | null
  source_of_wealth: string | null
  pep_status: boolean
  sanctions_checked: boolean
  sanctions_clear: boolean
  next_review_date: string | null
  verified_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
  documents?: KycDocument[]
  profile?: { full_name: string; email: string } | null
}

export interface KycDocument {
  id: string
  kyc_id: string
  user_id: string
  document_type: KycDocumentType
  document_category: KycDocumentCategory
  file_name: string
  file_url: string | null
  status: KycDocumentStatus
  rejection_reason: string | null
  expires_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface AmlAlert {
  id: string
  user_id: string
  transaction_id: string | null
  alert_type: AmlAlertType
  severity: AmlAlertSeverity
  trigger_amount: number | null
  trigger_data: Record<string, unknown>
  status: AmlAlertStatus
  sar_filed: boolean
  sar_reference: string | null
  assigned_to: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  profile?: { full_name: string; email: string } | null
}

export interface AmlDashboardStats {
  new_alerts: number
  investigating: number
  critical_alerts: number
  sars_filed: number
  pending_kyc: number
  high_risk_customers: number
}
