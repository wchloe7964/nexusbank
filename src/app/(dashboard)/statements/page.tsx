import { getAccounts } from '@/lib/queries/accounts'
import { getProfile } from '@/lib/queries/profile'
import { StatementsClient } from './statements-client'
import { FileDown } from 'lucide-react'

export default async function StatementsPage() {
  const [accounts, profile] = await Promise.all([getAccounts(), getProfile()])

  return (
    <div className="space-y-6 lg:space-y-8">
      {accounts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 lg:p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <FileDown className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No accounts found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Statements will appear here once you have an account.
          </p>
        </div>
      ) : (
        <StatementsClient accounts={accounts} profile={profile} />
      )}
    </div>
  )
}
