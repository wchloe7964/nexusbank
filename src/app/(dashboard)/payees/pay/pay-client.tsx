'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatGBP } from '@/lib/utils/currency'
import { formatSortCode } from '@/lib/utils/sort-code'
import { maskAccountNumber } from '@/lib/utils/account-number'
import { CheckCircle, ArrowRight, User, Send } from 'lucide-react'
import type { Account, Payee } from '@/lib/types'
import { executePayeePayment } from './actions'
import Link from 'next/link'

interface PayClientProps {
  payee: Payee
  accounts: Account[]
}

type Step = 'form' | 'confirm' | 'success'

export function PayClient({ payee, accounts }: PayClientProps) {
  const [step, setStep] = useState<Step>('form')
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState(payee.reference || '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const parsedAmount = parseFloat(amount)

  function handleReview() {
    if (!fromAccountId || !amount || parsedAmount <= 0) return
    if (fromAccount && parsedAmount > Number(fromAccount.balance)) {
      setError('Insufficient funds in selected account')
      return
    }
    setError('')
    setStep('confirm')
  }

  function handleConfirm() {
    startTransition(async () => {
      try {
        await executePayeePayment({
          fromAccountId,
          payeeId: payee.id,
          amount: parsedAmount,
          reference: reference || undefined,
        })
        setStep('success')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Payment failed. Please try again.')
        setStep('form')
      }
    })
  }

  function handleReset() {
    setStep('form')
    setAmount('')
    setReference(payee.reference || '')
    setError('')
  }

  if (step === 'success') {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 mb-5">
            <CheckCircle className="h-7 w-7 text-emerald-500" />
          </div>
          <h2 className="text-lg font-semibold">Payment Sent</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatGBP(parsedAmount)} has been sent to {payee.name}
          </p>

          <div className="mt-6 rounded-lg bg-muted/50 p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium">{payee.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatGBP(parsedAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium">{fromAccount?.account_name}</span>
            </div>
            {reference && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium">{reference}</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleReset}>
              Pay Again
            </Button>
            <Link href="/payees" className="flex-1">
              <Button className="w-full">Back to Payees</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'confirm') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Confirm Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="rounded-full bg-primary/[0.08] p-2.5">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{payee.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSortCode(payee.sort_code)} &middot; {maskAccountNumber(payee.account_number)}
                </p>
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-lg font-bold">{formatGBP(parsedAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium">{fromAccount?.account_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Balance</span>
              <span className="font-medium">{formatGBP(Number(fromAccount?.balance || 0))}</span>
            </div>
            {reference && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium">{reference}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>
              Edit
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={isPending} loading={isPending}>
              <Send className="mr-2 h-4 w-4" />
              Send Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Payee Info */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
          <div className="rounded-full bg-primary/[0.08] p-2.5">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">{payee.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatSortCode(payee.sort_code)} &middot; {maskAccountNumber(payee.account_number)}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* From Account */}
        <div className="space-y-2">
          <label className="text-sm font-medium">From Account</label>
          <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name} — {formatGBP(Number(acc.balance))}
              </option>
            ))}
          </Select>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={0.01}
              step={0.01}
              className="pl-8"
            />
          </div>
        </div>

        {/* Reference */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Reference (optional)</label>
          <Input
            placeholder="Payment reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={50}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleReview}
          disabled={!fromAccountId || !amount || parsedAmount <= 0}
        >
          Review Payment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
