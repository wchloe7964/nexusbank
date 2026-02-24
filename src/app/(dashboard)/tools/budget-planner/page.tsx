import { PageHeader } from '@/components/shared/page-header'
import { BudgetPlannerClient } from './budget-planner-client'

export default function BudgetPlannerPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Budget Planner"
        description="Plan your monthly budget and track spending"
      />
      <BudgetPlannerClient />
    </div>
  )
}
