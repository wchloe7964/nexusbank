import { getSars, getSarDashboardStats } from '@/lib/queries/sar'
import { SarClient } from './sar-client'

interface Props {
  searchParams: Promise<{
    status?: string
    page?: string
  }>
}

export default async function SarPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status || 'all'
  const page = Number(params.page) || 1

  const [{ sars, total, totalPages }, stats] = await Promise.all([
    getSars({ status, page, pageSize: 20 }),
    getSarDashboardStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">
          Suspicious Activity Reports
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          File, track, and manage SARs for NCA submission.
        </p>
      </div>
      <SarClient
        sars={sars}
        total={total}
        page={page}
        pageSize={20}
        totalPages={totalPages}
        stats={stats}
        statusFilter={status}
      />
    </div>
  )
}
