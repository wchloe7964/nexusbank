import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PieChart, BarChart3, ChevronRight } from 'lucide-react'
import { getSpendingByCategory, getDailySpending, getMonthlyComparison, getIncomeVsExpenses } from '@/lib/queries/transactions'
import { getAccounts } from '@/lib/queries/accounts'
import { InsightsClient } from './insights-client'
import Link from 'next/link'

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

      {/* Analytics Deep-Dive Link */}
      <Link href="/insights/analytics" className="block">
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-500/10 p-2.5">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Spending Analytics</p>
                  <p className="text-xs text-muted-foreground">
                    Merchant rankings, subscription detection, spending forecasts &amp; peer comparison
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
