import { getAdminDashboardStats, getRecentSignups, getRecentSuspiciousActivity } from '@/lib/queries/admin'
import { AdminDashboardClient } from './admin-dashboard-client'

export default async function AdminDashboardPage() {
  const [stats, recentSignups, suspiciousActivity] = await Promise.all([
    getAdminDashboardStats(),
    getRecentSignups(10),
    getRecentSuspiciousActivity(10),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">Bank-wide overview and key performance indicators</p>
      </div>
      <AdminDashboardClient
        stats={stats}
        recentSignups={recentSignups}
        suspiciousActivity={suspiciousActivity}
      />
    </div>
  )
}
