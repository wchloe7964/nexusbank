import { getCustomerDetail } from '@/lib/queries/admin'
import { CustomerDetailClient } from './customer-detail-client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ customerId: string }>
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params

  let detail
  try {
    detail = await getCustomerDetail(customerId)
  } catch {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/customers"
              className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Customers
            </Link>
          </div>
          <h1 className="text-[20px] font-bold tracking-tight text-foreground mt-2">
            {detail.profile.full_name || 'Customer'}
          </h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{detail.profile.email}</p>
        </div>
      </div>
      <CustomerDetailClient
        profile={detail.profile}
        accounts={detail.accounts}
        recentTransactions={detail.recentTransactions}
        cards={detail.cards}
        loginActivity={detail.loginActivity}
        disputes={detail.disputes}
      />
    </div>
  )
}
