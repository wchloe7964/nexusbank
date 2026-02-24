'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Logo } from '@/components/brand/logo'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'

export default function Verify2FAPage() {
  const router = useRouter()
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialising, setInitialising] = useState(true)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)

  const initChallenge = useCallback(async () => {
    try {
      const supabase = createClient()

      // Check if MFA verification is actually needed
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (!aalData || aalData.currentLevel === 'aal2' || aalData.nextLevel !== 'aal2') {
        // No MFA needed or already verified — go to dashboard
        router.push('/dashboard')
        return
      }

      // Get the enrolled TOTP factor
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totpFactor = factors?.totp?.[0]

      if (!totpFactor) {
        // No verified TOTP factor — shouldn't happen, go to dashboard
        router.push('/dashboard')
        return
      }

      setFactorId(totpFactor.id)

      // Create a challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })

      if (challengeError) {
        setError(challengeError.message)
        setInitialising(false)
        return
      }

      setChallengeId(challenge.id)
    } catch {
      setError('Failed to initialise 2FA verification.')
    }
    setInitialising(false)
  }, [router])

  useEffect(() => {
    initChallenge()
  }, [initChallenge])

  async function handleVerify() {
    if (!factorId || !challengeId || verifyCode.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode,
      })

      if (verifyError) {
        setError('Invalid code. Please check your authenticator app and try again.')
        setVerifyCode('')
        setLoading(false)

        // Create a new challenge for the next attempt
        const { data: newChallenge } = await supabase.auth.mfa.challenge({
          factorId,
        })
        if (newChallenge) {
          setChallengeId(newChallenge.id)
        }
        return
      }

      // Success — navigate to dashboard
      router.push('/dashboard')
    } catch {
      setError('Verification failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8 lg:hidden">
        <Logo size="md" variant="dark" />
        <p className="mt-1 text-sm text-muted-foreground">Your Complete Digital Bank</p>
      </div>

      <Card className="border-0 shadow-none lg:border lg:shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] lg:border-border">
        <CardHeader className="space-y-1 pb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/[0.08]">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl text-center">Two-Factor Verification</CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit code from your authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialising ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Preparing verification...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex justify-center">
                <Input
                  value={verifyCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setVerifyCode(val)
                    if (error) setError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && verifyCode.length === 6) handleVerify()
                  }}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  className="max-w-[220px] rounded-full text-center text-2xl tracking-[0.35em] font-mono"
                  autoFocus
                  aria-label="6-digit verification code"
                />
              </div>

              <Button
                className="w-full gap-1.5"
                onClick={handleVerify}
                disabled={verifyCode.length !== 6 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Having trouble?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  )
}
