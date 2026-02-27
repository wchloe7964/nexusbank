import { getPaymentSubmissions, getPaymentSchemeConfigs, getPaymentRailsStats } from '@/lib/queries/payments-admin'
import { PaymentsOpsClient } from './payments-ops-client'

interface Props {
  searchParams: Promise<{
    rail?: string
    railStatus?: string
    page?: string
  }>
}

export default async function PaymentsOpsPage({ searchParams }: Props) {
  const params = await searchParams
  const rail = params.rail ?? 'all'
  const railStatus = params.railStatus ?? 'all'
  const page = Number(params.page) || 1

  const [submissionsResult, schemeConfigs, stats] = await Promise.all([
    getPaymentSubmissions({ rail, railStatus, page, pageSize: 20 }),
    getPaymentSchemeConfigs(),
    getPaymentRailsStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Payment Operations</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Monitor payment submissions, settlements and scheme operations
        </p>
      </div>
      <PaymentsOpsClient
        data={submissionsResult.data}
        total={submissionsResult.total}
        page={submissionsResult.page}
        pageSize={submissionsResult.pageSize}
        totalPages={submissionsResult.totalPages}
        schemeConfigs={schemeConfigs}
        stats={stats}
        rail={rail}
        railStatus={railStatus}
      />
    </div>
  )
}
