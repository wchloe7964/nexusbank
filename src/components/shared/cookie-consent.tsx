'use client'

import { useState, useEffect } from 'react'
import { Cookie, Shield, Settings } from 'lucide-react'
import { CookiePreferencesModal } from './cookie-preferences-modal'

const STORAGE_KEY = 'nexusbank-cookie-consent'

interface CookieConsent {
  consent: 'all' | 'necessary'
  timestamp: string
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable (e.g. private browsing) — show banner
      setVisible(true)
    }
  }, [])

  function handleConsent(type: 'all' | 'necessary') {
    const value: CookieConsent = {
      consent: type,
      timestamp: new Date().toISOString(),
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Silently fail if storage is unavailable
    }

    setVisible(false)
  }

  // When modal closes after saving, also dismiss the banner
  function handlePreferencesClose() {
    setPreferencesOpen(false)
    setVisible(false)
  }

  return (
    <>
      {visible && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 animate-slide-up"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="border-t border-border bg-card shadow-lg">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:px-8">
              {/* Text */}
              <div className="flex items-start gap-3 sm:items-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Cookie className="h-4 w-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  We use cookies to improve your experience.{' '}
                  <button
                    onClick={() => setPreferencesOpen(true)}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Cookie Policy
                  </button>{' '}
                  for details.
                </p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => setPreferencesOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-muted"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Manage
                </button>
                <button
                  onClick={() => handleConsent('necessary')}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-transparent px-4 text-sm font-medium text-foreground transition-colors hover:border-primary hover:bg-muted"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Necessary only
                </button>
                <button
                  onClick={() => handleConsent('all')}
                  className="inline-flex h-9 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      <CookiePreferencesModal
        open={preferencesOpen}
        onClose={handlePreferencesClose}
      />
    </>
  )
}
