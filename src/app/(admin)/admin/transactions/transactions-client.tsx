'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { DataTable, type Column } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'
import { formatGBP } from '@/lib/utils/currency'
import Link from 'next/link'
import type { Transaction } from '@/lib/types'

type TransactionRow = Transaction & { account?: { user_id: string; account_name: string } }

interface TransactionsClientProps {
  data: TransactionRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  search: string
  category: string
  type: string
  status: string
}

export function TransactionsClient({
  data,
  total,
  page,
  pageSize,
  totalPages,
  search,
  category,
  type,
  status,
}: TransactionsClientProps) {
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
      router.push(`/admin/transactions?${params.toString()}`)
    },
    [router, searchParams]
  )

  const columns: Column<TransactionRow>[] = [
    {
      key: 'transaction_date',
      label: 'Date',
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-muted-foreground whitespace-nowrap">
          {new Date(row.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'account',
      label: 'Customer / Account',
      render: (row) => (
        <div>
          {row.account?.user_id ? (
            <Link href={`/admin/customers/${row.account.user_id}`} className="text-[#00AEEF] hover:underline text-[13px] font-medium">
              {row.account.account_name}
            </Link>
          ) : (
            <span className="text-[13px] text-muted-foreground">Unknown</span>
          )}
        </div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="text-[13px] font-medium">{row.description}</span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <Badge variant="secondary">{row.category}</Badge>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <Badge variant={row.type === 'credit' ? 'success' : 'default'}>
          {row.type}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      className: 'text-right',
      render: (row) => (
        <span className={`text-[13px] font-medium tabular-nums ${row.type === 'credit' ? 'text-[#00703C] dark:text-emerald-400' : ''}`}>
          {row.type === 'credit' ? '+' : '-'}{formatGBP(row.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'completed' ? 'success' :
            row.status === 'pending' ? 'warning' :
            row.status === 'failed' ? 'destructive' : 'secondary'
          }
        >
          {row.status}
        </Badge>
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
      searchPlaceholder="Search description, counterparty..."
      onSearch={(query) => updateParams({ search: query })}
      onPageChange={(p) => updateParams({ page: String(p) })}
      emptyIcon={History}
      emptyTitle="No transactions found"
      emptyDescription="Try adjusting your filters."
      filters={
        <div className="flex items-center gap-2 flex-wrap">
          <select value={category} onChange={(e) => updateParams({ category: e.target.value })} className={selectClass}>
            <option value="all">All Categories</option>
            <option value="transfer">Transfer</option>
            <option value="salary">Salary</option>
            <option value="bills">Bills</option>
            <option value="groceries">Groceries</option>
            <option value="shopping">Shopping</option>
            <option value="transport">Transport</option>
            <option value="entertainment">Entertainment</option>
            <option value="dining">Dining</option>
            <option value="other">Other</option>
          </select>
          <select value={type} onChange={(e) => updateParams({ type: e.target.value })} className={selectClass}>
            <option value="all">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
          <select value={status} onChange={(e) => updateParams({ status: e.target.value })} className={selectClass}>
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      }
    />
  )
}
