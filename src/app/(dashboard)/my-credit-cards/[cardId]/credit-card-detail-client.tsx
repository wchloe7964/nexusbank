'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { formatGBP } from '@/lib/utils/currency'
import { cardNetworkConfigs, cardStatusConfigs } from '@/lib/constants/credit-cards'
import { ArrowLeft, Wallet, Snowflake, Calendar, Percent, Gift, CreditCard } from 'lucide-react'
import { BankCard } from '@/components/shared/bank-card'
import Link from 'next/link'
import type { CreditCard as CreditCardType, Account } from '@/lib/types'
import { makeCreditCardPayment, toggleCreditCardFreeze } from '../actions'

interface Props {
  card: CreditCardType
  accounts: Account[]
}

export function CreditCardDetailClient({ card: initialCard, accounts }: Props) {
  const [card, setCard] = useState(initialCard)
  const [isPending, startTransition] = useTransition()

  // Payment dialog
  const [showPayment, setShowPayment] = useState(false)
  const [paymentAccountId, setPaymentAccountId] = useState(card.linked_account_id ?? accounts[0]?.id ?? '')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentError, setPaymentError] = useState('')

  const network = cardNetworkConfigs[card.card_network]
  const statusCfg = cardStatusConfigs[card.status]
  const StatusIcon = statusCfg.icon
  const utilization = Number(card.credit_limit) > 0
    ? (Number(card.current_balance) / Number(card.credit_limit)) * 100
    : 0

  function handleMakePayment() {
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid amount')
      return
    }
    if (amount > Number(card.current_balance)) {
      setPaymentError('Amount exceeds current balance')
      return
    }

    startTransition(async () => {
      try {
        await makeCreditCardPayment({
          creditCardId: card.id,
          fromAccountId: paymentAccountId,
          amount,
        })
        setCard((prev) => ({
          ...prev,
          current_balance: Number(prev.current_balance) - amount,
          available_credit: Number(prev.available_credit) + amount,
          minimum_payment: Math.max(0, (Number(prev.current_balance) - amount) * 0.02),
        }))
        setShowPayment(false)
        setPaymentAmount('')
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : 'Payment failed')
      }
    })
  }

  function handleToggleFreeze() {
    startTransition(async () => {
      try {
        const result = await toggleCreditCardFreeze(card.id)
        setCard((prev) => ({ ...prev, status: result.newStatus as CreditCardType['status'] }))
      } catch {
        // silent
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link href="/my-credit-cards" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Credit Cards
      </Link>

      {/* Visual Card */}
      <BankCard variant="credit" card={card} size="full" />

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={() => setShowPayment(true)} disabled={card.status === 'closed' || Number(card.current_balance) <= 0}>
          <Wallet className="mr-2 h-4 w-4" />
          Make Payment
        </Button>
        <div className="flex items-center gap-2">
          <Snowflake className={`h-4 w-4 ${card.status === 'frozen' ? 'text-blue-500' : 'text-muted-foreground'}`} />
          <Switch
            checked={card.status === 'frozen'}
            onCheckedChange={handleToggleFreeze}
            disabled={isPending || card.status === 'closed'}
          />
          <span className="text-sm text-muted-foreground">{card.status === 'frozen' ? 'Unfreeze' : 'Freeze'} Card</span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4 text-primary" />
              Balance & Credit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-semibold">{formatGBP(Number(card.current_balance))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Credit Limit</span>
              <span className="font-semibold">{formatGBP(Number(card.credit_limit))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available Credit</span>
              <span className="font-semibold text-success">{formatGBP(Number(card.available_credit))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Minimum Payment</span>
              <span className="font-semibold">{formatGBP(Number(card.minimum_payment))}</span>
            </div>
            {/* Utilization */}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>Credit Utilization</span>
                <span>{utilization.toFixed(1)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    utilization > 75 ? 'bg-destructive' : utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4 text-primary" />
              Dates & Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment Due Date</span>
              <span className="font-semibold">
                {card.payment_due_date
                  ? new Date(card.payment_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Statement Date</span>
              <span className="font-semibold">
                {card.statement_date
                  ? new Date(card.statement_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">APR</span>
              <span className="font-semibold">{Number(card.apr)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rewards Rate</span>
              <span className="font-semibold">{(Number(card.rewards_rate) * 100).toFixed(2)}% cashback</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Card Network</span>
              <span className={`font-semibold ${network.color}`}>{network.label}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onClose={() => setShowPayment(false)} title="Make a Payment">
        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm font-medium">{card.card_name}</p>
            <p className="text-xs text-muted-foreground">
              Balance: {formatGBP(Number(card.current_balance))}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium">Pay From</label>
            <select
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={paymentAccountId}
              onChange={(e) => setPaymentAccountId(e.target.value)}
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
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-2 mt-2">
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setPaymentAmount(Number(card.minimum_payment).toFixed(2))}
              >
                Min ({formatGBP(Number(card.minimum_payment))})
              </button>
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setPaymentAmount(Number(card.current_balance).toFixed(2))}
              >
                Full ({formatGBP(Number(card.current_balance))})
              </button>
            </div>
          </div>

          {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleMakePayment} disabled={isPending}>
              {isPending ? 'Processing...' : 'Make Payment'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
