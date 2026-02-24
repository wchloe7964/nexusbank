import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getSpendingAlerts, evaluateAlerts } from '@/lib/queries/spending-alerts'
import { getAccounts } from '@/lib/queries/accounts'
import { AlertsClient } from './alerts-client'

export default async function SpendingAlertsPage() {
  const [alerts, accounts, evaluation] = await Promise.all([
    getSpendingAlerts(),
    getAccounts(),
    evaluateAlerts(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Spending Alerts"
        description="Set up custom rules to monitor your spending"
        action={
          <Link href="/settings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
          </Link>
        }
      />
      <AlertsClient
        alerts={alerts}
        accounts={accounts}
        triggeredAlertIds={evaluation.triggered.map(t => t.alert.id)}
      />
    </div>
  )
}
