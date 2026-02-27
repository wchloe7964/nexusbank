import { PageHeader } from '@/components/shared/page-header'
import { getDisputes } from '@/lib/queries/disputes'
import { DisputesClient } from './disputes-client'

export default async function DisputesPage() {
  const disputes = await getDisputes()

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Transaction Disputes"
        description="Track and manage your dispute claims"
      />

      <DisputesClient disputes={disputes} />
    </div>
  )
}
