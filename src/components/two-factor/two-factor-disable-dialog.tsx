'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateTwoFactorEnabled } from '@/app/(dashboard)/settings/actions'
import { Dialog, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, AlertCircle, Loader2, ShieldOff } from 'lucide-react'

interface TwoFactorDisableDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TwoFactorDisableDialog({ open, onClose, onSuccess }: TwoFactorDisableDialogProps) {
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleOpenChange() {
    setVerifyCode('')
    setError(null)
    setLoading(false)
    onClose()
  }

  async function handleDisable() {
    if (verifyCode.length !== 6) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get the active TOTP factor
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()

      if (listError) {
        setError(listError.message)
        setLoading(false)
        return
      }

      const totpFactor = factors?.totp?.[0]

      if (!totpFactor) {
        setError('No active 2FA factor found.')
        setLoading(false)
        return
      }

      // Challenge and verify the code first
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      })

      if (challengeError) {
        setError(challengeError.message)
        setLoading(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code: verifyCode,
      })

      if (verifyError) {
        setError('Invalid code. Please check your authenticator app and try again.')
        setVerifyCode('')
        setLoading(false)
        return
      }

      // Code valid — now unenroll the factor
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id,
      })

      if (unenrollError) {
        setError(unenrollError.message)
        setLoading(false)
        return
      }

      // Persist to database
      await updateTwoFactorEnabled(false)

      onSuccess()
      onClose()
    } catch {
      setError('Failed to disable 2FA. Please try again.')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onClose={handleOpenChange} title="Disable Two-Factor Authentication">
      <div className="space-y-5">
        {/* Warning */}
        <div className="rounded-lg bg-warning/10 border border-warning/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">This will reduce your account security</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Removing two-factor authentication means your account will only be protected by your password. We strongly recommend keeping 2FA enabled.
            </p>
          </div>
        </div>

        <DialogDescription>
          Enter your current authenticator code to confirm disabling 2FA.
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
              if (e.key === 'Enter' && verifyCode.length === 6) handleDisable()
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
          <Button variant="outline" className="rounded-full" onClick={handleOpenChange}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-full gap-1.5"
            onClick={handleDisable}
            disabled={verifyCode.length !== 6 || loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
            {loading ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
