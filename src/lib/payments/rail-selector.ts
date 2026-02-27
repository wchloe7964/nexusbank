import type { PaymentRail } from '@/lib/types/payments'

interface RailSelection {
  rail: PaymentRail
  displayName: string
  estimatedSettlement: string
  fee: number
  reason: string
}

/**
 * Select the optimal payment rail based on amount, urgency and time.
 * Rules:
 * - Internal transfers always use 'internal' rail
 * - >£1M → CHAPS (only option)
 * - Urgent or >£250k → CHAPS (same-day, fee applies)
 * - Standard <£1M → FPS (instant, free)
 * - Bulk/non-urgent → BACS (3-day, free)
 */
export function selectPaymentRail(
  amount: number,
  options: {
    isInternal?: boolean
    isUrgent?: boolean
    isBulk?: boolean
  } = {}
): RailSelection {
  if (options.isInternal) {
    return {
      rail: 'internal',
      displayName: 'Internal Transfer',
      estimatedSettlement: 'Instant',
      fee: 0,
      reason: 'Transfer between NexusBank accounts',
    }
  }

  if (amount > 1_000_000) {
    return {
      rail: 'chaps',
      displayName: 'CHAPS',
      estimatedSettlement: 'Same day (by 4:30pm)',
      fee: 25,
      reason: 'Amount exceeds FPS limit of £1,000,000',
    }
  }

  if (options.isUrgent || amount > 250_000) {
    // Check CHAPS cutoff (2:30pm weekdays)
    const now = new Date()
    const hour = now.getHours()
    const day = now.getDay()
    const isWeekday = day >= 1 && day <= 5
    const beforeCutoff = hour < 14 || (hour === 14 && now.getMinutes() < 30)

    if (isWeekday && beforeCutoff) {
      return {
        rail: 'chaps',
        displayName: 'CHAPS',
        estimatedSettlement: 'Same day (by 4:30pm)',
        fee: 25,
        reason: options.isUrgent
          ? 'Urgent payment — guaranteed same-day settlement'
          : 'High-value payment routed via CHAPS for same-day settlement',
      }
    }

    // After cutoff, fall through to FPS if under limit
    if (amount <= 1_000_000) {
      return {
        rail: 'fps',
        displayName: 'Faster Payments',
        estimatedSettlement: 'Usually within 2 hours',
        fee: 0,
        reason: 'CHAPS cutoff passed — routed via Faster Payments',
      }
    }
  }

  if (options.isBulk) {
    return {
      rail: 'bacs',
      displayName: 'BACS',
      estimatedSettlement: '3 working days',
      fee: 0,
      reason: 'Bulk payment — routed via BACS',
    }
  }

  return {
    rail: 'fps',
    displayName: 'Faster Payments',
    estimatedSettlement: 'Usually within 2 hours',
    fee: 0,
    reason: 'Standard payment via Faster Payments Service',
  }
}
