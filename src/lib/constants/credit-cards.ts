import { CreditCard, Snowflake, CheckCircle, XCircle } from 'lucide-react'

export const cardNetworkConfigs = {
  visa: {
    label: 'Visa',
    color: 'text-blue-600',
    bg: 'bg-gradient-to-br from-blue-600 to-blue-800',
    logo: '𝗩𝗜𝗦𝗔',
    metalBase: '#1a3a6b',
    metalHighlight: '#2d5aa0',
  },
  mastercard: {
    label: 'Mastercard',
    color: 'text-orange-600',
    bg: 'bg-gradient-to-br from-gray-800 to-gray-950',
    logo: '●●',
    metalBase: '#2a2a2f',
    metalHighlight: '#4a4a52',
  },
} as const

export const cardStatusConfigs = {
  active: { label: 'Active', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  frozen: { label: 'Frozen', icon: Snowflake, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  closed: { label: 'Closed', icon: XCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
} as const

export const rewardTierLabels = {
  standard: 'Standard — 0.25% cashback',
  premium: 'Premium — 0.50% cashback',
  platinum: 'Platinum — 1.00% cashback',
} as const

export type CardNetwork = keyof typeof cardNetworkConfigs
export type CreditCardStatusKey = keyof typeof cardStatusConfigs
