import { Home, Car, Heart, Plane, Activity, Dog, CheckCircle, Clock, XCircle, AlertCircle, Banknote } from 'lucide-react'

export const policyTypeConfigs = {
  home: { label: 'Home Insurance', icon: Home, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  car: { label: 'Car Insurance', icon: Car, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950' },
  life: { label: 'Life Insurance', icon: Heart, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  travel: { label: 'Travel Insurance', icon: Plane, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950' },
  health: { label: 'Health Insurance', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950' },
  pet: { label: 'Pet Insurance', icon: Dog, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
} as const

export const policyStatusConfigs = {
  active: { label: 'Active', color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  expired: { label: 'Expired', color: 'text-gray-500', bg: 'bg-gray-500/10' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-500/10' },
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500/10' },
} as const

export const claimStatusConfigs = {
  submitted: { label: 'Submitted', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  under_review: { label: 'Under Review', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-500/10' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  denied: { label: 'Denied', icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10' },
  paid: { label: 'Paid', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
} as const

export const claimTypes = [
  'Accidental Damage',
  'Theft',
  'Water Damage',
  'Fire Damage',
  'Weather Damage',
  'Personal Injury',
  'Medical Emergency',
  'Trip Cancellation',
  'Vehicle Accident',
  'Other',
] as const
