import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { getInvestmentAccounts } from '@/lib/queries/investments'
import { InvestmentsClient } from './investments-client'

export default async function InvestmentsPage() {
  const accounts = await getInvestmentAccounts()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Investments"
        description="View your investment portfolio"
      />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No investments</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your investment accounts will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <InvestmentsClient accounts={accounts} />
      )}
    </div>
  )
}
