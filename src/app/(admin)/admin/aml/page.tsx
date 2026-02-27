import { getAmlAlerts, getAmlDashboardStats } from '@/lib/queries/kyc'
import { AmlClient } from './aml-client'

interface Props {
  searchParams: Promise<{
    status?: string
    severity?: string
    alertType?: string
    page?: string
  }>
}

export default async function AmlAlertsPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status ?? 'all'
  const severity = params.severity ?? 'all'
  const alertType = params.alertType ?? 'all'
  const page = Number(params.page) || 1

  const [alertsResult, stats] = await Promise.all([
    getAmlAlerts({ status, severity, alertType, page, pageSize: 20 }),
    getAmlDashboardStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">AML Alerts</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Anti-Money Laundering monitoring and suspicious activity reporting
        </p>
      </div>
      <AmlClient
        data={alertsResult.data}
        total={alertsResult.total}
        page={alertsResult.page}
        pageSize={alertsResult.pageSize}
        totalPages={alertsResult.totalPages}
        stats={stats}
        status={status}
        severity={severity}
        alertType={alertType}
      />
    </div>
  )
}
