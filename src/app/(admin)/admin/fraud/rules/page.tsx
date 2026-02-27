import { getFraudRules } from '@/lib/queries/fraud'
import { FraudRulesClient } from './rules-client'

export default async function FraudRulesPage() {
  const rules = await getFraudRules()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Fraud Rules</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Configure fraud detection rules and scoring weights
        </p>
      </div>
      <FraudRulesClient rules={rules} />
    </div>
  )
}
