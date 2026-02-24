import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getPaymentCalendarData } from '@/lib/queries/payment-calendar'
import { CalendarClient } from './calendar-client'

interface CalendarPageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function PaymentCalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams
  const now = new Date()
  const year = params.year ? parseInt(params.year) : now.getFullYear()
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1

  const calendarData = await getPaymentCalendarData(year, month)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payment Calendar"
        description="View your upcoming scheduled payments"
        action={
          <Link href="/payments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Payments
            </Button>
          </Link>
        }
      />
      <CalendarClient
        year={year}
        month={month}
        calendarData={calendarData}
      />
    </div>
  )
}
