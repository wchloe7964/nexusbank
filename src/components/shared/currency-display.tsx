import { formatGBP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'

interface CurrencyDisplayProps {
  amount: number
  className?: string
  showSign?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function CurrencyDisplay({ amount, className, showSign, size = 'md' }: CurrencyDisplayProps) {
  const isNegative = amount < 0
  const formatted = formatGBP(Math.abs(amount))

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold',
    xl: 'text-3xl font-bold',
  }

  return (
    <span
      className={cn(
        sizeClasses[size],
        showSign && isNegative && 'text-destructive',
        showSign && !isNegative && 'text-success',
        className
      )}
    >
      {showSign && !isNegative && '+'}
      {isNegative && '-'}
      {formatted}
    </span>
  )
}
