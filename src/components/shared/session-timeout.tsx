'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Clock, LogOut } from 'lucide-react'

const TIMEOUT_DURATION = 300_000 // 5 minutes in ms
const WARNING_BEFORE = 60_000   // 60 seconds before timeout

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/accounts',
  '/transfers',
  '/payments',
  '/transactions',
  '/cards',
  '/payees',
  '/notifications',
  '/settings',
]

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'keydown',
  'click',
  'scroll',
  'touchstart',
]

export function SessionTimeout() {
  const router = useRouter()
  const pathname = usePathname()

  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(60)

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expireTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  )

  const signOut = useCallback(async () => {
    // Clean up all timers before signing out
    clearAllTimers()
    setShowWarning(false)

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Proceed to login regardless of sign-out result
    }

    router.push('/login?message=Session expired due to inactivity')
  }, [router])

  const clearAllTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current)
      warningTimerRef.current = null
    }
    if (expireTimerRef.current) {
      clearTimeout(expireTimerRef.current)
      expireTimerRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  const startTimers = useCallback(() => {
    clearAllTimers()
    lastActivityRef.current = Date.now()

    // Timer to show the warning dialog
    warningTimerRef.current = setTimeout(() => {
      setSecondsLeft(Math.round(WARNING_BEFORE / 1000))
      setShowWarning(true)

      // Start the visible countdown
      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Countdown reached zero — sign out
            signOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Hard expiry backup timer
      expireTimerRef.current = setTimeout(() => {
        signOut()
      }, WARNING_BEFORE)
    }, TIMEOUT_DURATION - WARNING_BEFORE)
  }, [clearAllTimers, signOut])

  const handleActivity = useCallback(() => {
    // Debounce: ignore activity within 1 second of last event
    const now = Date.now()
    if (now - lastActivityRef.current < 1000) return
    lastActivityRef.current = now

    // If the warning is visible, ignore activity (user must click "Continue Session")
    if (showWarning) return

    startTimers()
  }, [showWarning, startTimers])

  const handleContinueSession = useCallback(() => {
    setShowWarning(false)
    setSecondsLeft(60)
    startTimers()
  }, [startTimers])

  // Attach / detach activity listeners
  useEffect(() => {
    if (!isProtectedRoute) return

    startTimers()

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearAllTimers()
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [isProtectedRoute, handleActivity, startTimers, clearAllTimers])

  // Don't render anything on non-protected routes
  if (!isProtectedRoute) return null

  return (
    <Dialog
      open={showWarning}
      onClose={handleContinueSession}
      title="Session Expiring"
    >
      <div className="flex flex-col items-center gap-5 py-2">
        {/* Countdown ring */}
        <div className="relative flex h-20 w-20 items-center justify-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-muted/50"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - secondsLeft / 60)}`}
              className="text-warning transition-all duration-1000 ease-linear"
            />
          </svg>
          <Clock className="h-6 w-6 text-warning" />
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Your session will expire in
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
            {secondsLeft}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {secondsLeft === 1 ? 'second' : 'seconds'}
            </span>
          </p>
        </div>

        <DialogDescription className="text-center">
          For your security, we&apos;ll sign you out after a period of
          inactivity. Click below to continue your session.
        </DialogDescription>
      </div>

      <DialogFooter>
        <button
          onClick={signOut}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-muted"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
        <button
          onClick={handleContinueSession}
          className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue Session
        </button>
      </DialogFooter>
    </Dialog>
  )
}
