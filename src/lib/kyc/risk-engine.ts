import type { RiskRating } from '@/lib/types/kyc'

interface RiskFactors {
  transactionVolume30d: number
  largestSingleTransaction: number
  isPep: boolean
  customerCategory: string
  countryRisk: string
  accountAge: number // days
  hasVerifiedIdentity: boolean
  hasVerifiedAddress: boolean
  suspiciousActivityCount: number
}

interface RiskResult {
  rating: RiskRating
  score: number
  factors: { factor: string; points: number; description: string }[]
}

/**
 * Rule-based customer risk scoring.
 * Score 0–100: 0–25 = low, 26–50 = medium, 51–75 = high, 76+ = very_high
 */
export function calculateRiskRating(factors: RiskFactors): RiskResult {
  const result: RiskResult['factors'] = []
  let score = 0

  // PEP status: +30
  if (factors.isPep) {
    score += 30
    result.push({ factor: 'pep_status', points: 30, description: 'Politically Exposed Person' })
  }

  // High transaction volume: +10–25
  if (factors.transactionVolume30d > 100000) {
    score += 25
    result.push({ factor: 'high_volume', points: 25, description: 'Transaction volume >£100k in 30 days' })
  } else if (factors.transactionVolume30d > 50000) {
    score += 15
    result.push({ factor: 'elevated_volume', points: 15, description: 'Transaction volume >£50k in 30 days' })
  } else if (factors.transactionVolume30d > 20000) {
    score += 10
    result.push({ factor: 'moderate_volume', points: 10, description: 'Transaction volume >£20k in 30 days' })
  }

  // Large single transaction: +10–20
  if (factors.largestSingleTransaction > 10000) {
    score += 20
    result.push({ factor: 'large_transaction', points: 20, description: 'Single transaction >£10,000' })
  } else if (factors.largestSingleTransaction > 5000) {
    score += 10
    result.push({ factor: 'elevated_transaction', points: 10, description: 'Single transaction >£5,000' })
  }

  // Customer category
  if (factors.customerCategory === 'high_net_worth') {
    score += 10
    result.push({ factor: 'hnw_customer', points: 10, description: 'High net worth customer category' })
  }

  // New account (<90 days): +10
  if (factors.accountAge < 90) {
    score += 10
    result.push({ factor: 'new_account', points: 10, description: 'Account less than 90 days old' })
  }

  // Unverified identity: +15
  if (!factors.hasVerifiedIdentity) {
    score += 15
    result.push({ factor: 'unverified_identity', points: 15, description: 'Identity not verified' })
  }

  // Unverified address: +10
  if (!factors.hasVerifiedAddress) {
    score += 10
    result.push({ factor: 'unverified_address', points: 10, description: 'Address not verified' })
  }

  // Suspicious activity: +15 per incident
  if (factors.suspiciousActivityCount > 0) {
    const points = Math.min(factors.suspiciousActivityCount * 15, 45)
    score += points
    result.push({ factor: 'suspicious_activity', points, description: `${factors.suspiciousActivityCount} suspicious activity flag(s)` })
  }

  // Determine rating
  let rating: RiskRating
  if (score >= 76) rating = 'very_high'
  else if (score >= 51) rating = 'high'
  else if (score >= 26) rating = 'medium'
  else rating = 'low'

  return { rating, score: Math.min(score, 100), factors: result }
}
