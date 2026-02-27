import { getInterestConfigs } from '@/lib/queries/interest'
import { InterestClient } from './interest-client'

export default async function InterestPage() {
  const configs = await getInterestConfigs()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">
          Interest Configuration
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Manage interest rates for savings, current accounts, and loan products.
        </p>
      </div>
      <InterestClient configs={configs} />
    </div>
  )
}
