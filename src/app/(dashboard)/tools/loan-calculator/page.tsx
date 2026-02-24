import { PageHeader } from '@/components/shared/page-header'
import { LoanCalculatorClient } from './loan-calculator-client'

export default function LoanCalculatorPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Loan Repayment Calculator"
        description="Calculate your monthly payments and total cost"
      />
      <LoanCalculatorClient />
    </div>
  )
}
