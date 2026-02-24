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

export const navigation = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Accounts',
    href: '/accounts',
    icon: Wallet,
  },
  {
    label: 'Transfers',
    href: '/transfers',
    icon: ArrowLeftRight,
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: Receipt,
  },
  {
    label: 'Transactions',
    href: '/transactions',
    icon: History,
  },
  {
    label: 'Cards',
    href: '/cards',
    icon: CreditCard,
  },
  {
    label: 'Credit Cards',
    href: '/my-credit-cards',
    icon: CircleDollarSign,
  },
  {
    label: 'Loans',
    href: '/my-loans',
    icon: Banknote,
  },
  {
    label: 'Investments',
    href: '/my-investments',
    icon: TrendingUp,
  },
  {
    label: 'Insurance',
    href: '/my-insurance',
    icon: Shield,
  },
  {
    label: 'Savings',
    href: '/savings-goals',
    icon: PiggyBank,
  },
  {
    label: 'Budgets',
    href: '/budgets',
    icon: Target,
  },
  {
    label: 'Rewards',
    href: '/rewards',
    icon: Gift,
  },
  {
    label: 'Tools',
    href: '/tools',
    icon: Calculator,
  },
  {
    label: 'Insights',
    href: '/insights',
    icon: PieChart,
  },
  {
    label: 'Statements',
    href: '/statements',
    icon: FileDown,
  },
  {
    label: 'Payees',
    href: '/payees',
    icon: Users,
  },
  {
    label: 'Disputes',
    href: '/disputes',
    icon: ShieldAlert,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export const bottomNavItems = [
  { label: 'Accounts', href: '/dashboard', icon: Home },
  { label: 'Products', href: '/accounts', icon: Wallet },
  { label: 'Pay & Transfer', href: '/transfers', icon: Send },
  { label: 'Help', href: '/notifications', icon: HelpCircle },
  { label: 'More', href: '#more', icon: MoreHorizontal },
]
