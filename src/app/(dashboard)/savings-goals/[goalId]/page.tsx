import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { PiggyBank } from 'lucide-react'
import Link from 'next/link'
import { getSavingsGoalById } from '@/lib/queries/savings-goals'
import { GoalDetailClient } from './goal-detail-client'

export default async function GoalDetailPage({ params }: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await params
  const goal = await getSavingsGoalById(goalId)

  if (!goal) {
    return (
      <div className="space-y-8">
        <PageHeader title="Savings Goal" description="Goal not found" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <PiggyBank className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Goal not found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              This savings goal may have been deleted.
            </p>
            <Link href="/savings-goals" className="text-sm text-primary hover:underline mt-2 inline-block">
              Back to Savings Goals
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={goal.name}
        description="Savings goal details"
      />
      <GoalDetailClient goal={goal} />
    </div>
  )
}
