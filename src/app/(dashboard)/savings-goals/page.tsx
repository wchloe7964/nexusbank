import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PiggyBank } from 'lucide-react'
import { getSavingsGoals } from '@/lib/queries/savings-goals'
import { getAccounts } from '@/lib/queries/accounts'
import { SavingsClient } from './savings-client'

export default async function SavingsPage() {
  const [goals, accounts] = await Promise.all([
    getSavingsGoals(),
    getAccounts(),
  ])

  const savingsAccounts = accounts.filter(
    (a) => a.account_type === 'savings' || a.account_type === 'isa'
  )

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Savings Goals"
        description="Set targets and track your progress"
      />

      {goals.length === 0 && savingsAccounts.length === 0 ? (
        <Card>
          <CardContent className="p-5 lg:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <PiggyBank className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No savings accounts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open a savings account first, then create savings goals.
            </p>
          </CardContent>
        </Card>
      ) : (
        <SavingsClient goals={goals} savingsAccounts={savingsAccounts} />
      )}
    </div>
  )
}
