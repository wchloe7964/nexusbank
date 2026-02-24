import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatGBP } from '@/lib/utils/currency'
import { formatTransactionDate, formatUKDate } from '@/lib/utils/dates'
import { formatSortCode } from '@/lib/utils/sort-code'
import { formatAccountNumber } from '@/lib/utils/account-number'
import { transactionCategories } from '@/lib/constants/categories'
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Wallet, Gauge, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAccountById } from '@/lib/queries/accounts'
import { getRecentTransactions } from '@/lib/queries/transactions'
import { AccountPreferencesDialog } from './account-preferences-dialog'

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

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ accountId: string }>
}) {
  const { accountId } = await params

  const [account, recentTransactions] = await Promise.all([
    getAccountById(accountId),
    getRecentTransactions(accountId, 10),
  ])

  if (!account) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={account.nickname || account.account_name}
        action={
          <div className="flex items-center gap-2">
            <AccountPreferencesDialog
              accountId={account.id}
              currentNickname={account.nickname}
              currentColor={account.color ?? 'blue'}
              currentIcon={account.icon ?? 'wallet'}
              currentHidden={account.hide_from_dashboard ?? false}
              accountName={account.account_name}
            />
            <Link href="/transfers">
              <Button size="sm">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Transfer
              </Button>
            </Link>
          </div>
        }
      />

      {/* Account Summary Card */}
      <Card className="border-primary/20 bg-white dark:bg-card">
        <CardContent className="p-6">
          <div className="accent-bar mb-4" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{formatGBP(account.balance)}</p>
              <p className="mt-1 text-sm text-muted-foreground tabular-nums">Available: {formatGBP(account.available_balance)}</p>
            </div>
            <Badge variant={typeVariants[account.account_type] || 'default'}>
              {typeLabels[account.account_type] || account.account_type}
            </Badge>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sort Code</p>
              <p className="font-mono font-medium tabular-nums">{formatSortCode(account.sort_code)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Account Number</p>
              <p className="font-mono font-medium tabular-nums">{formatAccountNumber(account.account_number)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base tracking-tight">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <dt className="text-muted-foreground">Account Type</dt>
            <dd className="font-medium capitalize">{typeLabels[account.account_type] || account.account_type}</dd>
            <dt className="text-muted-foreground">Opened</dt>
            <dd className="font-medium">{account.opened_at ? formatUKDate(account.opened_at) : formatUKDate(account.created_at)}</dd>
            {account.overdraft_limit > 0 && (
              <>
                <dt className="text-muted-foreground">Overdraft Limit</dt>
                <dd className="font-medium tabular-nums">{formatGBP(account.overdraft_limit)}</dd>
              </>
            )}
            {account.interest_rate > 0 && (
              <>
                <dt className="text-muted-foreground">Interest Rate</dt>
                <dd className="font-medium text-success tabular-nums">{(account.interest_rate * 100).toFixed(2)}% AER</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Overdraft Manager Link */}
      {account.overdraft_limit > 0 && (
        <Link href="/accounts/overdraft" className="block">
          <Card className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-500/10 p-2.5">
                    <Gauge className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Overdraft Manager</p>
                    <p className="text-xs text-muted-foreground">
                      Limit: {formatGBP(account.overdraft_limit)} &middot; Monitor usage and costs
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Transactions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Transactions</h2>
          <Link href="/transactions" className="text-sm font-medium text-primary hover:underline underline-offset-4">View all</Link>
        </div>

        {recentTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No transactions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Transactions will appear here once you start using your account.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => {
                  const cat = transactionCategories[tx.category as keyof typeof transactionCategories]
                  const Icon = cat?.icon
                  return (
                    <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2.5 ${cat?.bg || 'bg-muted'}`}>
                          {Icon && <Icon className={`h-4 w-4 ${cat?.color || 'text-muted-foreground'}`} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.counterparty_name} &middot; {formatTransactionDate(tx.transaction_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className={`text-sm font-semibold tabular-nums ${tx.type === 'credit' ? 'text-success' : ''}`}>
                            {tx.type === 'credit' ? '+' : '-'}{formatGBP(tx.amount)}
                          </p>
                          {tx.balance_after !== null && (
                            <p className="text-xs text-muted-foreground tabular-nums">{formatGBP(tx.balance_after)}</p>
                          )}
                        </div>
                        {tx.type === 'credit' ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
