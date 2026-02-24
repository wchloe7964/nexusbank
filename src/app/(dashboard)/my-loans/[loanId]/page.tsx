import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Banknote } from 'lucide-react'
import Link from 'next/link'
import { getLoanById } from '@/lib/queries/loans'
import { getAccounts } from '@/lib/queries/accounts'
import { LoanDetailClient } from './loan-detail-client'

export default async function LoanDetailPage({ params }: { params: Promise<{ loanId: string }> }) {
  const { loanId } = await params
  const [loan, accounts] = await Promise.all([
    getLoanById(loanId),
    getAccounts(),
  ])

  if (!loan) {
    return (
      <div className="space-y-8">
        <PageHeader title="Loan" description="Not found" />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Banknote className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Loan not found</p>
            <Link href="/my-loans" className="text-sm text-primary hover:underline mt-2 inline-block">
              Back to Loans
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={loan.loan_name} description="Loan details" />
      <LoanDetailClient loan={loan} accounts={accounts} />
    </div>
  )
}
