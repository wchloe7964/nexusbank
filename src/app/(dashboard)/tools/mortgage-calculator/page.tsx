import { PageHeader } from '@/components/shared/page-header'
import { MortgageCalculatorClient } from './mortgage-calculator-client'

export default function MortgageCalculatorPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Mortgage Calculator"
        description="Calculate mortgage payments and affordability"
      />
      <MortgageCalculatorClient />
    </div>
  )
}
