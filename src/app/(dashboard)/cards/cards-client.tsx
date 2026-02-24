'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { formatGBP } from '@/lib/utils/currency'
import { formatUKDate } from '@/lib/utils/dates'
import { Snowflake, Wifi, ShieldCheck, Settings } from 'lucide-react'
import type { Card as CardType } from '@/lib/types'
import { toggleCardFreeze, toggleCardContactless } from './actions'

interface CardsClientProps {
  initialCards: CardType[]
}

export function CardsClient({ initialCards }: CardsClientProps) {
  const [cards, setCards] = useState(initialCards)
  const [selectedCardId, setSelectedCardId] = useState(initialCards[0]?.id || '')
  const [isPending, startTransition] = useTransition()

  const selectedCard = cards.find((c) => c.id === selectedCardId)

  function handleToggleFreeze(id: string) {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    const newFrozen = !card.is_frozen
    // Optimistic update
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_frozen: newFrozen, status: newFrozen ? 'frozen' as const : 'active' as const } : c))
    startTransition(async () => {
      try {
        await toggleCardFreeze(id, newFrozen)
      } catch {
        // Revert on error
        setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_frozen: !newFrozen, status: !newFrozen ? 'frozen' as const : 'active' as const } : c))
      }
    })
  }

  function handleToggleContactless(id: string) {
    const card = cards.find((c) => c.id === id)
    if (!card) return
    const newEnabled = !card.is_contactless_enabled
    // Optimistic update
    setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_contactless_enabled: newEnabled } : c))
    startTransition(async () => {
      try {
        await toggleCardContactless(id, newEnabled)
      } catch {
        // Revert on error
        setCards((prev) => prev.map((c) => c.id === id ? { ...c, is_contactless_enabled: !newEnabled } : c))
      }
    })
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
            } ${card.is_frozen ? 'opacity-60' : ''}`}
            style={{ minWidth: '280px' }}
          >
            {/* Visual Card */}
            <div className={`relative overflow-hidden rounded-lg p-5 text-white ${
              card.card_type === 'debit'
                ? 'gradient-accent'
                : 'gradient-dark'
            }`}>
              <div className="absolute -top-16 -right-16 h-36 w-36 rounded-full bg-white/[0.06] blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-28 w-28 rounded-full bg-white/[0.04] blur-2xl" />
              {card.is_frozen && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-lg">
                  <div className="flex items-center gap-2 text-white">
                    <Snowflake className="h-5 w-5" />
                    <span className="text-sm font-medium">FROZEN</span>
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
                    <div className="text-xs font-medium tabular-nums">
                      {card.expiry_date}
                    </div>
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
                  disabled={isPending}
                />
              </div>

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
                  disabled={isPending}
                />
              </div>
            </CardContent>
          </Card>

          {/* Spending Limits */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold tracking-tight flex items-center gap-2">
                <div className="rounded-full bg-primary/[0.08] p-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                Spending Limits
              </h3>
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
                  <Badge variant={selectedCard.is_frozen ? 'warning' : 'success'}>
                    {selectedCard.is_frozen ? 'Frozen' : 'Active'}
                  </Badge>
                </dd>
              </dl>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}
