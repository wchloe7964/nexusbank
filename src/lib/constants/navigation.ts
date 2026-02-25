import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  Users,
  Bell,
  Settings,
  History,
  PieChart,
  FileDown,
  Home,
  Send,
  HelpCircle,
  MoreHorizontal,
  PiggyBank,
  Target,
  ShieldAlert,
  Gift,
  CircleDollarSign,
  Banknote,
  TrendingUp,
  Shield,
  Calculator,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

export const navigationGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Accounts & Cards',
    collapsible: true,
    items: [
      { label: 'Accounts', href: '/accounts', icon: Wallet },
      { label: 'Cards', href: '/cards', icon: CreditCard },
      { label: 'Credit Cards', href: '/my-credit-cards', icon: CircleDollarSign },
    ],
  },
  {
    label: 'Payments & Transfers',
    collapsible: true,
    items: [
      { label: 'Transfers', href: '/transfers', icon: ArrowLeftRight },
      { label: 'Payments', href: '/payments', icon: Receipt },
      { label: 'Payees', href: '/payees', icon: Users },
      { label: 'Transactions', href: '/transactions', icon: History },
      { label: 'Statements', href: '/statements', icon: FileDown },
    ],
  },
  {
    label: 'Products',
    collapsible: true,
    items: [
      { label: 'Loans', href: '/my-loans', icon: Banknote },
      { label: 'Investments', href: '/my-investments', icon: TrendingUp },
      { label: 'Insurance', href: '/my-insurance', icon: Shield },
      { label: 'Savings', href: '/savings-goals', icon: PiggyBank },
      { label: 'Rewards', href: '/rewards', icon: Gift },
    ],
  },
  {
    label: 'Planning & Insights',
    collapsible: true,
    items: [
      { label: 'Budgets', href: '/budgets', icon: Target },
      { label: 'Insights', href: '/insights', icon: PieChart },
      { label: 'Tools', href: '/tools', icon: Calculator },
    ],
  },
  {
    label: 'Support & Settings',
    collapsible: true,
    items: [
      { label: 'Disputes', href: '/disputes', icon: ShieldAlert },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

// Flat array for backward compatibility (bottom-nav filtering, etc.)
export const navigation = navigationGroups.flatMap((g) => g.items)

export const bottomNavItems = [
  { label: 'Accounts', href: '/dashboard', icon: Home },
  { label: 'Products', href: '/accounts', icon: Wallet },
  { label: 'Pay & Transfer', href: '/transfers', icon: Send },
  { label: 'Help', href: '/notifications', icon: HelpCircle },
  { label: 'More', href: '#more', icon: MoreHorizontal },
]
