/**
 * FCA PROD — Product Suitability Assessment
 *
 * Under FCA rules, firms must ensure financial products are suitable
 * for the customer's needs, knowledge, and risk tolerance before sale.
 */

import type {
  ProductType,
  RiskAppetite,
  InvestmentHorizon,
  IncomeBand,
  FinancialKnowledge,
  SuitabilityResult,
} from '@/lib/types/regulatory'

interface SuitabilityInput {
  productType: ProductType
  riskAppetite?: RiskAppetite | null
  investmentHorizon?: InvestmentHorizon | null
  annualIncomeBand?: IncomeBand | null
  existingDebt?: number
  financialKnowledge?: FinancialKnowledge | null
}

interface SuitabilityOutput {
  result: SuitabilityResult
  reasons: string[]
  warnings: string[]
}

/**
 * Assess whether a financial product is suitable for the customer.
 * Returns result, reasons, and FCA-required warnings.
 */
export function assessProductSuitability(input: SuitabilityInput): SuitabilityOutput {
  const reasons: string[] = []
  const warnings: string[] = []
  let score = 0 // 0 = suitable, positive = concerns

  const { productType, riskAppetite, investmentHorizon, annualIncomeBand, existingDebt, financialKnowledge } = input

  // ── Investment products require more scrutiny ──
  const isInvestment = ['investment_isa', 'general_investment'].includes(productType)
  const isCredit = ['credit_card', 'personal_loan', 'mortgage'].includes(productType)

  // Risk warnings for all investment products
  if (isInvestment) {
    warnings.push('Capital at risk: The value of investments can go down as well as up. You may get back less than you invest.')
    warnings.push('Past performance is not a reliable indicator of future results.')

    if (!riskAppetite) {
      score += 2
      reasons.push('Risk appetite not assessed — required for investment products.')
    }

    if (riskAppetite === 'conservative' && productType === 'general_investment') {
      score += 2
      reasons.push('Conservative risk appetite may not align with general investment products.')
      warnings.push('This product carries investment risk that may not match your stated conservative risk appetite.')
    }

    if (financialKnowledge === 'none') {
      score += 2
      reasons.push('Customer has no financial product knowledge — additional guidance recommended.')
      warnings.push('We recommend seeking independent financial advice before proceeding.')
    }

    if (investmentHorizon === 'short_term') {
      score += 1
      reasons.push('Short-term investment horizon increases risk of capital loss.')
      warnings.push('Investment products are generally more suitable for medium to long-term horizons.')
    }
  }

  // Credit product affordability
  if (isCredit) {
    warnings.push('Missing repayments could affect your credit score and lead to additional charges.')

    if (annualIncomeBand === 'under_25k' && productType === 'mortgage') {
      score += 2
      reasons.push('Income band may be insufficient for mortgage affordability requirements.')
    }

    if (existingDebt && existingDebt > 0) {
      const debtThresholds: Record<string, number> = {
        under_25k: 5000,
        '25k_50k': 15000,
        '50k_100k': 30000,
        '100k_250k': 75000,
        over_250k: 150000,
      }
      const threshold = annualIncomeBand ? debtThresholds[annualIncomeBand] ?? 15000 : 15000

      if (existingDebt > threshold) {
        score += 2
        reasons.push('Existing debt level is high relative to income — additional credit may not be affordable.')
        warnings.push('Taking on additional credit with your current debt level may cause financial difficulty.')
      }
    }

    if (productType === 'mortgage') {
      warnings.push('Your home may be repossessed if you do not keep up repayments on your mortgage.')
    }

    if (productType === 'personal_loan' || productType === 'credit_card') {
      warnings.push('Think carefully before securing other debts against your home.')
    }
  }

  // Insurance products
  if (productType === 'insurance_policy') {
    warnings.push('Please read the policy document carefully to understand what is and is not covered.')
    warnings.push('You have 14 days to cancel most insurance policies after purchase (cooling-off period).')
  }

  // Determine result
  let result: SuitabilityResult = 'suitable'
  if (score >= 4) {
    result = 'unsuitable'
    reasons.push('Multiple suitability concerns identified — product may not be appropriate.')
  } else if (score >= 2) {
    result = 'potentially_unsuitable'
    reasons.push('Some concerns identified — customer should review warnings carefully.')
  } else {
    reasons.push('Product appears suitable based on the information provided.')
  }

  return { result, reasons, warnings }
}

/**
 * Get product type display label.
 */
export function getProductTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    savings_account: 'Savings Account',
    current_account: 'Current Account',
    credit_card: 'Credit Card',
    personal_loan: 'Personal Loan',
    mortgage: 'Mortgage',
    investment_isa: 'Investment ISA',
    general_investment: 'General Investment',
    insurance_policy: 'Insurance Policy',
  }
  return labels[type] || type
}
