import { PageHeader } from '@/components/shared/page-header'
import { getTransactions } from '@/lib/queries/transactions'
import { getAccounts } from '@/lib/queries/accounts'
import TransactionsClient from './transactions-client'

export default async function TransactionsPage() {
  const [transactionsResult, accounts] = await Promise.all([
    getTransactions({ pageSize: 200 }),
    getAccounts(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader title="Transactions" description="View and search your transaction history" />
      <TransactionsClient
        initialTransactions={transactionsResult.data}
        accounts={accounts}
      />
    </div>
  )
}
