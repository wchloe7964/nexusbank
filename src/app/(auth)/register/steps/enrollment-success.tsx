'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, ArrowRight, Copy, Check, CreditCard, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInAfterRegistration } from '../actions'
import type { EnrollmentData, EnrollmentResult } from '@/lib/types'

interface SuccessProps {
  data: EnrollmentData
  result?: EnrollmentResult
}

function CopyableField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
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
        <p className={`text-sm font-semibold text-foreground ${mono ? 'font-mono tracking-wider' : ''}`}>
          {value}
        </p>
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

export function EnrollmentSuccess({ data, result }: SuccessProps) {
  const router = useRouter()
  const [autoLoginLoading, setAutoLoginLoading] = useState(false)
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null)

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Registration complete</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Welcome to NexusBank, {data.firstName}! Your account has been created and is ready to use.
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
            {result?.membershipNumber && (
              <CopyableField label="Membership number" value={result.membershipNumber} />
            )}
            {result?.sortCode && (
              <CopyableField label="Sort code" value={result.sortCode} />
            )}
            {result?.accountNumber && (
              <CopyableField label="Account number" value={result.accountNumber} />
            )}
            {result?.cardLast4 && (
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Debit card</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground font-mono tracking-wider">
                      **** **** **** {result.cardLast4}
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

      {/* Auto-login error */}
      {autoLoginError && (
        <p className="text-xs text-center text-destructive">{autoLoginError}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          className="flex-1"
          onClick={handleGoToDashboard}
          loading={autoLoginLoading}
        >
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
