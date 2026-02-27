import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import {
  Banknote,
  TrendingUp,
  Shield,
  PiggyBank,
  Gift,
  CircleDollarSign,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

const productCategories = [
  {
    label: 'Loans',
    description: 'Personal and secured loans',
    href: '/my-loans',
    icon: Banknote,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  {
    label: 'Investments',
    description: 'Stocks, funds and portfolios',
    href: '/my-investments',
    icon: TrendingUp,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    label: 'Insurance',
    description: 'Home, travel and life cover',
    href: '/my-insurance',
    icon: Shield,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
  },
  {
    label: 'Savings Goals',
    description: 'Track and reach your targets',
    href: '/savings-goals',
    icon: PiggyBank,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-950/30',
  },
  {
    label: 'Credit Cards',
    description: 'Manage your credit cards',
    href: '/my-credit-cards',
    icon: CircleDollarSign,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    label: 'Rewards',
    description: 'Points, cashback and offers',
    href: '/rewards',
    icon: Gift,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
  },
]

export default function ProductsPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Products"
        description="Explore and manage your financial products"
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {productCategories.map((product) => (
          <Link key={product.href} href={product.href}>
            <Card variant="raised" interactive>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`shrink-0 rounded-xl p-3 ${product.bg}`}>
                  <product.icon className={`h-5 w-5 ${product.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{product.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
