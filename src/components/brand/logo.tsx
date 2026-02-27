import Image from 'next/image'
import { cn } from '@/lib/utils/cn'

interface LogoProps {
  className?: string
  variant?: 'default' | 'white' | 'dark'
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { height: 24, width: 90, markSize: 'h-7 w-7' },
  md: { height: 32, width: 120, markSize: 'h-9 w-9' },
  lg: { height: 40, width: 150, markSize: 'h-11 w-11' },
}

const logoSrc = {
  default: '/images/sections/logo_dark.svg',
  dark: '/images/sections/logo_dark.svg',
  white: '/images/sections/logo_light.svg',
}

export function Logo({ className, variant = 'default', showWordmark = true, size = 'md' }: LogoProps) {
  const s = sizes[size]
  const src = logoSrc[variant]

  if (!showWordmark) {
    return (
      <div className={cn('flex items-center', className)}>
        <LogoMark size={size} variant={variant} />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src={src}
        alt="NexusBank"
        width={s.width}
        height={s.height}
        className="object-contain"
        priority
      />
    </div>
  )
}

/** Icon-only logomark — the stylised "NX" brand mark */
export function LogoMark({
  className,
  size = 'md',
  variant = 'default',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'white' | 'dark'
}) {
  const s = sizes[size]
  const fill = variant === 'white' ? '#ffffff' : '#02aef0'

  return (
    <svg
      className={cn(s.markSize, className)}
      viewBox="0 0 42.5 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill={fill}
        fillOpacity="1"
        fillRule="nonzero"
        d="M 33.492188 0.769531 L 42.21875 0.769531 C 37.886719 6.5 33.628906 12.121094 29.375 17.75 C 33.671875 23.429688 37.957031 29.085938 42.3125 34.835938 L 33.597656 34.835938 C 33.539062 34.78125 33.484375 34.71875 33.429688 34.644531 C 31.707031 32.332031 29.964844 30.039062 28.222656 27.742188 C 23.449219 21.441406 18.671875 15.152344 13.902344 8.859375 C 12.902344 7.539062 11.457031 7.042969 9.976562 7.53125 C 8.527344 8.011719 7.601562 9.339844 7.601562 10.929688 L 7.601562 23.46875 L 7.578125 23.460938 L 7.578125 34.835938 L 0.671875 34.835938 C 0.671875 32.332031 0.671875 29.828125 0.671875 27.328125 L 0.671875 10.761719 C 0.671875 9.355469 0.910156 7.996094 1.488281 6.722656 C 3.097656 3.175781 5.835938 1.007812 9.707031 0.511719 C 13.683594 0.00390625 16.964844 1.445312 19.429688 4.621094 C 21.128906 6.808594 22.777344 9.03125 24.449219 11.242188 C 24.625 11.46875 24.800781 11.695312 24.988281 11.949219 C 25.085938 11.839844 25.148438 11.769531 25.207031 11.695312 C 27.964844 8.0625 30.722656 4.429688 33.472656 0.789062 C 33.476562 0.78125 33.484375 0.777344 33.492188 0.769531 Z M 33.492188 0.769531"
      />
    </svg>
  )
}
