import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { CreditCard, ShieldAlert } from 'lucide-react'
import { getAccounts } from '@/lib/queries/accounts'
import { hasTransferPin } from '@/lib/pin/pin-service'
import { getProfile } from '@/lib/queries/profile'
import { KycBanner } from '@/components/shared/kyc-banner'
import { NewPaymentClient } from './new-payment-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function NewPaymentPage() {
  const [accounts, hasPinSet, profile] = await Promise.all([
    getAccounts(),
    hasTransferPin(),
    getProfile(),
  ])

  const kycStatus = profile?.kyc_status ?? 'not_started'
  const isKycBlocked = kycStatus !== 'verified'

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="New Payment" description="Set up a new regular payment" />

      {isKycBlocked ? (
        <div className="space-y-4">
          <KycBanner status={kycStatus} />
          <Card>
            <CardContent className="p-5 lg:p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 mb-4">
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-sm font-medium text-foreground">Payments unavailable</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Complete identity verification to set up payments.
              </p>
              <Link href="/settings/verification">
                <Button className="mt-4" size="sm">Verify Identity</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="p-5 lg:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No accounts found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You need at least one account to set up payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <NewPaymentClient accounts={accounts} hasPinSet={hasPinSet} />
      )}
    </div>
  )
}
