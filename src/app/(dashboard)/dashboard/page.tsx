import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileDashboard } from '@/components/dashboard/mobile-dashboard'
import { formatGBP } from '@/lib/utils/currency'
import { formatTransactionDate } from '@/lib/utils/dates'
import { transactionCategories } from '@/lib/constants/categories'
import { ArrowLeftRight, Receipt, CreditCard, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getAccounts } from '@/lib/queries/accounts'
import { getRecentTransactions, getSpendingByCategory } from '@/lib/queries/transactions'
import { getProfile } from '@/lib/queries/profile'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const accountTypeLabels: Record<string, string> = { current: 'Current', savings: 'Savings', isa: 'ISA' }
const accountTypeVariants: Record<string, 'default' | 'success' | 'warning'> = { current: 'default', savings: 'success', isa: 'warning' }
const accountTypeIcons: Record<string, string> = {
  current: 'bg-blue-500/10',
  savings: 'bg-emerald-500/10',
  isa: 'bg-amber-500/10',
}

export default async function DashboardPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/auth/login')
  }

  const [accounts, recentTransactions, spendingByCategory] = await Promise.all([
    getAccounts(),
    getRecentTransactions(undefined, 5),
    getSpendingByCategory(),
  ])

  // Get money in (credit transactions) in the last 30 days
  const supabase = await createClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: creditTransactions } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('type', 'credit')
    .gte('transaction_date', thirtyDaysAgo.toISOString())

  // Group credit transactions by category
  const incomeByCategory: Record<string, number> = {}
  for (const t of creditTransactions ?? []) {
    const label = transactionCategories[t.category as keyof typeof transactionCategories]?.label ?? t.category
    incomeByCategory[label] = (incomeByCategory[label] || 0) + Number(t.amount)
  }
  const incomeItems = Object.entries(incomeByCategory)
    .map(([label, amount]) => ({ label, amount }))
    .sort((a, b) => b.amount - a.amount)

  const totalIncome = incomeItems.reduce((sum, item) => sum + item.amount, 0)
  const totalSpending = spendingByCategory.reduce((sum, item) => sum + item.total, 0)

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
  const visibleAccounts = accounts.filter((a) => !a.hide_from_dashboard)
  const firstName = profile.full_name?.split(' ')[0] ?? 'there'
  const greeting = getGreeting()

  // Primary account for mobile hero (first current account, or first account)
  const primaryAccount = accounts.find((a) => a.account_type === 'current') ?? accounts[0] ?? null

  return (
    <>
      {/* ── Mobile Dashboard ─────────────────────────────────────────── */}
      <MobileDashboard
        primaryAccount={
          primaryAccount
            ? {
                id: primaryAccount.id,
                account_name: primaryAccount.account_name,
                account_type: primaryAccount.account_type,
                balance: Number(primaryAccount.balance),
                available_balance: Number(primaryAccount.available_balance),
                sort_code: primaryAccount.sort_code ?? undefined,
                account_number: primaryAccount.account_number ?? undefined,
              }
            : null
        }
        totalBalance={totalBalance}
        accountCount={accounts.length}
        recentTransactions={recentTransactions.map((tx) => ({
          id: tx.id,
          description: tx.description,
          counterparty_name: tx.counterparty_name,
          category: tx.category,
          amount: Number(tx.amount),
          type: tx.type,
          transaction_date: tx.transaction_date,
        }))}
      />

      {/* ── Desktop Dashboard ────────────────────────────────────────── */}
      <div className="hidden lg:block space-y-8">
        <PageHeader
          title={`${greeting}, ${firstName}`}
          description="Here's an overview of your accounts"
        />

        {/* Total Balance — Hero Gradient Card */}
        <Card variant="elevated" className="gradient-hero border-0 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_70%)]" />
          <CardContent className="relative p-6 lg:p-8">
            <p className="text-sm font-medium text-white/70">Total Balance</p>
            <p className="mt-2 text-4xl text-display">{formatGBP(totalBalance)}</p>
            <p className="mt-2 text-sm text-white/60">
              {accounts.length > 0
                ? `Across ${accounts.length} account${accounts.length === 1 ? '' : 's'}`
                : 'No accounts yet'}
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/transfers', icon: ArrowLeftRight, label: 'Transfer', gradient: 'from-blue-500/10 to-indigo-500/10' },
            { href: '/payments', icon: Receipt, label: 'Pay', gradient: 'from-emerald-500/10 to-green-500/10' },
            { href: '/cards', icon: CreditCard, label: 'Cards', gradient: 'from-violet-500/10 to-purple-500/10' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <Card variant="raised" interactive className="group">
                <CardContent className="flex flex-col items-center gap-3 p-5">
                  <div className={`rounded-2xl bg-gradient-to-br ${action.gradient} p-3 group-hover:scale-110 transition-transform duration-200`}>
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Accounts Overview */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Accounts</h2>
            <Link href="/accounts" className="text-sm font-medium text-primary hover:underline underline-offset-4">View all</Link>
          </div>
          {visibleAccounts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visibleAccounts.map((account) => (
                <Link key={account.id} href={`/accounts/${account.id}`}>
                  <Card variant="raised" interactive>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`rounded-xl p-2 ${accountTypeIcons[account.account_type] ?? 'bg-primary/10'}`}>
                            <Wallet className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{account.nickname || account.account_name}</span>
                        </div>
                        <Badge variant={accountTypeVariants[account.account_type] ?? 'default'}>
                          {accountTypeLabels[account.account_type] ?? account.account_type}
                        </Badge>
                      </div>
                      <p className="mt-4 text-2xl font-bold tracking-tight">{formatGBP(Number(account.balance))}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Available: {formatGBP(Number(account.available_balance))}
                      </p>
                      {account.interest_rate > 0 && (
                        <p className="mt-1 text-xs font-medium text-success">
                          {(Number(account.interest_rate) * 100).toFixed(2)}% AER
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-5 rounded-2xl bg-gradient-to-br from-muted to-muted/60 p-5">
                  <Wallet className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No accounts yet</p>
                <p className="text-xs text-muted-foreground mt-1">Open an account to get started</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Link href="/transactions" className="text-sm font-medium text-primary hover:underline underline-offset-4">View all</Link>
          </div>
          <Card variant="raised" className="overflow-hidden">
            <CardContent className="p-0">
              {recentTransactions.length > 0 ? (
                <div className="divide-y divide-border/60">
                  {recentTransactions.map((tx) => {
                    const cat = transactionCategories[tx.category as keyof typeof transactionCategories]
                    const Icon = cat?.icon
                    return (
                      <div key={tx.id} className="group flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className={`rounded-xl p-2.5 ${cat?.bg ?? 'bg-gray-50 dark:bg-gray-950'}`}>
                            {Icon && <Icon className={`h-4 w-4 ${cat?.color ?? 'text-gray-500'}`} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tx.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {tx.counterparty_name ? `${tx.counterparty_name} · ` : ''}{formatTransactionDate(tx.transaction_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {tx.type === 'credit' ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <p className={`text-sm font-semibold tabular-nums ${tx.type === 'credit' ? 'text-success' : ''}`}>
                            {tx.type === 'credit' ? '+' : '-'}{formatGBP(Number(tx.amount))}
                          </p>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-5 rounded-2xl bg-gradient-to-br from-muted to-muted/60 p-5">
                    <Receipt className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Your recent activity will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Spending Summary with Progress Bars */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card variant="raised">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-xl bg-red-50 dark:bg-red-950/30 p-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                </div>
                Money Out (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight">
                {totalSpending > 0 ? `-${formatGBP(totalSpending)}` : formatGBP(0)}
              </p>
              {spendingByCategory.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {spendingByCategory.map((item) => {
                    const cat = transactionCategories[item.category as keyof typeof transactionCategories]
                    return (
                      <div key={item.category} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{cat?.label ?? item.category}</span>
                          <span className="font-medium tabular-nums">{formatGBP(item.total)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/70 transition-all duration-700 ease-out"
                            style={{ width: `${totalSpending > 0 ? (item.total / totalSpending) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No spending in the last 30 days</p>
              )}
            </CardContent>
          </Card>
          <Card variant="raised">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                </div>
                Money In (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight text-success">
                {totalIncome > 0 ? `+${formatGBP(totalIncome)}` : formatGBP(0)}
              </p>
              {incomeItems.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {incomeItems.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium text-success tabular-nums">{formatGBP(item.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-success/70 transition-all duration-700 ease-out"
                          style={{ width: `${totalIncome > 0 ? (item.amount / totalIncome) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No income in the last 30 days</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
