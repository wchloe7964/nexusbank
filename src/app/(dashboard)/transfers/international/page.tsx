import { getAccounts } from '@/lib/queries/accounts'
import { getInternationalPayments } from '@/lib/queries/international-payments'
import { InternationalTransferClient } from './international-client'

export default async function InternationalTransferPage() {
  const [accounts, payments] = await Promise.all([
    getAccounts(),
    getInternationalPayments(),
  ])

  return <InternationalTransferClient accounts={accounts} recentPayments={payments} />
}
