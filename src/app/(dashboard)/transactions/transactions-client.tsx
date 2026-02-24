'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { formatGBP } from '@/lib/utils/currency'
import { formatTransactionDate } from '@/lib/utils/dates'
import { transactionCategories, type TransactionCategory } from '@/lib/constants/categories'
import { Search, Download, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import type { Transaction, Account } from '@/lib/types'

interface TransactionsClientProps {
  initialTransactions: Transaction[]
  accounts: Account[]
}

export default function TransactionsClient({ initialTransactions, accounts }: TransactionsClientProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')

  const filtered = initialTransactions.filter((tx) => {
    if (search && !tx.description.toLowerCase().includes(search.toLowerCase()) && !tx.counterparty_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && tx.category !== categoryFilter) return false
    if (typeFilter && tx.type !== typeFilter) return false
    if (accountFilter && tx.account_id !== accountFilter) return false
    return true
  })

  function handleExport() {
    const params = new URLSearchParams()
    if (accountFilter) params.set('accountId', accountFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    if (typeFilter) params.set('type', typeFilter)

    const url = `/api/transactions/export${params.toString() ? `?${params.toString()}` : ''}`
    window.location.href = url
  }

  return (
    <>
      {/* Filters */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-9 rounded-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {accounts.length > 1 && (
              <Select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="md:w-44 rounded-full">
                <option value="">All accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                ))}
              </Select>
            )}
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="md:w-40 rounded-full">
              <option value="">All categories</option>
              {Object.entries(transactionCategories).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="md:w-32 rounded-full">
              <option value="">All types</option>
              <option value="credit">Money in</option>
              <option value="debit">Money out</option>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No transactions found matching your filters.
              </div>
            ) : (
              filtered.map((tx) => {
                const cat = transactionCategories[tx.category as TransactionCategory]
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
                          <p className="text-xs text-muted-foreground tabular-nums">Bal: {formatGBP(tx.balance_after)}</p>
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
              })
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
