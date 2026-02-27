import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Calculator, Banknote, PiggyBank, Home, Wallet } from 'lucide-react'
import Link from 'next/link'

const tools = [
  {
    href: '/tools/loan-calculator',
    icon: Banknote,
    title: 'Loan Repayment Calculator',
    description: 'Calculate monthly payments, total interest, and total cost for any loan.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
  },
  {
    href: '/tools/savings-calculator',
    icon: PiggyBank,
    title: 'Savings Growth Calculator',
    description: 'See how your savings grow over time with compound interest.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950',
  },
  {
    href: '/tools/mortgage-calculator',
    icon: Home,
    title: 'Mortgage Calculator',
    description: 'Calculate mortgage payments, total repayment, and LTV ratio.',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-950',
  },
  {
    href: '/tools/budget-planner',
    icon: Wallet,
    title: 'Budget Planner',
    description: 'Plan your monthly budget and see your spending breakdown.',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950',
  },
]

export default function ToolsPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Financial Tools"
        description="Calculators and planners to help manage your finances"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card variant="raised" interactive className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`rounded-xl p-3 ${tool.bg}`}>
                    <tool.icon className={`h-5 w-5 ${tool.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{tool.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
