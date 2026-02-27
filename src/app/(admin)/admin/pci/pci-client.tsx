'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { StatCard } from '@/components/admin/stat-card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Key, Eye, Lock } from 'lucide-react'
import type { PciAccessLog, CardToken } from '@/lib/types/pci'

interface PciClientProps {
  accessLog: PciAccessLog[]
  logTotal: number
  logPage: number
  logPageSize: number
  logTotalPages: number
  activeTokens: CardToken[]
  tokenCount: number
  accessType: string
}

const accessTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    card_view: 'Card View',
    card_create: 'Card Create',
    card_update: 'Card Update',
    card_freeze: 'Card Freeze',
    card_cancel: 'Card Cancel',
    token_create: 'Token Create',
    token_revoke: 'Token Revoke',
    pan_access: 'PAN Access',
  }
  return labels[type] || type
}

export function PciClient({
  accessLog, logTotal, logPage, logPageSize, logTotalPages,
  activeTokens, tokenCount, accessType,
}: PciClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTokens, setShowTokens] = useState(false)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== 'all') params.set(key, value)
        else params.delete(key)
      }
      if (!('page' in updates)) params.delete('page')
      router.push(`/admin/pci?${params.toString()}`)
    },
    [router, searchParams]
  )

  const logColumns: Column<PciAccessLog>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => <span className="text-[11px] font-mono text-muted-foreground">#{row.id}</span>,
    },
    {
      key: 'access_type',
      label: 'Access Type',
      render: (row) => {
        const isPan = row.access_type === 'pan_access'
        return <Badge variant={isPan ? 'destructive' : 'secondary'}>{accessTypeLabel(row.access_type)}</Badge>
      },
    },
    {
      key: 'actor_role',
      label: 'Actor',
      render: (row) => (
        <div className="text-[12px]">
          <span className="text-muted-foreground">{row.actor_role || 'system'}</span>
          {row.actor_id && <p className="text-[10px] font-mono text-muted-foreground/60">{row.actor_id.slice(0, 8)}</p>}
        </div>
      ),
    },
    {
      key: 'card_id',
      label: 'Card/Token',
      render: (row) => (
        <span className="text-[11px] font-mono text-muted-foreground">
          {row.card_id ? `card:${row.card_id.slice(0, 8)}` : row.token_id ? `tok:${row.token_id.slice(0, 8)}` : '\u2014'}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
      render: (row) => <span className="text-[12px] text-muted-foreground truncate max-w-[200px] block">{row.reason || '\u2014'}</span>,
    },
    {
      key: 'ip_address',
      label: 'IP',
      render: (row) => <span className="text-[11px] font-mono text-muted-foreground">{row.ip_address || '\u2014'}</span>,
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      sortable: true,
      render: (row) => (
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {new Date(row.created_at).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
          })}
        </span>
      ),
    },
  ]

  const selectClass = "rounded-md border border-border/60 bg-background px-3 py-1.5 text-[13px] outline-none focus:border-[#00AEEF]/40 focus:ring-1 focus:ring-[#00AEEF]/10"

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Access Events" value={logTotal.toLocaleString()} icon={Eye} />
        <StatCard title="Active Tokens" value={tokenCount} icon={Key} variant="success" />
        <StatCard title="Cards Managed" value={activeTokens.length > 0 ? 'Active' : 'None'} icon={CreditCard} />
        <StatCard title="Compliance" value="PCI-DSS L1" icon={Lock} variant="success" />
      </div>

      {/* Token Inventory Toggle */}
      <button onClick={() => setShowTokens(!showTokens)} className="text-[13px] text-[#00AEEF] hover:underline font-medium">
        {showTokens ? 'Hide' : 'Show'} Active Token Inventory ({tokenCount})
      </button>

      {showTokens && activeTokens.length > 0 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Token</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last 4</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expires</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {activeTokens.map((t) => (
                <tr key={t.id} className="border-b border-border/20">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{t.token.slice(0, 20)}...</td>
                  <td className="px-4 py-2.5"><Badge variant="secondary">{t.token_type}</Badge></td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">****{t.last_four}</td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{t.expires_at ? new Date(t.expires_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}</td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Access Log */}
      <DataTable
        columns={logColumns}
        data={accessLog}
        total={logTotal}
        page={logPage}
        pageSize={logPageSize}
        totalPages={logTotalPages}
        onPageChange={(p) => updateParams({ page: String(p) })}
        emptyIcon={Lock}
        emptyTitle="No PCI access events"
        emptyDescription="Card data access events will be logged here."
        filters={
          <select value={accessType} onChange={(e) => updateParams({ accessType: e.target.value })} className={selectClass}>
            <option value="all">All Access Types</option>
            <option value="card_view">Card View</option>
            <option value="card_create">Card Create</option>
            <option value="card_update">Card Update</option>
            <option value="card_freeze">Card Freeze</option>
            <option value="card_cancel">Card Cancel</option>
            <option value="token_create">Token Create</option>
            <option value="token_revoke">Token Revoke</option>
            <option value="pan_access">PAN Access</option>
          </select>
        }
      />
    </div>
  )
}
