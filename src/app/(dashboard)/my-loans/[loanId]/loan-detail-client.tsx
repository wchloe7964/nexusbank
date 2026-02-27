'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { loanTypeConfigs, loanStatusConfigs } from '@/lib/constants/loans'
import { ArrowLeft, Wallet, Calendar, Percent, Banknote } from 'lucide-react'
import Link from 'next/link'
import type { Loan, Account } from '@/lib/types'
import { makeLoanOverpayment } from '../actions'

interface Props {
  loan: Loan
  accounts: Account[]
}

export function LoanDetailClient({ loan: initialLoan, accounts }: Props) {
  const [loan, setLoan] = useState(initialLoan)
  const [isPending, startTransition] = useTransition()

  const [showOverpay, setShowOverpay] = useState(false)
  const [overpayAccountId, setOverpayAccountId] = useState(loan.linked_account_id ?? accounts[0]?.id ?? '')
  const [overpayAmount, setOverpayAmount] = useState('')
  const [overpayError, setOverpayError] = useState('')

  const typeCfg = loanTypeConfigs[loan.loan_type as keyof typeof loanTypeConfigs]
  const statusCfg = loanStatusConfigs[loan.status as keyof typeof loanStatusConfigs]
  const TypeIcon = typeCfg?.icon ?? Banknote
  const StatusIcon = statusCfg?.icon
  const paidAmount = Number(loan.original_amount) - Number(loan.remaining_balance)
  const paidPct = Number(loan.original_amount) > 0 ? (paidAmount / Number(loan.original_amount)) * 100 : 0
  const totalInterest = (Number(loan.monthly_payment) * loan.term_months) - Number(loan.original_amount)

  function handleOverpay() {
    const amount = parseFloat(overpayAmount)
    if (isNaN(amount) || amount <= 0) {
      setOverpayError('Please enter a valid amount')
      return
    }
    if (amount > Number(loan.remaining_balance)) {
      setOverpayError('Amount exceeds remaining balance')
      return
    }

    startTransition(async () => {
      try {
        await makeLoanOverpayment({ loanId: loan.id, fromAccountId: overpayAccountId, amount })
        const newBalance = Number(loan.remaining_balance) - amount
        setLoan((prev) => ({
          ...prev,
          remaining_balance: newBalance,
          months_remaining: newBalance <= 0 ? 0 : Math.max(1, Math.ceil(newBalance / Number(prev.monthly_payment))),
          status: newBalance <= 0 ? ('paid_off' as const) : prev.status,
        }))
        setShowOverpay(false)
        setOverpayAmount('')
      } catch (err) {
        setOverpayError(err instanceof Error ? err.message : 'Payment failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link href="/my-loans" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Loans
      </Link>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`rounded-xl p-3 ${typeCfg?.bg ?? 'bg-gray-50'}`}>
              <TypeIcon className={`h-5 w-5 ${typeCfg?.color ?? 'text-gray-500'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{loan.loan_name}</h2>
              <p className="text-sm text-muted-foreground">{typeCfg?.label ?? loan.loan_type}</p>
            </div>
            <Badge variant="outline" className={`ml-auto ${statusCfg?.bg ?? ''} ${statusCfg?.color ?? ''} border-0`}>
              {StatusIcon && <StatusIcon className="mr-1 h-3 w-3" />}
              {statusCfg?.label ?? loan.status}
            </Badge>
          </div>

          {/* Big Progress */}
          <div className="mb-2">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Repaid: {formatGBP(paidAmount)}</span>
              <span className="font-semibold">{paidPct.toFixed(1)}% complete</span>
            </div>
            <div className="h-4 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(paidPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatGBP(0)}</span>
              <span>{formatGBP(Number(loan.original_amount))}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      {loan.status === 'active' && (
        <Button onClick={() => setShowOverpay(true)}>
          <Wallet className="mr-2 h-4 w-4" />
          Make Overpayment
        </Button>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4 text-primary" />
              Loan Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Amount</span>
              <span className="font-semibold">{formatGBP(Number(loan.original_amount))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining Balance</span>
              <span className="font-semibold">{formatGBP(Number(loan.remaining_balance))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Payment</span>
              <span className="font-semibold">{formatGBP(Number(loan.monthly_payment))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Interest Rate</span>
              <span className="font-semibold">{Number(loan.interest_rate)}% APR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Total Interest</span>
              <span className="font-semibold">{formatGBP(Math.max(0, totalInterest))}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-semibold">
                {new Date(loan.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-semibold">
                {new Date(loan.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Next Payment</span>
              <span className="font-semibold">
                {loan.next_payment_date
                  ? new Date(loan.next_payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Term</span>
              <span className="font-semibold">{loan.term_months} months</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Months Remaining</span>
              <span className="font-semibold">{loan.months_remaining}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overpayment Dialog */}
      <Dialog open={showOverpay} onClose={() => setShowOverpay(false)} title="Make an Overpayment">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">{loan.loan_name}</p>
            <p className="text-xs text-muted-foreground">Remaining: {formatGBP(Number(loan.remaining_balance))}</p>
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
            <Button variant="outline" className="flex-1" onClick={() => setShowOverpay(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleOverpay} disabled={isPending}>
              {isPending ? 'Processing...' : 'Make Overpayment'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
