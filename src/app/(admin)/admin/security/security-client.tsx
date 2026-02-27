'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import type { LoginActivity } from '@/lib/types'

type ActivityRow = LoginActivity & { profile?: { full_name: string; email: string } }

interface SecurityClientProps {
  data: ActivityRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  eventType: string
  suspicious: string
}

export function SecurityClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  eventType,
  suspicious,
}: SecurityClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all' && value !== '') {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/security?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<ActivityRow>[] = [
    {
      key: 'profile',
      label: 'User',
      render: (row) => (
        <div>
          <Link href={`/admin/customers/${row.user_id}`} className="text-[#00AEEF] hover:underline text-[13px] font-medium">
            {row.profile?.full_name || 'Unknown'}
          </Link>
          <p className="text-[11px] text-muted-foreground">{row.profile?.email}</p>
        </div>
      ),
    },
    {
      key: 'event_type',
      label: 'Event',
      render: (row) => (
        <Badge
          variant={
            row.event_type === 'login_failed' || row.event_type === 'suspicious_activity'
              ? 'destructive'
              : row.event_type === 'password_changed' || row.event_type === 'two_factor_enabled'
                ? 'warning'
                : 'secondary'
          }
        >
          {row.event_type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP Address',
      render: (row) => (
        <span className="text-[12px] font-mono text-muted-foreground">{row.ip_address || '\u2014'}</span>
      ),
    },
    {
      key: 'device_type',
      label: 'Device',
      render: (row) => (
        <div className="text-[12px] text-muted-foreground">
          <p>{row.device_type}</p>
          {row.browser && <p className="text-[10px] text-muted-foreground/60">{row.browser}</p>}
        </div>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">{row.location || '\u2014'}</span>
      ),
    },
    {
      key: 'is_suspicious',
      label: 'Flagged',
      render: (row) =>
        row.is_suspicious ? (
          <Badge variant="destructive">Suspicious</Badge>
        ) : (
          <span className="text-[12px] text-muted-foreground">\u2014</span>
        ),
    },
    {
      key: 'created_at',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <DataTable
      columns={columns}
      data={data}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      onPageChange={(p) => updateParams({ page: String(p) })}
      emptyIcon={Shield}
      emptyTitle="No activity found"
      emptyDescription="No login events match the current filter."
      filters={
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={eventType}
            onChange={(e) => updateParams({ eventType: e.target.value })}
            className={selectClass}
          >
            <option value="all">All Events</option>
            <option value="login_success">Login Success</option>
            <option value="login_failed">Login Failed</option>
            <option value="logout">Logout</option>
            <option value="password_changed">Password Changed</option>
            <option value="two_factor_enabled">2FA Enabled</option>
            <option value="two_factor_disabled">2FA Disabled</option>
            <option value="profile_updated">Profile Updated</option>
            <option value="suspicious_activity">Suspicious Activity</option>
          </select>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={suspicious === 'true'}
              onChange={(e) => updateParams({ suspicious: e.target.checked ? 'true' : '' })}
              className="rounded border-border accent-[#00AEEF]"
            />
            <span className="text-muted-foreground">Suspicious only</span>
          </label>
        </div>
      }
    />
  )
}
