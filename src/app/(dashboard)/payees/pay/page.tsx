import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getAccounts } from '@/lib/queries/accounts'
import { getPayees } from '@/lib/queries/payees'
import { PayClient } from './pay-client'

interface PayPageProps {
  searchParams: Promise<{ id?: string }>
}

export default async function PayPage({ searchParams }: PayPageProps) {
  const params = await searchParams
  const payeeId = params.id

  const [accounts, payees] = await Promise.all([
    getAccounts(),
    getPayees(),
  ])

  const payee = payeeId ? payees.find((p) => p.id === payeeId) : null

  if (!payee) {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <PageHeader title="Pay a Payee" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Send className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Payee not found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The payee you are trying to pay could not be found.
            </p>
            <Link href="/payees" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Payees
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <PageHeader title="Pay a Payee" />
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">No accounts available</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You need at least one account to make a payment.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader
        title={`Pay ${payee.name}`}
        description="Send a payment to this payee"
        action={
          <Link href="/payees">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        }
      />
      <PayClient payee={payee} accounts={accounts} />
    </div>
  )
}
