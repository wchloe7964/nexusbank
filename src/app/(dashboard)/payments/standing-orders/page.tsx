import { PageHeader } from '@/components/shared/page-header'
import { getStandingOrders } from '@/lib/queries/standing-orders'
import { getAccounts } from '@/lib/queries/accounts'
import { getPayees } from '@/lib/queries/payees'
import { StandingOrdersClient } from './standing-orders-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function StandingOrdersPage() {
  const [standingOrders, accounts, payees] = await Promise.all([
    getStandingOrders(),
    getAccounts(),
    getPayees(),
  ])

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>
        <PageHeader
          title="Standing Orders"
          description="Manage your standing orders and recurring payments"
        />
      </div>

      <StandingOrdersClient standingOrders={standingOrders} accounts={accounts} payees={payees} />
    </div>
  )
}
