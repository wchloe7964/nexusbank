'use client'

import { useState, useTransition, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { formatGBP } from '@/lib/utils/currency'
import {
  Snowflake, Wifi, ShieldCheck, Settings, Globe, Landmark,
  AlertTriangle, Eye, EyeOff, Pencil, Check, X,
} from 'lucide-react'
import type { Card as CardType } from '@/lib/types'
import {
  toggleCardFreeze, toggleCardContactless, toggleOnlinePayments,
  toggleATMWithdrawals, updateSpendingLimits, reportCardLost,
} from './actions'

interface CardsClientProps {
  initialCards: CardType[]
}

export function CardsClient({ initialCards }: CardsClientProps) {
  const [cards, setCards] = useState(initialCards)
  const [selectedCardId, setSelectedCardId] = useState(initialCards[0]?.id || '')
  const [isPending, startTransition] = useTransition()

  // Limit editing state
  const [editingLimits, setEditingLimits] = useState(false)
  const [dailyLimit, setDailyLimit] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')

  // Report lost dialog
  const [showReportLost, setShowReportLost] = useState(false)

  // PIN reveal
  const [pinRevealed, setPinRevealed] = useState(false)
  const [pinCountdown, setPinCountdown] = useState(0)

  const selectedCard = cards.find((c) => c.id === selectedCardId)

  // Reset edit state when card changes
  useEffect(() => {
    setEditingLimits(false)
    setPinRevealed(false)
    setPinCountdown(0)
  }, [selectedCardId])

  // PIN countdown timer
  useEffect(() => {
    if (pinCountdown <= 0) {
      if (pinRevealed) setPinRevealed(false)
      return
    }
    const timer = setTimeout(() => setPinCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [pinCountdown, pinRevealed])

  function optimisticToggle<K extends keyof CardType>(id: string, field: K, newValue: CardType[K], action: () => Promise<void>) {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    const oldValue = card[field]
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, [field]: newValue } : c))
    startTransition(async () => {
      try {
        await action()
      } catch {
        setCards((prev) => prev.map((c) => c.id === id ? { ...c, [field]: oldValue } : c))
      }
    })
  }

  function handleToggleFreeze(id: string) {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    const newFrozen = !card.is_frozen
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_frozen: newFrozen, status: newFrozen ? 'frozen' as const : 'active' as const } : c))
    startTransition(async () => {
      try {
        await toggleCardFreeze(id, newFrozen)
      } catch {
        setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_frozen: !newFrozen, status: !newFrozen ? 'frozen' as const : 'active' as const } : c))
      }
    })
  }

  function handleToggleContactless(id: string) {
    optimisticToggle(id, 'is_contactless_enabled', !selectedCard!.is_contactless_enabled, () =>
      toggleCardContactless(id, !selectedCard!.is_contactless_enabled)
    )
  }

  function handleToggleOnline(id: string) {
    optimisticToggle(id, 'online_payments_enabled', !selectedCard!.online_payments_enabled, () =>
      toggleOnlinePayments(id, !selectedCard!.online_payments_enabled)
    )
  }

  function handleToggleATM(id: string) {
    optimisticToggle(id, 'atm_withdrawals_enabled', !selectedCard!.atm_withdrawals_enabled, () =>
      toggleATMWithdrawals(id, !selectedCard!.atm_withdrawals_enabled)
    )
  }

  function handleStartEditLimits() {
    if (!selectedCard) return
    setDailyLimit(String(selectedCard.spending_limit_daily))
    setMonthlyLimit(String(selectedCard.spending_limit_monthly))
    setEditingLimits(true)
  }

  function handleSaveLimits() {
    if (!selectedCard) return
    const daily = parseFloat(dailyLimit) || selectedCard.spending_limit_daily
    const monthly = parseFloat(monthlyLimit) || selectedCard.spending_limit_monthly

    setCards((prev) => prev.map((c) => c.id === selectedCard.id
      ? { ...c, spending_limit_daily: daily, spending_limit_monthly: monthly }
      : c
    ))
    setEditingLimits(false)

    startTransition(async () => {
      try {
        await updateSpendingLimits(selectedCard.id, { daily, monthly })
      } catch {
        setCards((prev) => prev.map((c) => c.id === selectedCard.id
          ? { ...c, spending_limit_daily: selectedCard.spending_limit_daily, spending_limit_monthly: selectedCard.spending_limit_monthly }
          : c
        ))
      }
    })
  }

  function handleReportLost() {
    if (!selectedCard) return
    setCards((prev) => prev.map((c) => c.id === selectedCard.id
      ? { ...c, status: 'reported_lost' as const, is_frozen: true }
      : c
    ))
    setShowReportLost(false)

    startTransition(async () => {
      try {
        await reportCardLost(selectedCard.id)
      } catch {
        setCards((prev) => prev.map((c) => c.id === selectedCard.id
          ? { ...c, status: 'active' as const, is_frozen: false }
          : c
        ))
      }
    })
  }

  function handleRevealPIN() {
    setPinRevealed(true)
    setPinCountdown(10)
  }

  const isCardDisabled = selectedCard?.status === 'reported_lost' || selectedCard?.status === 'cancelled'

  const statusVariant: Record<string, 'success' | 'warning' | 'destructive'> = {
    active: 'success',
    frozen: 'warning',
    reported_lost: 'destructive',
    cancelled: 'destructive',
    expired: 'destructive',
  }

  return (
    <>
      {/* Card Selector */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => setSelectedCardId(card.id)}
            className={`flex-shrink-0 rounded-lg p-4 text-left transition-all duration-200 ${
              selectedCardId === card.id
                ? 'ring-2 ring-primary'
                : 'ring-1 ring-border hover:ring-primary'
            } ${card.is_frozen || card.status === 'reported_lost' ? 'opacity-60' : ''}`}
            style={{ minWidth: '280px' }}
          >
            <div className={`relative overflow-hidden rounded-lg p-5 text-white ${
              card.card_type === 'debit' ? 'gradient-accent' : 'gradient-dark'
            }`}>
              <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-white/[0.06] blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-white/[0.04] blur-2xl" />
              {(card.is_frozen || card.status === 'reported_lost') && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    {card.status === 'reported_lost' ? (
                      <>
                        <AlertTriangle className="h-5 w-5" />
                        <span className="text-sm font-medium">REPORTED LOST</span>
                      </>
                    ) : (
                      <>
                        <Snowflake className="h-5 w-5" />
                        <span className="text-sm font-medium">FROZEN</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="text-xs opacity-80 uppercase">
                    {card.card_type === 'debit' ? 'NexusBank Debit' : 'NexusBank Credit'}
                  </div>
                  {card.is_contactless_enabled && (
                    <Wifi className="h-4 w-4 opacity-80 rotate-90" />
                  )}
                </div>
                <div className="mt-6 font-mono text-lg tracking-widest tabular-nums">
                  •••• •••• •••• {card.card_number_last_four}
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <div className="text-[10px] opacity-60 uppercase">Cardholder</div>
                    <div className="text-xs font-medium">{card.card_holder_name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] opacity-60 uppercase">Expires</div>
                    <div className="text-xs font-medium tabular-nums">{card.expiry_date}</div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedCard && (
        <>
          {/* Card Controls */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold tracking-tight flex items-center gap-2">
                <div className="rounded-full bg-primary/[0.08] p-2">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                Card Controls
              </h3>

              {/* Freeze */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-500/10 p-2">
                    <Snowflake className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Freeze Card</p>
                    <p className="text-xs text-muted-foreground">Temporarily block all transactions</p>
                  </div>
                </div>
                <Switch
                  checked={selectedCard.is_frozen}
                  onCheckedChange={() => handleToggleFreeze(selectedCard.id)}
                  disabled={isPending || isCardDisabled}
                />
              </div>

              {/* Contactless */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <Wifi className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Contactless Payments</p>
                    <p className="text-xs text-muted-foreground">Tap to pay in shops</p>
                  </div>
                </div>
                <Switch
                  checked={selectedCard.is_contactless_enabled}
                  onCheckedChange={() => handleToggleContactless(selectedCard.id)}
                  disabled={isPending || isCardDisabled}
                />
              </div>

              {/* Online Payments */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-500/10 p-2">
                    <Globe className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Online Payments</p>
                    <p className="text-xs text-muted-foreground">Use card for online purchases</p>
                  </div>
                </div>
                <Switch
                  checked={selectedCard.online_payments_enabled}
                  onCheckedChange={() => handleToggleOnline(selectedCard.id)}
                  disabled={isPending || isCardDisabled}
                />
              </div>

              {/* ATM Withdrawals */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-500/10 p-2">
                    <Landmark className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">ATM Withdrawals</p>
                    <p className="text-xs text-muted-foreground">Withdraw cash from ATMs</p>
                  </div>
                </div>
                <Switch
                  checked={selectedCard.atm_withdrawals_enabled}
                  onCheckedChange={() => handleToggleATM(selectedCard.id)}
                  disabled={isPending || isCardDisabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spending Limits */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold tracking-tight flex items-center gap-2">
                  <div className="rounded-full bg-primary/[0.08] p-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                  </div>
                  Spending Limits
                </h3>
                {!editingLimits && !isCardDisabled && (
                  <Button variant="ghost" size="sm" onClick={handleStartEditLimits}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>

              {editingLimits ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily Limit</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">£</span>
                      <Input
                        type="number"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(e.target.value)}
                        min={0}
                        step={100}
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Monthly Limit</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">£</span>
                      <Input
                        type="number"
                        value={monthlyLimit}
                        onChange={(e) => setMonthlyLimit(e.target.value)}
                        min={0}
                        step={500}
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveLimits} disabled={isPending}>
                      <Check className="mr-1.5 h-3.5 w-3.5" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingLimits(false)}>
                      <X className="mr-1.5 h-3.5 w-3.5" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <div className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-medium">Daily spending limit</p>
                      <p className="text-xs text-muted-foreground">Maximum per day for transactions</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{formatGBP(selectedCard.spending_limit_daily)}</p>
                  </div>
                  <div className="flex items-center justify-between py-3.5">
                    <div>
                      <p className="text-sm font-medium">Monthly spending limit</p>
                      <p className="text-xs text-muted-foreground">Maximum per month across all purchases</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">{formatGBP(selectedCard.spending_limit_monthly)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PIN & Security */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold tracking-tight flex items-center gap-2">
                <div className="rounded-full bg-primary/[0.08] p-2">
                  <Eye className="h-4 w-4 text-primary" />
                </div>
                PIN & Security
              </h3>

              {/* PIN Reveal */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-500/10 p-2">
                    {pinRevealed ? (
                      <EyeOff className="h-4 w-4 text-cyan-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-cyan-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">View PIN</p>
                    <p className="text-xs text-muted-foreground">
                      {pinRevealed
                        ? `Visible for ${pinCountdown}s`
                        : 'Reveal your card PIN for 10 seconds'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {pinRevealed ? (
                    <div className="flex items-center gap-2">
                      <div className="w-12">
                        <Progress value={pinCountdown} max={10} className="h-1" />
                      </div>
                      <span className="font-mono text-lg font-bold tracking-[0.3em] text-primary">
                        {selectedCard.card_number_last_four}
                      </span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRevealPIN}
                      disabled={isCardDisabled}
                    >
                      Reveal PIN
                    </Button>
                  )}
                </div>
              </div>

              {/* Report Lost/Stolen */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-500/10 p-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Report Lost or Stolen</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCard.status === 'reported_lost'
                        ? 'This card has been reported as lost'
                        : 'Permanently block this card'
                      }
                    </p>
                  </div>
                </div>
                {selectedCard.status === 'reported_lost' ? (
                  <Badge variant="destructive">Reported</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setShowReportLost(true)}
                    disabled={isPending}
                  >
                    Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold tracking-tight mb-4">Card Details</h3>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Card Type</dt>
                <dd className="font-medium capitalize">{selectedCard.card_type}</dd>
                <dt className="text-muted-foreground">Card Number</dt>
                <dd className="font-medium font-mono tabular-nums">•••• {selectedCard.card_number_last_four}</dd>
                <dt className="text-muted-foreground">Cardholder</dt>
                <dd className="font-medium">{selectedCard.card_holder_name}</dd>
                <dt className="text-muted-foreground">Expires</dt>
                <dd className="font-medium">{selectedCard.expiry_date}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={statusVariant[selectedCard.status] || 'secondary'}>
                    {selectedCard.status === 'reported_lost' ? 'Reported Lost' :
                      selectedCard.is_frozen ? 'Frozen' :
                      selectedCard.status.charAt(0).toUpperCase() + selectedCard.status.slice(1)}
                  </Badge>
                </dd>
              </dl>
            </CardContent>
          </Card>
        </>
      )}

      {/* Report Lost Dialog */}
      <Dialog open={showReportLost} onClose={() => setShowReportLost(false)} title="Report Card Lost or Stolen">
        <div className="space-y-4">
          <div className="rounded-lg bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">This action cannot be undone</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your card ending in {selectedCard?.card_number_last_four} will be permanently blocked.
                  You will need to request a replacement card.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What happens next:</p>
            <ul className="list-disc pl-4 space-y-1 text-xs">
              <li>Your card will be immediately blocked</li>
              <li>Any pending transactions may still be processed</li>
              <li>A replacement card will be sent to your registered address</li>
              <li>Your new card should arrive within 3-5 working days</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowReportLost(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleReportLost} disabled={isPending}>
              Confirm Report
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
