'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Lock } from 'lucide-react'

const STORAGE_KEY = 'nexusbank-cookie-preferences'

export interface CookiePreferences {
  strictlyNecessary: boolean // always true
  performance: boolean
  targeting: boolean
  functionality: boolean
  timestamp: string
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  strictlyNecessary: true,
  performance: false,
  targeting: false,
  functionality: false,
  timestamp: '',
}

function getStoredPreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // ignore
  }
  return null
}

interface CookiePreferencesModalProps {
  open: boolean
  onClose: () => void
}

export function CookiePreferencesModal({ open, onClose }: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES)

  // Load stored preferences on open
  useEffect(() => {
    if (open) {
      const stored = getStoredPreferences()
      if (stored) {
        setPreferences(stored)
      } else {
        setPreferences(DEFAULT_PREFERENCES)
      }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleToggle = useCallback((key: keyof Omit<CookiePreferences, 'strictlyNecessary' | 'timestamp'>) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }, [])

  function handleSave() {
    const toSave: CookiePreferences = {
      ...preferences,
      strictlyNecessary: true,
      timestamp: new Date().toISOString(),
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      // Also update the old consent banner key so it doesn't reappear
      localStorage.setItem('nexusbank-cookie-consent', JSON.stringify({
        consent: toSave.performance && toSave.targeting && toSave.functionality ? 'all' : 'necessary',
        timestamp: toSave.timestamp,
      }))
    } catch {
      // silently fail
    }
    onClose()
  }

  if (!open) return null

  const categories = [
    {
      key: 'strictlyNecessary' as const,
      label: 'Strictly necessary',
      locked: true,
      description:
        'Data collected in this category is essential to provide our services to you. The data is necessary for the website to operate and to maintain your security and privacy while using the website. Data is not used for marketing purposes, or for the purposes covered by the other three categories below. These strictly necessary cookies are always on, as without this data, the services you\'ve asked for can\'t be provided.',
    },
    {
      key: 'performance' as const,
      label: 'Performance',
      locked: false,
      description:
        'Data collected in this category is used to inform us how the website is used, improve how our website works and to help us to identify issues you may have when using our services. This data is not used to target you with online advertising.',
    },
    {
      key: 'targeting' as const,
      label: 'Targeting',
      locked: false,
      description:
        'Data collected in this category is used to help make our messages more relevant to you. The data is shared with other NexusBank systems or with third parties, such as advertisers and social media platforms we may use to deliver personalised advertisements and messages. If you don\'t wish to consent to this category, it\'s important to note that you may still receive generic advertising or service messages, but they will be less relevant to you.',
    },
    {
      key: 'functionality' as const,
      label: 'Functionality & Profile',
      locked: false,
      description:
        'Data collected in this category enables the website to remember choices you make. This means a more personalised experience for features of the website that can be customised. It may also be used to provide services you\'ve asked for, such as watching a video, or commenting on a blog.',
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Data preferences"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Data preferences</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Intro */}
        <div className="border-b border-gray-100 px-6 py-4">
          <p className="text-sm leading-relaxed text-gray-600">
            The types of cookies used on this website fall into one of four categories. Please indicate
            the categories you wish to consent to using the toggles below and then click
            &ldquo;Save preferences&rdquo; to retain your preferences for future visits.
          </p>
        </div>

        {/* Scrollable categories */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          <div className="divide-y divide-gray-100">
            {categories.map((cat) => {
              const isOn = cat.key === 'strictlyNecessary' ? true : preferences[cat.key]

              return (
                <div key={cat.key} className="py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{cat.label}</h3>
                      {cat.locked && (
                        <Lock className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </div>

                    {/* Toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isOn}
                      aria-label={`${cat.label} cookies`}
                      disabled={cat.locked}
                      onClick={() => {
                        if (!cat.locked && cat.key !== 'strictlyNecessary') {
                          handleToggle(cat.key)
                        }
                      }}
                      className={`
                        relative inline-flex h-6 w-11 shrink-0 items-center rounded-full
                        transition-colors duration-200 ease-in-out focus-visible:outline-none
                        focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                        ${cat.locked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
                        ${isOn ? 'bg-[#00aeef]' : 'bg-gray-300'}
                      `}
                    >
                      <span
                        className={`
                          inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0
                          transition-transform duration-200 ease-in-out
                          ${isOn ? 'translate-x-[22px]' : 'translate-x-[3px]'}
                        `}
                      />
                    </button>
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    {cat.description}
                  </p>

                  {cat.locked && (
                    <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                      Always on
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-[#00aeef] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#009bd6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  )
}
