import { LineChart, Landmark, TrendingUp, Briefcase } from 'lucide-react'

export const investmentAccountTypeConfigs = {
  stocks_isa: {
    label: 'Stocks & Shares ISA',
    icon: LineChart,
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  lifetime_isa: {
    label: 'Lifetime ISA',
    icon: Landmark,
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
  general_investment: {
    label: 'General Investment Account',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
  },
  pension: {
    label: 'Pension',
    icon: Briefcase,
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950',
  },
} as const

export const assetTypeColors: Record<string, string> = {
  stock: '#3b82f6',   // blue
  bond: '#10b981',    // emerald
  etf: '#8b5cf6',     // violet
  fund: '#f59e0b',    // amber
  cash: '#6b7280',    // gray
}

export const assetTypeLabels: Record<string, string> = {
  stock: 'Stock',
  bond: 'Bond',
  etf: 'ETF',
  fund: 'Fund',
  cash: 'Cash',
}
