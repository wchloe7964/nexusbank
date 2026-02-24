import { User, Home, Car, GraduationCap, CheckCircle, XCircle, Clock } from 'lucide-react'

export const loanTypeConfigs = {
  personal: {
    label: 'Personal Loan',
    icon: User,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    description: 'Flexible borrowing for any purpose',
  },
  mortgage: {
    label: 'Mortgage',
    icon: Home,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    description: 'Home purchase or remortgage',
  },
  auto: {
    label: 'Car Finance',
    icon: Car,
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
    description: 'Vehicle purchase financing',
  },
  student: {
    label: 'Student Loan',
    icon: GraduationCap,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
    description: 'Education financing',
  },
} as const

export const loanStatusConfigs = {
  active: { label: 'Active', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  paid_off: { label: 'Paid Off', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  defaulted: { label: 'Defaulted', icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10' },
} as const

export type LoanTypeKey = keyof typeof loanTypeConfigs
export type LoanStatusKey = keyof typeof loanStatusConfigs
