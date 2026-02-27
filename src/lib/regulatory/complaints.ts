/**
 * FCA DISP-compliant complaint handling utilities.
 *
 * Under FCA DISP rules:
 * - Complaints must be acknowledged within 5 business days
 * - Final response within 8 weeks (56 calendar days)
 * - If unresolved after 8 weeks, customer can escalate to FOS
 * - Vulnerable customers get priority handling
 */

import { randomInt } from 'crypto'

/**
 * Generate a unique complaint reference in format CMP-YYYY-XXXXXX
 */
export function generateComplaintReference(): string {
  const year = new Date().getFullYear()
  const random = randomInt(0, 999999)
    .toString()
    .padStart(6, '0')
  return `CMP-${year}-${random}`
}

/**
 * Calculate the 8-week FCA deadline from complaint creation date.
 * 8 weeks = 56 calendar days.
 */
export function calculateDeadline(createdAt: Date): Date {
  const deadline = new Date(createdAt)
  deadline.setDate(deadline.getDate() + 56)
  return deadline
}

/**
 * Calculate remaining days until FCA deadline.
 * Negative means overdue.
 */
export function daysUntilDeadline(deadlineAt: string | Date): number {
  const deadline = new Date(deadlineAt)
  const now = new Date()
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Determine if a complaint is overdue per FCA rules.
 */
export function isOverdue(deadlineAt: string | Date, status: string): boolean {
  if (['resolved', 'closed', 'escalated_fos'].includes(status)) return false
  return daysUntilDeadline(deadlineAt) < 0
}

/**
 * Get urgency label and colour for complaint deadline.
 */
export function getDeadlineUrgency(deadlineAt: string | Date, status: string): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  if (['resolved', 'closed'].includes(status)) {
    return { label: 'Closed', variant: 'secondary' }
  }
  if (status === 'escalated_fos') {
    return { label: 'FOS', variant: 'destructive' }
  }

  const days = daysUntilDeadline(deadlineAt)

  if (days < 0) return { label: `${Math.abs(days)}d overdue`, variant: 'destructive' }
  if (days <= 7) return { label: `${days}d left`, variant: 'destructive' }
  if (days <= 21) return { label: `${days}d left`, variant: 'default' }
  return { label: `${days}d left`, variant: 'secondary' }
}

/**
 * Category display labels.
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    service_quality: 'Service Quality',
    fees_charges: 'Fees & Charges',
    product_performance: 'Product Performance',
    mis_selling: 'Mis-selling',
    data_privacy: 'Data Privacy',
    fraud_scam: 'Fraud / Scam',
    accessibility: 'Accessibility',
    account_management: 'Account Management',
    payment_issues: 'Payment Issues',
    other: 'Other',
  }
  return labels[category] || category
}

/**
 * Status display labels.
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    received: 'Received',
    acknowledged: 'Acknowledged',
    investigating: 'Investigating',
    response_issued: 'Response Issued',
    resolved: 'Resolved',
    escalated_fos: 'Escalated to FOS',
    closed: 'Closed',
  }
  return labels[status] || status
}
