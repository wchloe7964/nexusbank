'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { formatTransactionDate } from '@/lib/utils/dates'
import { transactionCategories } from '@/lib/constants/categories'
import {
  FileDown, Calendar, ArrowUpRight, ArrowDownRight, ChevronRight, Download, X,
} from 'lucide-react'
import type { Account, Transaction } from '@/lib/types'

interface StatementSummary {
  month: string
  year: number
  monthNum: number
  transactionCount: number
  totalIn: number
  totalOut: number
}

interface StatementsClientProps {
  accounts: Account[]
}

export function StatementsClient({ accounts }: StatementsClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '')
  const [summaries, setSummaries] = useState<StatementSummary[]>([])
  const [selectedMonth, setSelectedMonth] = useState<StatementSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isPending, startTransition] = useTransition()
  const [loadingTx, setLoadingTx] = useState(false)

  // Load summaries when account changes
  useEffect(() => {
    if (!selectedAccountId) return
    startTransition(async () => {
      try {
        const res = await fetch(`/api/statements?accountId=${selectedAccountId}`)
        if (res.ok) {
          const data = await res.json()
          setSummaries(data.summaries)
        }
      } catch {
        setSummaries([])
      }
    })
    setSelectedMonth(null)
    setTransactions([])
  }, [selectedAccountId])

  async function handleSelectMonth(summary: StatementSummary) {
    setSelectedMonth(summary)
    setLoadingTx(true)
    try {
      const res = await fetch(
        `/api/statements?accountId=${selectedAccountId}&year=${summary.year}&month=${summary.monthNum}`
      )
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions)
      }
    } catch {
      setTransactions([])
    }
    setLoadingTx(false)
  }

  function handleDownloadCSV() {
    if (!transactions.length || !selectedMonth) return
    const account = accounts.find((a) => a.id === selectedAccountId)

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Balance After']
    const rows = transactions.map((t) => [
      new Date(t.transaction_date).toLocaleDateString('en-GB'),
      `"${t.description.replace(/"/g, '""')}"`,
      getCategoryLabel(t.category),
      t.type === 'credit' ? 'Credit' : 'Debit',
      t.type === 'debit' ? `-${t.amount}` : `${t.amount}`,
      t.balance_after != null ? `${t.balance_after}` : '',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nexusbank-statement-${account?.account_name?.replace(/\s/g, '-') || 'account'}-${selectedMonth.month}-${selectedMonth.year}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function getCategoryLabel(category: string): string {
    const cat = transactionCategories[category as keyof typeof transactionCategories]
    return cat?.label || category.charAt(0).toUpperCase() + category.slice(1)
  }

  return (
    <div className="space-y-6">
      {/* Account Selector */}
      <Select
        value={selectedAccountId}
        onChange={(e) => setSelectedAccountId(e.target.value)}
        className="max-w-sm"
      >
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.account_name} — {acc.sort_code} / {acc.account_number}
          </option>
        ))}
      </Select>

      {/* Month Grid or Transaction Detail */}
      {selectedMonth ? (
        <div className="space-y-4">
          {/* Selected month header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => { setSelectedMonth(null); setTransactions([]) }}>
                <X className="mr-1.5 h-3.5 w-3.5" />
                Back
              </Button>
              <h2 className="text-lg font-semibold">
                {selectedMonth.month} {selectedMonth.year}
              </h2>
              <Badge variant="secondary">{selectedMonth.transactionCount} transactions</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={handleDownloadCSV} disabled={transactions.length === 0}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download CSV
            </Button>
          </div>

          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Money In</p>
                <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatGBP(selectedMonth.totalIn)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Money Out</p>
                <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
                  {formatGBP(selectedMonth.totalOut)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground">Net</p>
                <p className={`mt-1 text-lg font-bold ${
                  selectedMonth.totalIn - selectedMonth.totalOut >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selectedMonth.totalIn - selectedMonth.totalOut >= 0 ? '+' : ''}
                  {formatGBP(selectedMonth.totalIn - selectedMonth.totalOut)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardContent className="p-0">
              {loadingTx ? (
                <div className="p-8 text-center text-sm text-muted-foreground">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">No transactions found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {transactions.map((tx) => {
                        const catInfo = transactionCategories[tx.category as keyof typeof transactionCategories]
                        const Icon = catInfo?.icon
                        return (
                          <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {formatTransactionDate(tx.transaction_date)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {Icon && (
                                  <div className={`rounded-full p-1 ${catInfo.bg}`}>
                                    <Icon className={`h-3 w-3 ${catInfo.color}`} />
                                  </div>
                                )}
                                <span className="font-medium truncate max-w-[200px]">{tx.description}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <Badge variant="secondary" className="text-[10px]">
                                {getCategoryLabel(tx.category)}
                              </Badge>
                            </td>
                            <td className={`px-4 py-3 text-right font-semibold tabular-nums ${
                              tx.type === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : ''
                            }`}>
                              {tx.type === 'credit' ? '+' : '-'}{formatGBP(Number(tx.amount))}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground tabular-nums hidden md:table-cell">
                              {tx.balance_after != null ? formatGBP(Number(tx.balance_after)) : '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Month Cards Grid */}
          {isPending ? (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Loading statements...
              </CardContent>
            </Card>
          ) : summaries.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                  <FileDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No statements available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Statements will appear here once you have transactions.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {summaries.map((s) => (
                <button
                  key={`${s.year}-${s.monthNum}`}
                  onClick={() => handleSelectMonth(s)}
                  className="text-left rounded-lg border border-border bg-card p-4 hover:border-primary hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-full bg-primary/[0.08] p-2">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{s.month} {s.year}</p>
                        <p className="text-xs text-muted-foreground">{s.transactionCount} transactions</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <ArrowDownRight className="h-3 w-3" />
                      {formatGBP(s.totalIn)}
                    </div>
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <ArrowUpRight className="h-3 w-3" />
                      {formatGBP(s.totalOut)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
