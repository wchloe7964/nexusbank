import { PageHeader } from '@/components/shared/page-header'
import { SavingsCalculatorClient } from './savings-calculator-client'

export default function SavingsCalculatorPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Savings Growth Calculator"
        description="See how your savings grow with compound interest"
      />
      <SavingsCalculatorClient />
    </div>
  )
}
