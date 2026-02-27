"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationGroups } from "@/lib/constants/navigation";
import type { NavGroup } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, ChevronLeft, LogOut } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function useGroupOpen(group: NavGroup, pathname: string) {
  const hasActiveChild = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );
  return hasActiveChild;
}

interface SidebarProps {
  userName?: string;
}

export function Sidebar({ userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Track which collapsible groups are manually toggled
  // null = follow auto-open logic (open if active child), true/false = manual override
  const [manualOpen, setManualOpen] = useState<Record<string, boolean | null>>(
    {},
  );

  const toggleGroup = useCallback((label: string) => {
    setManualOpen((prev) => {
      const current = prev[label];
      // If currently null (auto) or true, close it. If false, open it.
      if (current === false) return { ...prev, [label]: true };
      return { ...prev, [label]: false };
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col glass-sidebar text-sidebar-foreground border-r border-white/[0.06] transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && <Logo variant="white" size="sm" />}
        {collapsed && (
          <div className="mx-auto">
            <LogoMark size="sm" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-lg p-1.5 hover:bg-white/10 transition-colors",
            collapsed && "mx-auto mt-2",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <ChevronLeft
            className={cn(
              "h-4 w-4 text-white/50 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex-1 overflow-y-auto px-3 mt-2 pb-2">
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
              <p className="text-sm font-medium text-white/80 truncate">
                {userName}
              </p>
              <p className="text-[10px] text-white/40">Personal Account</p>
            </div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40 hover:bg-white/[0.06] hover:text-white/70 transition-all duration-200">
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

function SidebarGroup({
  group,
  groupIndex,
  pathname,
  collapsed,
  manualOpen,
  onToggle,
}: {
  group: NavGroup;
  groupIndex: number;
  pathname: string;
  collapsed: boolean;
  manualOpen: boolean | null;
  onToggle: () => void;
}) {
  const hasActiveChild = useGroupOpen(group, pathname);

  // Logic remains locked as requested
  const isOpen = group.collapsible
    ? manualOpen !== null
      ? manualOpen
      : hasActiveChild
    : true;

  return (
    <div className="flex flex-col">
      {/* Group Header */}
      {groupIndex > 0 &&
        (collapsed ? (
          <div className="mx-4 my-4 border-t border-white/5" />
        ) : (
          <button
            onClick={group.collapsible ? onToggle : undefined}
            disabled={!group.collapsible}
            className={cn(
              "mt-6 mb-2 px-3 flex items-center justify-between w-full group/label transition-opacity",
              !group.collapsible && "cursor-default",
            )}>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 group-hover/label:text-white/50 transition-colors">
              {group.label}
            </span>
            {group.collapsible && (
              <ChevronDown
                className={cn(
                  "h-3 w-3 text-white/20 transition-transform duration-300 ease-out",
                  isOpen ? "rotate-0" : "-rotate-90",
                )}
              />
            )}
          </button>
        ))}

      {/* Smooth Height Transition Container */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isOpen || collapsed
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}>
        <div className="overflow-hidden space-y-1">
          {group.items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.08] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white/80",
                )}
                aria-current={isActive ? "page" : undefined}>
                <div className="relative">
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-all duration-300",
                      isActive
                        ? "text-primary scale-110"
                        : "group-hover:text-white/70",
                    )}
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
                  )}
                </div>

                {/* Label: Standard when open, Tooltip when collapsed */}
                {!collapsed ? (
                  <span className="truncate flex-1">{item.label}</span>
                ) : (
                  <div className="invisible fixed left-[72px] z-50 ml-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-1">
                    <div className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xl border border-white/10 whitespace-nowrap backdrop-blur-md">
                      {item.label}
                      {/* Optional: Tooltip Arrow */}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-[4px] border-y-transparent border-r-[4px] border-r-zinc-900" />
                    </div>
                  </div>
                )}

                {isActive && !collapsed && (
                  <div className="h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_#0066FF]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
