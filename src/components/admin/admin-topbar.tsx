'use client'

import { usePathname } from 'next/navigation'
import { Search } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'

interface AdminTopbarProps {
  userName: string
}

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/customers': 'Customers',
  '/admin/transactions': 'Transactions',
  '/admin/disputes': 'Disputes',
  '/admin/security': 'Security',
}

export function AdminTopbar({ userName }: AdminTopbarProps) {
  const pathname = usePathname()

  // Build breadcrumbs from path
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: { label: string; href?: string }[] = []

  if (segments.length >= 1) {
    breadcrumbs.push({ label: 'Admin', href: '/admin' })
  }
  if (segments.length >= 2 && segments[1] !== undefined) {
    const section = segments[1]
    const sectionPath = `/admin/${section}`
    breadcrumbs.push({
      label: breadcrumbMap[sectionPath] || section.charAt(0).toUpperCase() + section.slice(1),
      href: sectionPath,
    })
  }
  if (segments.length >= 3) {
    // Detail page — show truncated ID
    const id = segments[2]
    breadcrumbs.push({ label: id.length > 12 ? id.slice(0, 8) + '...' : id })
  }

  const initials = userName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header
      role="banner"
      className="flex h-[52px] items-center justify-between border-b border-border/60 bg-card px-5 sticky top-0 z-30"
    >
      {/* Left: Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[13px]">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground/40 mx-0.5">/</span>}
            {i < breadcrumbs.length - 1 ? (
              <a
                href={crumb.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </a>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right: Search + actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 border border-border/50 focus-within:border-primary/40 focus-within:bg-card transition-all">
          <Search className="h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search..."
            aria-label="Admin search"
            className="bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/40 w-48"
          />
        </div>

        <ThemeToggle />

        {/* Admin avatar */}
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border/50">
          <div className="h-7 w-7 rounded-md bg-[#00395D] flex items-center justify-center text-[10px] font-bold text-[#00AEEF]">
            {initials}
          </div>
          <span className="text-[12px] font-medium text-foreground hidden xl:block">{userName}</span>
        </div>
      </div>
    </header>
  )
}
