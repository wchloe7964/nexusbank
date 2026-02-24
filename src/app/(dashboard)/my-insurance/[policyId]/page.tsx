import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import { getInsurancePolicyById } from '@/lib/queries/insurance'
import { PolicyDetailClient } from './policy-detail-client'

export default async function PolicyDetailPage({ params }: { params: Promise<{ policyId: string }> }) {
  const { policyId } = await params
  const policy = await getInsurancePolicyById(policyId)

  if (!policy) {
    return (
      <div className="space-y-8">
        <PageHeader title="Insurance Policy" description="Not found" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Policy not found</p>
            <Link href="/my-insurance" className="text-sm text-primary hover:underline mt-2 inline-block">
              Back to Insurance
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={policy.policy_name} description="Policy details" />
      <PolicyDetailClient policy={policy} />
    </div>
  )
}
