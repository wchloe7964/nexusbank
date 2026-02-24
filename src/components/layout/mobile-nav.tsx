'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { navigation } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils/cn'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { LogOut } from 'lucide-react'
import { Logo } from '@/components/brand/logo'
import { createClient } from '@/lib/supabase/client'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()

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

      <nav className="mt-4 space-y-0.5 px-3">
        {navigation.map((item) => {
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
