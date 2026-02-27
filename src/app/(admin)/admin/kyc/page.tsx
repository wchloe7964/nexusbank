import { getKycVerifications } from '@/lib/queries/kyc'
import { getAmlDashboardStats } from '@/lib/queries/kyc'
import { KycClient } from './kyc-client'

interface Props {
  searchParams: Promise<{
    status?: string
    riskRating?: string
    page?: string
  }>
}

export default async function KycPage({ searchParams }: Props) {
  const params = await searchParams
  const status = params.status ?? 'all'
  const riskRating = params.riskRating ?? 'all'
  const page = Number(params.page) || 1

  const [kycResult, stats] = await Promise.all([
    getKycVerifications({ status, riskRating, page, pageSize: 20 }),
    getAmlDashboardStats(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">KYC Verifications</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Review and manage customer identity verification requests
        </p>
      </div>
      <KycClient
        data={kycResult.data}
        total={kycResult.total}
        page={kycResult.page}
        pageSize={kycResult.pageSize}
        totalPages={kycResult.totalPages}
        stats={stats}
        status={status}
        riskRating={riskRating}
      />
    </div>
  )
}
