'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { ScrollText, ShieldCheck, Eye, KeyRound, CreditCard, FileCheck, AlertTriangle } from 'lucide-react'
import type { AuditEvent, AuditStats } from '@/lib/types/audit'

interface AuditClientProps {
  data: AuditEvent[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  stats: AuditStats
  eventType: string
  targetTable: string
  search: string
}

const eventTypeVariant = (type: string) => {
  switch (type) {
    case 'admin_action': return 'destructive'
    case 'data_access': return 'default'
    case 'data_change': return 'warning'
    case 'auth_event': return 'secondary'
    case 'payment_event': return 'success'
    case 'compliance_event': return 'default'
    case 'fraud_event': return 'destructive'
    default: return 'secondary'
  }
}

export function AuditClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  stats,
  eventType,
  targetTable,
  search,
}: AuditClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/audit?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<AuditEvent>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => (
        <span className="text-[11px] font-mono text-muted-foreground">#{row.id}</span>
      ),
    },
    {
      key: 'event_type',
      label: 'Type',
      render: (row) => (
        <Badge variant={eventTypeVariant(row.event_type) as 'default' | 'secondary' | 'success' | 'warning' | 'destructive'}>
          {row.event_type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <span className="text-[13px] font-medium">{row.action}</span>
      ),
    },
    {
      key: 'target_table',
      label: 'Target',
      render: (row) => (
        <div className="text-[12px]">
          {row.target_table ? (
            <>
              <span className="font-mono text-muted-foreground">{row.target_table}</span>
              {row.target_id && (
                <span className="text-muted-foreground/60 ml-1">#{row.target_id.slice(0, 8)}</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground">{'\u2014'}</span>
          )}
        </div>
      ),
    },
    {
      key: 'actor_role',
      label: 'Actor',
      render: (row) => (
        <div className="text-[12px]">
          <span className="text-muted-foreground">{row.actor_role || 'system'}</span>
          {row.actor_id && (
            <p className="text-[11px] font-mono text-muted-foreground/60">{row.actor_id.slice(0, 8)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'ip_address',
      label: 'IP',
      render: (row) => (
        <span className="text-[11px] font-mono text-muted-foreground">{row.ip_address || '\u2014'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard title="Total Events" value={stats.total_events.toLocaleString()} icon={ScrollText} />
        <StatCard title="Admin Actions" value={stats.admin_actions.toLocaleString()} icon={ShieldCheck} variant="destructive" />
        <StatCard title="Data Access" value={stats.data_access.toLocaleString()} icon={Eye} />
        <StatCard title="Auth Events" value={stats.auth_events.toLocaleString()} icon={KeyRound} />
        <StatCard title="Payments" value={stats.payment_events.toLocaleString()} icon={CreditCard} variant="success" />
        <StatCard title="Compliance" value={stats.compliance_events.toLocaleString()} icon={FileCheck} />
        <StatCard title="Fraud" value={stats.fraud_events.toLocaleString()} icon={AlertTriangle} variant="warning" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        searchValue={search}
        searchPlaceholder="Search by action..."
        onSearch={(query) => updateParams({ search: query })}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={ScrollText}
        emptyTitle="No audit events found"
        emptyDescription="Audit events will appear here as the system is used."
        filters={
          <div className="flex items-center gap-2">
            <select
              value={eventType}
              onChange={(e) => updateParams({ eventType: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Types</option>
              <option value="data_access">Data Access</option>
              <option value="data_change">Data Change</option>
              <option value="admin_action">Admin Action</option>
              <option value="auth_event">Auth Event</option>
              <option value="payment_event">Payment Event</option>
              <option value="compliance_event">Compliance</option>
              <option value="fraud_event">Fraud</option>
            </select>
            <select
              value={targetTable}
              onChange={(e) => updateParams({ targetTable: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Tables</option>
              <option value="profiles">Profiles</option>
              <option value="accounts">Accounts</option>
              <option value="transactions">Transactions</option>
              <option value="disputes">Disputes</option>
              <option value="cards">Cards</option>
              <option value="payees">Payees</option>
              <option value="scheduled_payments">Payments</option>
            </select>
          </div>
        }
      />
    </div>
  )
}
