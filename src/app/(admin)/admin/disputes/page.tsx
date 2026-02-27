import { getAdminDisputes } from '@/lib/queries/admin'
import { DisputesClient } from './disputes-client'

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>
}

export default async function AdminDisputesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1

  const result = await getAdminDisputes({
    status: params.status,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Dispute Management</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Review and resolve customer disputes</p>
      </div>
      <DisputesClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        status={params.status || 'all'}
      />
    </div>
  )
}
