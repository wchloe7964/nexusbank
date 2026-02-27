import { getAuditLog, getAuditStats } from '@/lib/queries/audit'
import { AuditClient } from './audit-client'

interface Props {
  searchParams: Promise<{
    eventType?: string
    targetTable?: string
    search?: string
    page?: string
  }>
}

export default async function AuditLogPage({ searchParams }: Props) {
  const params = await searchParams
  const eventType = params.eventType ?? 'all'
  const targetTable = params.targetTable ?? 'all'
  const search = params.search ?? ''
  const page = Number(params.page) || 1

  const [logResult, stats] = await Promise.all([
    getAuditLog({
      eventType,
      targetTable,
      search,
      page,
      pageSize: 30,
    }),
    getAuditStats(30),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Audit Log</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Immutable record of all system events and data access
        </p>
      </div>
      <AuditClient
        data={logResult.data}
        total={logResult.total}
        page={logResult.page}
        pageSize={logResult.pageSize}
        totalPages={logResult.totalPages}
        stats={stats}
        eventType={eventType}
        targetTable={targetTable}
        search={search}
      />
    </div>
  )
}
