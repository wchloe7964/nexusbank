'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { signInWithIdentifier } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  Shield,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CircleHelp,
} from 'lucide-react'

type LoginMethod = 'membership' | 'card' | 'account'

const LOGIN_METHODS: { id: LoginMethod; label: string }[] = [
  { id: 'membership', label: 'Membership number' },
  { id: 'card', label: 'Card (last 4 digits)' },
  { id: 'account', label: 'Sort code and account number' },
]

const FAQ_ITEMS = [
  { q: 'How to reset your memorable word and passcode', href: '/forgot-password' },
  { q: 'Is saving my details safe?', href: '/privacy' },
  { q: 'Service status', href: '/complaints' },
  { q: 'How do I set up two-factor authentication?', href: '/privacy' },
  { q: 'Contact us', href: '/complaints' },
]

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('membership')
  const [lastName, setLastName] = useState('')
  const [membershipNumber, setMembershipNumber] = useState('')
  const [cardLast4, setCardLast4] = useState('')
  const [sortCode1, setSortCode1] = useState('')
  const [sortCode2, setSortCode2] = useState('')
  const [sortCode3, setSortCode3] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showFAQ, setShowFAQ] = useState(false)
  const [showMembershipTooltip, setShowMembershipTooltip] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const msg = params.get('message')
    if (msg) setMessage(msg)
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      if (!lastName.trim()) {
        setError('Please enter your last name')
        return
      }

      if (loginMethod === 'membership') {
        if (!membershipNumber || membershipNumber.length < 12) {
          setError('Please enter your 12-digit membership number')
          return
        }
      } else if (loginMethod === 'card') {
        if (!cardLast4 || cardLast4.length < 4) {
          setError('Please enter the last 4 digits of your card')
          return
        }
      } else if (loginMethod === 'account') {
        if (!sortCode1 || !sortCode2 || !sortCode3) {
          setError('Please enter your full sort code')
          return
        }
        if (!accountNumber || accountNumber.length < 8) {
          setError('Please enter your 8-digit account number')
          return
        }
      }

      setLoading(true)

      const result = await signInWithIdentifier({
        method: loginMethod,
        lastName,
        membershipNumber: loginMethod === 'membership' ? membershipNumber : undefined,
        cardLast4: loginMethod === 'card' ? cardLast4 : undefined,
        sortCode: loginMethod === 'account' ? `${sortCode1}-${sortCode2}-${sortCode3}` : undefined,
        accountNumber: loginMethod === 'account' ? accountNumber : undefined,
      })

      if (result?.error) {
        setError(result.error)
        setLoading(false)
      }
    },
    [lastName, loginMethod, membershipNumber, cardLast4, sortCode1, sortCode2, sortCode3, accountNumber]
  )

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-start gap-3">
        <Shield className="mt-0.5 h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Secure</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Log in to Online Banking
          </h1>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main login card */}
      <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
        {/* Card header */}
        <div className="border-b border-border/60 px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">How would you like to log in?</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Not registered for Online Banking?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Register now
            </Link>
            .
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Login method tabs */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {LOGIN_METHODS.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setLoginMethod(method.id)
                  setError(null)
                }}
                className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors border-r last:border-r-0 border-border ${
                  loginMethod === method.id
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-card text-muted-foreground hover:bg-muted/60'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Last name — shown for all methods */}
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                Last name
              </label>
              <Input
                id="lastName"
                name="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                autoComplete="family-name"
                autoFocus
              />
            </div>

            {/* ── Membership number method ── */}
            {loginMethod === 'membership' && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="membership" className="text-sm font-medium text-foreground">
                    Membership number (12 digits)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setShowMembershipTooltip(true)}
                      onMouseLeave={() => setShowMembershipTooltip(false)}
                      onClick={() => setShowMembershipTooltip(!showMembershipTooltip)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="What is my membership number?"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                    {showMembershipTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg border border-border bg-white dark:bg-card shadow-lg p-3 z-10">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          You will have received this number via email when you first signed up
                          to Online Banking.
                        </p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                          <div className="border-4 border-transparent border-t-white dark:border-t-card" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Input
                  id="membership"
                  name="membership"
                  type="text"
                  inputMode="numeric"
                  maxLength={12}
                  value={membershipNumber}
                  onChange={(e) => setMembershipNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="Enter your 12-digit membership number"
                />
                <Link
                  href="/forgot-password"
                  className="inline-block text-xs text-primary font-medium hover:underline mt-1"
                >
                  Don&apos;t know your membership number?
                </Link>
              </div>
            )}

            {/* ── Card last 4 digits method ── */}
            {loginMethod === 'card' && (
              <div className="space-y-1.5">
                <label htmlFor="cardLast4" className="text-sm font-medium text-foreground">
                  Last 4 digits of your card
                </label>
                <Input
                  id="cardLast4"
                  name="cardLast4"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setCardLast4(raw)
                  }}
                  placeholder="0000"
                  className="max-w-[120px]"
                />
              </div>
            )}

            {/* ── Sort code and account number method ── */}
            {loginMethod === 'account' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Sort code</label>
                  <div className="flex items-center gap-2 max-w-[220px]">
                    <div className="flex-1">
                      <Input
                        placeholder="00"
                        maxLength={2}
                        inputMode="numeric"
                        value={sortCode1}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                          setSortCode1(val)
                          if (val.length === 2) {
                            const next = document.querySelector<HTMLInputElement>('[data-sc="2"]')
                            next?.focus()
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
                        value={sortCode2}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 2)
                          setSortCode2(val)
                          if (val.length === 2) {
                            const next = document.querySelector<HTMLInputElement>('[data-sc="3"]')
                            next?.focus()
                          }
                        }}
                        className="text-center"
                        data-sc="2"
                        aria-label="Sort code second 2 digits"
                      />
                    </div>
                    <span className="text-muted-foreground font-medium">-</span>
                    <div className="flex-1">
                      <Input
                        placeholder="00"
                        maxLength={2}
                        inputMode="numeric"
                        value={sortCode3}
                        onChange={(e) => setSortCode3(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        className="text-center"
                        data-sc="3"
                        aria-label="Sort code third 2 digits"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="accountNum" className="text-sm font-medium text-foreground">
                    Account number
                  </label>
                  <Input
                    id="accountNum"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="8-digit account number"
                    className="max-w-[200px]"
                  />
                </div>
              </div>
            )}

            {/* Remember me */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <span className="text-sm text-foreground">
                  Remember my last name and login method (optional)
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Don&apos;t tick the box if you&apos;re using a public or shared device
                </p>
              </div>
            </label>

            {/* Submit */}
            <Button type="submit" className="w-full gap-2 h-11" loading={loading}>
              Log in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="rounded-xl border border-border bg-white dark:bg-card shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFAQ(!showFAQ)}
          className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Frequently asked questions</span>
          </div>
          {showFAQ ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showFAQ && (
          <div className="border-t border-border/60 px-6 py-4">
            <ul className="space-y-1">
              {FAQ_ITEMS.map((item) => (
                <li key={item.q}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 py-2 text-sm text-primary hover:underline"
                  >
                    <ArrowRight className="h-3 w-3 shrink-0" />
                    {item.q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
