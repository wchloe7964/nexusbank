import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { RegulatoryFooter } from '@/components/auth/regulatory-footer'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50/80 dark:bg-background">
      {/* Top header bar */}
      <header className="border-b border-border/60 bg-white dark:bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
          <Link href="/">
            <Logo size="md" variant="dark" />
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Need help?</span>
            <Link
              href="/complaints"
              className="text-primary font-medium hover:underline"
            >
              Contact us
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl px-5 py-8 lg:py-10">
          {children}
        </div>
      </main>

      {/* Regulatory footer */}
      <div className="mx-auto w-full max-w-3xl px-5">
        <RegulatoryFooter />
      </div>
    </div>
  )
}
