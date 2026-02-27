'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LogoMark } from '@/components/brand/logo'
import { formatGBP } from '@/lib/utils/currency'
import {
  FileDown, Calendar, ChevronRight, Download, ArrowLeft, Printer,
  CreditCard, Landmark, Repeat, Banknote, Smartphone, Building2, ArrowLeftRight,
} from 'lucide-react'
import type { Account, Transaction, Profile } from '@/lib/types'

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
  profile: Profile | null
}

/* ──────────────────── helpers ──────────────────── */

function computeStartBalance(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0
  const first = transactions[0]
  const bal = Number(first.balance_after ?? 0)
  const amt = Number(first.amount)
  return first.type === 'debit' ? bal + amt : bal - amt
}

function computeEndBalance(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0
  return Number(transactions[transactions.length - 1].balance_after ?? 0)
}

function formatStatementDate(day: number, month: number, year: number): string {
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function getPreviousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

function generateIBAN(sortCode: string, accountNumber: string): string {
  const sc = sortCode.replace(/[^0-9]/g, '')
  const an = accountNumber.replace(/[^0-9]/g, '')
  return `GB29 NXBK ${sc.slice(0, 2)}${sc.slice(2, 4)} ${sc.slice(4, 6)}${an.slice(0, 2)} ${an.slice(2, 4)}${an.slice(4, 6)} ${an.slice(6, 8)}`
}

function getPaymentType(tx: Transaction): string {
  if (tx.type === 'credit') {
    if (tx.category === 'salary') return 'Bank Credit'
    if (tx.category === 'transfer') return 'Transfer'
    return 'Credit'
  }
  if (tx.category === 'bills' || tx.category === 'subscriptions') return 'Direct Debit'
  if (tx.category === 'shopping' || tx.category === 'groceries' || tx.category === 'dining') return 'Contactless'
  if (tx.category === 'transport' || tx.category === 'entertainment' || tx.category === 'health') return 'Debit Card'
  if (tx.category === 'cash') return 'Branch'
  if (tx.category === 'transfer') return 'Standing Order'
  return 'Debit Card'
}

function formatDayMonth(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function accountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    current: 'Current account',
    savings: 'Savings account',
    isa: 'ISA account',
    business: 'Business account',
  }
  return labels[type] || 'Account'
}

/* ──────────────────── Component ──────────────────── */

export function StatementsClient({ accounts, profile }: StatementsClientProps) {
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '')
  const [summaries, setSummaries] = useState<StatementSummary[]>([])
  const [selectedMonth, setSelectedMonth] = useState<StatementSummary | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isPending, startTransition] = useTransition()
  const [loadingTx, setLoadingTx] = useState(false)
  const statementRef = useRef<HTMLDivElement>(null)

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0]

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
    const headers = ['Date', 'Description', 'Type', 'Money Out', 'Money In', 'Balance']
    const rows = transactions.map((t) => [
      new Date(t.transaction_date).toLocaleDateString('en-GB'),
      `"${t.description.replace(/"/g, '""')}"`,
      getPaymentType(t),
      t.type === 'debit' ? Number(t.amount).toFixed(2) : '',
      t.type === 'credit' ? Number(t.amount).toFixed(2) : '',
      t.balance_after != null ? Number(t.balance_after).toFixed(2) : '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `nexusbank-statement-${selectedAccount?.account_name?.replace(/\s/g, '-') || 'account'}-${selectedMonth.month}-${selectedMonth.year}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  /* ──────── Month selection view ──────── */
  if (!selectedMonth) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight">Statements</h1>
            <p className="mt-1 text-[13px] lg:text-sm text-muted-foreground">Select a month to view your statement</p>
          </div>
        </div>

        {/* Account selector */}
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

        {/* Month cards */}
        {isPending ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading statements...
          </div>
        ) : summaries.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <FileDown className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No statements available</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Statements will appear here once you have transactions.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((s) => (
              <button
                key={`${s.year}-${s.monthNum}`}
                onClick={() => handleSelectMonth(s)}
                className="text-left rounded-xl border border-border bg-card p-4 hover:border-[#0676b6] hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="rounded-xl bg-[#0676b6]/10 p-2">
                      <Calendar className="h-4 w-4 text-[#0676b6]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{s.month} {s.year}</p>
                      <p className="text-xs text-muted-foreground">{s.transactionCount} transactions</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-[#0676b6] transition-colors" />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">In: {formatGBP(s.totalIn)}</span>
                  <span className="text-red-600 dark:text-red-400">Out: {formatGBP(s.totalOut)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ──────── Statement document view ──────── */
  const startBalance = computeStartBalance(transactions)
  const endBalance = computeEndBalance(transactions)
  const totalIn = selectedMonth.totalIn
  const totalOut = selectedMonth.totalOut
  const lastDay = getLastDayOfMonth(selectedMonth.year, selectedMonth.monthNum)
  const prev = getPreviousMonth(selectedMonth.year, selectedMonth.monthNum)
  const prevLastDay = getLastDayOfMonth(prev.year, prev.month)
  const statementDate = formatStatementDate(lastDay, selectedMonth.monthNum, selectedMonth.year)
  const lastStatementDate = formatStatementDate(prevLastDay, prev.month, prev.year)
  const periodStart = formatStatementDate(1, selectedMonth.monthNum, selectedMonth.year)
  const periodEnd = statementDate
  const swiftBic = 'NXBKGB2L'
  const iban = selectedAccount ? generateIBAN(selectedAccount.sort_code, selectedAccount.account_number) : ''

  // Group transactions by date
  const groupedByDate: Record<string, Transaction[]> = {}
  for (const tx of transactions) {
    const dateKey = formatDayMonth(tx.transaction_date)
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = []
    groupedByDate[dateKey].push(tx)
  }

  // Payment type legend
  const paymentTypes = [
    { icon: Banknote, label: 'Bank Credit' },
    { icon: Smartphone, label: 'Contactless' },
    { icon: CreditCard, label: 'Debit Card' },
    { icon: Repeat, label: 'Direct Debit' },
    { icon: ArrowLeftRight, label: 'Standing Order' },
    { icon: Building2, label: 'Branch' },
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar (outside the statement) */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedMonth(null); setTransactions([]) }}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          All statements
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePrint}>
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Print
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownloadCSV} disabled={transactions.length === 0}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Download CSV
          </Button>
        </div>
      </div>

      {loadingTx ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading statement...
        </div>
      ) : (
        /* The statement document */
        <div
          ref={statementRef}
          className="mx-auto max-w-[900px] bg-white text-[#1a1a1a] rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none"
        >
          {/* ─── Top Header Bar ─── */}
          <div className="flex items-center justify-between px-8 pt-8 pb-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <LogoMark size="md" />
              <span className="text-[20px] font-bold tracking-tight text-[#0676b6]">NexusBank</span>
            </div>

            {/* Statement dates */}
            <div className="text-center text-[11px] text-gray-500 leading-relaxed">
              <p>Statement date <span className="font-semibold text-[#1a1a1a]">{statementDate}</span></p>
              <p>Last statement date <span className="font-semibold text-[#1a1a1a]">{lastStatementDate}</span></p>
            </div>

            {/* Account type badge */}
            <div className="text-right">
              <p className="text-[15px] font-bold text-[#0676b6]">NexusBank Account</p>
            </div>
          </div>

          {/* Thin blue divider */}
          <div className="h-[2px] bg-[#0676b6]" />

          {/* ─── Info Section ─── */}
          <div className="px-8 pt-6 pb-4 flex gap-8">
            {/* Left: Customer Address */}
            <div className="flex-1">
              <p className="text-[13px] font-bold uppercase tracking-wide">
                {profile?.full_name || 'Account Holder'}
              </p>
              {profile?.address_line_1 && (
                <p className="text-[12px] uppercase text-gray-600 mt-0.5">{profile.address_line_1}</p>
              )}
              {profile?.address_line_2 && (
                <p className="text-[12px] uppercase text-gray-600">{profile.address_line_2}</p>
              )}
              {(profile?.city || profile?.postcode) && (
                <p className="text-[12px] uppercase text-gray-600">
                  {[profile.city, profile.postcode].filter(Boolean).join(', ')}
                </p>
              )}
              {profile?.country && profile.country !== 'GB' && (
                <p className="text-[12px] uppercase text-gray-600">{profile.country}</p>
              )}
            </div>

            {/* Right: At a glance */}
            <div className="w-[300px] shrink-0">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-[#d6eaf8] px-4 py-2">
                  <p className="text-[12px] font-bold text-[#0676b6] uppercase tracking-wider">At a glance</p>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-[12px] text-gray-600">Start balance</span>
                    <span className="text-[12px] font-semibold tabular-nums">{formatGBP(startBalance)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-[12px] text-gray-600">Money in</span>
                    <span className="text-[12px] font-semibold text-emerald-700 tabular-nums">{formatGBP(totalIn)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2">
                    <span className="text-[12px] text-gray-600">Money out</span>
                    <span className="text-[12px] font-semibold text-red-700 tabular-nums">{formatGBP(totalOut)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2 bg-gray-50">
                    <span className="text-[12px] font-bold text-gray-800">End balance</span>
                    <span className="text-[12px] font-bold tabular-nums">{formatGBP(endBalance)}</span>
                  </div>
                </div>
              </div>

              {/* Noticeboard */}
              <div className="mt-3 rounded-lg overflow-hidden">
                <div className="bg-[#0a2540] px-4 py-2">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">Noticeboard</p>
                </div>
                <div className="bg-[#0e3a5c] px-4 py-3">
                  <p className="text-[10px] text-blue-100 leading-relaxed">
                    NexusBank is covered by the Financial Services Compensation Scheme (FSCS).
                    The FSCS can pay compensation if a bank is unable to meet its financial obligations.
                    Most depositors are covered up to <span className="font-semibold text-white">&pound;85,000</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Main Statement Title ─── */}
          <div className="px-8 pt-4 pb-2">
            <h1 className="text-[22px] font-bold text-[#0676b6] leading-tight">
              Your NexusBank Account statement
            </h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {accountTypeLabel(selectedAccount?.account_type || 'current')} statement
            </p>
          </div>

          {/* ─── Account Details Row ─── */}
          <div className="px-8 pb-2">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-[11px] text-gray-500">
              <p>
                <span className="text-gray-400">Period:</span>{' '}
                <span className="font-medium text-[#1a1a1a]">{periodStart} &ndash; {periodEnd}</span>
              </p>
              <p>
                <span className="text-gray-400">Sort Code:</span>{' '}
                <span className="font-medium text-[#1a1a1a]">{selectedAccount?.sort_code}</span>
              </p>
              <p>
                <span className="text-gray-400">Account no:</span>{' '}
                <span className="font-medium text-[#1a1a1a]">{selectedAccount?.account_number}</span>
              </p>
              <p>
                <span className="text-gray-400">SWIFT BIC:</span>{' '}
                <span className="font-medium text-[#1a1a1a]">{swiftBic}</span>
              </p>
              <p>
                <span className="text-gray-400">IBAN:</span>{' '}
                <span className="font-medium text-[#1a1a1a]">{iban}</span>
              </p>
            </div>
          </div>

          {/* ─── Payment Type Legend ─── */}
          <div className="px-8 py-3 mt-1">
            <div className="flex items-center gap-6 border-t border-b border-gray-200 py-2.5">
              {paymentTypes.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-100">
                    <Icon className="h-3 w-3 text-gray-500" />
                  </div>
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Transactions Table ─── */}
          <div className="px-8 pb-8">
            {/* Table header */}
            <div className="rounded-t-lg bg-[#0676b6] px-4 py-2.5">
              <p className="text-[13px] font-bold text-white">Your transactions</p>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[80px_1fr_110px_110px_120px] border-b border-gray-300 bg-gray-50 px-4 py-2">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Date</span>
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Description</span>
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide text-right">Money out</span>
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide text-right">Money in</span>
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide text-right">Balance</span>
            </div>

            {/* Transaction rows */}
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-gray-400">
                No transactions for this period
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {Object.entries(groupedByDate).map(([dateLabel, txs]) => (
                  txs.map((tx, idx) => (
                    <div
                      key={tx.id}
                      className="grid grid-cols-[80px_1fr_110px_110px_120px] px-4 py-2 hover:bg-blue-50/30 transition-colors"
                    >
                      {/* Date: only show on first tx of the date group */}
                      <span className="text-[12px] text-gray-500 tabular-nums">
                        {idx === 0 ? dateLabel : ''}
                      </span>

                      {/* Description */}
                      <div className="flex items-center gap-2 pr-2 min-w-0">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-gray-100">
                          {tx.category === 'salary' && <Banknote className="h-2.5 w-2.5 text-gray-500" />}
                          {tx.category === 'transfer' && <ArrowLeftRight className="h-2.5 w-2.5 text-gray-500" />}
                          {(tx.category === 'bills' || tx.category === 'subscriptions') && <Repeat className="h-2.5 w-2.5 text-gray-500" />}
                          {(tx.category === 'shopping' || tx.category === 'groceries' || tx.category === 'dining') && <Smartphone className="h-2.5 w-2.5 text-gray-500" />}
                          {(tx.category === 'transport' || tx.category === 'entertainment' || tx.category === 'health' || tx.category === 'education') && <CreditCard className="h-2.5 w-2.5 text-gray-500" />}
                          {tx.category === 'cash' && <Building2 className="h-2.5 w-2.5 text-gray-500" />}
                          {!['salary', 'transfer', 'bills', 'subscriptions', 'shopping', 'groceries', 'dining', 'transport', 'entertainment', 'health', 'education', 'cash'].includes(tx.category) && (
                            <CreditCard className="h-2.5 w-2.5 text-gray-500" />
                          )}
                        </div>
                        <span className="text-[12px] text-gray-800 truncate">{tx.description}</span>
                      </div>

                      {/* Money out */}
                      <span className="text-[12px] text-right tabular-nums text-gray-800">
                        {tx.type === 'debit' ? formatGBP(Number(tx.amount)) : ''}
                      </span>

                      {/* Money in */}
                      <span className="text-[12px] text-right tabular-nums text-gray-800">
                        {tx.type === 'credit' ? formatGBP(Number(tx.amount)) : ''}
                      </span>

                      {/* Balance */}
                      <span className="text-[12px] text-right tabular-nums font-medium text-gray-800">
                        {tx.balance_after != null ? formatGBP(Number(tx.balance_after)) : ''}
                      </span>
                    </div>
                  ))
                ))}
              </div>
            )}

            {/* Bottom bar */}
            <div className="rounded-b-lg bg-[#0676b6] px-4 py-2.5 mt-0 flex items-center justify-between">
              <p className="text-[11px] text-blue-100">
                {selectedMonth.transactionCount} transaction{selectedMonth.transactionCount !== 1 ? 's' : ''} shown
              </p>
              <p className="text-[12px] font-bold text-white tabular-nums">
                End balance: {formatGBP(endBalance)}
              </p>
            </div>
          </div>

          {/* ─── Footer ─── */}
          <div className="border-t border-gray-200 bg-gray-50 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LogoMark size="sm" />
              <span className="text-[10px] text-gray-400">NexusBank UK PLC. Registered in England &amp; Wales.</span>
            </div>
            <p className="text-[10px] text-gray-400">
              Page 1 of 1
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
