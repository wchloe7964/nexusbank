'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatGBP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import {
  Wallet, PiggyBank, Landmark, Briefcase, CheckCircle,
  ArrowRight, ArrowLeft, Shield, Percent, CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import type { AccountType } from '@/lib/types'
import { openNewAccount } from './actions'

type Step = 'type' | 'details' | 'confirm' | 'success'

interface AccountTypeConfig {
  type: AccountType
  label: string
  description: string
  icon: typeof Wallet
  features: string[]
  interestRate: number
  overdraftAvailable: boolean
  defaultOverdraft: number
  color: string
  bg: string
}

const accountTypes: AccountTypeConfig[] = [
  {
    type: 'current',
    label: 'Current Account',
    description: 'Everyday banking with a Visa debit card',
    icon: Wallet,
    features: ['Visa debit card included', 'Contactless payments', 'Overdraft available', 'Free UK bank transfers'],
    interestRate: 0,
    overdraftAvailable: true,
    defaultOverdraft: 1000,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    type: 'savings',
    label: 'Savings Account',
    description: 'Earn interest on your savings with easy access',
    icon: PiggyBank,
    features: ['4.15% AER variable', 'Easy access withdrawals', 'No monthly fees', 'Interest paid monthly'],
    interestRate: 0.0415,
    overdraftAvailable: false,
    defaultOverdraft: 0,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    type: 'isa',
    label: 'Cash ISA',
    description: 'Tax-free savings up to the annual ISA allowance',
    icon: Landmark,
    features: ['3.75% AER tax-free', '£20,000 annual allowance', 'No tax on interest', 'Easy access'],
    interestRate: 0.0375,
    overdraftAvailable: false,
    defaultOverdraft: 0,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    type: 'business',
    label: 'Business Account',
    description: 'Business banking with dedicated support',
    icon: Briefcase,
    features: ['Business debit card', 'Overdraft available', 'Free business transfers', 'Dedicated support'],
    interestRate: 0.005,
    overdraftAvailable: true,
    defaultOverdraft: 2000,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
]

const defaultNames: Record<AccountType, string> = {
  current: 'Current Account',
  savings: 'Savings Account',
  isa: 'Cash ISA',
  business: 'Business Account',
}

export function OpenAccountClient() {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('type')
  const [selectedType, setSelectedType] = useState<AccountTypeConfig | null>(null)
  const [accountName, setAccountName] = useState('')
  const [overdraftLimit, setOverdraftLimit] = useState('')
  const [error, setError] = useState('')

  // Success state
  const [resultSortCode, setResultSortCode] = useState('')
  const [resultAccountNumber, setResultAccountNumber] = useState('')
  const [resultAccountId, setResultAccountId] = useState('')
  const [resultCardLast4, setResultCardLast4] = useState<string | undefined>()

  function selectType(config: AccountTypeConfig) {
    setSelectedType(config)
    setAccountName(defaultNames[config.type])
    setOverdraftLimit(String(config.defaultOverdraft))
    setError('')
    setStep('details')
  }

  function goToConfirm() {
    if (!accountName.trim()) {
      setError('Please enter an account name')
      return
    }
    setError('')
    setStep('confirm')
  }

  function handleCreate() {
    if (!selectedType) return

    startTransition(async () => {
      try {
        const result = await openNewAccount({
          accountType: selectedType.type,
          accountName: accountName.trim(),
          overdraftLimit: selectedType.overdraftAvailable ? parseInt(overdraftLimit) || 0 : 0,
        })
        setResultSortCode(result.sortCode)
        setResultAccountNumber(result.accountNumber)
        setResultAccountId(result.accountId)
        setResultCardLast4(result.cardLast4)
        setStep('success')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to open account')
        setStep('details')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Open New Account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose an account type and get set up in minutes</p>
      </div>

      {/* Step indicator */}
      {step !== 'success' && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn('font-medium', step === 'type' && 'text-primary')}>1. Choose Type</span>
          <ArrowRight className="h-3 w-3" />
          <span className={cn('font-medium', step === 'details' && 'text-primary')}>2. Details</span>
          <ArrowRight className="h-3 w-3" />
          <span className={cn('font-medium', step === 'confirm' && 'text-primary')}>3. Confirm</span>
        </div>
      )}

      {/* Step 1: Choose Type */}
      {step === 'type' && (
        <div className="grid gap-4 md:grid-cols-2">
          {accountTypes.map((config) => {
            const Icon = config.icon
            return (
              <Card
                key={config.type}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => selectType(config)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('rounded-full p-2.5', config.bg)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{config.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
                    </div>
                  </div>

                  {config.interestRate > 0 && (
                    <div className="flex items-center gap-1.5 mb-3">
                      <Percent className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-500">{(config.interestRate * 100).toFixed(2)}% AER</span>
                    </div>
                  )}

                  <ul className="space-y-1.5">
                    {config.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 'details' && selectedType && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn('rounded-full p-2.5', selectedType.bg)}>
                <selectedType.icon className={cn('h-5 w-5', selectedType.color)} />
              </div>
              <div>
                <p className="font-semibold text-sm">{selectedType.label}</p>
                <p className="text-xs text-muted-foreground">{selectedType.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Account Name</label>
                <Input
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. My Savings"
                  maxLength={50}
                />
              </div>

              {selectedType.overdraftAvailable && (
                <div>
                  <label className="text-sm font-medium">Overdraft Limit</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                    <Input
                      type="number"
                      min="0"
                      max="25000"
                      step="100"
                      value={overdraftLimit}
                      onChange={(e) => setOverdraftLimit(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose your overdraft limit (up to £25,000). Set to 0 for no overdraft.
                  </p>
                </div>
              )}

              {selectedType.interestRate > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <Percent className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium">Interest Rate</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedType.interestRate * 100).toFixed(2)}% AER variable &middot; Interest paid monthly
                    </p>
                  </div>
                </div>
              )}

              {selectedType.type === 'isa' && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">ISA Allowance</p>
                    <p className="text-xs text-muted-foreground">
                      You can save up to £20,000 tax-free in ISAs each tax year
                    </p>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep('type')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1" onClick={goToConfirm}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && selectedType && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">Confirm New Account</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Account Type</span>
                <span className="font-medium">{selectedType.label}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Account Name</span>
                <span className="font-medium">{accountName}</span>
              </div>
              {selectedType.interestRate > 0 && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Interest Rate</span>
                  <span className="font-medium text-emerald-500">{(selectedType.interestRate * 100).toFixed(2)}% AER</span>
                </div>
              )}
              {selectedType.overdraftAvailable && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Overdraft Limit</span>
                  <span className="font-medium">{formatGBP(parseInt(overdraftLimit) || 0)}</span>
                </div>
              )}
              {(selectedType.type === 'current' || selectedType.type === 'business') && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Debit Card</span>
                  <span className="font-medium">Visa debit card will be issued</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Opening Balance</span>
                <span className="font-medium">{formatGBP(0)}</span>
              </div>
            </div>

            {error && <p className="text-sm text-destructive mt-3">{error}</p>}

            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setStep('details')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={isPending}>
                {isPending ? 'Opening Account...' : 'Open Account'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 'success' && selectedType && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold">Account Opened!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your new {selectedType.label.toLowerCase()} is ready to use
            </p>

            <div className="mt-6 space-y-3 text-sm text-left max-w-xs mx-auto">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Sort Code</span>
                <span className="font-mono font-semibold">{resultSortCode}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Account Number</span>
                <span className="font-mono font-semibold">{resultAccountNumber}</span>
              </div>
              {resultCardLast4 && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Debit Card</span>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-mono font-semibold">**** {resultCardLast4}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 max-w-xs mx-auto">
              <Link href={`/accounts/${resultAccountId}`} className="flex-1">
                <Button className="w-full">Go to Account</Button>
              </Link>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setStep('type')
                  setSelectedType(null)
                  setAccountName('')
                  setOverdraftLimit('')
                  setError('')
                }}
              >
                Open Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
