import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { ArrowLeft } from 'lucide-react'

const legalNav = [
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Complaints', href: '/complaints' },
]

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-white dark:bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 lg:px-8">
          <Link href="/" aria-label="NexusBank Home">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      {/* ── Legal navigation ───────────────────────────────────────────── */}
      <nav className="border-b border-border/40 bg-[#f8f8f8] dark:bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-2 -mx-1 scrollbar-none">
            {legalNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/[0.06] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 lg:px-8 py-10 lg:py-14">
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="footer-dark">
        <div className="mx-auto max-w-5xl px-4 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <Logo size="sm" variant="white" />
              <p className="mt-3 text-xs text-white/40 leading-relaxed max-w-md">
                NexusBank Ltd is authorised by the Prudential Regulation Authority and
                regulated by the Financial Conduct Authority and the Prudential Regulation
                Authority (Financial Services Register number: 000000). Registered in
                England and Wales (Company No. 00000000). Registered office: 1 Nexus
                Square, London, EC2A 1BB.
              </p>
              <p className="mt-2 text-xs text-white/40 leading-relaxed max-w-md">
                Your eligible deposits are protected up to £85,000 by the Financial
                Services Compensation Scheme.
              </p>
            </div>

            <div className="shrink-0">
              <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">
                Legal
              </h4>
              <ul className="space-y-1.5">
                {legalNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/20">
              &copy; {new Date().getFullYear()} NexusBank Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
