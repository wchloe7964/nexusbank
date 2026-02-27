import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div>
        <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-display">{title}</h1>
        {description && <p className="mt-1 lg:mt-1.5 text-[13px] lg:text-sm text-muted-foreground leading-relaxed">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
