import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { formatSortCode } from '@/lib/utils/sort-code'
import { Wallet } from 'lucide-react'
import Link from 'next/link'
import type { Account } from '@/lib/types'

const mockAccounts: Account[] = [
  { id: '1', user_id: '1', account_name: 'Nexus Current Account', account_type: 'current', sort_code: '20-45-67', account_number: '41234567', balance: 3247.85, available_balance: 4247.85, currency_code: 'GBP', interest_rate: 0, overdraft_limit: 1000, is_primary: true, is_active: true, opened_at: '2020-03-15', created_at: '', updated_at: '' },
  { id: '2', user_id: '1', account_name: 'Rainy Day Saver', account_type: 'savings', sort_code: '20-45-67', account_number: '51234568', balance: 12500.50, available_balance: 12500.50, currency_code: 'GBP', interest_rate: 0.0415, overdraft_limit: 0, is_primary: false, is_active: true, opened_at: '2021-06-01', created_at: '', updated_at: '' },
  { id: '3', user_id: '1', account_name: 'Cash ISA', account_type: 'isa', sort_code: '20-45-67', account_number: '61234569', balance: 8750.00, available_balance: 8750.00, currency_code: 'GBP', interest_rate: 0.05, overdraft_limit: 0, is_primary: false, is_active: true, opened_at: '2022-04-06', created_at: '', updated_at: '' },
]

const typeLabels = { current: 'Current', savings: 'Savings', isa: 'ISA' }
const typeVariants: Record<string, 'default' | 'success' | 'warning'> = { current: 'default', savings: 'success', isa: 'warning' }

export default function AccountsPage() {
  const totalBalance = mockAccounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-8">
      <PageHeader title="Accounts" description={`Total balance: ${formatGBP(totalBalance)}`} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockAccounts.map((account) => (
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
                  <Badge variant={typeVariants[account.account_type]}>
                    {typeLabels[account.account_type as keyof typeof typeLabels]}
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
    </div>
  )
}
