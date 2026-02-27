'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useTransition, useRef, useEffect } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BadgePoundSterling, Check, Loader2, Search, UserSearch, X } from 'lucide-react'
import { formatGBP } from '@/lib/utils/currency'
import { creditCustomerAccount, searchCustomers, getCustomerAccountsAction } from './actions'
import Link from 'next/link'
import type { Transaction } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────

type CreditRow = Transaction & {
  account?: {
    user_id: string
    account_name: string
    profile?: { full_name: string; email: string } | null
  }
}

interface CreditsClientProps {
  data: CreditRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  search: string
}

type CreditReason =
  | 'refund'
  | 'goodwill'
  | 'correction'
  | 'promotional'
  | 'compensation'
  | 'interest_adjustment'
  | 'fee_reversal'
  | 'other'

const REASONS: { value: CreditReason; label: string }[] = [
  { value: 'refund', label: 'Refund' },
  { value: 'goodwill', label: 'Goodwill' },
  { value: 'correction', label: 'Correction' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'interest_adjustment', label: 'Interest Adjustment' },
  { value: 'fee_reversal', label: 'Fee Reversal' },
  { value: 'other', label: 'Other' },
]

interface CustomerResult {
  id: string
  full_name: string
  email: string
  membership_number: string | null
}

interface CustomerAccount {
  id: string
  account_name: string
  account_type: string
  balance: number
  is_active: boolean
}

// ─── Component ──────────────────────────────────────────

export function CreditsClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  search,
}: CreditsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ─── Form state
  const [customerSearch, setCustomerSearch] = useState('')
  const [searchResults, setSearchResults] = useState<CustomerResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null)
  const [accounts, setAccounts] = useState<CustomerAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState<CreditReason>('refund')
  const [note, setNote] = useState('')
  const [reference, setReference] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState<{ balance: number; txId: string } | null>(null)
  const [formError, setFormError] = useState('')

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ─── Customer search with debounce
  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value)
    setFormError('')
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    if (value.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchCustomers(value)
        setSearchResults(results)
        setShowDropdown(results.length > 0)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const selectCustomer = async (customer: CustomerResult) => {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.full_name)
    setShowDropdown(false)
    setSelectedAccountId('')
    setFormError('')

    try {
      const result = await getCustomerAccountsAction(customer.id)
      if (!result.success) {
        setAccounts([])
        setFormError(`Failed to load customer accounts: ${result.error || 'Unknown error'}`)
        return
      }
      setAccounts(result.accounts)
      if (result.accounts.length === 1) {
        setSelectedAccountId(result.accounts[0].id)
      }
    } catch (err) {
      setAccounts([])
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setFormError(`Failed to load customer accounts: ${msg}`)
      console.error('[Credits] getCustomerAccountsAction error:', err)
    }
  }

  const clearCustomer = () => {
    setSelectedCustomer(null)
    setCustomerSearch('')
    setAccounts([])
    setSelectedAccountId('')
    setSearchResults([])
    setFormError('')
  }

  // ─── Form validation
  const parsedAmount = parseFloat(amount)
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0
  const isFormValid =
    selectedCustomer &&
    selectedAccountId &&
    isAmountValid &&
    note.trim().length >= 5

  // ─── Submit
  const handleSubmit = () => {
    if (!isFormValid) return
    setFormError('')
    setShowConfirmation(true)
  }

  const handleConfirm = () => {
    setFormError('')
    startTransition(async () => {
      try {
        const result = await creditCustomerAccount({
          accountId: selectedAccountId,
          amount: parsedAmount,
          reason,
          note: note.trim(),
          reference: reference.trim() || undefined,
        })
        setSuccess({ balance: result.newBalance, txId: result.transactionId })
        setShowConfirmation(false)
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to credit account')
        setShowConfirmation(false)
      }
    })
  }

  const resetForm = () => {
    clearCustomer()
    setAmount('')
    setReason('refund')
    setNote('')
    setReference('')
    setSuccess(null)
    setShowConfirmation(false)
    setFormError('')
    router.refresh()
  }

  // ─── Table navigation
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/credits?${params.toString()}`)
    },
    [router, searchParams]
  )

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)

  // ─── Shared classes
  const inputClass =
    'w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]/10 transition-all'
  const labelClass = 'block text-[13px] font-medium text-foreground mb-1'

  // ─── Table columns
  const columns: Column<CreditRow>[] = [
    {
      key: 'transaction_date',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          {new Date(row.transaction_date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => {
        const userId = row.account?.user_id
        const profile = row.account?.profile
        return (
          <div>
            {userId ? (
              <Link
                href={`/admin/customers/${userId}`}
                className="text-[#00AEEF] hover:underline text-[13px] font-medium"
              >
                {profile?.full_name || 'Unknown'}
              </Link>
            ) : (
              <span className="text-[13px] text-muted-foreground">—</span>
            )}
            {profile?.email && (
              <p className="text-[11px] text-muted-foreground">{profile.email}</p>
            )}
          </div>
        )
      },
    },
    {
      key: 'account',
      label: 'Account',
      render: (row) => (
        <span className="text-[13px]">{row.account?.account_name || '—'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className="text-[13px] font-semibold text-green-600 dark:text-green-400 tabular-nums">
          +{formatGBP(row.amount)}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Reason',
      render: (row) => (
        <span className="text-[13px] truncate max-w-[250px] block" title={row.description || ''}>
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'reference',
      label: 'Reference',
      render: (row) => (
        <span className="text-[11px] font-mono text-muted-foreground">
          {row.reference || '—'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      {/* ── Credit Form ──────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-teal-500/10">
            <BadgePoundSterling className="h-4 w-4 text-teal-500" />
          </div>
          <h2 className="text-[16px] font-semibold text-foreground">New Credit</h2>
        </div>

        {success ? (
          /* ── Success view ─── */
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-[16px] font-semibold text-foreground">Credit Applied Successfully</h3>
            <p className="text-[13px] text-muted-foreground">
              New balance: <span className="font-semibold text-foreground">{formatGBP(success.balance)}</span>
            </p>
            <p className="text-[11px] font-mono text-muted-foreground">
              Transaction: {success.txId.slice(0, 8)}
            </p>
            <Button onClick={resetForm} className="mt-4 bg-[#00AEEF] hover:bg-[#0098d1] text-white">
              Apply Another Credit
            </Button>
          </div>
        ) : (
          /* ── Form ─── */
          <div className="grid gap-5 md:grid-cols-2">
            {/* Customer search */}
            <div className="md:col-span-2" ref={dropdownRef}>
              <label className={labelClass}>Customer</label>
              <div className="relative">
                {selectedCustomer ? (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-foreground truncate">
                        {selectedCustomer.full_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {selectedCustomer.email}
                        {selectedCustomer.membership_number && ` · ${selectedCustomer.membership_number}`}
                      </p>
                    </div>
                    <button onClick={clearCustomer} className="p-1 hover:bg-muted rounded">
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <UserSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        placeholder="Search by name, email, or membership number..."
                        className={`${inputClass} pl-9`}
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
                      )}
                    </div>

                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                        {searchResults.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => selectCustomer(c)}
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                          >
                            <p className="text-[13px] font-medium text-foreground">{c.full_name}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {c.email}
                              {c.membership_number && ` · ${c.membership_number}`}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Account selector */}
            <div>
              <label className={labelClass}>Account</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                disabled={accounts.length === 0}
                className={inputClass}
              >
                <option value="">
                  {accounts.length === 0
                    ? selectedCustomer
                      ? 'No active accounts'
                      : 'Select a customer first'
                    : 'Select account...'}
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({a.account_type}) — {formatGBP(a.balance)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className={labelClass}>Amount (£)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={`${inputClass} tabular-nums`}
              />
            </div>

            {/* Reason */}
            <div>
              <label className={labelClass}>Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as CreditReason)}
                className={inputClass}
              >
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference */}
            <div>
              <label className={labelClass}>
                Reference <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. REFUND-2024-001"
                maxLength={50}
                className={inputClass}
              />
            </div>

            {/* Note */}
            <div className="md:col-span-2">
              <label className={labelClass}>Note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Describe the reason for this credit (min 5 characters)..."
                className={`${inputClass} resize-none`}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {note.trim().length}/5 characters minimum
              </p>
            </div>

            {/* Error */}
            {formError && (
              <div className="md:col-span-2 text-[13px] text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md px-3 py-2">
                {formError}
              </div>
            )}

            {/* Confirmation panel */}
            {showConfirmation && selectedCustomer && selectedAccount && (
              <div className="md:col-span-2 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                <h4 className="text-[14px] font-semibold text-foreground">Confirm Credit</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedCustomer.full_name}</span>
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium">{selectedAccount.account_name}</span>
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-medium tabular-nums">{formatGBP(selectedAccount.balance)}</span>
                  <span className="text-muted-foreground">Credit Amount</span>
                  <span className="font-semibold text-green-600 dark:text-green-400 tabular-nums">
                    +{formatGBP(parsedAmount)}
                  </span>
                  <span className="text-muted-foreground">New Balance</span>
                  <span className="font-semibold tabular-nums">
                    {formatGBP(selectedAccount.balance + parsedAmount)}
                  </span>
                  <span className="text-muted-foreground">Reason</span>
                  <span className="font-medium capitalize">{reason.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmation(false)}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={isPending}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm & Apply Credit'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Submit button */}
            {!showConfirmation && (
              <div className="md:col-span-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isPending}
                  className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
                >
                  Review Credit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Credit History ───────────────────────────────── */}
      <div>
        <h2 className="text-[16px] font-semibold text-foreground mb-3">Credit History</h2>
        <DataTable
          columns={columns}
          data={data}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          searchValue={search}
          searchPlaceholder="Search credits by description or reference..."
          onSearch={(q) => updateParams({ search: q })}
          onPageChange={(p) => updateParams({ page: String(p) })}
          emptyIcon={BadgePoundSterling}
          emptyTitle="No credits yet"
          emptyDescription="Credits will appear here once you apply them."
        />
      </div>
    </div>
  )
}
