import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PieChart } from 'lucide-react'
import { getSpendingByCategory, getDailySpending, getMonthlyComparison, getIncomeVsExpenses } from '@/lib/queries/transactions'
import { getAccounts } from '@/lib/queries/accounts'
import { InsightsClient } from './insights-client'

export default async function InsightsPage() {
  const [categorySpending, dailySpending, monthlyComparison, incomeVsExpenses, accounts] = await Promise.all([
    getSpendingByCategory(),
    getDailySpending(),
    getMonthlyComparison(),
    getIncomeVsExpenses(),
    getAccounts(),
  ])

  const hasData = categorySpending.length > 0 || dailySpending.some(d => d.amount > 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Spending Insights"
        description="Understand where your money goes"
      />

      {!hasData ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No spending data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your spending insights will appear here once you have transactions.
            </p>
          </CardContent>
        </Card>
      ) : (
        <InsightsClient
          initialCategorySpending={categorySpending}
          initialDailySpending={dailySpending}
          initialMonthlyComparison={monthlyComparison}
          initialIncomeVsExpenses={incomeVsExpenses}
          accounts={accounts}
        />
      )}
    </div>
  )
}
