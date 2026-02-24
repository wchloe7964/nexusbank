import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { getInvestmentAccountById } from '@/lib/queries/investments'
import { InvestmentDetailClient } from './investment-detail-client'

export default async function InvestmentDetailPage({ params }: { params: Promise<{ accountId: string }> }) {
  const { accountId } = await params
  const account = await getInvestmentAccountById(accountId)

  if (!account) {
    return (
      <div className="space-y-8">
        <PageHeader title="Investment" description="Not found" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Investment account not found</p>
            <Link href="/my-investments" className="text-sm text-primary hover:underline mt-2 inline-block">
              Back to Investments
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={account.account_name} description="Investment account details" />
      <InvestmentDetailClient account={account} />
    </div>
  )
}
