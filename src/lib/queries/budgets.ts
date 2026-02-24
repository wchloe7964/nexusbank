import { createClient } from '@/lib/supabase/server'
import type { Budget, BudgetWithSpending } from '@/lib/types'

export async function getBudgets(): Promise<Budget[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('is_active', true)
    .order('category')

  if (error) {
    console.error('getBudgets error:', error.message)
    return []
  }
  return data as Budget[]
}

export async function getBudgetsWithSpending(): Promise<BudgetWithSpending[]> {
  const supabase = await createClient()

  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .eq('is_active', true)
    .order('category')

  if (budgetError) {
    console.error('getBudgetsWithSpending error:', budgetError.message)
    return []
  }

  // Get current month spending by category
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('type', 'debit')
    .gte('transaction_date', monthStart.toISOString())

  const spendingByCategory: Record<string, number> = {}
  if (!txError && transactions) {
    for (const tx of transactions) {
      spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + Number(tx.amount)
    }
  }

  return (budgets as Budget[]).map((budget) => {
    const spent = spendingByCategory[budget.category] || 0
    const limit = Number(budget.monthly_limit)
    const percentage = limit > 0 ? (spent / limit) * 100 : 0
    const remaining = limit - spent

    let status: 'on-track' | 'warning' | 'exceeded' = 'on-track'
    if (percentage >= 100) status = 'exceeded'
    else if (percentage >= budget.alert_threshold * 100) status = 'warning'

    return { ...budget, spent, remaining, percentage, status }
  })
}

export async function getTotalBudgetSummary(): Promise<{
  totalBudget: number
  totalSpent: number
  percentage: number
}> {
  const budgets = await getBudgetsWithSpending()
  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  return {
    totalBudget,
    totalSpent,
    percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
  }
}
