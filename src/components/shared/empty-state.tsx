import { cn } from '@/lib/utils/cn'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="mb-5 rounded-2xl bg-gradient-to-br from-muted to-muted/60 p-5 shadow-xs">
        <Icon className="h-8 w-8 text-muted-foreground/70" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
