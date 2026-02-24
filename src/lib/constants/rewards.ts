import { UtensilsCrossed, ShoppingBag, Repeat, Tv, ShoppingCart, Bus, FileText, Coins, HelpCircle } from 'lucide-react'

// Cashback multiplier rates per transaction category
export const rewardMultipliers: Record<string, { rate: number; label: string; rewardType: string }> = {
  dining: { rate: 0.03, label: '3% Cashback', rewardType: 'cashback_dining' },
  shopping: { rate: 0.02, label: '2% Cashback', rewardType: 'cashback_shopping' },
  subscriptions: { rate: 0.015, label: '1.5% Cashback', rewardType: 'cashback_subscriptions' },
  entertainment: { rate: 0.01, label: '1% Cashback', rewardType: 'cashback_other' },
  groceries: { rate: 0.01, label: '1% Cashback', rewardType: 'cashback_other' },
  transport: { rate: 0.005, label: '0.5% Cashback', rewardType: 'cashback_other' },
  bills: { rate: 0.005, label: '0.5% Cashback', rewardType: 'cashback_other' },
  health: { rate: 0.005, label: '0.5% Cashback', rewardType: 'cashback_other' },
  education: { rate: 0.005, label: '0.5% Cashback', rewardType: 'cashback_other' },
  cash: { rate: 0, label: 'No Cashback', rewardType: 'cashback_other' },
  transfer: { rate: 0, label: 'No Cashback', rewardType: 'cashback_other' },
  salary: { rate: 0, label: 'No Cashback', rewardType: 'cashback_other' },
  other: { rate: 0.005, label: '0.5% Cashback', rewardType: 'cashback_other' },
}

export const rewardCategoryIcons: Record<string, { icon: typeof UtensilsCrossed; color: string; bg: string }> = {
  dining: { icon: UtensilsCrossed, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  shopping: { icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  subscriptions: { icon: Repeat, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  entertainment: { icon: Tv, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  groceries: { icon: ShoppingCart, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  transport: { icon: Bus, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  bills: { icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  cash: { icon: Coins, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  other: { icon: HelpCircle, color: 'text-gray-500', bg: 'bg-gray-500/10' },
}

export const redemptionOptions = [
  { id: 'cash', label: 'Cash to Account', description: 'Transfer cashback directly to your chosen account' },
  { id: 'charity', label: 'Donate to Charity', description: 'Donate your cashback to a UK charity partner' },
] as const

export type RedemptionMethod = typeof redemptionOptions[number]['id']
