import { cn } from '@/lib/utils/cn'

interface LogoProps {
  className?: string
  variant?: 'default' | 'white' | 'dark'
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { mark: 'h-7 w-7', text: 'text-[15px]', tagline: 'text-[10px]' },
  md: { mark: 'h-9 w-9', text: 'text-lg', tagline: 'text-xs' },
  lg: { mark: 'h-11 w-11', text: 'text-xl', tagline: 'text-xs' },
}

export function Logo({ className, variant = 'default', showWordmark = true, size = 'md' }: LogoProps) {
  const s = sizes[size]
  const textColor = variant === 'white' ? 'text-white' : variant === 'dark' ? 'text-foreground' : 'text-foreground'

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Logomark — stylised "N" formed by two interlocking shapes */}
      <svg
        className={s.mark}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="40" height="40" rx="10" fill="#0066FF" />
        <path
          d="M12 28V12h2.4l11.2 12.8V12H28v16h-2.4L14.4 15.2V28H12Z"
          fill="white"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col">
          <span className={cn('font-bold tracking-tight leading-none', s.text, textColor)}>
            NexusBank
          </span>
        </div>
      )}
    </div>
  )
}

export function LogoMark({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = sizes[size]
  return (
    <svg
      className={cn(s.mark, className)}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="#0066FF" />
      <path
        d="M12 28V12h2.4l11.2 12.8V12H28v16h-2.4L14.4 15.2V28H12Z"
        fill="white"
      />
    </svg>
  )
}
