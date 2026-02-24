'use client'

import { Bell, Search } from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TopbarProps {
  userName: string
  unreadCount?: number
}

export function Topbar({ userName, unreadCount = 0 }: TopbarProps) {
  return (
    <header role="banner" className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      {/* Mobile: user name centred */}
      <div className="flex items-center gap-3 lg:hidden">
        <Avatar name={userName} size="sm" />
        <span className="text-sm font-semibold truncate max-w-[180px]">{userName}</span>
      </div>

      {/* Desktop: search bar */}
      <div className="hidden lg:flex items-center gap-2.5 rounded-full bg-muted px-4 py-2.5 border border-border">
        <Search className="h-4 w-4 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search transactions, payees..."
          aria-label="Search transactions and payees"
          className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 w-64"
        />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Desktop: avatar on right */}
        <div className="hidden lg:block ml-1 pl-2 border-l border-border">
          <Avatar name={userName} size="sm" className="cursor-pointer" />
        </div>
      </div>
    </header>
  )
}
