import { createClient } from '@/lib/supabase/server'
import type { CalendarPaymentDay } from '@/lib/types'

export async function getPaymentCalendarData(year: number, month: number): Promise<CalendarPaymentDay[]> {
  const supabase = await createClient()

  // Build date range for the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // last day of month

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  const { data: payments, error } = await supabase
    .from('scheduled_payments')
    .select('id, description, reference, amount, payment_type, status, frequency, next_payment_date')
    .in('status', ['active', 'paused'])
    .gte('next_payment_date', startStr)
    .lte('next_payment_date', endStr)
    .order('next_payment_date', { ascending: true })

  if (error) return []

  // Group payments by date
  const dayMap: Record<string, CalendarPaymentDay['payments']> = {}

  for (const p of payments ?? []) {
    const date = p.next_payment_date
    if (!dayMap[date]) dayMap[date] = []
    dayMap[date].push({
      id: p.id,
      name: p.description || p.reference || 'Payment',
      amount: Number(p.amount),
      type: p.payment_type as 'standing_order' | 'direct_debit',
      status: p.status,
    })
  }

  // Also estimate future payments within the month for recurring ones
  // Fetch all active recurring payments
  const { data: allActive } = await supabase
    .from('scheduled_payments')
    .select('id, description, reference, amount, payment_type, status, frequency, next_payment_date')
    .in('status', ['active', 'paused'])

  for (const p of allActive ?? []) {
    const nextDate = new Date(p.next_payment_date)
    // Project forward based on frequency
    const dates = projectPaymentDates(nextDate, p.frequency, startDate, endDate)
    for (const d of dates) {
      const dateStr = d.toISOString().split('T')[0]
      if (dayMap[dateStr]?.find(existing => existing.id === p.id)) continue // already added
      if (!dayMap[dateStr]) dayMap[dateStr] = []
      dayMap[dateStr].push({
        id: p.id,
        name: p.description || p.reference || 'Payment',
        amount: Number(p.amount),
        type: p.payment_type as 'standing_order' | 'direct_debit',
        status: p.status,
      })
    }
  }

  return Object.entries(dayMap)
    .map(([date, payments]) => ({ date, payments }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function projectPaymentDates(nextDate: Date, frequency: string, rangeStart: Date, rangeEnd: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(nextDate)

  // Go backwards if needed to find earlier occurrences that fall in range
  const getStep = (freq: string) => {
    switch (freq) {
      case 'weekly': return 7
      case 'fortnightly': return 14
      case 'monthly': return 30 // approximate
      case 'quarterly': return 91
      case 'annually': return 365
      default: return 30
    }
  }

  // Move forward from next_payment_date
  for (let i = 0; i < 12; i++) {
    if (current > rangeEnd) break
    if (current >= rangeStart && current <= rangeEnd) {
      dates.push(new Date(current))
    }
    // Advance
    switch (frequency) {
      case 'weekly':
        current.setDate(current.getDate() + 7)
        break
      case 'fortnightly':
        current.setDate(current.getDate() + 14)
        break
      case 'monthly':
        current.setMonth(current.getMonth() + 1)
        break
      case 'quarterly':
        current.setMonth(current.getMonth() + 3)
        break
      case 'annually':
        current.setFullYear(current.getFullYear() + 1)
        break
      default:
        current.setMonth(current.getMonth() + 1)
    }
  }

  return dates
}
