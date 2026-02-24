import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import {
  getMerchantSpending,
  detectSubscriptions,
  getSpendingForecast,
  getCategoryTrends,
  getPeerComparison,
} from '@/lib/queries/analytics'
import { AnalyticsClient } from './analytics-client'

export default async function AnalyticsPage() {
  const [merchants, subscriptions, forecast, categoryTrends, peerComparison] = await Promise.all([
    getMerchantSpending(3),
    detectSubscriptions(),
    getSpendingForecast(30),
    getCategoryTrends(6),
    getPeerComparison(),
  ])

  const hasData = merchants.length > 0 || forecast.length > 0

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/insights"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Insights
        </Link>
        <PageHeader
          title="Spending Analytics"
          description="Deep dive into your spending patterns, subscriptions and forecasts"
        />
      </div>

      {!hasData ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Not enough data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Analytics will appear once you have at least a few weeks of transaction history.
            </p>
          </CardContent>
        </Card>
      ) : (
        <AnalyticsClient
          merchants={merchants}
          subscriptions={subscriptions}
          forecast={forecast}
          categoryTrends={categoryTrends}
          peerComparison={peerComparison}
        />
      )}
    </div>
  )
}
