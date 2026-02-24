'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { List, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ScheduledPayment } from '@/lib/types'
import { PaymentsClient } from './payments-client'
import { CalendarClient } from './calendar-client'

interface PaymentsViewToggleProps {
  initialPayments: ScheduledPayment[]
}

export function PaymentsViewToggle({ initialPayments }: PaymentsViewToggleProps) {
  const [view, setView] = useState<'list' | 'calendar'>('list')

  return (
    <>
      {/* View Toggle */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit border border-border">
        <button
          onClick={() => setView('list')}
          className={cn(
            'rounded-lg p-1.5 transition-all duration-200',
            view === 'list'
              ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => setView('calendar')}
          className={cn(
            'rounded-lg p-1.5 transition-all duration-200',
            view === 'calendar'
              ? 'bg-card text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-label="Calendar view"
        >
          <CalendarDays className="h-4 w-4" />
        </button>
      </div>

      {view === 'list' ? (
        <PaymentsClient initialPayments={initialPayments} />
      ) : (
        <CalendarClient payments={initialPayments} />
      )}
    </>
  )
}
