'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { formatGBP } from '@/lib/utils/currency'
import { cardNetworkConfigs, cardStatusConfigs } from '@/lib/constants/credit-cards'
import { CircleDollarSign, Snowflake, CreditCard, ChevronRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import type { CreditCard as CreditCardType, Account } from '@/lib/types'
import { makeCreditCardPayment, toggleCreditCardFreeze } from './actions'

interface Props {
  creditCards: CreditCardType[]
  accounts: Account[]
}

export function CreditCardsClient({ creditCards: initialCards, accounts }: Props) {
  const [creditCards, setCreditCards] = useState(initialCards)
  const [isPending, startTransition] = useTransition()

  // Payment dialog
  const [paymentCard, setPaymentCard] = useState<CreditCardType | null>(null)
  const [paymentAccountId, setPaymentAccountId] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentType, setPaymentType] = useState<'minimum' | 'full' | 'custom'>('custom')
  const [paymentError, setPaymentError] = useState('')

  const totalBalance = creditCards.reduce((sum, c) => sum + Number(c.current_balance), 0)
  const totalLimit = creditCards.reduce((sum, c) => sum + Number(c.credit_limit), 0)
  const totalAvailable = creditCards.reduce((sum, c) => sum + Number(c.available_credit), 0)

  function openPayment(card: CreditCardType) {
    setPaymentCard(card)
    setPaymentAccountId(card.linked_account_id ?? accounts[0]?.id ?? '')
    setPaymentAmount('')
    setPaymentType('custom')
    setPaymentError('')
  }

  function handlePaymentTypeChange(type: 'minimum' | 'full' | 'custom') {
    setPaymentType(type)
    if (!paymentCard) return
    if (type === 'minimum') setPaymentAmount(Number(paymentCard.minimum_payment).toFixed(2))
    else if (type === 'full') setPaymentAmount(Number(paymentCard.current_balance).toFixed(2))
    else setPaymentAmount('')
  }

  function handleMakePayment() {
    if (!paymentCard) return
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a valid amount')
      return
    }
    if (amount > Number(paymentCard.current_balance)) {
      setPaymentError('Amount exceeds current balance')
      return
    }
    const selectedAccount = accounts.find((a) => a.id === paymentAccountId)
    if (!selectedAccount || Number(selectedAccount.available_balance) < amount) {
      setPaymentError('Insufficient funds in selected account')
      return
    }

    startTransition(async () => {
      try {
        await makeCreditCardPayment({
          creditCardId: paymentCard.id,
          fromAccountId: paymentAccountId,
          amount,
        })
        setCreditCards((prev) =>
          prev.map((c) =>
            c.id === paymentCard.id
              ? {
                  ...c,
                  current_balance: Number(c.current_balance) - amount,
                  available_credit: Number(c.available_credit) + amount,
                  minimum_payment: Math.max(0, (Number(c.current_balance) - amount) * 0.02),
                }
              : c
          )
        )
        setPaymentCard(null)
      } catch (err) {
        setPaymentError(err instanceof Error ? err.message : 'Payment failed')
      }
    })
  }

  function handleToggleFreeze(card: CreditCardType) {
    startTransition(async () => {
      try {
        const result = await toggleCreditCardFreeze(card.id)
        setCreditCards((prev) =>
          prev.map((c) =>
            c.id === card.id ? { ...c, status: result.newStatus as CreditCardType['status'] } : c
          )
        )
      } catch {
        // silent
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Balance Owed</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatGBP(totalBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Credit Limit</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">{formatGBP(totalLimit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground">Total Available</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-success">{formatGBP(totalAvailable)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Card List */}
      <div className="grid gap-6">
        {creditCards.map((card) => {
          const network = cardNetworkConfigs[card.card_network]
          const statusCfg = cardStatusConfigs[card.status]
          const utilization = Number(card.credit_limit) > 0
            ? (Number(card.current_balance) / Number(card.credit_limit)) * 100
            : 0
          const StatusIcon = statusCfg.icon

          return (
            <Card key={card.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Visual Card */}
                  <div className={`${network.bg} p-6 text-white min-w-[280px] lg:min-w-[320px]`}>
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-sm font-medium opacity-90">{card.card_name}</span>
                      <span className="text-lg font-bold tracking-wider">{network.logo}</span>
                    </div>
                    <p className="text-xs opacity-70 mb-1">Card Number</p>
                    <p className="text-lg font-mono tracking-widest mb-6">•••• •••• •••• {card.card_number_last_four}</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs opacity-70">Balance</p>
                        <p className="text-xl font-bold">{formatGBP(Number(card.current_balance))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-70">Limit</p>
                        <p className="text-sm font-semibold">{formatGBP(Number(card.credit_limit))}</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${statusCfg.bg} ${statusCfg.color} border-0`}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                        <Badge variant="outline">{Number(card.apr)}% APR</Badge>
                      </div>
                      <Link href={`/credit-cards/${card.id}`}>
                        <Button variant="ghost" size="sm">
                          Details <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>

                    {/* Utilization Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>Credit Utilization</span>
                        <span>{utilization.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilization > 75 ? 'bg-destructive' : utilization > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Available Credit</p>
                        <p className="font-semibold text-success">{formatGBP(Number(card.available_credit))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Minimum Payment</p>
                        <p className="font-semibold">{formatGBP(Number(card.minimum_payment))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payment Due</p>
                        <p className="font-semibold">
                          {card.payment_due_date
                            ? new Date(card.payment_due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rewards Rate</p>
                        <p className="font-semibold">{(Number(card.rewards_rate) * 100).toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => openPayment(card)}
                        disabled={card.status === 'closed' || Number(card.current_balance) <= 0}
                      >
                        <Wallet className="mr-1.5 h-3.5 w-3.5" />
                        Make Payment
                      </Button>
                      <div className="flex items-center gap-2 text-sm">
                        <Snowflake className={`h-3.5 w-3.5 ${card.status === 'frozen' ? 'text-blue-500' : 'text-muted-foreground'}`} />
                        <Switch
                          checked={card.status === 'frozen'}
                          onCheckedChange={() => handleToggleFreeze(card)}
                          disabled={isPending || card.status === 'closed'}
                        />
                        <span className="text-xs text-muted-foreground">Freeze</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Payment Dialog */}
      <Dialog open={!!paymentCard} onClose={() => setPaymentCard(null)} title="Make a Payment">
        {paymentCard && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">{paymentCard.card_name}</p>
              <p className="text-xs text-muted-foreground">
                Balance: {formatGBP(Number(paymentCard.current_balance))} / Limit: {formatGBP(Number(paymentCard.credit_limit))}
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
              <label className="text-sm font-medium">Payment Type</label>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {[
                  { key: 'minimum' as const, label: 'Minimum', amount: Number(paymentCard.minimum_payment) },
                  { key: 'full' as const, label: 'Full Balance', amount: Number(paymentCard.current_balance) },
                  { key: 'custom' as const, label: 'Custom', amount: 0 },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    className={`rounded-lg border p-2.5 text-center transition-colors ${
                      paymentType === opt.key ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => handlePaymentTypeChange(opt.key)}
                  >
                    <p className="text-xs font-medium">{opt.label}</p>
                    {opt.key !== 'custom' && (
                      <p className="text-xs text-muted-foreground mt-0.5">{formatGBP(opt.amount)}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">£</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(paymentCard.current_balance)}
                  className="w-full rounded-md border border-input bg-background pl-7 pr-3 py-2 text-sm"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value)
                    setPaymentType('custom')
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>

            {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPaymentCard(null)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleMakePayment} disabled={isPending}>
                {isPending ? 'Processing...' : `Pay ${paymentAmount ? formatGBP(parseFloat(paymentAmount) || 0) : '£0.00'}`}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
