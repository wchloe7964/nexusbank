import { getAdminTransactions } from '@/lib/queries/admin'
import { TransactionsClient } from './transactions-client'

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    type?: string
    status?: string
    startDate?: string
    endDate?: string
    page?: string
  }>
}

export default async function AdminTransactionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1

  const result = await getAdminTransactions({
    search: params.search,
    category: params.category,
    type: params.type as 'credit' | 'debit' | undefined,
    status: params.status,
    startDate: params.startDate,
    endDate: params.endDate,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Transactions</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">View transactions across all customer accounts</p>
      </div>
      <TransactionsClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        search={params.search || ''}
        category={params.category || 'all'}
        type={params.type || 'all'}
        status={params.status || 'all'}
      />
    </div>
  )
}
