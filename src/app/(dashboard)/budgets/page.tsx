import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { getBudgetsWithSpending } from '@/lib/queries/budgets'
import { BudgetsClient } from './budgets-client'

export default async function BudgetsPage() {
  const budgets = await getBudgetsWithSpending()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Budgets"
        description="Set monthly spending limits and track your progress"
      />

      {budgets.length === 0 ? (
        <BudgetsClient budgets={[]} />
      ) : (
        <BudgetsClient budgets={budgets} />
      )}
    </div>
  )
}
