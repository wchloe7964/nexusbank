'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { enrollBusinessUser } from './actions'
import { signInAfterRegistration } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Check, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, Building2, Copy, CheckCircle, CreditCard, AlertTriangle } from 'lucide-react'
import { CookiePreferencesModal } from '@/components/shared/cookie-preferences-modal'
import {
  businessStep1Schema,
  businessStep3Schema,
} from '@/lib/utils/validation'
import type { BusinessEnrollmentData, EnrollmentResult } from '@/lib/types'

const INITIAL_DATA: BusinessEnrollmentData = {
  title: '',
  firstName: '',
  lastName: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  postcode: '',
  email: '',
  confirmEmail: '',
  businessName: '',
  businessContactNumber: '',
  membershipType: '',
  businessRelationship: '',
  hasAuthorisedAccess: false,
  addressLine1: '',
  street: '',
  district: '',
  city: '',
  county: '',
  addressPostcode: '',
  moveMonth: '',
  moveYear: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptPrivacyPolicy: false,
}

type Step = 1 | 2 | 3 | 'success'

const STEP_GROUPS = [
  { label: 'Your details' },
  { label: 'Check your details' },
  { label: 'Finish' },
]

const stepSchemas: Record<number, { parse: (data: unknown) => unknown }> = {
  1: businessStep1Schema,
  3: businessStep3Schema,
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const currentYear = new Date().getFullYear()
const YEARS_DOB = Array.from({ length: currentYear - 1915 + 1 }, (_, i) => currentYear - i)
const YEARS_MOVE = Array.from({ length: currentYear - 1926 + 1 }, (_, i) => currentYear - i)
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const RELATIONSHIP_OPTIONS: { value: string; label: string }[] = [
  { value: 'owner-sole-trader', label: 'Owner of Sole Trader' },
  { value: 'partner', label: 'Partner of' },
  { value: 'director', label: 'Director of' },
  { value: 'receiver', label: 'A receiver of' },
  { value: 'official', label: 'An official of' },
  { value: 'administrator', label: 'An administrator of' },
  { value: 'trustee-bankruptcy', label: 'A trustee in bankruptcy of' },
  { value: 'supervisor', label: 'A supervisor of' },
  { value: 'company-secretary', label: 'A company secretary of' },
]

function CopyableField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-b-0">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground font-mono tracking-wider">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <>
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-green-600">Copied</span>
          </>
        ) : (
          <>
            <Copy className="h-3 w-3" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  )
}

export default function BusinessRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<BusinessEnrollmentData>(INITIAL_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [enrollmentResult, setEnrollmentResult] = useState<EnrollmentResult | undefined>(undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [autoLoginLoading, setAutoLoginLoading] = useState(false)
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null)
  const [cookieModalOpen, setCookieModalOpen] = useState(false)

  const updateData = useCallback((updates: Partial<BusinessEnrollmentData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const validateStep = useCallback(
    (stepNum: number): boolean => {
      const schema = stepSchemas[stepNum]
      if (!schema) return true
      try {
        schema.parse(data)
        setErrors({})
        return true
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'errors' in err) {
          const zodErrors = (
            err as { errors: Array<{ path: (string | number)[]; message: string }> }
          ).errors
          const fieldErrors: Record<string, string> = {}
          for (const e of zodErrors) {
            const key = e.path.join('.')
            if (!fieldErrors[key]) fieldErrors[key] = e.message
          }
          setErrors(fieldErrors)
        }
        return false
      }
    },
    [data]
  )

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (validateStep(1)) {
        setStep(2)
        setErrors({})
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else if (step === 2) {
      setStep(3)
      setErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step, validateStep])

  const handleBack = useCallback(() => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) return
    setLoading(true)
    setSubmitError(null)

    const result = await enrollBusinessUser(data)
    if (result?.error) {
      setSubmitError(result.error)
      setLoading(false)
    } else {
      setEnrollmentResult(result)
      setStep('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [data, validateStep])

  async function handleGoToDashboard() {
    setAutoLoginLoading(true)
    setAutoLoginError(null)
    const res = await signInAfterRegistration(data.email)
    if (res.error) {
      setAutoLoginError(res.error)
      setAutoLoginLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  // ── Progress Header ──
  function ProgressHeader({ currentStep }: { currentStep: number }) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {STEP_GROUPS.map((group, i) => {
            const groupNum = i + 1
            const isActive = currentStep === groupNum
            const isCompleted = currentStep > groupNum

            return (
              <div key={group.label} className="flex-1">
                <div className={`mb-3 h-1 rounded-full transition-colors duration-300 ${
                  isCompleted || isActive ? 'bg-primary' : 'bg-muted'
                }`} />
                <div className="space-y-0.5">
                  <p className={`text-xs font-semibold ${
                    isActive ? 'text-foreground' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {groupNum}. {group.label}
                  </p>
                  <p className={`text-[11px] ${
                    isCompleted ? 'text-primary font-medium' : isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Complete
                      </span>
                    ) : isActive ? 'In Progress' : 'Not started'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Success Screen ──
  if (step === 'success') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Registration complete</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Welcome to NexusBank Business Banking, {data.firstName}! Your account for {data.businessName} has been created.
          </p>
        </div>

        {/* Important save notice */}
        <div className="flex items-start gap-3 rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/20 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Save your account details
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 leading-relaxed">
              You&apos;ll need these details to log in. Copy them now or take a screenshot — we&apos;ve also sent them to your email.
            </p>
          </div>
        </div>

        {/* All credentials */}
        <Card className="border-primary/30 bg-primary/[0.02]">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">Your account details</h3>
            <p className="text-xs text-muted-foreground mb-4">Use any of these to log in alongside your last name.</p>

            <div className="space-y-0">
              {enrollmentResult?.membershipNumber && (
                <CopyableField label="Membership number" value={enrollmentResult.membershipNumber} />
              )}
              {enrollmentResult?.sortCode && (
                <CopyableField label="Sort code" value={enrollmentResult.sortCode} />
              )}
              {enrollmentResult?.accountNumber && (
                <CopyableField label="Account number" value={enrollmentResult.accountNumber} />
              )}
              {enrollmentResult?.cardLast4 && (
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Debit card</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground font-mono tracking-wider">
                        **** **** **** {enrollmentResult.cardLast4}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How to log in */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">How to log in</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You can log in using your <strong>last name</strong> plus any one of:
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary shrink-0" />
                Your 12-digit membership number
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary shrink-0" />
                Your 16-digit card number
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary shrink-0" />
                Your sort code and account number
              </li>
            </ul>
          </CardContent>
        </Card>

        {autoLoginError && (
          <p className="text-xs text-center text-destructive">{autoLoginError}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={handleGoToDashboard} loading={autoLoginLoading}>
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Link href="/login" className="flex-1">
            <Button variant="outline" className="w-full">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStepNum = typeof step === 'number' ? step : 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Business Online Banking Registration
        </h1>
      </div>

      <ProgressHeader currentStep={currentStepNum} />

      {submitError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 1 — YOUR DETAILS                         */}
      {/* ══════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
            <div className="border-b border-border/60 px-6 py-4">
              <h2 className="text-sm font-semibold text-foreground">
                Step 1: Your details
              </h2>
            </div>

            <div className="p-6 space-y-8">
              {/* Intro text */}
              <div className="rounded-lg bg-accent border border-border/40 p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We&apos;ll automatically generate your business account number, sort code, and debit card once you complete registration.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-destructive">*</span> All starred fields are mandatory.
                </p>
              </div>

              {/* ── Personal details ── */}
              <section className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={data.title}
                    onChange={(e) => updateData({ title: e.target.value as BusinessEnrollmentData['title'] })}
                    error={errors.title}
                  >
                    <option value="">Please Select</option>
                    {['Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof', 'Other'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                </div>

                {/* First name(s) */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    First name(s) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="First name(s)"
                    value={data.firstName}
                    onChange={(e) => updateData({ firstName: e.target.value })}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName}</p>
                  )}
                </div>

                {/* Surname */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Surname <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Surname"
                    value={data.lastName}
                    onChange={(e) => updateData({ lastName: e.target.value })}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName}</p>
                  )}
                </div>

                {/* Date of birth */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Date of birth <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2 max-w-[340px]">
                    <Select
                      value={data.dobDay}
                      onChange={(e) => updateData({ dobDay: e.target.value })}
                      error={errors.dobDay}
                      className="flex-1"
                    >
                      <option value="">Day</option>
                      {DAYS.map((d) => (
                        <option key={d} value={String(d)}>{d}</option>
                      ))}
                    </Select>
                    <span className="text-muted-foreground font-medium">/</span>
                    <Select
                      value={data.dobMonth}
                      onChange={(e) => updateData({ dobMonth: e.target.value })}
                      error={errors.dobMonth}
                      className="flex-1"
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m) => (
                        <option key={m} value={String(m)}>{m}</option>
                      ))}
                    </Select>
                    <span className="text-muted-foreground font-medium">/</span>
                    <Select
                      value={data.dobYear}
                      onChange={(e) => updateData({ dobYear: e.target.value })}
                      error={errors.dobYear}
                      className="flex-[1.5]"
                    >
                      <option value="">Year</option>
                      {YEARS_DOB.map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </Select>
                  </div>
                  {(errors.dobDay || errors.dobMonth || errors.dobYear) && (
                    <p className="text-xs text-destructive">
                      {errors.dobDay || errors.dobMonth || errors.dobYear}
                    </p>
                  )}
                </div>

                {/* Postcode */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Postcode <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. SW1A 1AA"
                    value={data.postcode}
                    onChange={(e) => updateData({ postcode: e.target.value.toUpperCase() })}
                    className="max-w-[200px]"
                    autoComplete="postal-code"
                  />
                  {errors.postcode && (
                    <p className="text-xs text-destructive">{errors.postcode}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Preferred email address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Confirm email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Re-enter preferred email address <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Re-enter your email address"
                    value={data.confirmEmail}
                    onChange={(e) => updateData({ confirmEmail: e.target.value })}
                  />
                  {errors.confirmEmail && (
                    <p className="text-xs text-destructive">{errors.confirmEmail}</p>
                  )}
                </div>
              </section>

              {/* ── Your business ── */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Your business
                </h3>

                {/* Business name */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Your business name"
                    value={data.businessName}
                    onChange={(e) => updateData({ businessName: e.target.value })}
                  />
                  {errors.businessName && (
                    <p className="text-xs text-destructive">{errors.businessName}</p>
                  )}
                </div>

                {/* Business contact number */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Business contact number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. 020 1234 5678"
                    value={data.businessContactNumber}
                    onChange={(e) => updateData({ businessContactNumber: e.target.value })}
                  />
                  {errors.businessContactNumber && (
                    <p className="text-xs text-destructive">{errors.businessContactNumber}</p>
                  )}
                </div>

                {/* Membership type */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    What type of Online Banking membership are you applying for?
                  </label>
                  <Select
                    value={data.membershipType}
                    onChange={(e) => updateData({ membershipType: e.target.value as BusinessEnrollmentData['membershipType'] })}
                    error={errors.membershipType}
                  >
                    <option value="">Please Select</option>
                    <option value="business-only">Business membership only</option>
                    <option value="business-and-personal">Business and personal membership</option>
                  </Select>
                  {errors.membershipType && (
                    <p className="text-xs text-destructive">{errors.membershipType}</p>
                  )}
                </div>

                {/* Business relationship */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    What is your business relationship? <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={data.businessRelationship}
                    onChange={(e) => updateData({ businessRelationship: e.target.value as BusinessEnrollmentData['businessRelationship'] })}
                    error={errors.businessRelationship}
                  >
                    <option value="">Please Select</option>
                    {RELATIONSHIP_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </Select>
                  {errors.businessRelationship && (
                    <p className="text-xs text-destructive">{errors.businessRelationship}</p>
                  )}
                </div>

                {/* Authorised access */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.hasAuthorisedAccess}
                    onChange={(e) => updateData({ hasAuthorisedAccess: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    Is anyone else authorised to access this account?
                  </span>
                </label>
              </section>

              {/* ── Your address history ── */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Your address history
                </h3>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    House/flat name and no. <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Flat 2, 14"
                    value={data.addressLine1}
                    onChange={(e) => updateData({ addressLine1: e.target.value })}
                  />
                  {errors.addressLine1 && (
                    <p className="text-xs text-destructive">{errors.addressLine1}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Street <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Street name"
                    value={data.street}
                    onChange={(e) => updateData({ street: e.target.value })}
                  />
                  {errors.street && (
                    <p className="text-xs text-destructive">{errors.street}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">District</label>
                  <Input
                    placeholder="District (optional)"
                    value={data.district}
                    onChange={(e) => updateData({ district: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Town/city <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Town or city"
                    value={data.city}
                    onChange={(e) => updateData({ city: e.target.value })}
                  />
                  {errors.city && (
                    <p className="text-xs text-destructive">{errors.city}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">County</label>
                  <Input
                    placeholder="County (optional)"
                    value={data.county}
                    onChange={(e) => updateData({ county: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Postcode <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. SW1A 1AA"
                    value={data.addressPostcode}
                    onChange={(e) => updateData({ addressPostcode: e.target.value.toUpperCase() })}
                    className="max-w-[200px]"
                  />
                  {errors.addressPostcode && (
                    <p className="text-xs text-destructive">{errors.addressPostcode}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    When did you move to your residential address? <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2 max-w-[340px]">
                    <Select
                      value={data.moveMonth}
                      onChange={(e) => updateData({ moveMonth: e.target.value })}
                      error={errors.moveMonth}
                      className="flex-1"
                    >
                      <option value="">Month</option>
                      {MONTH_NAMES.map((m, i) => (
                        <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                      ))}
                    </Select>
                    <Select
                      value={data.moveYear}
                      onChange={(e) => updateData({ moveYear: e.target.value })}
                      error={errors.moveYear}
                      className="flex-1"
                    >
                      <option value="">Year</option>
                      {YEARS_MOVE.map((y) => (
                        <option key={y} value={String(y)}>{y}</option>
                      ))}
                    </Select>
                  </div>
                  {(errors.moveMonth || errors.moveYear) && (
                    <p className="text-xs text-destructive">
                      {errors.moveMonth || errors.moveYear}
                    </p>
                  )}
                </div>
              </section>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Link href="/register">
                  <Button variant="outline" className="gap-1.5 h-11">
                    <ArrowLeft className="h-4 w-4" />
                    Cancel
                  </Button>
                </Link>
                <Button className="flex-1 gap-2 h-11" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => setCookieModalOpen(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Cookie Policy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 2 — CHECK YOUR DETAILS                   */}
      {/* ══════════════════════════════════════════════ */}
      {step === 2 && (
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Step 2: Check your details
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Personal details review */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                Your details
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium text-foreground">{data.title} {data.firstName} {data.lastName}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Date of birth</dt>
                  <dd className="font-medium text-foreground">{data.dobDay}/{data.dobMonth}/{data.dobYear}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Postcode</dt>
                  <dd className="font-medium text-foreground">{data.postcode}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium text-foreground">{data.email}</dd>
                </div>
              </dl>
            </section>

            {/* Business details review */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Your business
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Business name</dt>
                  <dd className="font-medium text-foreground">{data.businessName}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Contact number</dt>
                  <dd className="font-medium text-foreground">{data.businessContactNumber}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Membership type</dt>
                  <dd className="font-medium text-foreground capitalize">{data.membershipType?.replace(/-/g, ' ')}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Business relationship</dt>
                  <dd className="font-medium text-foreground">
                    {RELATIONSHIP_OPTIONS.find((o) => o.value === data.businessRelationship)?.label || '\u2014'}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Address review */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                Your address
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Address</dt>
                  <dd className="font-medium text-foreground text-right max-w-[60%]">
                    {data.addressLine1}, {data.street}{data.district ? `, ${data.district}` : ''}, {data.city}{data.county ? `, ${data.county}` : ''}, {data.addressPostcode}
                  </dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/20">
                  <dt className="text-muted-foreground">Moved in</dt>
                  <dd className="font-medium text-foreground">
                    {data.moveMonth && data.moveYear
                      ? `${MONTH_NAMES[parseInt(data.moveMonth, 10) - 1]} ${data.moveYear}`
                      : '\u2014'}
                  </dd>
                </div>
              </dl>
            </section>

            <div className="rounded-lg bg-accent border border-border/40 p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Once you complete registration, we&apos;ll automatically create your business account and generate your membership number, sort code, account number, and debit card details.
              </p>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button variant="outline" className="gap-1.5 h-11" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button className="flex-1 gap-2 h-11" onClick={handleNext}>
                Confirm &amp; continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* STEP 3 — FINISH (Security + Terms)            */}
      {/* ══════════════════════════════════════════════ */}
      {step === 3 && (
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Step 3: Finish
            </h2>
          </div>

          <div className="p-6 space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                Create your password
              </h3>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={data.password}
                    onChange={(e) => updateData({ password: e.target.value })}
                    autoComplete="new-password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {[
                    { test: data.password.length >= 10, label: 'At least 10 characters' },
                    { test: /[A-Z]/.test(data.password), label: 'An uppercase letter' },
                    { test: /[a-z]/.test(data.password), label: 'A lowercase letter' },
                    { test: /\d/.test(data.password), label: 'A number' },
                    { test: /[^A-Za-z0-9]/.test(data.password), label: 'A special character' },
                  ].map((rule) => (
                    <li key={rule.label} className={`flex items-center gap-2 ${rule.test ? 'text-green-600 dark:text-green-400' : ''}`}>
                      <Check className={`h-3 w-3 ${rule.test ? '' : 'opacity-30'}`} />
                      {rule.label}
                    </li>
                  ))}
                </ul>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Confirm password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={data.confirmPassword}
                    onChange={(e) => updateData({ confirmPassword: e.target.value })}
                    autoComplete="new-password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                Terms and conditions
              </h3>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.acceptTerms}
                  onChange={(e) => updateData({ acceptTerms: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-foreground">
                  I accept the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms and Conditions
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="text-xs text-destructive ml-7">{errors.acceptTerms}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.acceptPrivacyPolicy}
                  onChange={(e) => updateData({ acceptPrivacyPolicy: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm text-foreground">
                  I accept the{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptPrivacyPolicy && (
                <p className="text-xs text-destructive ml-7">{errors.acceptPrivacyPolicy}</p>
              )}
            </section>

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="gap-1.5 h-11" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button className="flex-1 gap-2 h-11" onClick={handleSubmit} loading={loading}>
                Complete registration
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal
        open={cookieModalOpen}
        onClose={() => setCookieModalOpen(false)}
      />
    </div>
  )
}
