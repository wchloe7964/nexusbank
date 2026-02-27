import { getAdminCredits } from '@/lib/queries/admin'
import { CreditsClient } from './credits-client'

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function AdminCreditsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1

  const result = await getAdminCredits({
    search: params.search,
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Credit Customer</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Manually credit customer accounts for refunds, goodwill payments, corrections, and more
        </p>
      </div>
      <CreditsClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        search={params.search || ''}
      />
    </div>
  )
}
