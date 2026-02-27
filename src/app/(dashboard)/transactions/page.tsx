import { PageHeader } from '@/components/shared/page-header'
import { getTransactions } from '@/lib/queries/transactions'
import { getAccounts } from '@/lib/queries/accounts'
import { getNotesForTransactions, getAllUserTags } from '@/lib/queries/transaction-notes'
import TransactionsClient from './transactions-client'

export default async function TransactionsPage() {
  const [transactionsResult, accounts] = await Promise.all([
    getTransactions({ pageSize: 200 }),
    getAccounts(),
  ])

  // Fetch notes for all displayed transactions + user's tag list
  const txIds = transactionsResult.data.map((tx) => tx.id)
  const [notesMap, allTags] = await Promise.all([
    getNotesForTransactions(txIds),
    getAllUserTags(),
  ])

  // Serialise Map → plain object for client
  const notesRecord: Record<string, { id: string; note: string | null; tags: string[]; updated_at: string }> = {}
  notesMap.forEach((val, key) => {
    notesRecord[key] = { id: val.id, note: val.note, tags: val.tags, updated_at: val.updated_at }
  })

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Transactions" description="View and search your transaction history" />
      <TransactionsClient
        initialTransactions={transactionsResult.data}
        accounts={accounts}
        initialNotes={notesRecord}
        allTags={allTags}
      />
    </div>
  )
}
