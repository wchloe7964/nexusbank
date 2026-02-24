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
} from 'lucide-react'
import {
  enrollmentStep1Schema,
  enrollmentStep3Schema_personal,
} from '@/lib/utils/validation'
import type { EnrollmentData, EnrollmentResult } from '@/lib/types'

const INITIAL_DATA: EnrollmentData = {
  firstName: '',
  lastName: '',
  dobDay: '',
  dobMonth: '',
  dobYear: '',
  postcode: '',
  email: '',
  confirmEmail: '',
  marketingOptOut: false,
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  acceptPrivacyPolicy: false,
}

type Step = 'welcome' | 1 | 2 | 3 | 'success'

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [data, setData] = useState<EnrollmentData>({ ...INITIAL_DATA })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [enrollmentResult, setEnrollmentResult] = useState<EnrollmentResult | undefined>(undefined)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
      setEnrollmentResult(result)
      setStep('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [data, validateStep])

  // ── Success screen ──
  if (step === 'success') {
    return <EnrollmentSuccess data={data} result={enrollmentResult} />
  }

  // ── Welcome / Onboarding screen ──
  if (step === 'welcome') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Register for Online Banking
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            It only takes a few minutes
          </p>
        </div>

        <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Registering for NexusBank Online Banking
            </h2>
          </div>

          <div className="p-6 space-y-6">
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
                  'Have a valid email address',
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

            <div className="border-t border-border/40 pt-5">
              <h3 className="text-sm font-semibold text-foreground">
                What you&apos;ll get
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                We&apos;ll automatically create your current account, generate
                your membership number, sort code, account number, and debit
                card — everything you need to start banking.
              </p>
            </div>

            <div className="rounded-lg bg-accent border border-border/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Are you a business customer?
              </h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                If you need a business account, please{' '}
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

            <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
              To move to the next step or go back, use the navigation buttons at
              the bottom of each page. Don&apos;t use your web browser&apos;s
              &apos;back&apos; and &apos;forward&apos; buttons, as you&apos;ll
              lose any information you&apos;ve entered.
            </p>
          </div>
        </div>

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Register for Online Banking
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          It only takes a few minutes
        </p>
      </div>

      <ProgressHeader currentStep={currentStepNum} />

      {submitError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

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
              <section className="space-y-5">
                <h3 className="text-sm font-semibold text-foreground border-b border-border/40 pb-2">
                  Your details
                </h3>

                {/* First name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="firstName"
                    className="text-sm font-medium text-foreground"
                  >
                    First name
                  </label>
                  <Input
                    id="firstName"
                    type="text"
                    value={data.firstName}
                    onChange={(e) => updateData({ firstName: e.target.value })}
                    placeholder="Enter your first name"
                    autoComplete="given-name"
                    autoFocus
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">
                      {errors.firstName}
                    </p>
                  )}
                </div>

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
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{data.firstName} {data.lastName}</span>

                  <span className="text-muted-foreground">Date of birth</span>
                  <span className="font-medium">
                    {data.dobDay}/{data.dobMonth}/{data.dobYear}
                  </span>

                  <span className="text-muted-foreground">Postcode</span>
                  <span className="font-medium">{data.postcode}</span>
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

              {/* What we'll create */}
              <div className="rounded-lg bg-accent border border-border/40 p-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Once you complete registration, we&apos;ll automatically create
                  your current account and generate your membership number, sort
                  code, account number, and debit card details.
                </p>
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
