"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { bottomNavItems, navigationGroups } from "@/lib/constants/navigation";
import type { NavGroup } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import { ChevronDown, LogOut, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState<Record<string, boolean | null>>(
    {},
  );

  const toggleGroup = useCallback((label: string) => {
    setManualOpen((prev) => {
      const current = prev[label];
      if (current === false) return { ...prev, [label]: true };
      return { ...prev, [label]: false };
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Build grouped "More" items — exclude hrefs already shown in the bottom tab bar
  const bottomHrefs = useMemo(
    () => new Set(bottomNavItems.map((i) => i.href)),
    [],
  );
  const moreGroups = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !bottomHrefs.has(item.href)),
        }))
        .filter((group) => group.items.length > 0),
    [bottomHrefs],
  );

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0676b6] lg:hidden">
        <div className="flex items-stretch pb-safe">
          {bottomNavItems.map((item) => {
            const isMore = item.href === "#more";
            const isActive =
              !isMore &&
              (pathname === item.href || pathname.startsWith(item.href + "/"));

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-white/50 transition-colors",
                    moreOpen && "text-white",
                  )}>
                  <item.icon className="h-[22px] w-[22px]" strokeWidth={1.6} />
                  <span className="text-[9px] font-medium text-center">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors relative",
                  isActive ? "text-white" : "text-white/50",
                )}>
                {isActive && (
                  <span className="absolute top-0.5 h-[3px] w-8 rounded-full bg-white" />
                )}
                <item.icon
                  className={cn(
                    "h-[22px] w-[22px]",
                    isActive ? "stroke-[2.2]" : "stroke-[1.6]",
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] text-center",
                    isActive ? "font-bold" : "font-medium",
                  )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* "More" Drawer (slides up from bottom) */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setMoreOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] max-h-[80vh] rounded-t-3xl glass-strong border-t border-border/50 shadow-xl animate-slide-up flex flex-col">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-base font-semibold">More</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Grouped Nav Items */}
            <nav className="px-3 py-2 overflow-y-auto flex-1">
              {moreGroups.map((group, groupIndex) => (
                <MoreDrawerGroup
                  key={group.label}
                  group={group}
                  groupIndex={groupIndex}
                  pathname={pathname}
                  manualOpen={manualOpen[group.label] ?? null}
                  onToggle={() => toggleGroup(group.label)}
                  onClose={() => setMoreOpen(false)}
                />
              ))}
            </nav>

            {/* Sign Out */}
            <div className="border-t border-border px-3 py-2 pb-safe">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
                <LogOut className="h-[18px] w-[18px]" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MoreDrawerGroup({
  group,
  groupIndex,
  pathname,
  manualOpen,
  onToggle,
  onClose,
}: {
  group: NavGroup;
  groupIndex: number;
  pathname: string;
  manualOpen: boolean | null;
  onToggle: () => void;
  onClose: () => void;
}) {
  const hasActiveChild = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
  );

  const isOpen = group.collapsible
    ? manualOpen !== null
      ? manualOpen
      : hasActiveChild
    : true;

  const showLabel = groupIndex > 0 || group.label !== "Overview";

  return (
    <div>
      {showLabel &&
        (group.collapsible ? (
          <button
            onClick={onToggle}
            className={cn(
              "px-3 w-full flex items-center justify-between group/label",
              groupIndex > 0 ? "mt-4 mb-1" : "mb-1",
            )}>
            <span
              className={cn(
                "text-[10px] font-semibold tracking-widest transition-colors",
                hasActiveChild
                  ? "text-muted-foreground/70"
                  : "text-muted-foreground/50 group-hover/label:text-muted-foreground/60",
              )}>
              {group.label}
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                hasActiveChild
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground/30 group-hover/label:text-muted-foreground/40",
                !isOpen && "-rotate-90",
              )}
            />
          </button>
        ) : (
          <p
            className={cn(
              "px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50",
              groupIndex > 0 ? "mt-4 mb-1" : "mb-1",
            )}>
            {group.label}
          </p>
        ))}

      <div
        className={cn(
          "space-y-0.5 overflow-hidden transition-all duration-200",
          group.collapsible && !isOpen && "max-h-0 opacity-0",
          (!group.collapsible || isOpen) && "max-h-[500px] opacity-100",
        )}>
        {group.items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted",
              )}>
              <item.icon
                className={cn("h-[18px] w-[18px]", isActive && "text-primary")}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
