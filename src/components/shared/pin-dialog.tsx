'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Lock, Loader2, CheckCircle } from 'lucide-react'
import { setTransferPin, verifyTransferPin } from '@/lib/pin/pin-service'

// ─── PIN Entry (user has a PIN) ──────────────────────────────────────────────

interface PinEntryProps {
  onVerified: (pin: string) => void
  onCancel: () => void
  title?: string
  description?: string
}

export function PinEntryDialog({
  onVerified,
  onCancel,
  title = 'Enter Transfer PIN',
  description = 'Enter your 4-digit transfer PIN to authorise this payment.',
}: PinEntryProps) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)
    setError('')

    // Auto-advance to next
    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    // Auto-submit when all 4 entered
    if (digit && index === 3) {
      const pin = newDigits.join('')
      if (pin.length === 4) {
        handleVerify(pin)
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
    }
  }

  async function handleVerify(pin?: string) {
    const code = pin || digits.join('')
    if (code.length !== 4) {
      setError('Enter all 4 digits')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyTransferPin(code)
      if (result.verified) {
        onVerified(code)
      } else {
        setError(result.error || 'Incorrect PIN')
        setDigits(['', '', '', ''])
        inputRefs[0].current?.focus()
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-[320px] mx-4 space-y-5 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
            <p className="text-[12px] text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isVerifying}
              className="w-12 h-14 rounded-lg border-2 border-border bg-background text-center text-[22px] font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
          ))}
        </div>

        {error && (
          <p className="text-[12px] text-red-500 font-medium text-center">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isVerifying}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => handleVerify()}
            disabled={isVerifying || digits.join('').length !== 4}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Verifying...
              </>
            ) : (
              'Confirm'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── PIN Setup (first-time) ─────────────────────────────────────────────────

interface PinSetupProps {
  onComplete: () => void
  onCancel: () => void
}

export function PinSetupDialog({ onComplete, onCancel }: PinSetupProps) {
  const [step, setStep] = useState<'create' | 'confirm' | 'done'>('create')
  const [pin, setPin] = useState('')
  const [confirmDigits, setConfirmDigits] = useState(['', '', '', ''])
  const [createDigits, setCreateDigits] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const createRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]
  const confirmRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    createRefs[0].current?.focus()
  }, [])

  useEffect(() => {
    if (step === 'confirm') {
      confirmRefs[0].current?.focus()
    }
  }, [step])

  function handleCreateChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...createDigits]
    newDigits[index] = digit
    setCreateDigits(newDigits)
    setError('')

    if (digit && index < 3) {
      createRefs[index + 1].current?.focus()
    }

    if (digit && index === 3) {
      const full = newDigits.join('')
      if (full.length === 4) {
        setPin(full)
        setTimeout(() => setStep('confirm'), 150)
      }
    }
  }

  function handleCreateKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !createDigits[index] && index > 0) {
      createRefs[index - 1].current?.focus()
      const newDigits = [...createDigits]
      newDigits[index - 1] = ''
      setCreateDigits(newDigits)
    }
  }

  function handleConfirmChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...confirmDigits]
    newDigits[index] = digit
    setConfirmDigits(newDigits)
    setError('')

    if (digit && index < 3) {
      confirmRefs[index + 1].current?.focus()
    }

    if (digit && index === 3) {
      const full = newDigits.join('')
      if (full.length === 4) {
        handleSave(full)
      }
    }
  }

  function handleConfirmKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !confirmDigits[index] && index > 0) {
      confirmRefs[index - 1].current?.focus()
      const newDigits = [...confirmDigits]
      newDigits[index - 1] = ''
      setConfirmDigits(newDigits)
    }
  }

  async function handleSave(confirmPin: string) {
    if (confirmPin !== pin) {
      setError('PINs do not match. Please try again.')
      setConfirmDigits(['', '', '', ''])
      confirmRefs[0].current?.focus()
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const result = await setTransferPin(pin)
      if (result.success) {
        setStep('done')
        setTimeout(() => onComplete(), 1200)
      } else {
        setError(result.error || 'Failed to save PIN')
      }
    } catch {
      setError('Failed to save PIN. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-card border border-border rounded-lg shadow-lg p-6 w-full max-w-[360px] mx-4 space-y-5 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-foreground">Set Up Transfer PIN</h3>
            <p className="text-[12px] text-muted-foreground mt-1">
              {step === 'create' && 'Create a 4-digit PIN to authorise payments and transfers.'}
              {step === 'confirm' && 'Re-enter your PIN to confirm.'}
              {step === 'done' && 'Your transfer PIN has been set up successfully.'}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-2">
            <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 'create' ? 'bg-primary' : 'bg-primary'}`} />
            <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        )}

        {/* Create step */}
        {step === 'create' && (
          <div className="flex justify-center gap-3">
            {createDigits.map((digit, i) => (
              <input
                key={i}
                ref={createRefs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCreateChange(i, e.target.value)}
                onKeyDown={(e) => handleCreateKeyDown(i, e)}
                className="w-12 h-14 rounded-lg border-2 border-border bg-background text-center text-[22px] font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            ))}
          </div>
        )}

        {/* Confirm step */}
        {step === 'confirm' && (
          <div className="flex justify-center gap-3">
            {confirmDigits.map((digit, i) => (
              <input
                key={i}
                ref={confirmRefs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleConfirmChange(i, e.target.value)}
                onKeyDown={(e) => handleConfirmKeyDown(i, e)}
                disabled={isSaving}
                className="w-12 h-14 rounded-lg border-2 border-border bg-background text-center text-[22px] font-bold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
            ))}
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div className="flex justify-center py-2">
            <div className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 p-3">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-[12px] text-red-500 font-medium text-center">{error}</p>
        )}

        {/* Actions */}
        {step !== 'done' && (
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={step === 'confirm' ? () => {
                setStep('create')
                setCreateDigits(['', '', '', ''])
                setConfirmDigits(['', '', '', ''])
                setPin('')
                setError('')
              } : onCancel}
              disabled={isSaving}
            >
              {step === 'confirm' ? 'Back' : 'Cancel'}
            </Button>
            {step === 'create' && (
              <p className="text-[11px] text-muted-foreground">Choose a PIN you&apos;ll remember</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
