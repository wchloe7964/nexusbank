'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (row: T) => React.ReactNode
  className?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = any

interface DataTableProps<T = AnyRow> {
  columns: Column<T>[]
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  searchValue?: string
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  onPageChange?: (page: number) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  isLoading?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  filters?: React.ReactNode
}

export function DataTable<T = AnyRow>({
  columns,
  data,
  total,
  page,
  pageSize,
  totalPages,
  searchValue = '',
  searchPlaceholder = 'Search...',
  onSearch,
  onPageChange,
  onSort,
  isLoading,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No results found',
  emptyDescription = 'Try adjusting your search or filters.',
  filters,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: string) => {
    const newDir = sortKey === key && sortDir === 'desc' ? 'asc' : 'desc'
    setSortKey(key)
    setSortDir(newDir)
    onSort?.(key, newDir)
  }

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 bg-muted/20">
        {onSearch && (
          <div className="flex items-center gap-2 rounded-md bg-background px-3 py-1.5 border border-border/60 focus-within:border-[#00AEEF]/40 focus-within:ring-1 focus-within:ring-[#00AEEF]/10 transition-all">
            <Search className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
            <input
              type="text"
              defaultValue={searchValue}
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              className="bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/40 w-full sm:w-56"
            />
          </div>
        )}
        {filters && <div className="flex items-center gap-2">{filters}</div>}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: pageSize }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20">
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-2.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0
                ? (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <EmptyIcon className="h-8 w-8 text-muted-foreground/25" />
                        <p className="text-[13px] font-medium text-muted-foreground">{emptyTitle}</p>
                        <p className="text-[11px] text-muted-foreground/60">{emptyDescription}</p>
                      </div>
                    </td>
                  </tr>
                )
                : data.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      'border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors',
                      rowIndex % 2 === 1 && 'bg-muted/15'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-2.5', col.className)}>
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? '\u2014'}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/60 bg-muted/10">
          <p className="text-[11px] text-muted-foreground">
            Showing <span className="font-medium text-foreground">{from}</span>&ndash;<span className="font-medium text-foreground">{to}</span> of <span className="font-medium text-foreground">{total.toLocaleString()}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 text-[11px] text-muted-foreground font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
