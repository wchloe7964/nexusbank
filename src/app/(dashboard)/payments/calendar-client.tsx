'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight, Repeat, Building2, Calendar } from 'lucide-react'
import type { ScheduledPayment } from '@/lib/types'

interface CalendarClientProps {
  payments: ScheduledPayment[]
}

const typeColors: Record<string, string> = {
  standing_order: 'bg-blue-500',
  direct_debit: 'bg-orange-500',
  scheduled_transfer: 'bg-emerald-500',
  bill_payment: 'bg-purple-500',
}

const typeLabels: Record<string, string> = {
  standing_order: 'Standing Order',
  direct_debit: 'Direct Debit',
  scheduled_transfer: 'Scheduled Transfer',
  bill_payment: 'Bill Payment',
}

const typeIcons: Record<string, typeof Repeat> = {
  standing_order: Repeat,
  direct_debit: Building2,
  scheduled_transfer: Calendar,
  bill_payment: Building2,
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function getPaymentsForDate(payments: ScheduledPayment[], date: Date): ScheduledPayment[] {
  const dateStr = date.toISOString().split('T')[0]

  return payments.filter((p) => {
    if (p.status === 'cancelled' || p.status === 'paused') return false

    const nextDate = new Date(p.next_payment_date)
    const nextDateStr = nextDate.toISOString().split('T')[0]

    // Direct match
    if (nextDateStr === dateStr) return true

    // For recurring payments, check if date falls on the recurring pattern
    if (p.frequency === 'monthly') {
      return nextDate.getDate() === date.getDate() &&
        date >= nextDate &&
        (!p.end_date || date <= new Date(p.end_date))
    }

    if (p.frequency === 'weekly') {
      return nextDate.getDay() === date.getDay() &&
        date >= nextDate &&
        (!p.end_date || date <= new Date(p.end_date))
    }

    return false
  })
}

function getPaymentName(payment: ScheduledPayment): string {
  if (payment.payee?.name) return payment.payee.name
  if (payment.description) return payment.description
  return typeLabels[payment.payment_type] || 'Payment'
}

export function CalendarClient({ payments }: CalendarClientProps) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const activePayments = payments.filter((p) => p.status !== 'cancelled')

  function goToPreviousMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
    setSelectedDate(null)
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
    setSelectedDate(null)
  }

  function goToToday() {
    setCurrentMonth(today.getMonth())
    setCurrentYear(today.getFullYear())
    setSelectedDate(null)
  }

  // Build calendar grid
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  // Get day of week for first day (0=Sun, adjust for Mon start)
  let startDay = firstDayOfMonth.getDay() - 1
  if (startDay < 0) startDay = 6

  const calendarDays: (Date | null)[] = []

  // Add empty cells before first day
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null)
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(currentYear, currentMonth, day))
  }

  // Fill remaining cells to complete last row
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null)
  }

  const selectedPayments = selectedDate ? getPaymentsForDate(activePayments, selectedDate) : []

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <Card>
        <CardContent className="p-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <h3 className="text-sm font-semibold">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <button onClick={goToToday} className="text-xs text-primary hover:underline">
                Today
              </button>
            </div>
            <Button variant="ghost" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0">
            {DAY_NAMES.map((day) => (
              <div key={day} className="p-2 text-center text-[11px] font-medium text-muted-foreground">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="p-1" />
              }

              const dayPayments = getPaymentsForDate(activePayments, date)
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = selectedDate?.toDateString() === date.toDateString()
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    'relative flex flex-col items-center rounded-lg p-1 min-h-[48px] transition-all duration-150',
                    isSelected && 'bg-primary/10 ring-1 ring-primary',
                    isToday && !isSelected && 'ring-1 ring-primary/40',
                    !isSelected && !isToday && 'hover:bg-muted/50',
                    isPast && 'opacity-50',
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium',
                    isToday && 'text-primary font-bold',
                  )}>
                    {date.getDate()}
                  </span>
                  {dayPayments.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {dayPayments.slice(0, 3).map((p, i) => (
                        <div
                          key={i}
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            typeColors[p.payment_type] || 'bg-gray-400',
                          )}
                        />
                      ))}
                      {dayPayments.length > 3 && (
                        <span className="text-[8px] text-muted-foreground">+{dayPayments.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={cn('h-2 w-2 rounded-full', color)} />
                <span className="text-[10px] text-muted-foreground">
                  {typeLabels[type]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Detail */}
      {selectedDate && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">
              {selectedDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </h3>

            {selectedPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No payments scheduled for this date.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {selectedPayments.map((payment) => {
                  const Icon = typeIcons[payment.payment_type] || Calendar
                  return (
                    <div key={payment.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'rounded-full p-2',
                          payment.payment_type === 'standing_order' ? 'bg-blue-500/10' :
                          payment.payment_type === 'direct_debit' ? 'bg-orange-500/10' :
                          payment.payment_type === 'scheduled_transfer' ? 'bg-emerald-500/10' :
                          'bg-purple-500/10'
                        )}>
                          <Icon className={cn(
                            'h-4 w-4',
                            payment.payment_type === 'standing_order' ? 'text-blue-500' :
                            payment.payment_type === 'direct_debit' ? 'text-orange-500' :
                            payment.payment_type === 'scheduled_transfer' ? 'text-emerald-500' :
                            'text-purple-500'
                          )} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{getPaymentName(payment)}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {typeLabels[payment.payment_type]}
                            </Badge>
                            <span className="text-xs text-muted-foreground capitalize">{payment.frequency}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatGBP(Number(payment.amount))}</p>
                    </div>
                  )
                })}

                {selectedPayments.length > 0 && (
                  <div className="flex items-center justify-between py-3">
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-sm font-bold tabular-nums">
                      {formatGBP(selectedPayments.reduce((s, p) => s + Number(p.amount), 0))}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
