'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { verifyScaChallenge } from '@/lib/sca/sca-service'

interface ScaDialogProps {
  challengeId: string
  expiresAt: string
  onVerified: () => void
  onCancel: () => void
  title?: string
  description?: string
}

export function ScaDialog({
  challengeId,
  expiresAt,
  onVerified,
  onCancel,
  title = 'Security Verification',
  description = 'Enter the 6-digit code sent to your registered device to authorise this action.',
}: ScaDialogProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(remaining)
    }
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyScaChallenge(challengeId, code)
      if (result.verified) {
        onVerified()
      } else {
        setError(result.error || 'Verification failed')
        setCode('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const isExpired = secondsLeft <= 0
  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-sm mx-4 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#00AEEF]/10">
            <ShieldCheck className="h-5 w-5 text-[#00AEEF]" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[13px] font-medium text-foreground">Verification Code</label>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                setCode(val)
                setError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6) handleVerify()
              }}
              placeholder="000000"
              disabled={isExpired || isVerifying}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-center text-[24px] font-mono tracking-[0.5em] outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]/10 disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-500 font-medium">{error}</p>
          )}

          <div className="text-center">
            {isExpired ? (
              <p className="text-[12px] text-red-500 font-medium">Code expired. Please cancel and try again.</p>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                Code expires in{' '}
                <span className="font-mono font-medium text-foreground">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </p>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground/60 text-center">
            For demo purposes, check the server console for the verification code.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isVerifying}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleVerify}
            disabled={isVerifying || isExpired || code.length !== 6}
            className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Verifying...
              </>
            ) : (
              'Verify'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
