'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { loanTypeConfigs, loanStatusConfigs } from '@/lib/constants/loans'
import { ChevronRight, Wallet, Banknote } from 'lucide-react'
import Link from 'next/link'
import type { Loan, Account } from '@/lib/types'
import { makeLoanOverpayment } from './actions'

interface Props {
  loans: Loan[]
  accounts: Account[]
}

export function LoansClient({ loans: initialLoans, accounts }: Props) {
  const [loans, setLoans] = useState(initialLoans)
  const [isPending, startTransition] = useTransition()

  // Overpayment dialog
  const [overpayLoan, setOverpayLoan] = useState<Loan | null>(null)
  const [overpayAccountId, setOverpayAccountId] = useState('')
  const [overpayAmount, setOverpayAmount] = useState('')
  const [overpayError, setOverpayError] = useState('')

  const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.original_amount), 0)
  const totalRemaining = loans.reduce((sum, l) => sum + Number(l.remaining_balance), 0)
  const monthlyOutgoing = loans.filter((l) => l.status === 'active').reduce((sum, l) => sum + Number(l.monthly_payment), 0)

  function openOverpayment(loan: Loan) {
    setOverpayLoan(loan)
    setOverpayAccountId(loan.linked_account_id ?? accounts[0]?.id ?? '')
    setOverpayAmount('')
    setOverpayError('')
  }

  function handleOverpay() {
    if (!overpayLoan) return
    const amount = parseFloat(overpayAmount)
    if (isNaN(amount) || amount <= 0) {
      setOverpayError('Please enter a valid amount')
      return
    }
    if (amount > Number(overpayLoan.remaining_balance)) {
      setOverpayError('Amount exceeds remaining balance')
      return
    }

    startTransition(async () => {
      try {
        await makeLoanOverpayment({
          loanId: overpayLoan.id,
          fromAccountId: overpayAccountId,
          amount,
        })
        setLoans((prev) =>
          prev.map((l) => {
            if (l.id !== overpayLoan.id) return l
            const newBalance = Number(l.remaining_balance) - amount
            return {
              ...l,
              remaining_balance: newBalance,
              months_remaining: newBalance <= 0 ? 0 : Math.max(1, Math.ceil(newBalance / Number(l.monthly_payment))),
              status: newBalance <= 0 ? ('paid_off' as const) : l.status,
            }
          })
        )
        setOverpayLoan(null)
      } catch (err) {
        setOverpayError(err instanceof Error ? err.message : 'Payment failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Borrowed</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatGBP(totalBorrowed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Remaining</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatGBP(totalRemaining)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Monthly Outgoing</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-destructive">{formatGBP(monthlyOutgoing)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Loan Cards */}
      <div className="grid gap-4">
        {loans.map((loan) => {
          const typeCfg = loanTypeConfigs[loan.loan_type as keyof typeof loanTypeConfigs]
          const statusCfg = loanStatusConfigs[loan.status as keyof typeof loanStatusConfigs]
          const TypeIcon = typeCfg?.icon ?? Banknote
          const StatusIcon = statusCfg?.icon
          const paidPct = Number(loan.original_amount) > 0
            ? ((Number(loan.original_amount) - Number(loan.remaining_balance)) / Number(loan.original_amount)) * 100
            : 0

          return (
            <Card key={loan.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2.5 ${typeCfg?.bg ?? 'bg-gray-50'}`}>
                      <TypeIcon className={`h-4 w-4 ${typeCfg?.color ?? 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{loan.loan_name}</p>
                      <p className="text-xs text-muted-foreground">{typeCfg?.label ?? loan.loan_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${statusCfg?.bg ?? ''} ${statusCfg?.color ?? ''} border-0`}>
                      {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
                      {statusCfg?.label ?? loan.status}
                    </Badge>
                    <Link href={`/loans/${loan.id}`}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Repaid: {formatGBP(Number(loan.original_amount) - Number(loan.remaining_balance))}</span>
                    <span>{paidPct.toFixed(1)}% complete</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(paidPct, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="font-semibold">{formatGBP(Number(loan.remaining_balance))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly</p>
                    <p className="font-semibold">{formatGBP(Number(loan.monthly_payment))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rate</p>
                    <p className="font-semibold">{Number(loan.interest_rate)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Months Left</p>
                    <p className="font-semibold">{loan.months_remaining}</p>
                  </div>
                </div>

                {loan.status === 'active' && (
                  <Button size="sm" variant="outline" onClick={() => openOverpayment(loan)}>
                    <Wallet className="mr-1.5 h-3.5 w-3.5" />
                    Make Overpayment
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Overpayment Dialog */}
      <Dialog open={!!overpayLoan} onClose={() => setOverpayLoan(null)} title="Make an Overpayment">
        {overpayLoan && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">{overpayLoan.loan_name}</p>
              <p className="text-xs text-muted-foreground">
                Remaining: {formatGBP(Number(overpayLoan.remaining_balance))}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Pay From</label>
              <select
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={overpayAccountId}
                onChange={(e) => setOverpayAccountId(e.target.value)}
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.nickname || acc.account_name} ({formatGBP(Number(acc.available_balance))})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={overpayAmount}
                  onChange={(e) => setOverpayAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {overpayError && <p className="text-sm text-destructive">{overpayError}</p>}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setOverpayLoan(null)}>Cancel</Button>
              <Button className="flex-1" onClick={handleOverpay} disabled={isPending}>
                {isPending ? 'Processing...' : 'Make Overpayment'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
