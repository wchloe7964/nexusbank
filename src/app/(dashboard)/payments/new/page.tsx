'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { formatGBP } from '@/lib/utils/currency'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

const mockAccounts = [
  { id: '1', name: 'Nexus Current Account', balance: 3247.85 },
  { id: '2', name: 'Rainy Day Saver', balance: 12500.50 },
]

type Step = 'form' | 'confirm' | 'success'

export default function NewPaymentPage() {
  const [step, setStep] = useState<Step>('form')
  const [accountId, setAccountId] = useState('')
  const [payeeName, setPayeeName] = useState('')
  const [sortCode, setSortCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [frequency, setFrequency] = useState('monthly')
  const [paymentType, setPaymentType] = useState('standing_order')
  const [loading, setLoading] = useState(false)

  const parsedAmount = parseFloat(amount)
  const account = mockAccounts.find((a) => a.id === accountId)

  function handleReview() {
    if (!accountId || !payeeName || !sortCode || !accountNumber || !amount || parsedAmount <= 0) return
    setStep('confirm')
  }

  function handleConfirm() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setStep('success')
    }, 1500)
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="New Payment" description="Set up a new regular payment" />

      {step === 'form' && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay from</label>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Select account</option>
                {mockAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({formatGBP(a.balance)})</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment type</label>
              <Select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                <option value="standing_order">Standing Order</option>
                <option value="scheduled">Scheduled Payment</option>
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
                <option value="yearly">Yearly</option>
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
        <Card>
          <CardHeader><CardTitle className="tracking-tight">Confirm Payment Setup</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-muted p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{account?.name}</span>
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
              <Button className="flex-1" onClick={handleConfirm} loading={loading}>Confirm</Button>
            </div>
          </CardContent>
        </Card>
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
    </div>
  )
}
