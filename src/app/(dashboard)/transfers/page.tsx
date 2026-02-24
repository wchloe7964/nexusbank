'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatGBP } from '@/lib/utils/currency'
import { CheckCircle, ArrowRight } from 'lucide-react'

const mockAccounts = [
  { id: '1', name: 'Nexus Current Account', balance: 3247.85, sortCode: '20-45-67', accountNumber: '41234567' },
  { id: '2', name: 'Rainy Day Saver', balance: 12500.50, sortCode: '20-45-67', accountNumber: '51234568' },
  { id: '3', name: 'Cash ISA', balance: 8750.00, sortCode: '20-45-67', accountNumber: '61234569' },
]

type Step = 'form' | 'confirm' | 'success'

export default function TransfersPage() {
  const [step, setStep] = useState<Step>('form')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  const fromAccount = mockAccounts.find((a) => a.id === fromAccountId)
  const toAccount = mockAccounts.find((a) => a.id === toAccountId)
  const parsedAmount = parseFloat(amount)

  function handleReview() {
    if (!fromAccountId || !toAccountId || !amount || parsedAmount <= 0) return
    if (fromAccountId === toAccountId) return
    setStep('confirm')
  }

  function handleConfirm() {
    setLoading(true)
    // Simulate transfer
    setTimeout(() => {
      setLoading(false)
      setStep('success')
    }, 1500)
  }

  function handleReset() {
    setStep('form')
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
    setReference('')
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <PageHeader title="Transfer Money" description="Move money between your accounts" />

      {step === 'form' && (
        <Card className="transition-all duration-200">
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">From account</label>
              <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="rounded-lg">
                <option value="">Select account</option>
                {mockAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatGBP(a.balance)})</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/[0.08] p-2">
                <ArrowRight className="h-5 w-5 text-primary rotate-90" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">To account</label>
              <Select value={toAccountId} onChange={(e) => setToAccountId(e.target.value)} className="rounded-lg">
                <option value="">Select destination</option>
                {mockAccounts.filter((a) => a.id !== fromAccountId).map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatGBP(a.balance)})</option>
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
                <span className="font-medium">{fromAccount?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{toAccount?.name}</span>
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
              <Button className="flex-1" onClick={handleConfirm} loading={loading}>Confirm Transfer</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'success' && (
        <Card className="transition-all duration-200">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Transfer Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatGBP(parsedAmount)} has been transferred from {fromAccount?.name} to {toAccount?.name}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleReset}>Make Another Transfer</Button>
              <Button variant="link" onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
