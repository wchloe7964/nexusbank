'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { adminNavigationGroups } from '@/lib/constants/admin-navigation'
import type { AdminNavGroup } from '@/lib/constants/admin-navigation'
import { cn } from '@/lib/utils/cn'
import { ChevronDown, ChevronLeft, LogOut, ShieldCheck } from 'lucide-react'
import { LogoMark } from '@/components/brand/logo'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/lib/types'

interface AdminSidebarProps {
  userName?: string
  role?: UserRole
}

export function AdminSidebar({ userName, role }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
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

  const initials = userName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col glass-sidebar border-r border-[#0a1525] transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[252px]'
      )}
    >
      {/* Header — Bank Logo + Admin identifier */}
      <div className={cn(
        'flex h-[56px] items-center border-b border-white/[0.06]',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <LogoMark size="sm" variant="white" />
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-white leading-none">NexusBank</span>
              <span className="text-[10px] text-[#00AEEF] font-medium tracking-wide leading-none mt-0.5">ADMIN PORTAL</span>
            </div>
          </div>
        )}
        {collapsed && (
          <LogoMark size="sm" variant="white" />
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 hover:bg-white/[0.06] transition-colors"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-white/40" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 rounded p-1 hover:bg-white/[0.06] transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-white/40 rotate-180" />
        </button>
      )}

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-2 mt-3 pb-2">
        {adminNavigationGroups.map((group, groupIndex) => (
          <AdminSidebarGroup
            key={group.label || `group-${groupIndex}`}
            group={group}
            groupIndex={groupIndex}
            pathname={pathname}
            collapsed={collapsed}
            manualOpen={manualOpen[group.label] ?? null}
            onToggle={() => toggleGroup(group.label)}
          />
        ))}
      </nav>

      {/* Footer — User info + Sign out */}
      <div className="border-t border-white/[0.06] px-2 py-2.5 mt-auto">
        {!collapsed && userName && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-1">
            <div className="h-7 w-7 rounded-md bg-[#00395D] flex items-center justify-center text-[10px] font-bold text-[#00AEEF]">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/80 truncate leading-none">{userName}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-2.5 w-2.5 text-[#00AEEF]/60" />
                <p className="text-[10px] text-white/40 capitalize leading-none">{role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[12px] font-medium text-white/35 hover:bg-white/[0.04] hover:text-white/60 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

function AdminSidebarGroup({
  group,
  groupIndex,
  pathname,
  collapsed,
  manualOpen,
  onToggle,
}: {
  group: AdminNavGroup
  groupIndex: number
  pathname: string
  collapsed: boolean
  manualOpen: boolean | null
  onToggle: () => void
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
        collapsed ? (
          <div className="mx-2 my-2 border-t border-white/[0.06]" />
        ) : group.collapsible && group.label ? (
          <button
            onClick={onToggle}
            className="mt-4 mb-1 px-2.5 w-full flex items-center justify-between group/label"
          >
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors',
              hasActiveChild ? 'text-white/40' : 'text-white/25 group-hover/label:text-white/35'
            )}>
              {group.label}
            </span>
            <ChevronDown
              className={cn(
                'h-3 w-3 transition-transform duration-200',
                hasActiveChild ? 'text-white/30' : 'text-white/15 group-hover/label:text-white/25',
                !isOpen && '-rotate-90'
              )}
            />
          </button>
        ) : group.label ? (
          <p className="mt-4 mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/25">
            {group.label}
          </p>
        ) : (
          <div className="mx-2 my-2 border-t border-white/[0.06]" />
        )
      )}

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
                'flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150 relative',
                isActive
                  ? 'bg-[#00AEEF]/10 text-[#00AEEF] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-4 before:w-[2px] before:rounded-full before:bg-[#00AEEF]'
                  : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70'
              )}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <item.icon className={cn(
                'h-[16px] w-[16px] shrink-0 transition-colors',
                isActive ? 'text-[#00AEEF]' : ''
              )} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
