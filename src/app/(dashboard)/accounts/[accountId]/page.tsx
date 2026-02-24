import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatGBP } from '@/lib/utils/currency'
import { formatTransactionDate, formatUKDate } from '@/lib/utils/dates'
import { formatSortCode } from '@/lib/utils/sort-code'
import { formatAccountNumber } from '@/lib/utils/account-number'
import { transactionCategories } from '@/lib/constants/categories'
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import Link from 'next/link'

const mockAccount = {
  id: '1', user_id: '1', account_name: 'Nexus Current Account', account_type: 'current',
  sort_code: '20-45-67', account_number: '41234567', balance: 3247.85, available_balance: 4247.85,
  currency_code: 'GBP', interest_rate: 0, overdraft_limit: 1000, is_primary: true, is_active: true,
  opened_at: '2020-03-15T00:00:00Z', created_at: '', updated_at: '',
}

const mockTransactions = [
  { id: '1', account_id: '1', type: 'debit' as const, category: 'bills' as const, amount: 850, currency_code: 'GBP', description: 'Monthly Rent', reference: null, counterparty_name: 'Property Mgmt Ltd', counterparty_sort_code: null, counterparty_account_number: null, balance_after: 3247.85, transfer_reference: null, status: 'completed' as const, transaction_date: new Date(Date.now() - 86400000).toISOString(), created_at: '' },
  { id: '2', account_id: '1', type: 'credit' as const, category: 'salary' as const, amount: 3200, currency_code: 'GBP', description: 'Monthly Salary', reference: null, counterparty_name: 'ACME Corp Ltd', counterparty_sort_code: null, counterparty_account_number: null, balance_after: 4097.85, transfer_reference: null, status: 'completed' as const, transaction_date: new Date(Date.now() - 172800000).toISOString(), created_at: '' },
  { id: '3', account_id: '1', type: 'debit' as const, category: 'groceries' as const, amount: 67.43, currency_code: 'GBP', description: 'Weekly Shop', reference: null, counterparty_name: 'Tesco Stores', counterparty_sort_code: null, counterparty_account_number: null, balance_after: 1022.85, transfer_reference: null, status: 'completed' as const, transaction_date: new Date(Date.now() - 345600000).toISOString(), created_at: '' },
  { id: '4', account_id: '1', type: 'debit' as const, category: 'transport' as const, amount: 156, currency_code: 'GBP', description: 'Monthly Travelcard', reference: null, counterparty_name: 'TfL', counterparty_sort_code: null, counterparty_account_number: null, balance_after: 1090.28, transfer_reference: null, status: 'completed' as const, transaction_date: new Date(Date.now() - 432000000).toISOString(), created_at: '' },
  { id: '5', account_id: '1', type: 'debit' as const, category: 'subscriptions' as const, amount: 15.99, currency_code: 'GBP', description: 'Netflix Monthly', reference: null, counterparty_name: 'Netflix.com', counterparty_sort_code: null, counterparty_account_number: null, balance_after: 1246.28, transfer_reference: null, status: 'completed' as const, transaction_date: new Date(Date.now() - 518400000).toISOString(), created_at: '' },
]

export default function AccountDetailPage() {
  const account = mockAccount

  return (
    <div className="space-y-8">
      <PageHeader
        title={account.account_name}
        action={
          <Link href="/transfers">
            <Button size="sm">
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          </Link>
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
            <Badge variant={account.account_type === 'current' ? 'default' : account.account_type === 'savings' ? 'success' : 'warning'}>
              {account.account_type === 'current' ? 'Current' : account.account_type === 'savings' ? 'Savings' : 'ISA'}
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
            <dd className="font-medium capitalize">{account.account_type}</dd>
            <dt className="text-muted-foreground">Opened</dt>
            <dd className="font-medium">{formatUKDate(account.opened_at)}</dd>
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

      {/* Transactions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Transactions</h2>
          <Link href="/transactions" className="text-sm font-medium text-primary hover:underline underline-offset-4">View all</Link>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {mockTransactions.map((tx) => {
                const cat = transactionCategories[tx.category]
                const Icon = cat?.icon
                return (
                  <div key={tx.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2.5 ${cat?.bg}`}>
                        {Icon && <Icon className={`h-4 w-4 ${cat?.color}`} />}
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
      </div>
    </div>
  )
}
