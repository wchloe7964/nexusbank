import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeftRight } from 'lucide-react'
import { getAccounts } from '@/lib/queries/accounts'
import { getPayees } from '@/lib/queries/payees'
import { hasTransferPin } from '@/lib/pin/pin-service'
import { TransfersClient } from './transfers-client'

export default async function TransfersPage() {
  const [accounts, payees, hasPinSet] = await Promise.all([
    getAccounts(),
    getPayees(),
    hasTransferPin(),
  ])

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Transfer Money" description="Transfer between your accounts or send to someone" />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No accounts found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You need at least one account to make transfers.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TransfersClient accounts={accounts} payees={payees} hasPinSet={hasPinSet} />
      )}
    </div>
  )
}
