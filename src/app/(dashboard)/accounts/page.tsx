import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { formatSortCode } from '@/lib/utils/sort-code'
import { Wallet } from 'lucide-react'
import Link from 'next/link'
import { getAccounts, getTotalBalance } from '@/lib/queries/accounts'

const typeLabels: Record<string, string> = {
  current: 'Current',
  savings: 'Savings',
  isa: 'ISA',
  business: 'Business',
}

const typeVariants: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
  current: 'default',
  savings: 'success',
  isa: 'warning',
  business: 'destructive',
}

export default async function AccountsPage() {
  const [accounts, totalBalance] = await Promise.all([
    getAccounts(),
    getTotalBalance(),
  ])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Accounts"
        description={
          accounts.length > 0
            ? `Total balance: ${formatGBP(totalBalance)}`
            : undefined
        }
      />

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No accounts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your accounts will appear here once they&apos;re set up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="cursor-pointer transition-all duration-200 hover:border-primary">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/[0.08] p-2.5">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium tracking-tight">{account.account_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatSortCode(account.sort_code)} &middot; ****{account.account_number.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={typeVariants[account.account_type] || 'default'}>
                      {typeLabels[account.account_type] || account.account_type}
                    </Badge>
                  </div>
                  <div className="mt-5">
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="text-2xl font-bold tracking-tight tabular-nums">{formatGBP(account.balance)}</p>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">Available: {formatGBP(account.available_balance)}</span>
                    {account.interest_rate > 0 && (
                      <span className="text-success tabular-nums">{(account.interest_rate * 100).toFixed(2)}% AER</span>
                    )}
                  </div>
                  {account.overdraft_limit > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      Overdraft: {formatGBP(account.overdraft_limit)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
