import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const cardVariants = cva(
  'rounded-xl border text-card-foreground transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-border bg-card shadow-xs',
        raised: 'border-border/50 bg-card shadow-sm hover:shadow-md',
        elevated: 'border-transparent bg-card shadow-md',
        glass: 'border-white/20 glass',
        ghost: 'border-transparent bg-transparent shadow-none',
      },
      interactive: {
        true: 'cursor-pointer hover-lift',
        false: '',
      },
      accent: {
        none: '',
        primary: 'border-l-[3px] border-l-primary',
        success: 'border-l-[3px] border-l-success',
        warning: 'border-l-[3px] border-l-warning',
        destructive: 'border-l-[3px] border-l-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
      interactive: false,
      accent: 'none',
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ className, variant, interactive, accent, ...props }: CardProps) {
  return (
    <div
      className={cn(cardVariants({ variant, interactive, accent }), className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
}
