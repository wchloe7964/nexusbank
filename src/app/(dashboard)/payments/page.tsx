import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar } from 'lucide-react'
import Link from 'next/link'
import { getScheduledPayments } from '@/lib/queries/payments'
import { PaymentsViewToggle } from './payments-view-toggle'

export default async function PaymentsPage() {
  const payments = await getScheduledPayments()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        description="Manage your regular payments and direct debits"
        action={
          <Link href="/payments/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Payment
            </Button>
          </Link>
        }
      />

      {payments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No scheduled payments</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set up standing orders and direct debits to manage recurring payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PaymentsViewToggle initialPayments={payments} />
      )}
    </div>
  )
}
