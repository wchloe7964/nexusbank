'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { formatGBP } from '@/lib/utils/currency'
import { formatSortCode } from '@/lib/utils/sort-code'
import { maskAccountNumber } from '@/lib/utils/account-number'
import {
  CheckCircle,
  ArrowRight,
  ArrowLeftRight,
  User,
  Search,
  Star,
  AlertTriangle,
  Info,
  Lock,
  Zap,
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

// ─── Main Component ───────────────────────────────────────────────────────────

export function TransfersClient({ accounts, payees, hasPinSet }: TransfersClientProps) {
  const [pinReady, setPinReady] = useState(hasPinSet)

  return (
    <Tabs defaultValue="own" className="space-y-4">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="own">Between my accounts</TabsTrigger>
        <TabsTrigger value="someone">To someone else</TabsTrigger>
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
      {error && (
        <Card className="border-destructive mb-4">
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
                {activeAccounts.map((a) => (
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
                {activeAccounts.filter((a) => a.id !== fromAccountId).map((a) => (
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
              <Button className="flex-1" onClick={handleConfirmClick} loading={isPending}>
                <Lock className="mr-1.5 h-4 w-4" />
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
        <Card className="transition-all duration-200">
          <CardContent className="flex flex-col items-center p-5 lg:p-8 text-center">
            <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Transfer Complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatGBP(parsedAmount)} has been transferred from {fromAccount?.account_name} to {toAccount?.account_name}
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleReset}>Make Another Transfer</Button>
              <Button variant="link" onClick={() => (window.location.href = '/dashboard')}>Go to Dashboard</Button>
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
      {error && (
        <Card className="border-destructive mb-4">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {/* ── Step 1: Recipient ── */}
      {step === 'recipient' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle className="tracking-tight">Who are you sending to?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setRecipientMode('saved')
                  setSelectedPayee(null)
                }}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
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
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
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
                  <div className="rounded-lg border border-dashed p-6 text-center">
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
                        className="pl-9 rounded-lg"
                        value={payeeSearch}
                        onChange={(e) => setPayeeSearch(e.target.value)}
                      />
                    </div>

                    {/* Favourites */}
                    {!payeeSearch && favourites.length > 0 && (
                      <div className="space-y-1">
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
                    <div className="space-y-1 max-h-[280px] overflow-y-auto">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient name</label>
                  <Input
                    placeholder="Full name of the account holder"
                    className="rounded-lg"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleCopCheck}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort code</label>
                    <Input
                      placeholder="00-00-00"
                      className="rounded-lg tabular-nums"
                      value={newSortCode}
                      onChange={(e) => handleSortCodeChange(e.target.value)}
                      onBlur={handleCopCheck}
                      maxLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account number</label>
                    <Input
                      placeholder="12345678"
                      className="rounded-lg tabular-nums"
                      value={newAccountNumber}
                      onChange={(e) => setNewAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      onBlur={handleCopCheck}
                      maxLength={8}
                    />
                  </div>
                </div>

                {/* CoP result badge */}
                {cop.checking && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Verifying recipient...</span>
                  </div>
                )}
                {!cop.checking && cop.error && (
                  <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">{cop.error}</span>
                  </div>
                )}
                {!cop.checking && cop.result && <CopBadge result={cop.result} message={cop.message} severity={cop.severity} />}
              </div>
            )}

            <Button
              className="w-full"
              onClick={() => {
                setError('')
                setStep('details')
              }}
              disabled={!canContinueRecipient}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Step 2: Payment Details ── */}
      {step === 'details' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle className="tracking-tight">Payment details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Recipient summary */}
            <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{recipientName}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatSortCode(recipientSortCode)} &middot; {maskAccountNumber(recipientAccountNumber)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep('recipient')}
                className="text-xs font-medium text-primary hover:underline"
              >
                Change
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From account</label>
              <Select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className="rounded-lg">
                <option value="">Select account</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} ({formatGBP(a.balance)})
                  </option>
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
                  onBlur={handleAmountBlur}
                />
              </div>
              {/* Rail info */}
              {railInfo && (
                <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span>
                    Via {railInfo.displayName}
                    {railInfo.fee > 0 ? ` · ${formatGBP(railInfo.fee)} fee` : ' · Free'}
                    {' · '}{railInfo.estimatedSettlement}
                  </span>
                </div>
              )}
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

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('recipient')}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setError('')
                  setStep('confirm')
                }}
                disabled={!fromAccountId || !amount || parsedAmount <= 0}
              >
                Review Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Step 3: Confirm ── */}
      {step === 'confirm' && (
        <Card className="transition-all duration-200">
          <CardHeader>
            <CardTitle className="tracking-tight">Confirm Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg bg-muted p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <div className="text-right">
                  <span className="font-medium">{recipientName}</span>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatSortCode(recipientSortCode)} &middot; {maskAccountNumber(recipientAccountNumber)}
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{fromAccount?.account_name}</span>
              </div>
              <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-lg font-bold tracking-tight tabular-nums">{formatGBP(parsedAmount)}</span>
              </div>
              {reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{reference}</span>
                </div>
              )}
              {railInfo && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Payment rail</span>
                    <span className="font-medium">{railInfo.displayName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee</span>
                    <span className="font-medium">{railInfo.fee > 0 ? formatGBP(railInfo.fee) : 'Free'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Settlement</span>
                    <span className="font-medium">{railInfo.estimatedSettlement}</span>
                  </div>
                </>
              )}
              {cop.result && (
                <div className="flex justify-between text-sm items-center">
                  <span className="text-muted-foreground">Name check</span>
                  <CopBadge result={cop.result} message={cop.message} severity={cop.severity} compact />
                </div>
              )}
            </div>

            {!selectedPayee && (
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-primary/80">
                  This recipient will be saved to your payees for future payments.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('details')}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleSendClick} loading={isPending}>
                <Lock className="mr-1.5 h-4 w-4" />
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

      {/* ── Step 5: Success ── */}
      {step === 'success' && (
        <Card className="transition-all duration-200">
          <CardContent className="flex flex-col items-center p-5 lg:p-8 text-center">
            <div className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Payment Sent</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatGBP(parsedAmount)} has been sent to {recipientName}
            </p>

            <div className="mt-5 w-full rounded-lg bg-muted p-4 space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{fromAccount?.account_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{recipientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium tabular-nums">{formatGBP(parsedAmount)}</span>
              </div>
              {reference && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-medium">{reference}</span>
                </div>
              )}
              {resultData?.railDisplayName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Via</span>
                  <span className="font-medium">{resultData.railDisplayName}</span>
                </div>
              )}
              {resultData?.railSettlement && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Settlement</span>
                  <span className="font-medium">{resultData.railSettlement}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={handleReset}>
                Send Another
              </Button>
              <Button variant="link" onClick={() => (window.location.href = '/dashboard')}>
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
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
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
    <div className={`flex items-start gap-2 rounded-lg p-3 ${c.bg}`}>
      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${c.text}`} />
      <div>
        <p className={`text-sm font-medium ${c.text}`}>{c.label}</p>
        {message && <p className="text-xs text-muted-foreground mt-0.5">{message}</p>}
      </div>
    </div>
  )
}
