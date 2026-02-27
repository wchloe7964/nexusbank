import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
}

export function Progress({ value, max = 100, className, indicatorClassName }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-muted/80', className)}
    >
      <div
        className={cn('h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-out', indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
