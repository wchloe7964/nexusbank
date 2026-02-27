import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { CircleDollarSign } from 'lucide-react'
import { getCreditCards } from '@/lib/queries/credit-cards'
import { getAccounts } from '@/lib/queries/accounts'
import { CreditCardsClient } from './credit-cards-client'

export default async function CreditCardsPage() {
  const [creditCards, accounts] = await Promise.all([
    getCreditCards(),
    getAccounts(),
  ])

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Credit Cards"
        description="Manage your credit cards and make payments"
      />

      {creditCards.length === 0 ? (
        <Card>
          <CardContent className="p-5 lg:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <CircleDollarSign className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No credit cards</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your credit card products will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <CreditCardsClient creditCards={creditCards} accounts={accounts} />
      )}
    </div>
  )
}
