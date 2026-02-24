import {
  Wallet, PiggyBank, Briefcase, Home, Plane, Car, GraduationCap, Heart,
} from 'lucide-react'

export const accountColors = [
  { id: 'blue', label: 'Blue', class: 'bg-blue-500', ring: 'ring-blue-500' },
  { id: 'green', label: 'Green', class: 'bg-green-500', ring: 'ring-green-500' },
  { id: 'purple', label: 'Purple', class: 'bg-purple-500', ring: 'ring-purple-500' },
  { id: 'orange', label: 'Orange', class: 'bg-orange-500', ring: 'ring-orange-500' },
  { id: 'pink', label: 'Pink', class: 'bg-pink-500', ring: 'ring-pink-500' },
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500', ring: 'ring-cyan-500' },
  { id: 'amber', label: 'Amber', class: 'bg-amber-500', ring: 'ring-amber-500' },
  { id: 'red', label: 'Red', class: 'bg-red-500', ring: 'ring-red-500' },
] as const

export const accountIcons = [
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'piggy-bank', label: 'Piggy Bank', icon: PiggyBank },
  { id: 'briefcase', label: 'Briefcase', icon: Briefcase },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'plane', label: 'Travel', icon: Plane },
  { id: 'car', label: 'Car', icon: Car },
  { id: 'graduation-cap', label: 'Education', icon: GraduationCap },
  { id: 'heart', label: 'Personal', icon: Heart },
] as const

export type AccountColor = typeof accountColors[number]['id']
export type AccountIcon = typeof accountIcons[number]['id']

export function getAccountColorClass(color: string | null | undefined): string {
  const found = accountColors.find(c => c.id === color)
  return found?.class ?? 'bg-blue-500'
}

export function getAccountColorRing(color: string | null | undefined): string {
  const found = accountColors.find(c => c.id === color)
  return found?.ring ?? 'ring-blue-500'
}

export function getAccountIcon(iconId: string | null | undefined) {
  const found = accountIcons.find(i => i.id === iconId)
  return found?.icon ?? Wallet
}
