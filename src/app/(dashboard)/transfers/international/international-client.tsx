'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Globe, ArrowLeft, Send, AlertCircle, CheckCircle,
  Clock, ChevronRight, RefreshCw, Info, Plane,
} from 'lucide-react'
import { submitInternationalPayment, getQuote } from './actions'
import type { Account, InternationalPayment } from '@/lib/types'
import type { FxQuote } from '@/lib/payments/fx-rates'

const POPULAR_CURRENCIES = [
  { code: 'EUR', name: 'Euro', flag: '\u20ac' },
  { code: 'USD', name: 'US Dollar', flag: '$' },
  { code: 'CHF', name: 'Swiss Franc', flag: 'Fr' },
  { code: 'JPY', name: 'Japanese Yen', flag: '\u00a5' },
  { code: 'AUD', name: 'Australian Dollar', flag: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', flag: 'C$' },
  { code: 'INR', name: 'Indian Rupee', flag: '\u20b9' },
  { code: 'SGD', name: 'Singapore Dollar', flag: 'S$' },
  { code: 'SEK', name: 'Swedish Krona', flag: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', flag: 'kr' },
  { code: 'DKK', name: 'Danish Krone', flag: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', flag: 'z\u0142' },
  { code: 'HUF', name: 'Hungarian Forint', flag: 'Ft' },
  { code: 'CZK', name: 'Czech Koruna', flag: 'K\u010d' },
  { code: 'TRY', name: 'Turkish Lira', flag: '\u20ba' },
  { code: 'ZAR', name: 'South African Rand', flag: 'R' },
]

const PAYMENT_STATUS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending:     { label: 'Pending', color: 'text-amber-600 bg-amber-50', icon: Clock },
  processing:  { label: 'Processing', color: 'text-blue-600 bg-blue-50', icon: RefreshCw },
  sent:        { label: 'Sent', color: 'text-blue-600 bg-blue-50', icon: Send },
  in_transit:  { label: 'In transit', color: 'text-indigo-600 bg-indigo-50', icon: Plane },
  completed:   { label: 'Completed', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  failed:      { label: 'Failed', color: 'text-red-600 bg-red-50', icon: AlertCircle },
  cancelled:   { label: 'Cancelled', color: 'text-muted-foreground bg-muted', icon: AlertCircle },
  returned:    { label: 'Returned', color: 'text-orange-600 bg-orange-50', icon: AlertCircle },
}

const CHARGE_OPTIONS = [
  { value: 'shared', label: 'Shared (SHA)', desc: 'Fees split between sender and recipient' },
  { value: 'our', label: 'Our (OUR)', desc: 'You pay all fees' },
  { value: 'beneficiary', label: 'Beneficiary (BEN)', desc: 'Recipient pays all fees' },
]

const PURPOSE_CODES = [
  { value: '', label: 'Select purpose...' },
  { value: 'TRADE', label: 'Trade / commercial payment' },
  { value: 'PERSONAL', label: 'Personal / family support' },
  { value: 'SALARY', label: 'Salary / wages' },
  { value: 'PROPERTY', label: 'Property purchase' },
  { value: 'EDUCATION', label: 'Education / tuition' },
  { value: 'MEDICAL', label: 'Medical expenses' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'OTHER', label: 'Other' },
]

const SOURCE_OF_FUNDS = [
  { value: '', label: 'Select source...' },
  { value: 'salary', label: 'Salary / employment income' },
  { value: 'savings', label: 'Personal savings' },
  { value: 'investment', label: 'Investment returns' },
  { value: 'property', label: 'Property sale proceeds' },
  { value: 'inheritance', label: 'Inheritance / gift' },
  { value: 'business', label: 'Business income' },
  { value: 'other', label: 'Other' },
]

interface Props {
  accounts: Account[]
  recentPayments: InternationalPayment[]
}

type ViewState = 'list' | 'form' | 'quote' | 'success'

export function InternationalTransferClient({ accounts, recentPayments }: Props) {
  const router = useRouter()
  const [view, setView] = useState<ViewState>(recentPayments.length === 0 ? 'form' : 'list')

  // Form fields
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || '')
  const [beneficiaryName, setBeneficiaryName] = useState('')
  const [beneficiaryIban, setBeneficiaryIban] = useState('')
  const [beneficiarySwiftBic, setBeneficiarySwiftBic] = useState('')
  const [beneficiaryBankName, setBeneficiaryBankName] = useState('')
  const [beneficiaryBankCountry, setBeneficiaryBankCountry] = useState('')
  const [beneficiaryAddress, setBeneficiaryAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [targetCurrency, setTargetCurrency] = useState('EUR')
  const [chargeType, setChargeType] = useState<'shared' | 'our' | 'beneficiary'>('shared')
  const [purposeCode, setPurposeCode] = useState('')
  const [reference, setReference] = useState('')
  const [sourceOfFunds, setSourceOfFunds] = useState('')
  const [declaration, setDeclaration] = useState(false)

  // Quote
  const [quote, setQuote] = useState<FxQuote | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)

  // Submission
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)

  const selectedAccount = accounts.find(a => a.id === fromAccountId)

  const handleGetQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0 || !targetCurrency || !fromAccountId) return
    setLoadingQuote(true)
    setError(null)

    try {
      const q = await getQuote(
        parseFloat(amount),
        selectedAccount?.currency_code || 'GBP',
        targetCurrency,
        beneficiaryBankCountry || 'US'
      )
      setQuote(q)
      setView('quote')
    } catch {
      setError('Unable to get exchange rate. Please try again.')
    }
    setLoadingQuote(false)
  }, [amount, targetCurrency, fromAccountId, selectedAccount, beneficiaryBankCountry])

  const handleSubmit = useCallback(async () => {
    if (!quote || !declaration) return
    setSubmitting(true)
    setError(null)

    const result = await submitInternationalPayment({
      fromAccountId,
      beneficiaryName,
      beneficiaryIban,
      beneficiarySwiftBic,
      beneficiaryBankName,
      beneficiaryBankCountry,
      beneficiaryAddress,
      amount: parseFloat(amount),
      targetCurrency,
      chargeType,
      purposeCode,
      reference,
      sourceOfFunds,
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSuccessId(result.id || null)
      setView('success')
      setSubmitting(false)
      router.refresh()
    }
  }, [quote, declaration, fromAccountId, beneficiaryName, beneficiaryIban, beneficiarySwiftBic, beneficiaryBankName, beneficiaryBankCountry, beneficiaryAddress, amount, targetCurrency, chargeType, purposeCode, reference, sourceOfFunds, router])

  const resetForm = () => {
    setBeneficiaryName('')
    setBeneficiaryIban('')
    setBeneficiarySwiftBic('')
    setBeneficiaryBankName('')
    setBeneficiaryBankCountry('')
    setBeneficiaryAddress('')
    setAmount('')
    setTargetCurrency('EUR')
    setChargeType('shared')
    setPurposeCode('')
    setReference('')
    setSourceOfFunds('')
    setDeclaration(false)
    setQuote(null)
    setError(null)
    setSuccessId(null)
  }

  const selectClass = 'flex h-11 w-full rounded-full border border-input bg-card px-5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

  // ── Success View ──
  if (view === 'success') {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm p-8 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold">Payment submitted</h2>
          <p className="text-sm text-muted-foreground">
            Your international payment has been submitted for processing.
          </p>
          {successId && (
            <p className="text-xs text-muted-foreground">
              Payment ID: <span className="font-mono">{successId.slice(0, 8)}...</span>
            </p>
          )}
          <div className="flex gap-3 justify-center pt-2">
            <Button variant="outline" onClick={() => { resetForm(); setView('list') }}>
              View payments
            </Button>
            <Button onClick={() => { resetForm(); setView('form') }}>
              Send another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Quote Review View ──
  if (view === 'quote' && quote) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setView('form')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Edit details
          </Button>
          <h1 className="text-xl font-bold">Review payment</h1>
        </div>

        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm divide-y divide-border/40">
          {/* Summary */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sending</span>
              <span className="text-lg font-bold">{parseFloat(amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} {selectedAccount?.currency_code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exchange rate</span>
              <span className="text-sm font-medium">1 {quote.baseCurrency} = {quote.rate.toFixed(4)} {quote.targetCurrency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recipient gets</span>
              <span className="text-lg font-bold text-green-600">{quote.convertedAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} {quote.targetCurrency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Fee</span>
              <span className="text-sm">{quote.fee > 0 ? `${quote.fee.toFixed(2)} ${quote.baseCurrency}` : 'Free'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <span className="text-sm font-semibold">Total cost</span>
              <span className="text-sm font-bold">{quote.totalCost.toFixed(2)} {quote.baseCurrency}</span>
            </div>
          </div>

          {/* Beneficiary details */}
          <div className="p-6 space-y-2">
            <h3 className="text-sm font-semibold mb-3">Recipient details</h3>
            <Row label="Name" value={beneficiaryName} />
            {beneficiaryIban && <Row label="IBAN" value={beneficiaryIban} />}
            {beneficiarySwiftBic && <Row label="SWIFT/BIC" value={beneficiarySwiftBic} />}
            <Row label="Bank" value={beneficiaryBankName} />
            <Row label="Country" value={beneficiaryBankCountry} />
            {reference && <Row label="Reference" value={reference} />}
          </div>

          {/* Declaration */}
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                I confirm the information is accurate and the funds are from a legitimate source.
                I understand this payment is subject to compliance checks and may be delayed or rejected.
              </p>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">I accept the declaration and terms above</span>
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setView('form')}>
            Back
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={handleSubmit}
            disabled={!declaration}
            loading={submitting}
          >
            <Send className="h-4 w-4" /> Confirm and send
          </Button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground">
          Quote valid until {new Date(quote.expiresAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    )
  }

  // ── Form View ──
  if (view === 'form') {
    const canQuote = beneficiaryName && beneficiaryBankName && beneficiaryBankCountry
      && parseFloat(amount) > 0 && targetCurrency && sourceOfFunds && purposeCode

    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <div className="flex items-center gap-3">
          {recentPayments.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setView('list')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <div>
            <h1 className="text-xl font-bold">International Transfer</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Send money abroad via SWIFT or SEPA</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="h-4 w-4" /> {error}
            </div>
          )}

          {/* From account */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">From account</label>
            <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)} className={selectClass}>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.account_name} ({a.currency_code} {Number(a.balance).toLocaleString('en-GB', { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          </div>

          <hr className="border-border/40" />

          {/* Beneficiary */}
          <h3 className="text-sm font-semibold">Recipient details</h3>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full name</label>
            <Input value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} placeholder="John Smith" maxLength={200} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">IBAN</label>
              <Input value={beneficiaryIban} onChange={(e) => setBeneficiaryIban(e.target.value.toUpperCase())} placeholder="DE89 3704 0044 0532 0130 00" maxLength={34} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">SWIFT/BIC</label>
              <Input value={beneficiarySwiftBic} onChange={(e) => setBeneficiarySwiftBic(e.target.value.toUpperCase())} placeholder="COBADEFFXXX" maxLength={11} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Bank name</label>
            <Input value={beneficiaryBankName} onChange={(e) => setBeneficiaryBankName(e.target.value)} placeholder="Deutsche Bank" maxLength={200} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bank country</label>
              <Input value={beneficiaryBankCountry} onChange={(e) => setBeneficiaryBankCountry(e.target.value.toUpperCase())} placeholder="DE" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Recipient address <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input value={beneficiaryAddress} onChange={(e) => setBeneficiaryAddress(e.target.value)} placeholder="123 Main St, Berlin" maxLength={300} />
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Payment details */}
          <h3 className="text-sm font-semibold">Payment details</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency</label>
              <select value={targetCurrency} onChange={(e) => setTargetCurrency(e.target.value)} className={selectClass}>
                {POPULAR_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code} - {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Fee arrangement</label>
            <select value={chargeType} onChange={(e) => setChargeType(e.target.value as typeof chargeType)} className={selectClass}>
              {CHARGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label} - {o.desc}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Purpose</label>
              <select value={purposeCode} onChange={(e) => setPurposeCode(e.target.value)} className={selectClass}>
                {PURPOSE_CODES.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Source of funds</label>
              <select value={sourceOfFunds} onChange={(e) => setSourceOfFunds(e.target.value)} className={selectClass}>
                {SOURCE_OF_FUNDS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Reference <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Invoice #12345" maxLength={35} />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGetQuote}
            disabled={!canQuote}
            loading={loadingQuote}
          >
            <Globe className="h-4 w-4" /> Get quote
          </Button>
        </div>
      </div>
    )
  }

  // ── Payment History View ──
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">International Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send money abroad via SWIFT or SEPA
          </p>
        </div>
        <Button className="gap-2" onClick={() => { resetForm(); setView('form') }}>
          <Globe className="h-4 w-4" /> New transfer
        </Button>
      </div>

      {recentPayments.length === 0 ? (
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm p-12 text-center">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-sm font-semibold">No international payments yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Send money abroad to over 180 countries.
          </p>
          <Button className="mt-4 gap-2" onClick={() => setView('form')}>
            <Globe className="h-4 w-4" /> Send your first payment
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden divide-y divide-border/40">
          {recentPayments.map((p) => {
            const status = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending
            return (
              <div
                key={p.id}
                className="w-full text-left px-5 py-4 flex items-center gap-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold truncate">{p.beneficiary_name}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Number(p.amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })} {p.target_currency}
                    {p.tracking_reference && <> &middot; {p.tracking_reference}</>}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Small helper
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] break-all">{value}</span>
    </div>
  )
}
