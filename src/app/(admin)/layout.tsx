import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { getProfile } from '@/lib/queries/profile'
import { redirect } from 'next/navigation'

// All admin pages are dynamic — they always need fresh data and auth checks
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()

  // Server-side role check — redundant with middleware but defense in depth
  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/dashboard')
  }

  const userName = profile.full_name || 'Admin'

  return (
    <div className="barclays-admin flex h-screen overflow-hidden bg-background">
      <AdminSidebar userName={userName} role={profile.role} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar userName={userName} />
        <main id="main-content" role="main" className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-[1440px] px-6 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
