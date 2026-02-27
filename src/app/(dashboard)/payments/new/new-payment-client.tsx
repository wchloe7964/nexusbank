'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatGBP } from '@/lib/utils/currency'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Account } from '@/lib/types'
import { createScheduledPayment } from './actions'
import { PinEntryDialog, PinSetupDialog } from '@/components/shared/pin-dialog'

interface NewPaymentClientProps {
  accounts: Account[]
  hasPinSet: boolean
}

type Step = 'form' | 'confirm' | 'pin' | 'success'

export function NewPaymentClient({ accounts, hasPinSet }: NewPaymentClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [accountId, setAccountId] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [sortCode, setSortCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [paymentType, setPaymentType] = useState('standing_order')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showPinSetup, setShowPinSetup] = useState(false)

  const parsedAmount = parseFloat(amount)
  const account = accounts.find((a) => a.id === accountId)

  function handleReview() {
    if (!accountId || !payeeName || !sortCode || !accountNumber || !amount || parsedAmount <= 0) return
    setError('')
    setStep('confirm')
  }

  function handleConfirmClick() {
    if (!hasPinSet) {
      setShowPinSetup(true)
      return
    }
    setStep('pin')
  }

  function handlePinVerified(pin: string) {
    setStep('confirm')
    startTransition(async () => {
      try {
        const result = await createScheduledPayment({
          accountId,
          payeeName,
          sortCode,
          accountNumber,
          amount: parsedAmount,
          frequency,
          paymentType,
          reference: reference || undefined,
          pin,
        })
        if (result.blocked) {
          setError(result.blockReason || 'This payment was blocked. Please contact support.')
          setStep('form')
          return
        }
        setStep('success')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create payment. Please try again.')
        setStep('form')
      }
    })
  }

  return (
    <>
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {step === 'form' && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay from</label>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.account_name} ({formatGBP(a.balance)})</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment type</label>
              <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="standing_order">Standing Order</option>
                <option value="scheduled_transfer">Scheduled Payment</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payee name</label>
              <Input placeholder="Who are you paying?" value={payeeName} onChange={(e) => setPayeeName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort code</label>
                <Input placeholder="00-00-00" value={sortCode} onChange={(e) => setSortCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account number</label>
                <Input placeholder="12345678" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input type="number" step="0.01" min="0.01" placeholder="0.00" className="pl-7" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency</label>
              <Select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reference (optional)</label>
              <Input placeholder="Payment reference" maxLength={18} value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleReview} disabled={!accountId || !payeeName || !sortCode || !accountNumber || !amount || parsedAmount <= 0}>
              Review Payment
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <>
          <Card>
            <CardHeader><CardTitle className="tracking-tight">Confirm Payment Setup</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg bg-muted p-5 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">From</span>
                  <span className="font-medium">{account?.account_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{payeeName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sort Code</span>
                  <span className="font-medium font-mono">{sortCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account No.</span>
                  <span className="font-medium font-mono">{accountNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-lg font-bold">{formatGBP(parsedAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frequency</span>
                  <span className="font-medium capitalize">{frequency}</span>
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
                <Button className="flex-1" onClick={handleConfirmClick} loading={isPending}>Confirm</Button>
              </div>
            </CardContent>
          </Card>

          {/* PIN setup for first-time users */}
          {showPinSetup && (
            <PinSetupDialog
              onComplete={() => {
                setShowPinSetup(false)
                setStep('pin')
              }}
              onCancel={() => setShowPinSetup(false)}
            />
          )}
        </>
      )}

      {step === 'pin' && (
        <PinEntryDialog
          onVerified={handlePinVerified}
          onCancel={() => setStep('confirm')}
          title="Verify Payment"
          description={`Enter your transfer PIN to authorise this ${formatGBP(parsedAmount)} ${frequency} payment to ${payeeName}.`}
        />
      )}

      {step === 'success' && (
        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center">
            <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Payment Set Up</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your {frequency} payment of {formatGBP(parsedAmount)} to {payeeName} has been created.
            </p>
            <div className="mt-6 flex gap-3">
              <Link href="/payments"><Button variant="outline">View Payments</Button></Link>
              <Link href="/dashboard"><Button variant="link">Go to Dashboard</Button></Link>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
