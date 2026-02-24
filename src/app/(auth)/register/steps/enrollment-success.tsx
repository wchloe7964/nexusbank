'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowRight, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import type { EnrollmentData } from '@/lib/types'

const accountTypeLabels: Record<string, string> = {
  current_savings: 'Current / Savings Account',
  mortgage: 'Mortgage Account',
  merchant: 'Merchant Account',
}

interface SuccessProps {
  data: EnrollmentData
  membershipNumber?: string
}

export function EnrollmentSuccess({ data, membershipNumber }: SuccessProps) {
  const [copied, setCopied] = useState(false)

  function copyMembership() {
    if (membershipNumber) {
      navigator.clipboard.writeText(membershipNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-4 mb-4">
          <CheckCircle className="h-10 w-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Registration complete</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          Thank you. Your Online Banking registration has been completed successfully.
        </p>
      </div>

      {/* Membership number card */}
      {membershipNumber && (
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="p-6 space-y-3">
            <p className="text-sm font-semibold text-foreground">Your Membership Number</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                {membershipNumber}
              </span>
              <button
                type="button"
                onClick={copyMembership}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copy membership number"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Keep this number safe — you&apos;ll use it to log in to Online Banking.
              We&apos;ve also sent it to your email address.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="accent-bar mx-auto" />
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account type</span>
              <span className="font-medium">{accountTypeLabels[data.registrationAccountType] || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last name</span>
              <span className="font-medium">{data.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{data.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="flex items-start gap-3 p-4 text-left">
          <div className="rounded-full bg-primary/[0.08] p-2 shrink-0">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              We&apos;ve sent your membership number and account details to{' '}
              <span className="font-medium">{data.email}</span>.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/login" className="flex-1">
          <Button className="w-full">
            Go to Login
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
