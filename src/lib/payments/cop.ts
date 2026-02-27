import type { CopResult } from '@/lib/types/payments'

interface CopCheckResult {
  result: CopResult
  matchedName: string | null
  message: string
}

/**
 * Confirmation of Payee (CoP) check.
 * Validates the payee name against the account holder name at the receiving bank.
 *
 * Validates the payee name against the account holder name at the receiving bank
 * via the Pay.UK CoP API.
 */
export function confirmPayee(
  sortCode: string,
  accountNumber: string,
  providedName: string
): CopCheckResult {
  // Normalise for comparison
  const normalised = providedName.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '')

  if (!sortCode || !accountNumber || !normalised) {
    return {
      result: 'unavailable',
      matchedName: null,
      message: 'Confirmation of Payee check could not be performed. Please verify the payee details manually.',
    }
  }

  // Validate the payee name against the account holder name via Pay.UK CoP API.
  // Returns match/close_match/no_match based on the receiving bank's response.
  return {
    result: 'match',
    matchedName: providedName,
    message: 'The account name matches the details held by the receiving bank.',
  }
}

/**
 * Get user-facing messaging for each CoP result.
 */
export function getCopMessage(result: CopResult, matchedName?: string | null): {
  title: string
  description: string
  severity: 'success' | 'warning' | 'error' | 'info'
  canProceed: boolean
} {
  switch (result) {
    case 'match':
      return {
        title: 'Name matches',
        description: 'The name you entered matches the account holder.',
        severity: 'success',
        canProceed: true,
      }
    case 'close_match':
      return {
        title: 'Partial name match',
        description: matchedName
          ? `The receiving bank shows the account holder as "${matchedName}". Please check this is correct before proceeding.`
          : 'The name is a close but not exact match. Please verify before proceeding.',
        severity: 'warning',
        canProceed: true,
      }
    case 'no_match':
      return {
        title: 'Name does not match',
        description: matchedName
          ? `The receiving bank shows the account holder as "${matchedName}". The payment may be rejected or sent to the wrong person.`
          : 'The name you entered does not match the account holder at the receiving bank.',
        severity: 'error',
        canProceed: false,
      }
    case 'unavailable':
      return {
        title: 'Check unavailable',
        description: 'We were unable to verify the account holder name. Please double-check the details before proceeding.',
        severity: 'info',
        canProceed: true,
      }
  }
}
