import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Banknote } from 'lucide-react'
import { getLoans } from '@/lib/queries/loans'
import { getAccounts } from '@/lib/queries/accounts'
import { LoansClient } from './loans-client'

export default async function LoansPage() {
  const [loans, accounts] = await Promise.all([
    getLoans(),
    getAccounts(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Loans"
        description="View and manage your loans"
      />

      {loans.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Banknote className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No loans</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your loan products will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <LoansClient loans={loans} accounts={accounts} />
      )}
    </div>
  )
}
