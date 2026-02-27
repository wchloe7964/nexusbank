import { CoolingClient } from './cooling-client'

export default function AdminCoolingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Payee Cooling Periods</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          View and waive cooling periods for customer payees after identity verification
        </p>
      </div>
      <CoolingClient />
    </div>
  )
}
