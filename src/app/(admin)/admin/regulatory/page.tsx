import { getRegulatoryReturns, getCapitalAdequacy, getLatestCapitalAdequacy } from '@/lib/queries/regulatory'
import { RegulatoryClient } from './regulatory-client'

interface Props {
  searchParams: Promise<{
    status?: string
    returnType?: string
    page?: string
  }>
}

export default async function RegulatoryPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status ?? 'all'
  const returnType = params.returnType ?? 'all'
  const page = Number(params.page) || 1

  const [{ returns, total, totalPages }, capitalHistory, latestCapital] = await Promise.all([
    getRegulatoryReturns({ status, returnType, page }),
    getCapitalAdequacy(12),
    getLatestCapitalAdequacy(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Regulatory Returns</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          GABRIEL submissions, capital adequacy monitoring and FCA/PRA reporting
        </p>
      </div>
      <RegulatoryClient
        returns={returns}
        total={total}
        page={page}
        pageSize={20}
        totalPages={totalPages}
        capitalHistory={capitalHistory}
        latestCapital={latestCapital}
        statusFilter={status}
        returnTypeFilter={returnType}
      />
    </div>
  )
}
