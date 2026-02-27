import { createAdminClient } from '@/lib/supabase/admin'
import { PciClient } from './pci-client'
import type { PciAccessLog, CardToken } from '@/lib/types/pci'

interface Props {
  searchParams: Promise<{
    accessType?: string
    page?: string
  }>
}

export default async function PciDashboardPage({ searchParams }: Props) {
  const params = await searchParams
  const accessType = params.accessType ?? 'all'
  const page = Number(params.page) || 1
  const pageSize = 30

  const admin = createAdminClient()

  // Fetch PCI access log with pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let logQuery = admin
    .from('pci_access_log')
    .select('*', { count: 'exact' })

  if (accessType !== 'all') {
    logQuery = logQuery.eq('access_type', accessType)
  }

  logQuery = logQuery.order('created_at', { ascending: false }).range(from, to)

  const [logRes, tokensRes] = await Promise.all([
    logQuery,
    admin
      .from('card_tokens')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const logTotal = logRes.count ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">PCI-DSS Compliance</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Card data access logging, tokenization inventory and compliance monitoring
        </p>
      </div>
      <PciClient
        accessLog={(logRes.data ?? []) as PciAccessLog[]}
        logTotal={logTotal}
        logPage={page}
        logPageSize={pageSize}
        logTotalPages={Math.ceil(logTotal / pageSize)}
        activeTokens={(tokensRes.data ?? []) as CardToken[]}
        tokenCount={tokensRes.count ?? 0}
        accessType={accessType}
      />
    </div>
  )
}
