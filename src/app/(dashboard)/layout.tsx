import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { getProfile } from '@/lib/queries/profile'
import { getUnreadCount } from '@/lib/queries/notifications'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, unreadCount] = await Promise.all([
    getProfile(),
    getUnreadCount(),
  ])

  const userName = profile?.full_name || 'User'

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar userName={userName} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar userName={userName} unreadCount={unreadCount} />
        <main id="main-content" role="main" className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <div className="mx-auto max-w-6xl p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
