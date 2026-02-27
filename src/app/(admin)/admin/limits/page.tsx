import { getTransactionLimits, getCoolingPeriodConfigs, getScaConfigRows } from '@/lib/queries/limits'
import { LimitsClient } from './limits-client'

export default async function LimitsPage() {
  const [limits, cooling, scaConfig] = await Promise.all([
    getTransactionLimits(),
    getCoolingPeriodConfigs(),
    getScaConfigRows(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">
          Transaction Limits & Controls
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Manage KYC-level transaction limits, SCA configuration, and cooling periods.
        </p>
      </div>
      <LimitsClient limits={limits} cooling={cooling} scaConfig={scaConfig} />
    </div>
  )
}
