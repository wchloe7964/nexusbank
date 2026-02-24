import Image from 'next/image'

interface ContentIconProps {
  src: string
  alt?: string
  size?: number
  className?: string
}

export function ContentIcon({ src, alt = '', size = 20, className }: ContentIconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      aria-hidden={alt === '' ? true : undefined}
    />
  )
}
