'use client'

import Link from 'next/link'
import { ShieldAlert, AlertTriangle, Clock, XCircle, ChevronRight, Fingerprint } from 'lucide-react'
import type { KycProfileStatus } from '@/lib/types'

interface KycBannerProps {
  status: KycProfileStatus
  variant?: 'full' | 'compact' | 'mobile'
}

const KYC_CONFIG: Record<
  string,
  {
    icon: typeof ShieldAlert
    title: string
    description: string
    mobileDescription: string
    cta: string
    bg: string
    text: string
    border: string
    mobileBg: string
    mobileAccent: string
    mobileIcon: typeof ShieldAlert
  }
> = {
  not_started: {
    icon: ShieldAlert,
    title: 'Verify your identity',
    description: 'Complete identity verification to unlock all features including transfers and payments.',
    mobileDescription: 'To protect your account and enable transfers, we need to verify who you are. It only takes a few minutes.',
    cta: 'Verify now',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-900/40',
    mobileBg: 'from-[#0676b6] to-[#045a8d]',
    mobileAccent: 'bg-white/20',
    mobileIcon: Fingerprint,
  },
  pending: {
    icon: Clock,
    title: 'Verification in progress',
    description: 'We are reviewing your documents. This usually takes up to 24 hours.',
    mobileDescription: "We're reviewing your documents. This usually takes up to 24 hours — we'll notify you once it's done.",
    cta: 'View status',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-800 dark:text-blue-200',
    border: 'border-blue-200 dark:border-blue-900/40',
    mobileBg: 'from-[#0676b6] to-[#045a8d]',
    mobileAccent: 'bg-white/20',
    mobileIcon: Clock,
  },
  failed: {
    icon: XCircle,
    title: 'Verification unsuccessful',
    description: 'Your identity verification was unsuccessful. Please resubmit your documents or contact support.',
    mobileDescription: 'We couldn\'t verify your identity. Please resubmit your documents or contact our support team for help.',
    cta: 'Try again',
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-800 dark:text-red-200',
    border: 'border-red-200 dark:border-red-900/40',
    mobileBg: 'from-red-600 to-red-700',
    mobileAccent: 'bg-white/20',
    mobileIcon: XCircle,
  },
  expired: {
    icon: AlertTriangle,
    title: 'Verification expired',
    description: 'Your identity verification has expired. Please re-verify to continue using all features.',
    mobileDescription: 'Your verification has expired. Re-verify your identity to continue making transfers and payments.',
    cta: 'Re-verify',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-800 dark:text-amber-200',
    border: 'border-amber-200 dark:border-amber-900/40',
    mobileBg: 'from-amber-600 to-amber-700',
    mobileAccent: 'bg-white/20',
    mobileIcon: AlertTriangle,
  },
}

export function KycBanner({ status, variant = 'full' }: KycBannerProps) {
  if (status === 'verified') return null

  const config = KYC_CONFIG[status]
  if (!config) return null

  const Icon = config.icon
  const MobileIcon = config.mobileIcon

  /* ── Mobile action card ──────────────────────────────────── */
  if (variant === 'mobile') {
    return (
      <Link href="/settings/verification" className="block">
        <div className={`rounded-2xl bg-gradient-to-br ${config.mobileBg} p-5 text-white overflow-hidden relative`}>
          {/* Decorative background circle */}
          <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/[0.07]" />
          <div className="absolute -bottom-4 -right-10 h-20 w-20 rounded-full bg-white/[0.05]" />

          <div className="relative flex items-start gap-4">
            <div className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl ${config.mobileAccent}`}>
              <MobileIcon className="h-5 w-5 text-white" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold leading-snug">{config.title}</p>
              <p className="mt-1 text-[12px] text-white/75 leading-relaxed">
                {config.mobileDescription}
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5">
                <span className="text-[12px] font-semibold text-white">{config.cta}</span>
                <ChevronRight className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  /* ── Compact (inline bar) ────────────────────────────────── */
  if (variant === 'compact') {
    return (
      <Link href="/settings/verification">
        <div className={`flex items-center gap-3 rounded-xl border ${config.border} ${config.bg} px-4 py-3`}>
          <Icon className={`h-4 w-4 shrink-0 ${config.text}`} />
          <span className={`text-xs font-medium flex-1 ${config.text}`}>{config.title}</span>
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${config.text} opacity-60`} />
        </div>
      </Link>
    )
  }

  /* ── Full (desktop) ──────────────────────────────────────── */
  return (
    <Link href="/settings/verification">
      <div className={`rounded-xl border ${config.border} ${config.bg} p-4`}>
        <div className="flex items-start gap-3">
          <div className={`shrink-0 rounded-lg p-2 ${config.bg}`}>
            <Icon className={`h-5 w-5 ${config.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${config.text}`}>{config.title}</p>
            <p className={`text-xs mt-0.5 ${config.text} opacity-80 leading-relaxed`}>{config.description}</p>
          </div>
          <ChevronRight className={`h-4 w-4 shrink-0 mt-1 ${config.text} opacity-60`} />
        </div>
      </div>
    </Link>
  )
}
