"use client";

import { Bell, ChevronDown, Search, User } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TopbarProps {
  userName: string;
  unreadCount?: number;
}

export function Topbar({ userName, unreadCount = 0 }: TopbarProps) {
  return (
    <header
      role="banner"
      className="flex h-14 items-center justify-between bg-white dark:bg-card px-4 lg:px-6 sticky top-0 z-30 lg:h-16 lg:border-b lg:border-border/50 lg:glass-strong">
      {/* ── Mobile Header: avatar left · name centre · bell right ── */}
      <div className="relative flex w-full items-center lg:hidden">
        {/* Left — Generic person avatar */}
        <Link href="/settings" className="shrink-0 z-10">
          <User
            className="h-[22px] w-[22px] text-[#0676b6]"
            strokeWidth={1.0}
          />
        </Link>

        {/* Centre — Customer name */}
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[16px] text-[#0676b6] truncate max-w-[200px]">
            {userName}
          </span>
        </span>

        {/* Right — Notification bell only */}
        <div className="ml-auto shrink-0 z-10">
          <Link href="/notifications">
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
              aria-label={
                unreadCount > 0
                  ? `Notifications — ${unreadCount} unread`
                  : "Notifications"
              }>
              <Bell
                className="h-[19px] w-[19px] text-[#0676b6]"
                strokeWidth={1.0}
              />
              {unreadCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </Link>
        </div>
      </div>

      {/* ── Desktop Header: search bar · notifications · avatar ── */}
      <div className="hidden lg:flex items-center gap-2.5 rounded-full bg-muted/60 px-4 py-2.5 border border-border/50 focus-within:border-primary/40 focus-within:bg-card focus-within:shadow-sm focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300">
        <Search className="h-4 w-4 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search transactions, payees..."
          aria-label="Search transactions and payees"
          className="bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 w-64"
        />
      </div>

      <div className="hidden lg:flex items-center gap-2">
        <ThemeToggle />

        <Link href="/notifications">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notifications — ${unreadCount} unread`
                : "Notifications"
            }>
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-pulse-gentle shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </Link>

        {/* Desktop: avatar on right */}
        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border/50">
          <Avatar
            name={userName}
            size="sm"
            className="cursor-pointer ring-2 ring-primary/10 hover:ring-primary/30 transition-all"
          />
          <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
        </div>
      </div>
    </header>
  );
}
