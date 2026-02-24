'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { ChevronLeft, ChevronRight, Building2, CalendarClock } from 'lucide-react'
import type { CalendarPaymentDay } from '@/lib/types'

interface CalendarClientProps {
  year: number
  month: number
  calendarData: CalendarPaymentDay[]
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function CalendarClient({ year, month, calendarData }: CalendarClientProps) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<CalendarPaymentDay | null>(null)

  // Build day map for quick lookup
  const dayMap: Record<number, CalendarPaymentDay> = {}
  for (const day of calendarData) {
    const d = new Date(day.date)
    dayMap[d.getDate()] = day
  }

  // Total monthly outgoings
  const totalOutgoings = calendarData.reduce(
    (sum, day) => sum + day.payments.reduce((s, p) => s + p.amount, 0),
    0
  )

  const ddCount = calendarData.reduce(
    (sum, day) => sum + day.payments.filter(p => p.type === 'direct_debit').length,
    0
  )
  const soCount = calendarData.reduce(
    (sum, day) => sum + day.payments.filter(p => p.type === 'standing_order').length,
    0
  )

  // Calendar grid calculations
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  // getDay() returns 0 (Sun) to 6 (Sat). We want Mon=0, so shift
  let startOffset = firstDay.getDay() - 1
  if (startOffset < 0) startOffset = 6

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  function navigateMonth(delta: number) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 1) { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1; newYear++ }
    router.push(`/payments/calendar?year=${newYear}&month=${newMonth}`)
  }

  function handleDayClick(dayNum: number) {
    const dayData = dayMap[dayNum]
    if (dayData) {
      setSelectedDay(dayData)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Outgoings</p>
            <p className="text-xl font-bold tracking-tight mt-1 tabular-nums">{formatGBP(totalOutgoings)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Direct Debits</p>
            <p className="text-xl font-bold tracking-tight mt-1 tabular-nums">{ddCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Standing Orders</p>
            <p className="text-xl font-bold tracking-tight mt-1 tabular-nums">{soCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-base tracking-tight">
              {MONTH_NAMES[month - 1]} {year}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const dayData = dayMap[dayNum]
              const isToday = isCurrentMonth && today.getDate() === dayNum
              const hasPayments = !!dayData && dayData.payments.length > 0
              const hasDd = dayData?.payments.some(p => p.type === 'direct_debit')
              const hasSo = dayData?.payments.some(p => p.type === 'standing_order')

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleDayClick(dayNum)}
                  disabled={!hasPayments}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative ${
                    isToday ? 'ring-2 ring-primary' : ''
                  } ${
                    hasPayments
                      ? 'hover:bg-muted/50 cursor-pointer font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasPayments && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasDd && <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />}
                      {hasSo && <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-xs text-muted-foreground">Direct Debit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Standing Order</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Detail Dialog */}
      <Dialog
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `Payments on ${new Date(selectedDay.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}` : 'Payments'}
      >
        {selectedDay && (
          <div className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total for this day</p>
              <p className="text-lg font-bold tabular-nums">
                {formatGBP(selectedDay.payments.reduce((sum, p) => sum + p.amount, 0))}
              </p>
            </div>

            <div className="divide-y divide-border">
              {selectedDay.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${
                      payment.type === 'direct_debit'
                        ? 'bg-orange-500/10'
                        : 'bg-purple-500/10'
                    }`}>
                      {payment.type === 'direct_debit' ? (
                        <Building2 className={`h-3.5 w-3.5 ${
                          payment.type === 'direct_debit' ? 'text-orange-500' : 'text-purple-500'
                        }`} />
                      ) : (
                        <CalendarClock className="h-3.5 w-3.5 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{payment.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {payment.type.replace('_', ' ')}
                        {payment.status === 'paused' && ' · Paused'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">{formatGBP(payment.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
