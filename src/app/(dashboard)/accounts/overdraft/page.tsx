import { PageHeader } from '@/components/shared/page-header'
import { getOverdraftUsage } from '@/lib/queries/overdraft'
import { OverdraftClient } from './overdraft-client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function OverdraftPage() {
  const overdraftAccounts = await getOverdraftUsage()

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Accounts
        </Link>
        <PageHeader
          title="Overdraft Manager"
          description="Monitor and manage your overdraft usage across accounts"
        />
      </div>

      <OverdraftClient accounts={overdraftAccounts} />
    </div>
  )
}
