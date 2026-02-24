'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateTwoFactorEnabled } from '@/app/(dashboard)/settings/actions'
import { Dialog, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Smartphone, CheckCircle, AlertCircle, Copy, Check, Loader2, ShieldCheck } from 'lucide-react'

interface TwoFactorSetupDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type Step = 'qr' | 'verify' | 'success'

export function TwoFactorSetupDialog({ open, onClose, onSuccess }: TwoFactorSetupDialogProps) {
  const [step, setStep] = useState<Step>('qr')
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [copied, setCopied] = useState(false)

  // Enroll on dialog open
  useEffect(() => {
    if (!open) return

    // Reset state for fresh enrollment
    setStep('qr')
    setFactorId(null)
    setQrCode('')
    setSecret('')
    setVerifyCode('')
    setError(null)
    setLoading(false)
    setCopied(false)

    const enroll = async () => {
      setEnrolling(true)
      try {
        const supabase = createClient()

        // Check if user already has a verified TOTP factor
        const { data: factors } = await supabase.auth.mfa.listFactors()
        if (factors?.totp && factors.totp.length > 0) {
          setError('You already have 2FA enabled. Please disable it first before re-enrolling.')
          setEnrolling(false)
          return
        }

        // Clean up any unverified factors from previous attempts (found in the `all` array)
        const unverifiedTotp = factors?.all?.filter(
          (f) => f.factor_type === 'totp' && f.status === 'unverified'
        ) ?? []
        for (const f of unverifiedTotp) {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }

        const { data, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: 'totp',
          friendlyName: 'NexusBank Authenticator',
        })

        if (enrollError) {
          setError(enrollError.message)
          setEnrolling(false)
          return
        }

        if (data) {
          setFactorId(data.id)
          setQrCode(data.totp.qr_code)
          setSecret(data.totp.secret)
        }
      } catch {
        setError('Failed to start 2FA setup. Please try again.')
      }
      setEnrolling(false)
    }

    enroll()
  }, [open])

  // Cleanup unverified factor on close
  const handleClose = useCallback(async () => {
    if (step !== 'success' && factorId) {
      try {
        const supabase = createClient()
        await supabase.auth.mfa.unenroll({ factorId })
      } catch {
        // Silently ignore — unverified factors are inactive anyway
      }
    }
    onClose()
  }, [step, factorId, onClose])

  async function handleVerify() {
    if (!factorId || verifyCode.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError) {
        setError(challengeError.message)
        setLoading(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      })

      if (verifyError) {
        setError('Invalid code. Please check your authenticator app and try again.')
        setVerifyCode('')
        setLoading(false)
        return
      }

      // Persist to database
      await updateTwoFactorEnabled(true)

      setStep('success')
    } catch {
      setError('Verification failed. Please try again.')
    }
    setLoading(false)
  }

  function handleCopySecret() {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDone() {
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} title={step === 'success' ? undefined : 'Set Up Two-Factor Authentication'}>
      {/* Step 1: QR Code */}
      {step === 'qr' && (
        <div className="space-y-5">
          <DialogDescription>
            Scan the QR code below with your authenticator app (Google Authenticator, Authy, etc.)
          </DialogDescription>

          {enrolling ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating QR code...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          ) : (
            <>
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="rounded-xl border-2 border-border bg-white p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="Scan this QR code with your authenticator app" className="h-48 w-48" />
                </div>
              </div>

              {/* Manual Secret */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Can&apos;t scan? Enter this code manually:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-muted px-3 py-2.5 font-mono text-xs tracking-wider break-all select-all">
                    {secret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={handleCopySecret}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="rounded-full gap-1.5"
              onClick={() => { setError(null); setStep('verify') }}
              disabled={!qrCode || enrolling}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Next
            </Button>
          </DialogFooter>
        </div>
      )}

      {/* Step 2: Verify */}
      {step === 'verify' && (
        <div className="space-y-5">
          <DialogDescription>
            Enter the 6-digit code from your authenticator app to complete setup.
          </DialogDescription>

          <div className="flex justify-center">
            <Input
              value={verifyCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setVerifyCode(val)
                setError(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && verifyCode.length === 6) handleVerify()
              }}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              className="max-w-[200px] rounded-full text-center text-2xl tracking-[0.35em] font-mono"
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => { setStep('qr'); setError(null); setVerifyCode('') }}>
              Back
            </Button>
            <Button
              className="rounded-full gap-1.5"
              onClick={handleVerify}
              disabled={verifyCode.length !== 6 || loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              {loading ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </DialogFooter>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 'success' && (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="rounded-full bg-success/10 p-4">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Two-Factor Authentication Enabled</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Your account is now protected with an extra layer of security. You&apos;ll need your authenticator app each time you sign in.
            </p>
          </div>
          <DialogFooter className="w-full">
            <Button className="rounded-full w-full" onClick={handleDone}>
              Done
            </Button>
          </DialogFooter>
        </div>
      )}
    </Dialog>
  )
}
