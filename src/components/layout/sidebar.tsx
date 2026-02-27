'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { navigationGroups } from '@/lib/constants/navigation'
import type { NavGroup } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils/cn'
import { ChevronDown, ChevronLeft, LogOut } from 'lucide-react'
import { Logo, LogoMark } from '@/components/brand/logo'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function useGroupOpen(group: NavGroup, pathname: string) {
  const hasActiveChild = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )
  return hasActiveChild
}

interface SidebarProps {
  userName?: string
}

export function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  // Track which collapsible groups are manually toggled
  // null = follow auto-open logic (open if active child), true/false = manual override
  const [manualOpen, setManualOpen] = useState<Record<string, boolean | null>>({})

  const toggleGroup = useCallback((label: string) => {
    setManualOpen((prev) => {
      const current = prev[label]
      // If currently null (auto) or true, close it. If false, open it.
      if (current === false) return { ...prev, [label]: true }
      return { ...prev, [label]: false }
    })
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col glass-sidebar text-sidebar-foreground border-r border-white/[0.06] transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <Logo variant="white" size="sm" />
        )}
        {collapsed && (
          <div className="mx-auto">
            <LogoMark size="sm" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'rounded-lg p-1.5 hover:bg-white/10 transition-colors',
            collapsed && 'mx-auto mt-2'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={cn('h-4 w-4 text-white/50 transition-transform duration-300', collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 mt-2 pb-2">
        {navigationGroups.map((group, groupIndex) => (
          <SidebarGroup
            key={group.label}
            group={group}
            groupIndex={groupIndex}
            pathname={pathname}
            collapsed={collapsed}
            manualOpen={manualOpen[group.label] ?? null}
            onToggle={() => toggleGroup(group.label)}
          />
        ))}
      </nav>

      {/* User profile + Sign out */}
      <div className="border-t border-white/[0.08] px-3 py-3 mt-auto">
        {!collapsed && userName && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{userName}</p>
              <p className="text-[10px] text-white/40">Personal Account</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

function SidebarGroup({
  group,
  groupIndex,
  pathname,
  collapsed,
  manualOpen,
  onToggle,
}: {
  group: NavGroup
  groupIndex: number
  pathname: string
  collapsed: boolean
  manualOpen: boolean | null
  onToggle: () => void
}) {
  const hasActiveChild = useGroupOpen(group, pathname)

  // Determine if group is open
  const isOpen = group.collapsible
    ? manualOpen !== null ? manualOpen : hasActiveChild
    : true // non-collapsible groups are always open

  return (
    <div>
      {/* Group separator / label */}
      {groupIndex > 0 && (
        collapsed ? (
          <div className="mx-3 my-3 border-t border-white/10" />
        ) : group.collapsible ? (
          <button
            onClick={onToggle}
            className="mt-5 mb-1 px-3 w-full flex items-center justify-between group/label"
          >
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-widest transition-colors',
              hasActiveChild ? 'text-white/50' : 'text-white/30 group-hover/label:text-white/40'
            )}>
              {group.label}
            </span>
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-200',
                hasActiveChild ? 'text-white/40' : 'text-white/20 group-hover/label:text-white/30',
                !isOpen && '-rotate-90'
              )}
            />
          </button>
        ) : (
          <p className="mt-5 mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            {group.label}
          </p>
        )
      )}

      {/* Group items */}
      <div
        className={cn(
          'space-y-0.5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          group.collapsible && !collapsed && !isOpen && 'max-h-0 opacity-0',
          (!group.collapsible || collapsed || isOpen) && 'max-h-[500px] opacity-100',
        )}
      >
        {group.items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative',
                isActive
                  ? 'bg-white/[0.1] text-white font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-primary'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
              )}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <item.icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive && 'text-primary drop-shadow-[0_0_6px_rgba(0,102,255,0.4)]')} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
