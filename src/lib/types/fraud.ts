export type FraudDecision = 'allow' | 'review' | 'block'
export type FraudRuleType = 'velocity' | 'amount' | 'geographic' | 'behavioural' | 'device' | 'time_based'
export type FraudCaseStatus = 'open' | 'investigating' | 'confirmed_fraud' | 'false_positive' | 'closed'
export type FraudCasePriority = 'low' | 'medium' | 'high' | 'critical'

export interface FraudScore {
  id: string
  transaction_id: string | null
  user_id: string
  score: number
  decision: FraudDecision
  factors: { rule: string; points: number; description: string }[]
  model_version: string
  reviewed_by: string | null
  review_decision: string | null
  review_notes: string | null
  created_at: string
  profile?: { full_name: string; email: string } | null
}

export interface FraudRule {
  id: string
  name: string
  description: string | null
  rule_type: FraudRuleType
  conditions: Record<string, unknown>
  weight: number
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface FraudCase {
  id: string
  fraud_score_id: string | null
  user_id: string
  status: FraudCaseStatus
  priority: FraudCasePriority
  assigned_to: string | null
  description: string | null
  resolution: string | null
  amount_at_risk: number | null
  amount_recovered: number
  created_at: string
  updated_at: string
  profile?: { full_name: string; email: string } | null
}

export interface FraudDashboardStats {
  open_cases: number
  blocked_today: number
  review_pending: number
  confirmed_fraud: number
  total_at_risk: number
  total_recovered: number
}
