'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  User,
  CreditCard,
  MapPin,
  FileCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Fingerprint,
  FileText,
  Home,
} from 'lucide-react'
import { submitKycApplication } from './actions'

const STEPS = [
  { label: 'Personal', icon: User },
  { label: 'Identity', icon: CreditCard },
  { label: 'Address', icon: MapPin },
  { label: 'Review', icon: FileCheck },
]

const ID_TYPES = [
  { value: 'passport', label: 'Passport', description: 'Valid international passport' },
  { value: 'driving_licence', label: 'Driving Licence', description: 'Full UK or EU driving licence' },
  { value: 'national_id', label: 'National ID Card', description: 'Government-issued national ID' },
] as const

const ADDRESS_DOC_TYPES = [
  { value: 'utility_bill', label: 'Utility Bill', description: 'Gas, electric, or water bill (within 3 months)' },
  { value: 'bank_statement', label: 'Bank Statement', description: 'From another bank (within 3 months)' },
  { value: 'council_tax', label: 'Council Tax Bill', description: 'Current year council tax statement' },
] as const

interface FormData {
  fullName: string
  dateOfBirth: string
  documentType: 'passport' | 'driving_licence' | 'national_id'
  documentNumber: string
  expiryDate: string
  addressDocumentType: 'utility_bill' | 'bank_statement' | 'council_tax'
  addressLine1: string
  addressLine2: string
  city: string
  postcode: string
}

export function KycWizard({ userName }: { userName: string }) {
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<FormData>({
    fullName: userName || '',
    dateOfBirth: '',
    documentType: 'passport',
    documentNumber: '',
    expiryDate: '',
    addressDocumentType: 'utility_bill',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
  })

  function update(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function canAdvance(): boolean {
    if (step === 0) return form.fullName.trim().length > 0 && form.dateOfBirth.length > 0
    if (step === 1) return form.documentNumber.trim().length > 0 && form.expiryDate.length > 0
    if (step === 2) return form.addressLine1.trim().length > 0 && form.city.trim().length > 0 && form.postcode.trim().length > 0
    return true
  }

  function handleNext() {
    if (step < 3) {
      setStep(step + 1)
    } else {
      handleSubmit()
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitKycApplication({
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        documentType: form.documentType,
        documentNumber: form.documentNumber,
        expiryDate: form.expiryDate,
        addressDocumentType: form.addressDocumentType,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        city: form.city,
        postcode: form.postcode,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSubmitted(true)
      }
    })
  }

  /* ── Success State ─────────────────────────────────────── */
  if (submitted) {
    return (
      <Card variant="raised">
        <CardContent className="flex flex-col items-center text-center p-5 lg:p-8 py-10 lg:py-14">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/30">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mt-5 text-lg font-bold text-foreground">Application Submitted</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm">
            Your identity verification is now being reviewed. This usually takes up to 24 hours.
            We&apos;ll notify you once it&apos;s complete.
          </p>
          <div className="mt-6 w-full max-w-xs space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-blue-600">Under review</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">ID document</span>
              <span className="font-medium">{ID_TYPES.find((t) => t.value === form.documentType)?.label}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Address proof</span>
              <span className="font-medium">{ADDRESS_DOC_TYPES.find((t) => t.value === form.addressDocumentType)?.label}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Step Indicator ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-2">
        {STEPS.map((s, i) => {
          const StepIcon = s.icon
          const isActive = i === step
          const isDone = i < step
          return (
            <div key={s.label} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                  isDone
                    ? 'bg-emerald-100 dark:bg-emerald-950/30'
                    : isActive
                      ? 'bg-[#0676b6] shadow-md shadow-[#0676b6]/25'
                      : 'bg-muted'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <StepIcon
                    className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground/50'}`}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  isDone ? 'text-emerald-600' : isActive ? 'text-[#0676b6]' : 'text-muted-foreground/50'
                }`}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Step Content ──────────────────────────────────── */}
      <Card variant="raised">
        <CardContent className="p-5 lg:p-6">
          {/* Step 0: Personal Details */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0676b6]/10">
                  <User className="h-4 w-4 text-[#0676b6]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold">Personal Details</h3>
                  <p className="text-xs text-muted-foreground">As they appear on your ID document</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Legal Name</label>
                  <Input
                    value={form.fullName}
                    onChange={(e) => update('fullName', e.target.value)}
                    placeholder="e.g. John Michael Smith"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth</label>
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update('dateOfBirth', e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Identity Document */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0676b6]/10">
                  <Fingerprint className="h-4 w-4 text-[#0676b6]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold">Identity Document</h3>
                  <p className="text-xs text-muted-foreground">Select your photo ID type and enter its details</p>
                </div>
              </div>

              <div className="space-y-2">
                {ID_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => update('documentType', type.value)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      form.documentType === type.value
                        ? 'border-[#0676b6] bg-[#0676b6]/5 ring-1 ring-[#0676b6]/20'
                        : 'border-border hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        form.documentType === type.value ? 'bg-[#0676b6]/10' : 'bg-muted'
                      }`}
                    >
                      <CreditCard
                        className={`h-3.5 w-3.5 ${
                          form.documentType === type.value ? 'text-[#0676b6]' : 'text-muted-foreground/50'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-[11px] text-muted-foreground">{type.description}</p>
                    </div>
                    {form.documentType === type.value && (
                      <CheckCircle2 className="h-4 w-4 text-[#0676b6] shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Document Number</label>
                  <Input
                    value={form.documentNumber}
                    onChange={(e) => update('documentNumber', e.target.value)}
                    placeholder={form.documentType === 'passport' ? 'e.g. 533401827' : 'e.g. SMITH 901015 AB1CD'}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expiry Date</label>
                  <Input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => update('expiryDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0676b6]/10">
                  <Home className="h-4 w-4 text-[#0676b6]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold">Address Verification</h3>
                  <p className="text-xs text-muted-foreground">Your current residential address</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Address Line 1</label>
                  <Input
                    value={form.addressLine1}
                    onChange={(e) => update('addressLine1', e.target.value)}
                    placeholder="e.g. 42 Baker Street"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Address Line 2 <span className="text-muted-foreground/50">(Optional)</span>
                  </label>
                  <Input
                    value={form.addressLine2}
                    onChange={(e) => update('addressLine2', e.target.value)}
                    placeholder="e.g. Flat 4B"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">City</label>
                    <Input
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      placeholder="e.g. London"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Postcode</label>
                    <Input
                      value={form.postcode}
                      onChange={(e) => update('postcode', e.target.value)}
                      placeholder="e.g. NW1 6XE"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground block">Proof of Address Document</label>
                {ADDRESS_DOC_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => update('addressDocumentType', type.value)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                      form.addressDocumentType === type.value
                        ? 'border-[#0676b6] bg-[#0676b6]/5 ring-1 ring-[#0676b6]/20'
                        : 'border-border hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        form.addressDocumentType === type.value ? 'bg-[#0676b6]/10' : 'bg-muted'
                      }`}
                    >
                      <FileText
                        className={`h-3.5 w-3.5 ${
                          form.addressDocumentType === type.value ? 'text-[#0676b6]' : 'text-muted-foreground/50'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-[11px] text-muted-foreground">{type.description}</p>
                    </div>
                    {form.addressDocumentType === type.value && (
                      <CheckCircle2 className="h-4 w-4 text-[#0676b6] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0676b6]/10">
                  <FileCheck className="h-4 w-4 text-[#0676b6]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold">Review &amp; Submit</h3>
                  <p className="text-xs text-muted-foreground">Please check all details are correct</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Personal */}
                <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Personal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{form.fullName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date of birth</span>
                    <span className="font-medium">
                      {form.dateOfBirth
                        ? new Date(form.dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Identity */}
                <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Fingerprint className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identity</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Document type</span>
                    <span className="font-medium">{ID_TYPES.find((t) => t.value === form.documentType)?.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Document number</span>
                    <span className="font-medium font-mono tracking-wide">{form.documentNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expiry date</span>
                    <span className="font-medium">
                      {form.expiryDate
                        ? new Date(form.expiryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="rounded-xl bg-muted/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Address</span>
                    <span className="font-medium text-right">
                      {form.addressLine1}
                      {form.addressLine2 ? `, ${form.addressLine2}` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">City</span>
                    <span className="font-medium">{form.city}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Postcode</span>
                    <span className="font-medium">{form.postcode}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Proof document</span>
                    <span className="font-medium">{ADDRESS_DOC_TYPES.find((t) => t.value === form.addressDocumentType)?.label}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                By submitting, you confirm that the information provided is accurate and you consent
                to Nexus Bank verifying your identity in accordance with UK regulations.
              </p>
            </div>
          )}

          {/* ── Error ───────────────────────────────────────── */}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 px-4 py-3">
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* ── Navigation ──────────────────────────────────── */}
          <div className="flex items-center gap-3 mt-6">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isPending}
                className="gap-1.5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canAdvance() || isPending}
              className="flex-1 gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : step === 3 ? (
                'Submit Application'
              ) : (
                <>
                  Continue
                  <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
