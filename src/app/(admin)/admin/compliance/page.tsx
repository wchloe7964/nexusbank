import { getComplianceReports, getDataRetentionPolicies } from '@/lib/queries/audit'
import { ComplianceClient } from './compliance-client'

interface Props {
  searchParams: Promise<{
    reportType?: string
    status?: string
    page?: string
  }>
}

export default async function CompliancePage({ searchParams }: Props) {
  const params = await searchParams
  const reportType = params.reportType ?? 'all'
  const status = params.status ?? 'all'
  const page = Number(params.page) || 1

  const [reportsResult, retentionPolicies] = await Promise.all([
    getComplianceReports({ reportType, status, page, pageSize: 20 }),
    getDataRetentionPolicies(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Compliance Reports</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Generate, review and submit regulatory compliance reports
        </p>
      </div>
      <ComplianceClient
        reports={reportsResult.data}
        total={reportsResult.total}
        page={reportsResult.page}
        pageSize={reportsResult.pageSize}
        totalPages={reportsResult.totalPages}
        retentionPolicies={retentionPolicies}
        reportType={reportType}
        status={status}
      />
    </div>
  )
}
