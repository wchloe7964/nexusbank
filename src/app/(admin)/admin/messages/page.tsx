import { getAdminConversations } from './actions'
import { MessagesClient } from './messages-client'

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string; page?: string }>
}

export default async function AdminMessagesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status = params.status || 'all'
  const category = params.category || 'all'
  const page = parseInt(params.page || '1', 10)

  const result = await getAdminConversations({ status, category, page })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">
          Secure Messages
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          View and respond to customer messages and enquiries.
        </p>
      </div>
      <MessagesClient
        data={result.data}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        totalPages={result.totalPages}
        status={status}
        category={category}
      />
    </div>
  )
}
