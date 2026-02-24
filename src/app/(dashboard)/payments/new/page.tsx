import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'
import { getAccounts } from '@/lib/queries/accounts'
import { NewPaymentClient } from './new-payment-client'

export default async function NewPaymentPage() {
  const accounts = await getAccounts()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="New Payment" description="Set up a new regular payment" />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No accounts found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You need at least one account to set up payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <NewPaymentClient accounts={accounts} />
      )}
    </div>
  )
}
