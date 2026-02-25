'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { navigationGroups } from '@/lib/constants/navigation'
import type { NavGroup } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils/cn'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ChevronDown, LogOut } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { createClient } from '@/lib/supabase/client'
import { useState, useCallback } from 'react'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [manualOpen, setManualOpen] = useState<Record<string, boolean | null>>({})

  const toggleGroup = useCallback((label: string) => {
    setManualOpen((prev) => {
      const current = prev[label]
      if (current === false) return { ...prev, [label]: true }
      return { ...prev, [label]: false }
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Sheet open={open} onClose={onClose} side="left">
      <SheetHeader>
        <SheetTitle>
          <Logo size="sm" variant="dark" />
        </SheetTitle>
      </SheetHeader>

      <nav className="mt-2 px-3 overflow-y-auto pb-20">
        {navigationGroups.map((group, groupIndex) => (
          <MobileNavGroup
            key={group.label}
            group={group}
            groupIndex={groupIndex}
            pathname={pathname}
            manualOpen={manualOpen[group.label] ?? null}
            onToggle={() => toggleGroup(group.label)}
            onClose={onClose}
          />
        ))}
      </nav>

      <div className="absolute bottom-6 left-0 right-0 px-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sign out</span>
        </button>
      </div>
    </Sheet>
  )
}

function MobileNavGroup({
  group,
  groupIndex,
  pathname,
  manualOpen,
  onToggle,
  onClose,
}: {
  group: NavGroup
  groupIndex: number
  pathname: string
  manualOpen: boolean | null
  onToggle: () => void
  onClose: () => void
}) {
  const hasActiveChild = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  const isOpen = group.collapsible
    ? manualOpen !== null ? manualOpen : hasActiveChild
    : true

  return (
    <div>
      {groupIndex > 0 && (
        group.collapsible ? (
          <button
            onClick={onToggle}
            className="mt-5 mb-1 px-3 w-full flex items-center justify-between group/label"
          >
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-widest transition-colors',
              hasActiveChild ? 'text-muted-foreground/70' : 'text-muted-foreground/50 group-hover/label:text-muted-foreground/60'
            )}>
              {group.label}
            </span>
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-200',
                hasActiveChild ? 'text-muted-foreground/60' : 'text-muted-foreground/30 group-hover/label:text-muted-foreground/40',
                !isOpen && '-rotate-90'
              )}
            />
          </button>
        ) : (
          <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            {group.label}
          </p>
        )
      )}

      <div
        className={cn(
          'space-y-0.5 overflow-hidden transition-all duration-200',
          group.collapsible && !isOpen && 'max-h-0 opacity-0',
          (!group.collapsible || isOpen) && 'max-h-[500px] opacity-100',
        )}
      >
        {group.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-primary')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
