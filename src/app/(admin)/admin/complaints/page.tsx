import { getComplaints, getComplaintsDashboardStats } from '@/lib/queries/regulatory'
import { ComplaintsClient } from './complaints-client'

interface Props {
  searchParams: Promise<{
    status?: string
    category?: string
    priority?: string
    page?: string
  }>
}

export default async function ComplaintsPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status ?? 'all'
  const category = params.category ?? 'all'
  const priority = params.priority ?? 'all'
  const page = Number(params.page) || 1

  const [{ complaints, total, totalPages }, stats] = await Promise.all([
    getComplaints({ status, category, priority, page }),
    getComplaintsDashboardStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Complaints Management</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          FCA DISP-compliant complaint handling — 8-week resolution deadline
        </p>
      </div>
      <ComplaintsClient
        complaints={complaints}
        total={total}
        page={page}
        pageSize={30}
        totalPages={totalPages}
        stats={stats}
        statusFilter={status}
        categoryFilter={category}
        priorityFilter={priority}
      />
    </div>
  )
}
