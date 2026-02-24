'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { enrollUser } from './actions'
import { ProgressHeader } from './components/progress-header'
import { EnrollmentSuccess } from './steps/enrollment-success'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Shield,
  CircleHelp,
} from 'lucide-react'
import {
  enrollmentStep1Schema,
  enrollmentStep3Schema_personal,
} from '@/lib/utils/validation'
import type { EnrollmentData, RegistrationAccountType } from '@/lib/types'

const INITIAL_DATA: EnrollmentData = {
  lastName: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  postcode: '',
  registrationAccountType: '',
  sortCode1: '',
  sortCode2: '',
  sortCode3: '',
  cardNumber: '',
  email: '',
  confirmEmail: '',
  marketingOptOut: false,
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptPrivacyPolicy: false,
}

type Step = 'welcome' | 1 | 2 | 3 | 'success'

const ACCOUNT_TYPE_OPTIONS: {
  id: RegistrationAccountType
  label: string
  description: string
}[] = [
  {
    id: 'current_savings',
    label: 'Current or savings account',
    description:
      'You can also use this option if you have a mortgage and a current account or savings account with us.',
  },
  {
    id: 'mortgage',
    label: 'Mortgage account',
    description:
      'Use this if you only have a mortgage with us and no other accounts.',
  },
  {
    id: 'merchant',
    label: 'Merchant',
    description: 'Use this if you have a merchant services account with us.',
  },
]

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [data, setData] = useState<EnrollmentData>({ ...INITIAL_DATA })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [membershipNumber, setMembershipNumber] = useState<string | undefined>(
    undefined
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSortCodeTooltip, setShowSortCodeTooltip] = useState(false)
  const [showCardTooltip, setShowCardTooltip] = useState(false)

  const updateData = useCallback((updates: Partial<EnrollmentData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  const validateStep = useCallback(
    (stepNum: number): boolean => {
      const schema =
        stepNum === 1
          ? enrollmentStep1Schema
          : stepNum === 3
            ? enrollmentStep3Schema_personal
            : null
      if (!schema) return true
      try {
        schema.parse(data)
        setErrors({})
        return true
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'errors' in err) {
          const zodErrors = (
            err as {
              errors: Array<{ path: (string | number)[]; message: string }>
            }
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

  const goNext = useCallback(() => {
    if (typeof step !== 'number') return
    if (step === 2) {
      // Review step — no validation needed
      setStep(3)
      setErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (validateStep(step)) {
      setStep((step + 1) as Step)
      setErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step, validateStep])

  const goBack = useCallback(() => {
    if (typeof step === 'number' && step > 1) {
      setStep((step - 1) as Step)
      setErrors({})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [step])

  const handleSubmit = useCallback(async () => {
    if (!validateStep(3)) return
    setLoading(true)
    setSubmitError(null)

    const result = await enrollUser(data)
    if (result?.error) {
      setSubmitError(result.error)
      setLoading(false)
    } else {
      setMembershipNumber(result.membershipNumber)
      setStep('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [data, validateStep])

  // ── Success screen ──
  if (step === 'success') {
    return <EnrollmentSuccess data={data} membershipNumber={membershipNumber} />
  }

  // ── Welcome / Onboarding screen (Screen 1) ──
  if (step === 'welcome') {
    return (
      <div className="space-y-6">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Register for Online Banking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            It only takes a few minutes
          </p>
        </div>

        {/* Main info card */}
        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Registering for NexusBank Online Banking
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Who can register */}
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Who can register?
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                To register you&apos;ll need to:
              </p>
              <ul className="mt-3 space-y-2.5">
                {[
                  'Live in the UK',
                  'Be aged 16 or over',
                  'Have either a NexusBank current account with a bank card, a savings account or a mortgage, or be a merchant customer',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* What happens after */}
            <div className="border-t border-border/40 pt-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Once you&apos;re registered, you&apos;ll be able to see and
                manage all of your NexusBank accounts in Online Banking, except
                for those that need someone else&apos;s signature.
              </p>
            </div>

            {/* Business callout */}
            <div className="rounded-lg bg-accent border border-border/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Are you a business customer?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                If you have a business savings or current account with us,
                please{' '}
                <Link
                  href="/register/business"
                  target="_blank"
                  className="text-primary font-medium hover:underline"
                >
                  register for Business Online Banking
                </Link>{' '}
                instead.
              </p>
            </div>

            {/* Navigation note */}
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              To move to the next step or go back, use the navigation buttons at
              the bottom of each page. Don&apos;t use your web browser&apos;s
              &apos;back&apos; and &apos;forward&apos; buttons, as you&apos;ll
              lose any information you&apos;ve entered.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link href="/login" className="flex-1">
            <Button variant="outline" className="w-full h-11">
              Cancel
            </Button>
          </Link>
          <Button
            className="flex-1 gap-2 h-11"
            onClick={() => {
              setStep(1)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Start
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  // ── Registration form steps (1, 2, 3) ──
  const currentStepNum = typeof step === 'number' ? step : 1
  const STEP_HEADINGS: Record<number, string> = {
    1: 'Your Details',
    2: 'Review',
    3: 'Complete',
  }

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Register for Online Banking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          It only takes a few minutes
        </p>
      </div>

      {/* Progress header */}
      <ProgressHeader currentStep={currentStepNum} />

      {/* Submit-level error */}
      {submitError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Step content card */}
      <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Step {currentStepNum} of 3 &mdash;{' '}
            {STEP_HEADINGS[currentStepNum]}
          </h2>
        </div>

        <div className="p-6">
          {/* ══════════════════════════════════════════════ */}
          {/* STEP 1 — YOUR DETAILS                         */}
          {/* ══════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-8">
              {/* ── Your details ── */}
              <section className="space-y-5">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Your details
                </h3>

                {/* Last name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="lastName"
                    className="text-sm font-medium text-foreground"
                  >
                    Last name
                  </label>
                  <Input
                    id="lastName"
                    type="text"
                    value={data.lastName}
                    onChange={(e) => updateData({ lastName: e.target.value })}
                    placeholder="Enter your last name"
                    autoComplete="family-name"
                    autoFocus
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">
                      {errors.lastName}
                    </p>
                  )}
                </div>

                {/* Date of birth */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    Date of birth (DD/MM/YYYY)
                  </label>
                  <div className="flex gap-2 max-w-[280px]">
                    <div className="flex-1">
                      <Input
                        placeholder="DD"
                        maxLength={2}
                        inputMode="numeric"
                        value={data.dobDay}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 2)
                          updateData({ dobDay: val })
                          if (val.length === 2) {
                            document
                              .querySelector<HTMLInputElement>(
                                '[data-dob="month"]'
                              )
                              ?.focus()
                          }
                        }}
                        className="text-center"
                        aria-label="Day of birth"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium self-center">
                      /
                    </span>
                    <div className="flex-1">
                      <Input
                        placeholder="MM"
                        maxLength={2}
                        inputMode="numeric"
                        value={data.dobMonth}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 2)
                          updateData({ dobMonth: val })
                          if (val.length === 2) {
                            document
                              .querySelector<HTMLInputElement>(
                                '[data-dob="year"]'
                              )
                              ?.focus()
                          }
                        }}
                        data-dob="month"
                        className="text-center"
                        aria-label="Month of birth"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium self-center">
                      /
                    </span>
                    <div className="flex-[1.5]">
                      <Input
                        placeholder="YYYY"
                        maxLength={4}
                        inputMode="numeric"
                        value={data.dobYear}
                        onChange={(e) =>
                          updateData({
                            dobYear: e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 4),
                          })
                        }
                        data-dob="year"
                        className="text-center"
                        aria-label="Year of birth"
                      />
                    </div>
                  </div>
                  {(errors.dobDay || errors.dobMonth || errors.dobYear) && (
                    <p className="text-xs text-destructive">
                      {errors.dobDay || errors.dobMonth || errors.dobYear}
                    </p>
                  )}
                </div>

                {/* Postcode */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="postcode"
                    className="text-sm font-medium text-foreground"
                  >
                    Postcode
                  </label>
                  <Input
                    id="postcode"
                    type="text"
                    value={data.postcode}
                    onChange={(e) =>
                      updateData({ postcode: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. SW1A 1AA"
                    className="max-w-[200px]"
                    autoComplete="postal-code"
                  />
                  {errors.postcode && (
                    <p className="text-xs text-destructive">
                      {errors.postcode}
                    </p>
                  )}
                </div>
              </section>

              {/* ── Account details ── */}
              <section className="space-y-5">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Account details
                </h3>

                <p className="text-sm text-muted-foreground">
                  Select the type of NexusBank account you have.
                </p>

                {/* Account type radio buttons */}
                <div className="space-y-3">
                  {ACCOUNT_TYPE_OPTIONS.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        data.registrationAccountType === option.id
                          ? 'border-primary bg-primary/[0.03]'
                          : 'border-border hover:border-border/80 hover:bg-muted/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="registrationAccountType"
                        value={option.id}
                        checked={data.registrationAccountType === option.id}
                        onChange={() =>
                          updateData({ registrationAccountType: option.id })
                        }
                        className="mt-0.5 h-4 w-4 accent-primary"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {option.description}
                        </p>
                      </div>
                    </label>
                  ))}
                  {errors.registrationAccountType && (
                    <p className="text-xs text-destructive">
                      {errors.registrationAccountType}
                    </p>
                  )}
                </div>

                {/* Sort code */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Sort code
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setShowSortCodeTooltip(true)}
                        onMouseLeave={() => setShowSortCodeTooltip(false)}
                        onClick={() =>
                          setShowSortCodeTooltip(!showSortCodeTooltip)
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Where to find your sort code"
                      >
                        <CircleHelp className="h-4 w-4" />
                      </button>
                      {showSortCodeTooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg border border-border bg-white dark:bg-card shadow-lg p-3 z-10">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            You&apos;ll find the 6-digit sort code on the front
                            of your debit card or on your bank statements.
                          </p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-white dark:border-t-card" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 max-w-[220px]">
                    <div className="flex-1">
                      <Input
                        placeholder="00"
                        maxLength={2}
                        inputMode="numeric"
                        value={data.sortCode1}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 2)
                          updateData({ sortCode1: val })
                          if (val.length === 2) {
                            document
                              .querySelector<HTMLInputElement>(
                                '[data-sc="2"]'
                              )
                              ?.focus()
                          }
                        }}
                        className="text-center"
                        aria-label="Sort code first 2 digits"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium">-</span>
                    <div className="flex-1">
                      <Input
                        placeholder="00"
                        maxLength={2}
                        inputMode="numeric"
                        value={data.sortCode2}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, '')
                            .slice(0, 2)
                          updateData({ sortCode2: val })
                          if (val.length === 2) {
                            document
                              .querySelector<HTMLInputElement>(
                                '[data-sc="3"]'
                              )
                              ?.focus()
                          }
                        }}
                        data-sc="2"
                        className="text-center"
                        aria-label="Sort code second 2 digits"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium">-</span>
                    <div className="flex-1">
                      <Input
                        placeholder="00"
                        maxLength={2}
                        inputMode="numeric"
                        value={data.sortCode3}
                        onChange={(e) =>
                          updateData({
                            sortCode3: e.target.value
                              .replace(/\D/g, '')
                              .slice(0, 2),
                          })
                        }
                        data-sc="3"
                        className="text-center"
                        aria-label="Sort code third 2 digits"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    You&apos;ll find the 6-digit sort code on the front of your
                    debit card or authentication card.
                  </p>
                  {(errors.sortCode1 ||
                    errors.sortCode2 ||
                    errors.sortCode3) && (
                    <p className="text-xs text-destructive">
                      Please enter your full sort code
                    </p>
                  )}
                </div>

                {/* Card number */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="cardNumber"
                      className="text-sm font-medium text-foreground"
                    >
                      Card number (16 digits)
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setShowCardTooltip(true)}
                        onMouseLeave={() => setShowCardTooltip(false)}
                        onClick={() => setShowCardTooltip(!showCardTooltip)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Where to find your card number"
                      >
                        <CircleHelp className="h-4 w-4" />
                      </button>
                      {showCardTooltip && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg border border-border bg-white dark:bg-card shadow-lg p-3 z-10">
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            The 16-digit number on the front of your debit card.
                            If you haven&apos;t received a card yet, you can
                            order one through Online Banking once registered.
                          </p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-white dark:border-t-card" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Input
                    id="cardNumber"
                    type="text"
                    inputMode="numeric"
                    maxLength={19}
                    value={data.cardNumber
                      .replace(/(.{4})/g, '$1 ')
                      .trim()}
                    onChange={(e) => {
                      const raw = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 16)
                      updateData({ cardNumber: raw })
                    }}
                    placeholder="0000 0000 0000 0000"
                    className="max-w-[280px]"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    If you haven&apos;t received a card yet, you can order one
                    through Online Banking once registered.
                  </p>
                  {errors.cardNumber && (
                    <p className="text-xs text-destructive">
                      {errors.cardNumber}
                    </p>
                  )}
                </div>
              </section>

              {/* ── Contact details ── */}
              <section className="space-y-5">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Contact details
                </h3>

                {/* Email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData({ email: e.target.value })}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Confirm email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmEmail"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm email address
                  </label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    value={data.confirmEmail}
                    onChange={(e) =>
                      updateData({ confirmEmail: e.target.value })
                    }
                    placeholder="Confirm your email"
                    autoComplete="email"
                  />
                  {errors.confirmEmail && (
                    <p className="text-xs text-destructive">
                      {errors.confirmEmail}
                    </p>
                  )}
                </div>

                {/* Marketing opt-out */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.marketingOptOut}
                    onChange={(e) =>
                      updateData({ marketingOptOut: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <div>
                    <span className="text-sm text-foreground">
                      I do not want to receive marketing communications
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                      By opting out, you won&apos;t receive any marketing offers
                      from NexusBank. You&apos;ll still receive important account
                      information.
                    </p>
                  </div>
                </label>
              </section>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-2 h-11"
                  onClick={() => {
                    setStep('welcome')
                    setErrors({})
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1 gap-2 h-11" onClick={goNext}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* STEP 2 — REVIEW                               */}
          {/* ══════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Please check all the details below are correct before
                continuing.
              </p>

              {/* Your details review */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Your details
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                  <span className="text-muted-foreground">Last name</span>
                  <span className="font-medium">{data.lastName}</span>

                  <span className="text-muted-foreground">Date of birth</span>
                  <span className="font-medium">
                    {data.dobDay}/{data.dobMonth}/{data.dobYear}
                  </span>

                  <span className="text-muted-foreground">Postcode</span>
                  <span className="font-medium">{data.postcode}</span>
                </div>
              </div>

              {/* Account details review */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Account details
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                  <span className="text-muted-foreground">Account type</span>
                  <span className="font-medium">
                    {ACCOUNT_TYPE_OPTIONS.find(
                      (o) => o.id === data.registrationAccountType
                    )?.label || '—'}
                  </span>

                  <span className="text-muted-foreground">Sort code</span>
                  <span className="font-medium font-mono">
                    {data.sortCode1}-{data.sortCode2}-{data.sortCode3}
                  </span>

                  <span className="text-muted-foreground">Card number</span>
                  <span className="font-medium font-mono">
                    •••• •••• ••••{' '}
                    {data.cardNumber.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Contact details review */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Contact details
                </h3>
                <div className="grid grid-cols-[140px_1fr] gap-y-3 text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{data.email}</span>

                  <span className="text-muted-foreground">Marketing</span>
                  <span className="font-medium">
                    {data.marketingOptOut ? 'Opted out' : 'Opted in'}
                  </span>
                </div>
              </div>

              {/* Edit link */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="text-primary font-medium hover:underline"
                >
                  Edit your details
                </button>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-2 h-11"
                  onClick={goBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button className="flex-1 gap-2 h-11" onClick={goNext}>
                  Confirm &amp; continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════ */}
          {/* STEP 3 — COMPLETE (Security + Submit)         */}
          {/* ══════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Security section */}
              <section className="space-y-5">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Set up your security
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground">
                  Create a password for your Online Banking account. You&apos;ll
                  use this alongside your membership number to verify your
                  identity.
                </p>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Create a password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={data.password}
                      onChange={(e) =>
                        updateData({ password: e.target.value })
                      }
                      placeholder="At least 10 characters"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <ul className="space-y-1 mt-2">
                    {[
                      {
                        test: data.password.length >= 10,
                        label: 'At least 10 characters',
                      },
                      {
                        test: /[A-Z]/.test(data.password),
                        label: 'An uppercase letter',
                      },
                      {
                        test: /[a-z]/.test(data.password),
                        label: 'A lowercase letter',
                      },
                      { test: /\d/.test(data.password), label: 'A number' },
                      {
                        test: /[^A-Za-z0-9]/.test(data.password),
                        label: 'A special character',
                      },
                    ].map((rule) => (
                      <li
                        key={rule.label}
                        className={`flex items-center gap-2 text-xs ${
                          rule.test
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${rule.test ? '' : 'opacity-30'}`}
                        />
                        {rule.label}
                      </li>
                    ))}
                  </ul>
                  {errors.password && (
                    <p className="text-xs text-destructive">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={data.confirmPassword}
                      onChange={(e) =>
                        updateData({ confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </section>

              {/* Terms & conditions */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Terms and conditions
                </h3>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.acceptTerms}
                    onChange={(e) =>
                      updateData({ acceptTerms: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    I accept the{' '}
                    <Link
                      href="/terms"
                      className="text-primary hover:underline"
                    >
                      Terms and Conditions
                    </Link>
                  </span>
                </label>
                {errors.acceptTerms && (
                  <p className="text-xs text-destructive">
                    {errors.acceptTerms}
                  </p>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.acceptPrivacyPolicy}
                    onChange={(e) =>
                      updateData({ acceptPrivacyPolicy: e.target.checked })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    I accept the{' '}
                    <Link
                      href="/privacy"
                      className="text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>
                {errors.acceptPrivacyPolicy && (
                  <p className="text-xs text-destructive">
                    {errors.acceptPrivacyPolicy}
                  </p>
                )}
              </section>

              {/* Navigation */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="gap-2 h-11"
                  onClick={goBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  className="flex-1 gap-2 h-11"
                  onClick={handleSubmit}
                  loading={loading}
                >
                  Complete registration
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
