import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Building2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getScheduledPayments } from '@/lib/queries/payments'
import { PaymentsViewToggle } from './payments-view-toggle'

export default async function PaymentsPage() {
  const payments = await getScheduledPayments()
  const directDebitCount = payments.filter((p) => p.payment_type === 'direct_debit' && p.status !== 'cancelled').length

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

      {/* Quick Links */}
      <Link href="/payments/direct-debits" className="block">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-500/10 p-2.5">
                  <Building2 className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Manage Direct Debits</p>
                  <p className="text-xs text-muted-foreground">
                    {directDebitCount} active direct debit{directDebitCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>

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
