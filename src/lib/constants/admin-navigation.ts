import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  History,
  ShieldAlert,
  Shield,
  ArrowLeft,
  ScrollText,
  FileCheck,
  UserCheck,
  AlertTriangle,
  ShieldBan,
  BookOpen,
  Settings2,
  Zap,
  CreditCard,
  MessageSquare,
  FileText,
  Gauge,
  FileWarning,
  Percent,
} from 'lucide-react'

export interface AdminNavItem {
  label: string
  href: string
  icon: LucideIcon
}

export interface AdminNavGroup {
  label: string
  items: AdminNavItem[]
  collapsible?: boolean
}

export const adminNavigationGroups: AdminNavGroup[] = [
  {
    label: 'Admin',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Transactions', href: '/admin/transactions', icon: History },
    ],
  },
  {
    label: 'Operations',
    collapsible: true,
    items: [
      { label: 'Disputes', href: '/admin/disputes', icon: ShieldAlert },
      { label: 'Security', href: '/admin/security', icon: Shield },
      { label: 'Payments', href: '/admin/payments-ops', icon: Zap },
      { label: 'Limits & SCA', href: '/admin/limits', icon: Gauge },
    ],
  },
  {
    label: 'Compliance',
    collapsible: true,
    items: [
      { label: 'Audit Log', href: '/admin/audit', icon: ScrollText },
      { label: 'Reports', href: '/admin/compliance', icon: FileCheck },
      { label: 'KYC Verifications', href: '/admin/kyc', icon: UserCheck },
      { label: 'AML Alerts', href: '/admin/aml', icon: AlertTriangle },
      { label: 'SAR Filing', href: '/admin/sar', icon: FileWarning },
      { label: 'PCI-DSS', href: '/admin/pci', icon: CreditCard },
    ],
  },
  {
    label: 'Fraud',
    collapsible: true,
    items: [
      { label: 'Dashboard', href: '/admin/fraud', icon: ShieldBan },
      { label: 'Cases', href: '/admin/fraud/cases', icon: BookOpen },
      { label: 'Rules', href: '/admin/fraud/rules', icon: Settings2 },
    ],
  },
  {
    label: 'Regulatory',
    collapsible: true,
    items: [
      { label: 'Complaints', href: '/admin/complaints', icon: MessageSquare },
      { label: 'Returns', href: '/admin/regulatory', icon: FileText },
      { label: 'Interest Rates', href: '/admin/interest', icon: Percent },
    ],
  },
  {
    label: '',
    items: [
      { label: 'Back to App', href: '/dashboard', icon: ArrowLeft },
    ],
  },
]
