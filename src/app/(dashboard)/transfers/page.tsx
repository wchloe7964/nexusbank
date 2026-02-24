import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeftRight } from 'lucide-react'
import { getAccounts } from '@/lib/queries/accounts'
import { TransfersClient } from './transfers-client'

export default async function TransfersPage() {
  const accounts = await getAccounts()

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Transfer Money" description="Move money between your accounts" />

      {accounts.length < 2 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {accounts.length === 0 ? 'No accounts found' : 'You need at least two accounts to transfer money'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Transfers are between your own accounts.
            </p>
          </CardContent>
        </Card>
      ) : (
        <TransfersClient accounts={accounts} />
      )}
    </div>
  )
}
