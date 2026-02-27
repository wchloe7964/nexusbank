export type ComplaintCategory =
  | 'service_quality' | 'fees_charges' | 'product_performance'
  | 'mis_selling' | 'data_privacy' | 'fraud_scam'
  | 'accessibility' | 'account_management' | 'payment_issues' | 'other'

export type ComplaintStatus =
  | 'received' | 'acknowledged' | 'investigating' | 'response_issued'
  | 'resolved' | 'escalated_fos' | 'closed'

export type ComplaintPriority = 'standard' | 'urgent' | 'vulnerable_customer'

export interface Complaint {
  id: string
  user_id: string
  reference: string
  category: ComplaintCategory
  subject: string
  description: string
  status: ComplaintStatus
  priority: ComplaintPriority
  assigned_to: string | null
  acknowledged_at: string | null
  deadline_at: string
  resolved_at: string | null
  response: string | null
  root_cause: string | null
  remediation: string | null
  compensation_amount: number
  fos_reference: string | null
  fos_escalated_at: string | null
  fos_outcome: string | null
  created_at: string
  updated_at: string
  profiles?: { full_name: string | null; email: string | null } | null
  assigned_profile?: { full_name: string | null } | null
}

export type ProductType =
  | 'savings_account' | 'current_account' | 'credit_card' | 'personal_loan'
  | 'mortgage' | 'investment_isa' | 'general_investment' | 'insurance_policy'

export type RiskAppetite = 'conservative' | 'moderate' | 'balanced' | 'growth' | 'aggressive'
export type InvestmentHorizon = 'short_term' | 'medium_term' | 'long_term'
export type IncomeBand = 'under_25k' | '25k_50k' | '50k_100k' | '100k_250k' | 'over_250k'
export type FinancialKnowledge = 'none' | 'basic' | 'intermediate' | 'advanced'
export type SuitabilityResult = 'suitable' | 'potentially_unsuitable' | 'unsuitable'

export interface ProductSuitability {
  id: string
  user_id: string
  product_type: ProductType
  risk_appetite: RiskAppetite | null
  investment_horizon: InvestmentHorizon | null
  annual_income_band: IncomeBand | null
  existing_debt: number
  financial_knowledge: FinancialKnowledge | null
  assessment_result: SuitabilityResult
  assessment_reasons: string[]
  warnings_shown: string[]
  customer_acknowledged: boolean
  assessed_by: string
  created_at: string
}

export type ReturnType =
  | 'capital_adequacy' | 'liquidity' | 'large_exposures' | 'complaints_data'
  | 'fraud_data' | 'psd2_reporting' | 'aml_returns' | 'operational_risk'

export type ReturnStatus = 'draft' | 'in_review' | 'approved' | 'submitted' | 'accepted' | 'rejected'

export interface RegulatoryReturn {
  id: string
  return_type: ReturnType
  period_start: string
  period_end: string
  submission_deadline: string
  status: ReturnStatus
  data: Record<string, unknown>
  submitted_at: string | null
  submitted_by: string | null
  approved_by: string | null
  gabriel_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CapitalAdequacy {
  id: string
  reporting_date: string
  tier1_capital: number
  tier2_capital: number
  total_capital: number
  risk_weighted_assets: number
  capital_ratio: number
  tier1_ratio: number
  minimum_requirement: number
  buffer_requirement: number
  is_compliant: boolean
  liquidity_coverage_ratio: number | null
  leverage_ratio: number | null
  notes: string | null
  recorded_by: string | null
  created_at: string
}

export interface ComplaintsDashboardStats {
  total: number
  open: number
  overdue: number
  escalated_fos: number
  avg_resolution_days: number
  compensation_total: number
  by_category: { category: string; count: number }[]
  by_status: { status: string; count: number }[]
}
