import { PageHeader } from '@/components/shared/page-header'
import { getDirectDebits } from '@/lib/queries/direct-debits'
import { DirectDebitsClient } from './direct-debits-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function DirectDebitsPage() {
  const directDebits = await getDirectDebits()

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Payments
        </Link>
        <PageHeader
          title="Direct Debits"
          description="Manage your direct debit mandates and payment history"
        />
      </div>

      <DirectDebitsClient directDebits={directDebits} />
    </div>
  )
}
