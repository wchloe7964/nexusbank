'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LogoMark } from '@/components/brand/logo'
import { formatGBP } from '@/lib/utils/currency'
import { formatSortCode } from '@/lib/utils/sort-code'
import { maskAccountNumber } from '@/lib/utils/account-number'
import { getAccountIcon, getAccountColorClass } from '@/lib/constants/account-preferences'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeftRight,
  ArrowDown,
  User,
  Search,
  Star,
  AlertTriangle,
  Info,
  Lock,
  Zap,
  Send,
  Wallet,
  CreditCard,
  FileText,
  Check,
  PoundSterling,
} from 'lucide-react'
import type { Account, Payee } from '@/lib/types'
import { executeTransfer, sendToSomeone, checkRecipient, previewPaymentRail } from './actions'
import { PinEntryDialog, PinSetupDialog } from '@/components/shared/pin-dialog'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TransfersClientProps {
  accounts: Account[]
  payees: Payee[]
  hasPinSet: boolean
}

type OwnStep = 'form' | 'confirm' | 'pin' | 'success'

type SendStep = 'recipient' | 'details' | 'confirm' | 'pin' | 'success'

interface CopState {
  checking: boolean
  result?: string
  message?: string
  severity?: string
  canProceed?: boolean
  error?: string
}

interface RailInfo {
  rail: string
  displayName: string
  estimatedSettlement: string
  fee: number
}

interface StepDef {
  label: string
  icon: typeof Check
}

// ─── Step Definitions ─────────────────────────────────────────────────────────

const OWN_STEPS: StepDef[] = [
  { label: 'Details', icon: FileText },
  { label: 'Review', icon: Search },
  { label: 'Complete', icon: Check },
]

const SEND_STEPS: StepDef[] = [
  { label: 'Recipient', icon: User },
  { label: 'Details', icon: FileText },
  { label: 'Review', icon: Search },
  { label: 'Complete', icon: Check },
]

// ─── Step Progress Indicator ──────────────────────────────────────────────────

function StepIndicator({ steps, currentIndex }: { steps: StepDef[]; currentIndex: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((s, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        const Icon = done ? Check : s.icon

        return (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  done
                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                    : active
                      ? 'border-primary bg-primary text-white shadow-md shadow-primary/25'
                      : 'border-muted-foreground/20 bg-muted text-muted-foreground/50'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  done
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : active
                      ? 'text-primary'
                      : 'text-muted-foreground/50'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-12 mx-1.5 sm:mx-2.5 mb-5 rounded-full transition-colors duration-300 ${
                  i < currentIndex ? 'bg-emerald-500' : 'bg-muted-foreground/15'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Account Selection Card ───────────────────────────────────────────────────

function AccountCard({
  account,
  isSelected,
  onSelect,
}: {
  account: Account
  isSelected: boolean
  onSelect: () => void
}) {
  const Icon = getAccountIcon(account.icon)
  const colorClass = getAccountColorClass(account.color)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3.5 rounded-xl border-2 px-4 py-3.5 text-left transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm'
          : 'border-border hover:border-primary/30 hover:bg-muted/50'
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{account.account_name}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatSortCode(account.sort_code)} &middot; {maskAccountNumber(account.account_number)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-bold tabular-nums">{formatGBP(account.balance)}</p>
        {isSelected && <CheckCircle className="h-4 w-4 text-primary ml-auto mt-0.5" />}
      </div>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransfersClient({ accounts, payees, hasPinSet }: TransfersClientProps) {
  const [pinReady, setPinReady] = useState(hasPinSet)

  return (
    <Tabs defaultValue="own" className="space-y-5">
      <TabsList className="w-full grid grid-cols-2 h-12">
        <TabsTrigger value="own" className="gap-2 text-sm">
          <ArrowLeftRight className="h-4 w-4" />
          Between my accounts
        </TabsTrigger>
        <TabsTrigger value="someone" className="gap-2 text-sm">
          <Send className="h-4 w-4" />
          To someone else
        </TabsTrigger>
      </TabsList>

      <TabsContent value="own">
        <OwnAccountTransfer accounts={accounts} hasPinSet={pinReady} onPinCreated={() => setPinReady(true)} />
      </TabsContent>

      <TabsContent value="someone">
        <SendToSomeone accounts={accounts} payees={payees} hasPinSet={pinReady} onPinCreated={() => setPinReady(true)} />
      </TabsContent>
    </Tabs>
  )
}

// ─── Own Account Transfer ─────────────────────────────────────────────────────

function OwnAccountTransfer({ accounts, hasPinSet, onPinCreated }: {
  accounts: Account[]
  hasPinSet: boolean
  onPinCreated: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<OwnStep>('form')
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // PIN
  const [showPinSetup, setShowPinSetup] = useState(false)

  // Only show active accounts in dropdowns
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active !== false && (!a.status || a.status === 'active')),
    [accounts],
  )

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const toAccount = accounts.find((a) => a.id === toAccountId)
  const parsedAmount = parseFloat(amount)

  const stepIndex = step === 'form' ? 0 : step === 'confirm' || step === 'pin' ? 1 : 2

  function handleReview() {
    if (!fromAccountId || !toAccountId || !amount || parsedAmount <= 0) return
    if (fromAccountId === toAccountId) return
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
        const result = await executeTransfer({
          fromAccountId,
          toAccountId,
          amount: parsedAmount,
          reference: reference || undefined,
          pin,
        })

        if (result.blocked) {
          setError(result.blockReason || 'This transfer was blocked. Please contact support.')
          setStep('form')
          return
        }
        setStep('success')
        router.refresh()
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
  }

  if (activeAccounts.length < 2) {
    return (
      <Card>
        <CardContent className="p-5 lg:p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Need at least two active accounts</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You need at least two active accounts to transfer between them. Use the &quot;To someone else&quot; tab to send money externally.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <StepIndicator steps={OWN_STEPS} currentIndex={stepIndex} />

      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {step === 'form' && (
        <Card variant="raised" className="animate-in overflow-hidden">
          <CardContent className="space-y-6 p-5 lg:p-7 pt-5 lg:pt-7">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Transfer Details</h3>
                <p className="text-xs text-muted-foreground">Move money between your NexusBank accounts</p>
              </div>
            </div>

            {/* From account */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">From account</label>
              <div className="space-y-2">
                {activeAccounts.map((a) => (
                  <AccountCard
                    key={a.id}
                    account={a}
                    isSelected={fromAccountId === a.id}
                    onSelect={() => setFromAccountId(a.id)}
                  />
                ))}
              </div>
            </div>

            {/* Direction arrow */}
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-2.5 shadow-sm">
                <ArrowDown className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* To account */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">To account</label>
              <div className="space-y-2">
                {activeAccounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((a) => (
                    <AccountCard
                      key={a.id}
                      account={a}
                      isSelected={toAccountId === a.id}
                      onSelect={() => setToAccountId(a.id)}
                    />
                  ))}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">£</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="h-14 pl-9 text-lg font-semibold rounded-xl tabular-nums"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Reference */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Reference (optional)</label>
              <Input
                placeholder="What's this for?"
                maxLength={18}
                className="rounded-xl"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-12 text-base"
              onClick={handleReview}
              disabled={!fromAccountId || !toAccountId || !amount || parsedAmount <= 0 || fromAccountId === toAccountId}
            >
              Review Transfer
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card variant="raised" className="animate-in overflow-hidden">
          {/* Gradient hero band */}
          <div className="gradient-primary px-6 py-7 text-center text-white">
            <p className="text-sm font-medium text-white/80 mb-1">Transfer amount</p>
            <p className="text-4xl font-bold tracking-tight tabular-nums">{formatGBP(parsedAmount)}</p>
          </div>

          <CardContent className="space-y-5 p-5 lg:p-7 pt-5 lg:pt-6">
            {/* Visual from → to flow */}
            <div className="space-y-3">
              {/* From card */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">From</p>
                  <p className="text-sm font-semibold truncate">{fromAccount?.account_name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {fromAccount && formatSortCode(fromAccount.sort_code)} &middot; {fromAccount && maskAccountNumber(fromAccount.account_number)}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 p-1.5">
                  <ArrowDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              {/* To card */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                  <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">To</p>
                  <p className="text-sm font-semibold truncate">{toAccount?.account_name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {toAccount && formatSortCode(toAccount.sort_code)} &middot; {toAccount && maskAccountNumber(toAccount.account_number)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-muted/30">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold tabular-nums">{formatGBP(parsedAmount)}</span>
              </div>
              {reference && (
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">Reference</span>
                  <span className="text-sm font-medium">{reference}</span>
                </div>
              )}
              <div className="flex justify-between items-center px-4 py-3">
                <span className="text-sm text-muted-foreground">Payment rail</span>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Internal (Instant)
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-3 bg-muted/30">
                <span className="text-sm text-muted-foreground">Fee</span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Free</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('form')}>
                Edit Details
              </Button>
              <Button className="flex-1 h-12 text-base" onClick={handleConfirmClick} loading={isPending}>
                <Lock className="mr-2 h-4 w-4" />
                Confirm Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PIN entry dialog */}
      {step === 'pin' && (
        <PinEntryDialog
          onVerified={handlePinVerified}
          onCancel={() => setStep('confirm')}
          title="Authorise Transfer"
          description={`Enter your PIN to transfer ${formatGBP(parsedAmount)}`}
        />
      )}

      {/* PIN setup dialog (first time) */}
      {showPinSetup && (
        <PinSetupDialog
          onComplete={() => {
            setShowPinSetup(false)
            onPinCreated()
            setStep('pin')
          }}
          onCancel={() => setShowPinSetup(false)}
        />
      )}

      {step === 'success' && (
        <Card variant="raised" className="animate-in overflow-hidden">
          {/* Success gradient header */}
          <div className="gradient-success relative px-6 py-8 text-center text-white overflow-hidden">
            {/* Floating celebration dots */}
            <div className="absolute top-3 left-6 h-2 w-2 rounded-full bg-white/20 animate-float" />
            <div className="absolute top-6 right-10 h-1.5 w-1.5 rounded-full bg-white/30 animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-4 left-16 h-1 w-1 rounded-full bg-white/25 animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-3 right-20 h-2.5 w-2.5 rounded-full bg-white/15 animate-float" style={{ animationDelay: '1.5s' }} />

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">Transfer Complete</h2>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{formatGBP(parsedAmount)}</p>
          </div>

          <CardContent className="p-5 lg:p-7 pt-5 lg:pt-6">
            {/* Receipt layout */}
            <div className="rounded-xl border border-dashed border-border/80 overflow-hidden">
              <div className="divide-y divide-dashed divide-border/60">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">From</span>
                  <span className="text-sm font-medium">{fromAccount?.account_name}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm font-medium">{toAccount?.account_name}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-bold tabular-nums">{formatGBP(parsedAmount)}</span>
                </div>
                {reference && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <span className="text-sm font-medium">{reference}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* LogoMark branding */}
            <div className="mt-5 flex items-center justify-center gap-2 text-muted-foreground/40">
              <LogoMark size="sm" />
              <span className="text-[11px] font-medium tracking-wider uppercase">NexusBank</span>
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={handleReset}>
                Make Another Transfer
              </Button>
              <Button variant="link" className="flex-1" onClick={() => (window.location.href = '/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ─── Send To Someone Else ─────────────────────────────────────────────────────

function SendToSomeone({ accounts, payees, hasPinSet, onPinCreated }: {
  accounts: Account[]
  payees: Payee[]
  hasPinSet: boolean
  onPinCreated: () => void
}) {
  const router = useRouter()
  const [step, setStep] = useState<SendStep>('recipient')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  // Recipient mode
  const [recipientMode, setRecipientMode] = useState<'saved' | 'new'>('saved')
  const [payeeSearch, setPayeeSearch] = useState('')
  const [selectedPayee, setSelectedPayee] = useState<Payee | null>(null)

  // New recipient fields
  const [newName, setNewName] = useState('')
  const [newSortCode, setNewSortCode] = useState('')
  const [newAccountNumber, setNewAccountNumber] = useState('')

  // CoP state
  const [cop, setCop] = useState<CopState>({ checking: false })

  // Payment details
  const [fromAccountId, setFromAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [railInfo, setRailInfo] = useState<RailInfo | null>(null)

  // PIN
  const [showPinSetup, setShowPinSetup] = useState(false)

  // Result
  const [resultData, setResultData] = useState<{
    rail?: string
    railDisplayName?: string
    railFee?: number
    railSettlement?: string
  } | null>(null)

  // Only show active accounts in dropdowns
  const activeAccounts = useMemo(
    () => accounts.filter((a) => a.is_active !== false && (!a.status || a.status === 'active')),
    [accounts],
  )

  const fromAccount = accounts.find((a) => a.id === fromAccountId)
  const parsedAmount = parseFloat(amount)

  // Derived recipient info
  const recipientName = selectedPayee ? selectedPayee.name : newName.trim()
  const recipientSortCode = selectedPayee ? selectedPayee.sort_code : newSortCode.replace(/-/g, '')
  const recipientAccountNumber = selectedPayee ? selectedPayee.account_number : newAccountNumber

  // Step index for progress indicator
  const stepIndex =
    step === 'recipient' ? 0
    : step === 'details' ? 1
    : step === 'confirm' || step === 'pin' ? 2
    : 3

  // Filter payees by search
  const favourites = useMemo(() => payees.filter((p) => p.is_favourite), [payees])
  const filteredPayees = useMemo(() => {
    if (!payeeSearch.trim()) return payees
    const q = payeeSearch.toLowerCase()
    return payees.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sort_code.includes(q) ||
        p.account_number.includes(q)
    )
  }, [payees, payeeSearch])

  // Sort code auto-formatter
  const handleSortCodeChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6)
    let formatted = digits
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`
    setNewSortCode(formatted)
  }, [])

  // CoP check on blur
  async function handleCopCheck() {
    const name = newName.trim()
    const sc = newSortCode.replace(/-/g, '')
    const an = newAccountNumber
    if (!name || sc.length !== 6 || an.length !== 8) return

    setCop({ checking: true })
    try {
      const result = await checkRecipient({ name, sortCode: sc, accountNumber: an })
      setCop({
        checking: false,
        result: result.copResult,
        message: result.copMessage,
        severity: result.copSeverity,
        canProceed: result.canProceed,
        error: result.error,
      })
    } catch {
      setCop({ checking: false, error: 'Unable to verify recipient' })
    }
  }

  // Rail preview on amount change
  async function handleAmountBlur() {
    const val = parseFloat(amount)
    if (!val || val <= 0) {
      setRailInfo(null)
      return
    }
    try {
      const info = await previewPaymentRail(val)
      setRailInfo(info)
    } catch {
      setRailInfo(null)
    }
  }

  // Can proceed from recipient step?
  const canContinueRecipient =
    recipientMode === 'saved'
      ? !!selectedPayee
      : !!(
          newName.trim() &&
          newSortCode.replace(/-/g, '').length === 6 &&
          newAccountNumber.length === 8 &&
          (!cop.result || cop.canProceed !== false) &&
          !cop.checking &&
          !cop.error
        )

  function handleSendClick() {
    if (!hasPinSet) {
      setShowPinSetup(true)
      return
    }
    setStep('pin')
  }

  function handlePinVerified(pin: string) {
    setStep('confirm')
    executeSend(pin)
  }

  function executeSend(pin: string) {
    startTransition(async () => {
      try {
        const result = await sendToSomeone({
          fromAccountId,
          recipientName,
          sortCode: recipientSortCode,
          accountNumber: recipientAccountNumber,
          amount: parsedAmount,
          reference: reference || undefined,
          payeeId: selectedPayee?.id || undefined,
          pin,
        })

        if (result.blocked) {
          setError(result.blockReason || 'This payment was blocked. Please contact support.')
          setStep('details')
          return
        }

        setResultData({
          rail: result.rail,
          railDisplayName: result.railDisplayName,
          railFee: result.railFee,
          railSettlement: result.railSettlement,
        })
        setStep('success')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Payment failed. Please try again.')
        setStep('details')
      }
    })
  }

  function handleReset() {
    setStep('recipient')
    setRecipientMode('saved')
    setPayeeSearch('')
    setSelectedPayee(null)
    setNewName('')
    setNewSortCode('')
    setNewAccountNumber('')
    setCop({ checking: false })
    setFromAccountId('')
    setAmount('')
    setReference('')
    setRailInfo(null)
    setError('')
    setResultData(null)
  }

  return (
    <>
      <StepIndicator steps={SEND_STEPS} currentIndex={stepIndex} />

      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* ── Step 1: Recipient ── */}
      {step === 'recipient' && (
        <Card variant="raised" className="animate-in overflow-hidden">
          <CardContent className="space-y-5 p-5 lg:p-7 pt-5 lg:pt-7">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Who are you sending to?</h3>
                <p className="text-xs text-muted-foreground">Choose a saved payee or add a new recipient</p>
              </div>
            </div>

            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setRecipientMode('saved')
                  setSelectedPayee(null)
                }}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                  recipientMode === 'saved'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <User className="mr-1.5 inline h-4 w-4" />
                Saved payee
              </button>
              <button
                onClick={() => {
                  setRecipientMode('new')
                  setSelectedPayee(null)
                  setCop({ checking: false })
                }}
                className={`rounded-xl border-2 px-3 py-3 text-sm font-medium transition-all ${
                  recipientMode === 'new'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <ArrowRight className="mr-1.5 inline h-4 w-4" />
                New recipient
              </button>
            </div>

            {/* Saved payee selector */}
            {recipientMode === 'saved' && (
              <div className="space-y-3">
                {payees.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed p-6 text-center">
                    <User className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No saved payees yet</p>
                    <button
                      onClick={() => setRecipientMode('new')}
                      className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                      Add a new recipient
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search payees..."
                        className="pl-9 rounded-xl"
                        value={payeeSearch}
                        onChange={(e) => setPayeeSearch(e.target.value)}
                      />
                    </div>

                    {/* Favourites */}
                    {!payeeSearch && favourites.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
                          Favourites
                        </p>
                        {favourites.map((p) => (
                          <PayeeRow
                            key={p.id}
                            payee={p}
                            isSelected={selectedPayee?.id === p.id}
                            onSelect={() => setSelectedPayee(selectedPayee?.id === p.id ? null : p)}
                          />
                        ))}
                      </div>
                    )}

                    {/* All / filtered */}
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                      {payeeSearch && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
                          {filteredPayees.length} result{filteredPayees.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      {!payeeSearch && (
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1">
                          All payees
                        </p>
                      )}
                      {filteredPayees
                        .filter((p) => payeeSearch || !p.is_favourite)
                        .map((p) => (
                          <PayeeRow
                            key={p.id}
                            payee={p}
                            isSelected={selectedPayee?.id === p.id}
                            onSelect={() => setSelectedPayee(selectedPayee?.id === p.id ? null : p)}
                          />
                        ))}
                      {filteredPayees.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">No payees found</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* New recipient form */}
            {recipientMode === 'new' && (
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Recipient name</label>
                  <Input
                    placeholder="Full name of the account holder"
                    className="rounded-xl"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleCopCheck}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Sort code</label>
                    <Input
                      placeholder="00-00-00"
                      className="rounded-xl tabular-nums"
                      value={newSortCode}
                      onChange={(e) => handleSortCodeChange(e.target.value)}
                      onBlur={handleCopCheck}
                      maxLength={8}
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Account number</label>
                    <Input
                      placeholder="12345678"
                      className="rounded-xl tabular-nums"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      onBlur={handleCopCheck}
                      maxLength={8}
                    />
                  </div>
                </div>

                {/* CoP result badge */}
                {cop.checking && (
                  <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Verifying recipient...</span>
                  </div>
                )}
                {!cop.checking && cop.error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{cop.error}</span>
                  </div>
                )}
                {!cop.checking && cop.result && <CopBadge result={cop.result} message={cop.message} severity={cop.severity} />}
              </div>
            )}

            <Button
              className="w-full h-12 text-base"
              onClick={() => {
                setError('')
                setStep('details')
              }}
              disabled={!canContinueRecipient}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Payment Details ── */}
      {step === 'details' && (
        <Card variant="raised" className="animate-in overflow-hidden">
          <CardContent className="space-y-5 p-5 lg:p-7 pt-5 lg:pt-7">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <PoundSterling className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Payment Details</h3>
                <p className="text-xs text-muted-foreground">Choose the account and enter the amount</p>
              </div>
            </div>

            {/* Recipient summary */}
            <div className="flex items-center justify-between rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{recipientName}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatSortCode(recipientSortCode)} &middot; {maskAccountNumber(recipientAccountNumber)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep('recipient')}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Change
              </button>
            </div>

            {/* From account */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">From account</label>
              <div className="space-y-2">
                {activeAccounts.map((a) => (
                  <AccountCard
                    key={a.id}
                    account={a}
                    isSelected={fromAccountId === a.id}
                    onSelect={() => setFromAccountId(a.id)}
                  />
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">£</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="h-14 pl-9 text-lg font-semibold rounded-xl tabular-nums"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={handleAmountBlur}
                />
              </div>
              {/* Rail info */}
              {railInfo && (
                <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Via {railInfo.displayName}
                    {railInfo.fee > 0 ? ` · ${formatGBP(railInfo.fee)} fee` : ' · Free'}
                    {' · '}{railInfo.estimatedSettlement}
                  </span>
                </div>
              )}
            </div>

            {/* Reference */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Reference (optional)</label>
              <Input
                placeholder="What's this for?"
                maxLength={18}
                className="rounded-xl"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('recipient')}>
                Back
              </Button>
              <Button
                className="flex-1 h-12 text-base"
                onClick={() => {
                  setError('')
                  setStep('confirm')
                }}
                disabled={!fromAccountId || !amount || parsedAmount <= 0}
              >
                Review Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 'confirm' && (
        <Card variant="raised" className="animate-in overflow-hidden">
          {/* Gradient hero band */}
          <div className="gradient-primary px-6 py-7 text-center text-white">
            <p className="text-sm font-medium text-white/80 mb-1">Sending to {recipientName}</p>
            <p className="text-4xl font-bold tracking-tight tabular-nums">{formatGBP(parsedAmount)}</p>
          </div>

          <CardContent className="space-y-5 p-5 lg:p-7 pt-5 lg:pt-6">
            {/* Visual from → to flow */}
            <div className="space-y-3">
              {/* From card */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">From</p>
                  <p className="text-sm font-semibold truncate">{fromAccount?.account_name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {fromAccount && formatSortCode(fromAccount.sort_code)} &middot; {fromAccount && maskAccountNumber(fromAccount.account_number)}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/40 p-1.5">
                  <ArrowDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              {/* To card */}
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                  <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">To</p>
                  <p className="text-sm font-semibold truncate">{recipientName}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatSortCode(recipientSortCode)} &middot; {maskAccountNumber(recipientAccountNumber)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
              <div className="flex justify-between items-center px-4 py-3 bg-muted/30">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-semibold tabular-nums">{formatGBP(parsedAmount)}</span>
              </div>
              {reference && (
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">Reference</span>
                  <span className="text-sm font-medium">{reference}</span>
                </div>
              )}
              {railInfo && (
                <>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Payment rail</span>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      {railInfo.displayName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 bg-muted/30">
                    <span className="text-sm text-muted-foreground">Fee</span>
                    <span className={`text-sm font-medium ${railInfo.fee === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {railInfo.fee > 0 ? formatGBP(railInfo.fee) : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Settlement</span>
                    <span className="text-sm font-medium">{railInfo.estimatedSettlement}</span>
                  </div>
                </>
              )}
              {cop.result && (
                <div className="flex justify-between items-center px-4 py-3 bg-muted/30">
                  <span className="text-sm text-muted-foreground">Name check</span>
                  <CopBadge result={cop.result} message={cop.message} severity={cop.severity} compact />
                </div>
              )}
            </div>

            {!selectedPayee && (
              <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-primary/80">
                  This recipient will be saved to your payees for future payments.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('details')}>
                Edit Details
              </Button>
              <Button className="flex-1 h-12 text-base" onClick={handleSendClick} loading={isPending}>
                <Lock className="mr-2 h-4 w-4" />
                Send Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── PIN entry dialog ── */}
      {step === 'pin' && (
        <PinEntryDialog
          onVerified={handlePinVerified}
          onCancel={() => setStep('confirm')}
          title="Authorise Payment"
          description={`Enter your PIN to send ${formatGBP(parsedAmount)} to ${recipientName}`}
        />
      )}

      {/* PIN setup dialog (first time) */}
      {showPinSetup && (
        <PinSetupDialog
          onComplete={() => {
            setShowPinSetup(false)
            onPinCreated()
            setStep('pin')
          }}
          onCancel={() => setShowPinSetup(false)}
        />
      )}

      {/* ── Step 4: Success ── */}
      {step === 'success' && (
        <Card variant="raised" className="animate-in overflow-hidden">
          {/* Success gradient header */}
          <div className="gradient-success relative px-6 py-8 text-center text-white overflow-hidden">
            {/* Floating celebration dots */}
            <div className="absolute top-3 left-6 h-2 w-2 rounded-full bg-white/20 animate-float" />
            <div className="absolute top-6 right-10 h-1.5 w-1.5 rounded-full bg-white/30 animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-4 left-16 h-1 w-1 rounded-full bg-white/25 animate-float" style={{ animationDelay: '1s' }} />
            <div className="absolute bottom-3 right-20 h-2.5 w-2.5 rounded-full bg-white/15 animate-float" style={{ animationDelay: '1.5s' }} />

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-xl font-bold">Payment Sent</h2>
            <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{formatGBP(parsedAmount)}</p>
            <p className="mt-1 text-sm text-white/80">to {recipientName}</p>
          </div>

          <CardContent className="p-5 lg:p-7 pt-5 lg:pt-6">
            {/* Receipt layout */}
            <div className="rounded-xl border border-dashed border-border/80 overflow-hidden">
              <div className="divide-y divide-dashed divide-border/60">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">From</span>
                  <span className="text-sm font-medium">{fromAccount?.account_name}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">To</span>
                  <span className="text-sm font-medium">{recipientName}</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-bold tabular-nums">{formatGBP(parsedAmount)}</span>
                </div>
                {reference && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Reference</span>
                    <span className="text-sm font-medium">{reference}</span>
                  </div>
                )}
                {resultData?.railDisplayName && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Via</span>
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      {resultData.railDisplayName}
                    </span>
                  </div>
                )}
                {resultData?.railSettlement && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-sm text-muted-foreground">Settlement</span>
                    <span className="text-sm font-medium">{resultData.railSettlement}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* LogoMark branding */}
            <div className="mt-5 flex items-center justify-center gap-2 text-muted-foreground/40">
              <LogoMark size="sm" />
              <span className="text-[11px] font-medium tracking-wider uppercase">NexusBank</span>
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1 h-11" onClick={handleReset}>
                Send Another
              </Button>
              <Button variant="link" className="flex-1" onClick={() => (window.location.href = '/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PayeeRow({
  payee,
  isSelected,
  onSelect,
}: {
  payee: Payee
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
        isSelected
          ? 'bg-primary/10 ring-1 ring-primary/30'
          : 'hover:bg-muted'
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
        }`}
      >
        <User className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{payee.name}</p>
          {payee.is_favourite && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatSortCode(payee.sort_code)} &middot; {maskAccountNumber(payee.account_number)}
        </p>
      </div>
      {isSelected && (
        <CheckCircle className="h-5 w-5 text-primary shrink-0" />
      )}
    </button>
  )
}

function CopBadge({
  result,
  message,
  severity,
  compact = false,
}: {
  result?: string
  message?: string
  severity?: string
  compact?: boolean
}) {
  if (!result) return null

  const config: Record<string, { icon: typeof CheckCircle; bg: string; text: string; label: string }> = {
    match: {
      icon: CheckCircle,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      label: 'Name matched',
    },
    close_match: {
      icon: AlertTriangle,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-600 dark:text-amber-400',
      label: 'Close match',
    },
    no_match: {
      icon: AlertTriangle,
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-600 dark:text-red-400',
      label: 'Name mismatch',
    },
    unavailable: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      text: 'text-blue-600 dark:text-blue-400',
      label: 'Check unavailable',
    },
  }

  const c = config[result] || config.unavailable
  const Icon = c.icon

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}>
        <Icon className="h-3 w-3" />
        {c.label}
      </span>
    )
  }

  return (
    <div className={`flex items-start gap-2 rounded-xl p-3 ${c.bg}`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${c.text}`} />
      <div>
        <p className={`text-sm font-medium ${c.text}`}>{c.label}</p>
        {message && <p className="text-xs text-muted-foreground mt-0.5">{message}</p>}
      </div>
    </div>
  )
}
