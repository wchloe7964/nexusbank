'use client'

import { cn } from '@/lib/utils/cn'
import { formatGBP } from '@/lib/utils/currency'
import { Snowflake, AlertTriangle } from 'lucide-react'
import type { Card as DebitCard, CreditCard } from '@/lib/types'

// ─── EMV Chip (the exact base64 chip image from the reference design) ────────

const CHIP_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAB6VBMVEUAAACNcTiVeUKVeUOYfEaafEeUeUSYfEWZfEaykleyklaXe0SWekSZZjOYfEWYe0WXfUWXe0WcgEicfkiXe0SVekSXekSWekKYe0a9nF67m12ZfUWUeEaXfESVekOdgEmVeUWWekSniU+VeUKVeUOrjFKYfEWliE6WeESZe0GSe0WYfES7ml2Xe0WXeESUeEOWfEWcf0eWfESXe0SXfEWYekSVeUKXfEWxklawkVaZfEWWekOUekOWekSYfESZe0eXekWYfEWZe0WZe0eVeUSWeETAnmDCoWLJpmbxy4P1zoXwyoLIpWbjvXjivnjgu3bfu3beunWvkFWxkle/nmDivXiWekTnwXvkwHrCoWOuj1SXe0TEo2TDo2PlwHratnKZfEbQrWvPrWuafUfbt3PJp2agg0v0zYX0zYSfgkvKp2frxX7mwHrlv3rsxn/yzIPgvHfduXWXe0XuyIDzzISsjVO1lVm0lFitjVPzzIPqxX7duna0lVncuHTLqGjvyIHeuXXxyYGZfUayk1iyk1e2lln1zYTEomO2llrbtnOafkjFpGSbfkfZtXLhvHfkv3nqxH3mwXujhU3KqWizlFilh06khk2fgkqsjlPHpWXJp2erjVOhg0yWe0SliE+XekShhEvAn2D///+gx8TWAAAARnRSTlMACVCTtsRl7Pv7+vxkBab7pZv5+ZlL/UnU/f3SJCVe+Fx39naA9/75XSMh0/3SSkia+pil/KRj7Pr662JPkrbP7OLQ0JFOijI1MwAAAAFiS0dEorDd34wAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IDx2lsiuJAAACLElEQVRIx2NgGAXkAUYmZhZWPICFmYkRVQcbOwenmzse4MbFzc6DpIGXj8PD04sA8PbhF+CFaxEU8iWkAQT8hEVgOkTF/InR4eUVICYO1SIhCRMLDAoKDvFDVhUaEhwUFAjjSUlDdMiEhcOEItzdI6OiYxA6YqODIt3dI2DcuDBZsBY5eVTr4xMSYcyk5BRUOXkFsBZFJTQnp6alQxgZmVloUkrKYC0qqmji2WE5EEZuWB6alKoKdi35YQUQRkFYPpFaCouKIYzi6EDitJSUlsGY5RWVRGjJLyxNy4ZxqtIqqvOxaVELQwZFZdkIJVU1RSiSalAt6rUwUBdWG1CP6pT6gNqwOrgCdQyHNYR5YQFhDXj8MiK1IAeyN6aORiyBjByVTc0FqBoKWpqwRCVSgilOaY2OaUPw29qjOzqLvTAchpos47u6EZyYnngUSRwpuTe6D+6qaFQdOPNLRzOM1dzhRZyW+CZouHk3dWLXglFcFIflQhj9YWjJGlZcaKAVSvjyPrRQ0oQVKDAQHlYFYUwIm4gqExGmBSkutaVQJeomwViTJqPK6OhCy2Q9sQBk8cY0DxjTJw0lAQWK6cOKfgNhpKK7ZMpUeF3jPa28BCETV2iEqJKM+X1gxvWXpoUjVIVPnwErw71nmpgiqiQGBjNzbgs3j1nus+fMndc+Cwm0T52/oNR9lsdCa7Tq1cbWjpXV3sHRCb1idXZ0sGdltXNxRqueRwHRAACYHutzk/2I5QAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMy0wMi0xM1QwODoxNToyOSswMDowMEUnN7UAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjMtMDItMTNUMDg6MTU6MjkrMDA6MDA0eo8JAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTAyLTEzVDA4OjE1OjI5KzAwOjAwY2+u1gAAAABJRU5ErkJggg=='

// ─── Props ────────────────────────────────────────────────────────────────────

type BankCardSize = 'compact' | 'full'

interface BaseProps {
  size?: BankCardSize
  className?: string
}

interface DebitCardProps extends BaseProps {
  variant: 'debit'
  card: DebitCard
}

interface CreditCardProps extends BaseProps {
  variant: 'credit'
  card: CreditCard
}

type BankCardProps = DebitCardProps | CreditCardProps

// ─── Component ────────────────────────────────────────────────────────────────

export function BankCard(props: BankCardProps) {
  const { size = 'compact', className } = props

  const lastFour = props.card.card_number_last_four
  const status = props.card.status

  const isFrozen =
    props.variant === 'debit'
      ? props.card.is_frozen || status === 'frozen'
      : status === 'frozen'

  const isDisabled =
    props.variant === 'debit'
      ? status === 'reported_lost' || status === 'cancelled'
      : status === 'closed'

  // Card label
  const cardLabel =
    props.variant === 'credit'
      ? props.card.card_name || 'NexusBank Credit'
      : props.card.card_type === 'debit'
        ? 'NEXUS BANK'
        : 'NEXUS BANK'

  // Tier text
  const tierText =
    props.variant === 'credit'
      ? props.card.card_network === 'visa'
        ? 'PLATINUM'
        : 'SILVER'
      : 'DEBIT'

  // Network
  const network =
    props.variant === 'credit' ? props.card.card_network : null

  // Bottom info
  const holderName =
    props.variant === 'debit'
      ? props.card.card_holder_name
      : null

  const expiryDate =
    props.variant === 'debit'
      ? props.card.expiry_date
      : null

  const sizeClass = size === 'full' ? 'bank-card-full' : 'bank-card-compact'

  return (
    <div
      className={cn(
        'bank-card',
        sizeClass,
        className,
      )}
    >
      {/* Frozen / Reported Lost overlay */}
      {(isFrozen || isDisabled) && (
        <div className="bank-card-overlay">
          <div className="flex items-center gap-2 text-white">
            {props.variant === 'debit' && status === 'reported_lost' ? (
              <>
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Reported Lost</span>
              </>
            ) : (
              <>
                <Snowflake className="h-5 w-5" />
                <span className="text-sm font-medium uppercase tracking-wide">Frozen</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Layer 1: Gradient border */}
      <div className="bank-card-border">
        {/* Layer 2: Silver brushed metal base */}
        <div className="bank-card-metal">
          {/* Layer 3: Corner shadow + diagonal lighting */}
          <div className="bank-card-shadow">
            {/* Layer 4: Inner content face */}
            <div className="bank-card-content">
              {/* Brand name — top left */}
              <p className="bank-card-text bank-card-brand">{cardLabel}</p>

              {/* Tier label — top right */}
              <p className="bank-card-text bank-card-tier">{tierText}</p>

              {/* EMV Chip */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CHIP_DATA_URI}
                alt=""
                aria-hidden="true"
                className="bank-card-chip"
                width={size === 'full' ? 40 : 30}
                height={size === 'full' ? 40 : 30}
              />

              {/* Card number */}
              <p className="bank-card-text bank-card-number">
                •••• •••• •••• {lastFour}
              </p>

              {/* Cardholder name (debit) */}
              {holderName && (
                <p className="bank-card-text bank-card-holder">{holderName}</p>
              )}

              {/* Expiry (debit) */}
              {expiryDate && (
                <p className="bank-card-text bank-card-expiry">{expiryDate}</p>
              )}

              {/* Credit card: balance + limit in bottom-left */}
              {props.variant === 'credit' && (
                <p className="bank-card-text bank-card-holder">
                  {formatGBP(Number(props.card.current_balance))}
                </p>
              )}
              {props.variant === 'credit' && (
                <p className="bank-card-text bank-card-expiry">
                  Limit: {formatGBP(Number(props.card.credit_limit))}
                </p>
              )}

              {/* Mastercard circles */}
              {(network === 'mastercard' || props.variant === 'debit') && (
                <>
                  <span className="bank-card-mc mc-one" />
                  <span className="bank-card-mc" />
                  <p className="bank-card-text bank-card-network-text">mastercard</p>
                </>
              )}

              {/* Visa logo */}
              {network === 'visa' && (
                <span className="bank-card-visa-logo">VISA</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
