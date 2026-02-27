'use client'

import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { Users, Wallet, UserPlus, ShieldAlert, AlertCircle, CreditCard, ArrowUpRight, Clock } from 'lucide-react'
import { formatGBP } from '@/lib/utils/currency'
import type { AdminDashboardStats, Profile, LoginActivity } from '@/lib/types'
import Link from 'next/link'

interface AdminDashboardClientProps {
  stats: AdminDashboardStats
  recentSignups: Profile[]
  suspiciousActivity: LoginActivity[]
}

export function AdminDashboardClient({ stats, recentSignups, suspiciousActivity }: AdminDashboardClientProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards — 4 across on desktop, data-dense */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={stats.total_customers.toLocaleString()}
          icon={Users}
        />
        <StatCard
          title="Total Deposits"
          value={formatGBP(stats.total_deposits)}
          icon={Wallet}
          variant="success"
        />
        <StatCard
          title="Active Accounts"
          value={stats.total_accounts.toLocaleString()}
          icon={CreditCard}
        />
        <StatCard
          title="Open Disputes"
          value={stats.open_disputes.toLocaleString()}
          icon={AlertCircle}
          variant={stats.open_disputes > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="New Signups (30d)"
          value={stats.new_signups_30d.toLocaleString()}
          icon={UserPlus}
        />
        <StatCard
          title="Flagged Activity (30d)"
          value={stats.flagged_activity_30d.toLocaleString()}
          icon={ShieldAlert}
          variant={stats.flagged_activity_30d > 0 ? 'destructive' : 'default'}
        />
      </div>

      {/* Two-column: Recent Signups + Flagged Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Signups */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#00AEEF]" />
              <h3 className="text-[13px] font-semibold text-foreground">Recent Signups</h3>
            </div>
            <Link href="/admin/customers" className="text-[11px] text-[#00AEEF] hover:underline flex items-center gap-0.5">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentSignups.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-muted-foreground text-center">No recent signups</p>
            ) : (
              recentSignups.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/admin/customers/${profile.id}`}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md bg-[#00395D]/10 flex items-center justify-center text-[10px] font-bold text-[#00395D] dark:bg-[#00AEEF]/10 dark:text-[#00AEEF]">
                      {profile.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground leading-none">{profile.full_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Flagged Activity */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-[#D4351C]" />
              <h3 className="text-[13px] font-semibold text-foreground">Flagged Security Events</h3>
            </div>
            <Link href="/admin/security" className="text-[11px] text-[#00AEEF] hover:underline flex items-center gap-0.5">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {suspiciousActivity.length === 0 ? (
              <p className="px-4 py-8 text-[13px] text-muted-foreground text-center">No flagged events</p>
            ) : (
              suspiciousActivity.map((event) => (
                <div key={event.id} className="flex items-center justify-between px-4 py-2.5">
                  <div>
                    <p className="text-[13px] font-medium text-foreground leading-none">
                      {event.event_type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {event.ip_address || 'Unknown IP'} &middot; {event.device_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">Flagged</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
