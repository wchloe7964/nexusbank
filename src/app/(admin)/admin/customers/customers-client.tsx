'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { Users, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import type { CustomerListItem } from '@/lib/types'

interface CustomersClientProps {
  data: CustomerListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  search: string
  role: string
}

export function CustomersClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  search,
  role,
}: CustomersClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      if (!('page' in updates)) {
        params.delete('page')
      }
      router.push(`/admin/customers?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<CustomerListItem>[] = [
    {
      key: 'membership_number',
      label: 'Member ID',
      render: (row) => (
        <span className="text-[12px] font-mono text-muted-foreground">
          {row.membership_number || '\u2014'}
        </span>
      ),
    },
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <Link
            href={`/admin/customers/${row.id}`}
            className="text-[13px] font-medium text-[#00AEEF] hover:underline"
          >
            {row.full_name}
          </Link>
          <p className="text-[11px] text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'phone_number',
      label: 'Phone',
      render: (row) => (
        <span className="text-[13px] text-muted-foreground">{row.phone_number || '\u2014'}</span>
      ),
    },
    {
      key: 'city',
      label: 'Location',
      render: (row) => (
        <span className="text-[13px] text-muted-foreground">
          {[row.city, row.postcode].filter(Boolean).join(', ') || '\u2014'}
        </span>
      ),
    },
    {
      key: 'security_score',
      label: 'Security',
      render: (row) => {
        const score = row.security_score ?? 0
        const variant = score >= 80 ? 'success' : score >= 50 ? 'warning' : 'destructive'
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant={variant}>{score}%</Badge>
            {row.two_factor_enabled && (
              <ShieldCheck className="h-3.5 w-3.5 text-[#00703C] dark:text-emerald-400" />
            )}
          </div>
        )
      },
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <Badge variant={row.role === 'admin' || row.role === 'super_admin' ? 'destructive' : 'secondary'}>
          {row.role.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-muted-foreground">
          {new Date(row.created_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
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
      searchValue={search}
      searchPlaceholder="Search by name, email or member ID..."
      onSearch={(query) => updateParams({ search: query })}
      onPageChange={(p) => updateParams({ page: String(p) })}
      emptyIcon={Users}
      emptyTitle="No customers found"
      emptyDescription="Try adjusting your search or filters."
      filters={
        <select
          value={role}
          onChange={(e) => updateParams({ role: e.target.value })}
          className={selectClass}
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      }
    />
  )
}
