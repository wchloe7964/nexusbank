import { Banknote, ShoppingCart, Wallet, Store, TrendingUp } from 'lucide-react'
import type { SpendingAlertType } from '@/lib/types'

export const alertTypeConfigs: Record<SpendingAlertType, {
  label: string
  description: string
  icon: typeof Banknote
  color: string
  bg: string
  placeholder: string
}> = {
  single_transaction: {
    label: 'Large Transaction',
    description: 'Alert when a single transaction exceeds a set amount',
    icon: Banknote,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    placeholder: 'e.g. £100',
  },
  category_monthly: {
    label: 'Category Cap',
    description: 'Alert when monthly spending in a category exceeds a limit',
    icon: ShoppingCart,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    placeholder: 'e.g. £200',
  },
  balance_below: {
    label: 'Low Balance',
    description: 'Alert when your account balance drops below a threshold',
    icon: Wallet,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    placeholder: 'e.g. £500',
  },
  merchant_payment: {
    label: 'Merchant Payment',
    description: 'Alert when a payment is made to a specific merchant',
    icon: Store,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    placeholder: 'e.g. £50',
  },
  large_incoming: {
    label: 'Large Incoming',
    description: 'Alert when you receive a payment above a set amount',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    placeholder: 'e.g. £1000',
  },
}

export const presetAlertSuggestions = [
  {
    name: 'Large purchases',
    alert_type: 'single_transaction' as SpendingAlertType,
    threshold_amount: 100,
  },
  {
    name: 'Dining budget',
    alert_type: 'category_monthly' as SpendingAlertType,
    category: 'dining',
    threshold_amount: 150,
  },
  {
    name: 'Low balance warning',
    alert_type: 'balance_below' as SpendingAlertType,
    threshold_amount: 500,
  },
]
