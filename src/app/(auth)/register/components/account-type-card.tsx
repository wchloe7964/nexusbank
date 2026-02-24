import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface AccountTypeCardProps {
  icon: LucideIcon
  name: string
  tagline: string
  features: string[]
  highlight: string
  selected: boolean
  onSelect: () => void
}

export function AccountTypeCard({
  icon: Icon,
  name,
  tagline,
  features,
  highlight,
  selected,
  onSelect,
}: AccountTypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative w-full rounded-lg border p-6 text-left transition-all duration-200 ${
        selected
          ? 'border-primary bg-primary/[0.04] shadow-[0_3px_8px_rgba(0,0,0,0.08)]'
          : 'border-border bg-card hover:border-primary'
      }`}
    >
      {/* Selected check */}
      {selected && (
        <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Check className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className="accent-bar mb-4" />

      <div className="flex items-center gap-3 mb-3">
        <div className="rounded-full bg-primary/[0.08] p-2.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <Badge variant="default" className="text-[10px]">{highlight}</Badge>
      </div>

      <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>

      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}
