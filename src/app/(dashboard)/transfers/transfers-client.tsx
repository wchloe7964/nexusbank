'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatGBP } from '@/lib/utils/currency'
import { CheckCircle, ArrowRight } from 'lucide-react'
import type { Account } from '@/lib/types'
import { executeTransfer } from './actions'
import { createScaChallenge } from '@/lib/sca/sca-service'
import { ScaDialog } from '@/components/shared/sca-dialog'

interface TransfersClientProps {
  accounts: Account[]
}

type Step = 'form' | 'confirm' | 'sca' | 'success'

export function TransfersClient({ accounts }: TransfersClientProps) {
  const [step, setStep] = useState<Step>('form')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // SCA state
  const [scaChallengeId, setScaChallengeId] = useState<string | null>(null)
  const [scaExpiresAt, setScaExpiresAt] = useState<string | null>(null)

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toAccount = accounts.find((a) => a.id === toAccountId)
  const parsedAmount = parseFloat(amount)

  function handleReview() {
    if (!fromAccountId || !toAccountId || !amount || parsedAmount <= 0) return
    if (fromAccountId === toAccountId) return
    setError('')
    setStep('confirm')
  }

  function handleConfirm(challengeId?: string) {
    startTransition(async () => {
      try {
        const result = await executeTransfer({
          fromAccountId,
          toAccountId,
          amount: parsedAmount,
          reference: reference || undefined,
          scaChallengeId: challengeId || undefined,
        })

        // SCA required — create challenge and show dialog
        if (result.requiresSca && !challengeId) {
          try {
            const challenge = await createScaChallenge('transfer', {
              amount: parsedAmount,
              from: fromAccountId,
              to: toAccountId,
            })
            setScaChallengeId(challenge.challengeId)
            setScaExpiresAt(challenge.expiresAt)
            setStep('sca')
          } catch {
            setError('Failed to create security challenge. Please try again.')
            setStep('form')
          }
          return
        }

        if (result.blocked) {
          setError(result.blockReason || 'This transfer was blocked. Please contact support.')
          setStep('form')
          return
        }
        setStep('success')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Transfer failed. Please try again.')
        setStep('form')
      }
    })
  }

  function handleReset() {
    setStep('form')
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
    setReference('')
    setError('')
    setScaChallengeId(null)
    setScaExpiresAt(null)
  }

  return (
    <>
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {step === 'form' && (
        <Card className="transition-all duration-200">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">From account</label>
              <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="rounded-lg">
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name} ({formatGBP(a.balance)})</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-center">
              <div className="rounded-xl bg-primary/10 p-2">
                <ArrowRight className="h-5 w-5 text-primary rotate-90" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To account</label>
              <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="rounded-lg">
                <option value="">Select destination</option>
                {accounts.filter((a) => a.id !== fromAccountId).map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name} ({formatGBP(a.balance)})</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">£</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="pl-7 rounded-lg tabular-nums"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference (optional)</label>
              <Input
                placeholder="What's this for?"
                maxLength={18}
                className="rounded-lg"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleReview}
              disabled={!fromAccountId || !toAccountId || !amount || parsedAmount <= 0 || fromAccountId === toAccountId}
            >
              Review Transfer
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle className="tracking-tight">Confirm Transfer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-muted p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{fromAccount?.account_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{toAccount?.account_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-lg font-bold tracking-tight tabular-nums">{formatGBP(parsedAmount)}</span>
              </div>
              {reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{reference}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('form')}>Back</Button>
              <Button className="flex-1" onClick={() => handleConfirm()} loading={isPending}>Confirm Transfer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'sca' && scaChallengeId && scaExpiresAt && (
        <ScaDialog
          challengeId={scaChallengeId}
          expiresAt={scaExpiresAt}
          onVerified={() => {
            setStep('confirm')
            handleConfirm(scaChallengeId)
          }}
          onCancel={() => {
            setStep('confirm')
            setScaChallengeId(null)
            setScaExpiresAt(null)
          }}
          title="Verify Transfer"
          description="This transfer requires additional verification. Enter the 6-digit code to continue."
        />
      )}

      {step === 'success' && (
        <Card className="transition-all duration-200">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Transfer Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatGBP(parsedAmount)} has been transferred from {fromAccount?.account_name} to {toAccount?.account_name}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleReset}>Make Another Transfer</Button>
              <Button variant="link" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
