import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        success: 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
        warning: 'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
        destructive: 'border-transparent bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
        outline: 'text-foreground border-border',
        glow: 'border-transparent bg-primary/10 text-primary shadow-[0_0_8px_rgba(0,102,255,0.15)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
