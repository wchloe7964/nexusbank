import { getFraudCases } from '@/lib/queries/fraud'
import { FraudCasesClient } from './cases-client'

interface Props {
  searchParams: Promise<{
    status?: string
    priority?: string
    page?: string
  }>
}

export default async function FraudCasesPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status ?? 'all'
  const priority = params.priority ?? 'all'
  const page = Number(params.page) || 1

  const result = await getFraudCases({ status, priority, page, pageSize: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Fraud Cases</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Investigation and resolution of suspected fraud cases
        </p>
      </div>
      <FraudCasesClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        status={status}
        priority={priority}
      />
    </div>
  )
}
