import { getCustomers } from '@/lib/queries/admin'
import { CustomersClient } from './customers-client'

interface PageProps {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>
}

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const result = await getCustomers({
    search: params.search,
    role: params.role,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Customers</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">View and manage bank customers</p>
      </div>
      <CustomersClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        search={params.search || ''}
        role={params.role || 'all'}
      />
    </div>
  )
}
