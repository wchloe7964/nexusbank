import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}

const variantStyles = {
  default: {
    border: 'border-l-[#00AEEF]',
    icon: 'text-[#00AEEF] bg-[#00AEEF]/8',
    trend: 'text-muted-foreground',
  },
  success: {
    border: 'border-l-[#00703C]',
    icon: 'text-[#00703C] bg-[#00703C]/8 dark:text-emerald-400 dark:bg-emerald-400/10',
    trend: 'text-[#00703C] dark:text-emerald-400',
  },
  warning: {
    border: 'border-l-[#F47738]',
    icon: 'text-[#F47738] bg-[#F47738]/8 dark:text-amber-400 dark:bg-amber-400/10',
    trend: 'text-[#F47738] dark:text-amber-400',
  },
  destructive: {
    border: 'border-l-[#D4351C]',
    icon: 'text-[#D4351C] bg-[#D4351C]/8 dark:text-red-400 dark:bg-red-400/10',
    trend: 'text-[#D4351C] dark:text-red-400',
  },
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', className }: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={cn(
      'rounded-lg border border-border bg-card p-4 border-l-[3px] transition-colors',
      styles.border,
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground leading-none">{title}</p>
          <p className="text-[22px] font-bold tracking-tight text-foreground leading-none mt-2">{value}</p>
          {trend && (
            <p className={cn('text-[11px] font-medium mt-1', styles.trend)}>
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-lg p-2 shrink-0', styles.icon)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}
