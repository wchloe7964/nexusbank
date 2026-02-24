'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { bottomNavItems, navigation } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils/cn'
import { LogOut, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [moreOpen, setMoreOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Items shown in the "More" drawer — exclude those already in bottom nav
  const bottomHrefs = new Set(bottomNavItems.map((i) => i.href))
  const moreItems = navigation.filter((item) => !bottomHrefs.has(item.href))

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary lg:hidden">
        <div className="flex items-stretch pb-safe">
          {bottomNavItems.map((item) => {
            const isMore = item.href === '#more'
            const isActive = !isMore && (
              pathname === item.href || pathname.startsWith(item.href + '/')
            )

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-white/60 transition-colors',
                    moreOpen && 'text-white',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors',
                  isActive ? 'text-white' : 'text-white/60',
                )}
              >
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* "More" Drawer (slides up from bottom) */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-2xl bg-card shadow-[0_-8px_30px_rgba(0,0,0,0.15)] animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <h3 className="text-base font-semibold">More</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="px-3 py-2 space-y-0.5">
              {moreItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-primary')} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Sign Out */}
            <div className="border-t border-border px-3 py-2 pb-safe">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted transition-all"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
