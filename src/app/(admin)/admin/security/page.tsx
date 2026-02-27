import { getAdminLoginActivity } from '@/lib/queries/admin'
import { SecurityClient } from './security-client'

interface PageProps {
  searchParams: Promise<{ eventType?: string; suspicious?: string; page?: string }>
}

export default async function AdminSecurityPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1

  const result = await getAdminLoginActivity({
    eventType: params.eventType,
    isSuspicious: params.suspicious === 'true',
    page,
    pageSize: 20,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Security & Login Activity</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Monitor login events and suspicious activity across all users</p>
      </div>
      <SecurityClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        eventType={params.eventType || 'all'}
        suspicious={params.suspicious || ''}
      />
    </div>
  )
}
