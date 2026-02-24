import { cn } from '@/lib/utils/cn'
import Image from 'next/image'

interface TrustBadgesProps {
  className?: string
  variant?: 'light' | 'dark'
}

const badges = [
  {
    src: '/images/badges/fscs.png',
    alt: 'FSCS Protected — eligible deposits are protected up to £85,000',
    width: 80,
    height: 96,
  },
  {
    src: '/images/badges/cyber-essentials.png',
    alt: 'Cyber Essentials Plus Certified',
    width: 72,
    height: 72,
  },
  {
    src: '/images/badges/kitemark-digital-banking.png',
    alt: 'BSI Secure Digital Banking Kitemark — Certificate Number IS 616800',
    width: 100,
    height: 56,
  },
  {
    src: '/images/badges/kitemark-iso27001.png',
    alt: 'BSI ISO/IEC 27001 Information Security Management Certified — Certificate Number IS 539200',
    width: 100,
    height: 56,
  },
  {
    src: '/images/badges/take-five.png',
    alt: 'Take Five — to stop fraud',
    width: 120,
    height: 40,
  },
]

export function TrustBadges({ className, variant = 'light' }: TrustBadgesProps) {
  const labelColor = variant === 'dark' ? 'text-white/40' : 'text-muted-foreground/60'

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
        {badges.map((badge) => (
          <Image
            key={badge.src}
            src={badge.src}
            alt={badge.alt}
            width={badge.width}
            height={badge.height}
            className="shrink-0 object-contain"
          />
        ))}
      </div>
      <p className={cn('text-[10px] leading-tight text-center max-w-2xl', labelColor)}>
        Eligible deposits with us are protected up to a total of £85,000 by the Financial
        Services Compensation Scheme, the UK&apos;s deposit guarantee scheme.
      </p>
    </div>
  )
}
