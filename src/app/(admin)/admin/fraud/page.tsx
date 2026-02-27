import { getFraudScores, getFraudDashboardStats } from '@/lib/queries/fraud'
import { FraudClient } from './fraud-client'

interface Props {
  searchParams: Promise<{
    decision?: string
    page?: string
  }>
}

export default async function FraudDashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const decision = params.decision ?? 'all'
  const page = Number(params.page) || 1

  const [scoresResult, stats] = await Promise.all([
    getFraudScores({ decision, page, pageSize: 20 }),
    getFraudDashboardStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Fraud Detection</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Real-time transaction scoring and fraud monitoring
        </p>
      </div>
      <FraudClient
        data={scoresResult.data}
        total={scoresResult.total}
        page={scoresResult.page}
        pageSize={scoresResult.pageSize}
        totalPages={scoresResult.totalPages}
        stats={stats}
        decision={decision}
      />
    </div>
  )
}
