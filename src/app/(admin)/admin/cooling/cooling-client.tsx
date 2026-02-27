'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatSortCode } from '@/lib/utils/sort-code'
import { maskAccountNumber } from '@/lib/utils/account-number'
import {
  Search,
  User,
  Clock,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  Star,
} from 'lucide-react'
import {
  searchCustomersForCooling,
  getCustomerPayeesWithCooling,
  waiveCoolingPeriod,
  type CoolingPayee,
} from './actions'

export function CoolingClient() {
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<{ id: string; full_name: string; email: string }[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; full_name: string; email: string } | null>(null)
  const [payees, setPayees] = useState<CoolingPayee[]>([])
  const [coolingHours, setCoolingHours] = useState(24)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Waive dialog
  const [waivePayeeId, setWaivePayeeId] = useState<string | null>(null)
  const [waiveReason, setWaiveReason] = useState('')
  const [waiveError, setWaiveError] = useState('')

  const waivePayee = payees.find((p) => p.id === waivePayeeId)

  async function handleSearch(value: string) {
    setCustomerSearch(value)
    setError('')
    setSuccessMsg('')

    if (value.trim().length < 2) {
      setCustomers([])
      setShowDropdown(false)
      return
    }

    const result = await searchCustomersForCooling(value)
    if (result.success) {
      setCustomers(result.customers)
      setShowDropdown(result.customers.length > 0)
    }
  }

  async function selectCustomer(customer: { id: string; full_name: string; email: string }) {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.full_name)
    setShowDropdown(false)
    setError('')
    setSuccessMsg('')

    const result = await getCustomerPayeesWithCooling(customer.id)
    if (result.success) {
      setPayees(result.payees)
      setCoolingHours(result.coolingHours)
    } else {
      setPayees([])
      setError(result.error || 'Failed to load payees')
    }
  }

  function handleWaiveConfirm() {
    if (!waivePayeeId || waiveReason.trim().length < 5) {
      setWaiveError('Please provide a reason (minimum 5 characters)')
      return
    }

    startTransition(async () => {
      const result = await waiveCoolingPeriod(waivePayeeId, waiveReason)
      if (result.success) {
        setWaivePayeeId(null)
        setWaiveReason('')
        setWaiveError('')
        setSuccessMsg(`Cooling period waived for ${waivePayee?.name}. The customer can now send payments immediately.`)

        // Refresh payees list
        if (selectedCustomer) {
          const refreshed = await getCustomerPayeesWithCooling(selectedCustomer.id)
          if (refreshed.success) {
            setPayees(refreshed.payees)
          }
        }
      } else {
        setWaiveError(result.error || 'Failed to waive cooling period')
      }
    })
  }

  const activeCooling = payees.filter((p) => p.cooling_status === 'active')
  const clearedPayees = payees.filter((p) => p.cooling_status !== 'active')

  return (
    <div className="space-y-6">
      {/* Customer search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={customerSearch}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => customers.length > 0 && setShowDropdown(true)}
            />

            {showDropdown && (
              <div className="absolute z-20 mt-1 w-full rounded-lg border bg-card shadow-lg max-h-[240px] overflow-y-auto">
                {customers.map((c) => (
                  <button
                    key={c.id}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-0"
                    onClick={() => selectCustomer(c)}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.full_name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error / Success */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}
      {successMsg && (
        <Card className="border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {successMsg}
          </CardContent>
        </Card>
      )}

      {/* Payee list */}
      {selectedCustomer && (
        <>
          {/* Active cooling periods */}
          {activeCooling.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">
                    Active Cooling Periods ({activeCooling.length})
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  These payees are still within their {coolingHours}-hour cooling window
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeCooling.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium">{p.name}</p>
                          {p.is_favourite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                        </div>
                        <p className="text-xs text-muted-foreground tabular-nums">
                          {formatSortCode(p.sort_code)} &middot; {maskAccountNumber(p.account_number)}
                        </p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                          {p.hours_remaining} hour{p.hours_remaining !== 1 ? 's' : ''} remaining
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      onClick={() => {
                        setWaivePayeeId(p.id)
                        setWaiveReason('')
                        setWaiveError('')
                        setSuccessMsg('')
                      }}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                      Waive
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* No active cooling */}
          {activeCooling.length === 0 && payees.length > 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm font-medium">No active cooling periods</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All of {selectedCustomer.full_name}&apos;s payees have cleared their cooling periods.
                </p>
              </CardContent>
            </Card>
          )}

          {payees.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-medium">No payees found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This customer has no saved payees yet.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cleared payees (collapsed) */}
          {clearedPayees.length > 0 && (
            <details className="group">
              <summary className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 px-1">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>{clearedPayees.length} payee{clearedPayees.length !== 1 ? 's' : ''} with cleared cooling</span>
              </summary>
              <Card className="mt-2">
                <CardContent className="p-3 space-y-1">
                  {clearedPayees.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{p.name}</span>
                          {p.is_favourite && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatSortCode(p.sort_code)} &middot; {maskAccountNumber(p.account_number)}
                        </span>
                      </div>
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </details>
          )}
        </>
      )}

      {/* Waive confirmation dialog */}
      {waivePayeeId && waivePayee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md animate-in zoom-in-95 fade-in duration-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-base">Waive Cooling Period</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Payee</span>
                  <span className="font-medium">{waivePayee.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sort code</span>
                  <span className="font-medium tabular-nums">{formatSortCode(waivePayee.sort_code)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-medium tabular-nums">{waivePayee.account_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selectedCustomer?.full_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time remaining</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {waivePayee.hours_remaining}h
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This will allow the customer to send Faster Payments to this payee immediately,
                  bypassing the {coolingHours}-hour cooling period. Only do this after confirming the
                  customer&apos;s identity and that they initiated the payment.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for waiver</label>
                <Input
                  placeholder="e.g. Customer identity verified via phone call"
                  value={waiveReason}
                  onChange={(e) => {
                    setWaiveReason(e.target.value)
                    setWaiveError('')
                  }}
                />
                {waiveError && (
                  <p className="text-xs text-destructive">{waiveError}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setWaivePayeeId(null)
                    setWaiveReason('')
                    setWaiveError('')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleWaiveConfirm}
                  loading={isPending}
                  disabled={waiveReason.trim().length < 5}
                >
                  <ShieldCheck className="h-4 w-4 mr-1.5" />
                  Confirm Waiver
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
