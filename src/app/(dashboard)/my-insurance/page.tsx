import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { getInsurancePolicies, getInsuranceClaims } from '@/lib/queries/insurance'
import { InsuranceClient } from './insurance-client'

export default async function InsurancePage() {
  const [policies, claims] = await Promise.all([
    getInsurancePolicies(),
    getInsuranceClaims(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Insurance"
        description="Manage your insurance policies and claims"
      />

      {policies.length === 0 && claims.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No insurance policies</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your insurance policies will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <InsuranceClient policies={policies} claims={claims} />
      )}
    </div>
  )
}
