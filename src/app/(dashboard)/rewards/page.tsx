import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Gift } from 'lucide-react'
import { getRewardsSummary, getRecentRewards } from '@/lib/queries/rewards'
import { getAccounts } from '@/lib/queries/accounts'
import { RewardsClient } from './rewards-client'

export default async function RewardsPage() {
  const [summary, recentRewards, accounts] = await Promise.all([
    getRewardsSummary(),
    getRecentRewards(30),
    getAccounts(),
  ])

  const hasData = summary.totalEarned > 0 || recentRewards.length > 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rewards & Cashback"
        description="Earn cashback on every card transaction"
      />

      {!hasData ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Gift className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No rewards yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Start earning cashback on your card transactions. Rewards will appear here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <RewardsClient
          summary={summary}
          recentRewards={recentRewards}
          accounts={accounts}
        />
      )}
    </div>
  )
}
