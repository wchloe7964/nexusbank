'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import { Plus, Target, Trash2 } from 'lucide-react'
import { transactionCategories } from '@/lib/constants/categories'
import type { BudgetWithSpending } from '@/lib/types'
import { createBudget, updateBudget, deleteBudget } from './actions'

interface BudgetsClientProps {
  budgets: BudgetWithSpending[]
}

const statusConfig = {
  'on-track': { variant: 'success' as const, label: 'On Track', indicator: '[&>div]:bg-emerald-500' },
  'warning': { variant: 'warning' as const, label: 'Nearing Limit', indicator: '[&>div]:bg-amber-500' },
  'exceeded': { variant: 'destructive' as const, label: 'Over Budget', indicator: '[&>div]:bg-red-500' },
}

const BUDGETABLE_CATEGORIES = Object.keys(transactionCategories).filter(
  (c) => c !== 'transfer' && c !== 'salary'
)

export function BudgetsClient({ budgets }: BudgetsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpending | null>(null)

  // Create form
  const [category, setCategory] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')
  const [alertThreshold, setAlertThreshold] = useState('80')
  const [error, setError] = useState('')

  const totalBudget = budgets.reduce((sum, b) => sum + Number(b.monthly_limit), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0)
  const totalPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const existingCategories = budgets.map((b) => b.category) as string[]
  const availableCategories = BUDGETABLE_CATEGORIES.filter((c) => !existingCategories.includes(c))

  function resetForm() {
    setCategory(''); setMonthlyLimit(''); setAlertThreshold('80'); setError('')
  }

  function openEdit(budget: BudgetWithSpending) {
    setEditingBudget(budget)
    setMonthlyLimit(String(Number(budget.monthly_limit)))
    setAlertThreshold(String(Math.round(budget.alert_threshold * 100)))
    setError('')
  }

  function handleCreate() {
    const limit = parseFloat(monthlyLimit)
    if (!category) { setError('Please select a category'); return }
    if (!limit || limit <= 0) { setError('Please enter a valid amount'); return }

    startTransition(async () => {
      try {
        await createBudget({ category, monthlyLimit: limit, alertThreshold: parseInt(alertThreshold) / 100 })
        resetForm()
        setShowCreateDialog(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create budget')
      }
    })
  }

  function handleUpdate() {
    if (!editingBudget) return
    const limit = parseFloat(monthlyLimit)
    if (!limit || limit <= 0) { setError('Please enter a valid amount'); return }

    startTransition(async () => {
      try {
        await updateBudget(editingBudget.id, { monthlyLimit: limit, alertThreshold: parseInt(alertThreshold) / 100 })
        setEditingBudget(null)
        resetForm()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update budget')
      }
    })
  }

  function handleDelete(budgetId: string) {
    startTransition(async () => {
      try {
        await deleteBudget(budgetId)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete budget')
      }
    })
  }

  const overallStatus = totalPct >= 100 ? 'exceeded' : totalPct >= 80 ? 'warning' : 'on-track'

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="flex items-center justify-between gap-4">
        <Card className="flex-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Budget</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">{formatGBP(totalSpent)} <span className="text-sm font-normal text-muted-foreground">of {formatGBP(totalBudget)}</span></p>
              </div>
              <div className="text-right">
                <Badge variant={statusConfig[overallStatus].variant}>{statusConfig[overallStatus].label}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} set</p>
              </div>
            </div>
            {totalBudget > 0 && (
              <Progress value={Math.min(totalPct, 100)} className={cn('h-2', statusConfig[overallStatus].indicator)} />
            )}
          </CardContent>
        </Card>
        <Button size="sm" onClick={() => { resetForm(); setShowCreateDialog(true) }} disabled={availableCategories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Set Budget
        </Button>
      </div>

      {/* Create Budget Dialog */}
      <Dialog open={showCreateDialog} onClose={() => { setShowCreateDialog(false); resetForm() }} title="Set Monthly Budget">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select a category</option>
              {availableCategories.map((cat) => {
                const catInfo = transactionCategories[cat as keyof typeof transactionCategories]
                return <option key={cat} value={cat}>{catInfo?.label || cat}</option>
              })}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Monthly Limit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
              <Input type="number" min="1" step="1" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} className="pl-7" placeholder="0" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Alert Threshold: {alertThreshold}%</label>
            <input type="range" min="50" max="100" step="5" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} className="w-full mt-1 accent-primary" />
            <p className="text-xs text-muted-foreground">Get warned when you reach {alertThreshold}% of your limit</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleCreate} disabled={isPending} className="w-full">
            {isPending ? 'Creating...' : 'Set Budget'}
          </Button>
        </div>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onClose={() => { setEditingBudget(null); resetForm() }} title={editingBudget ? `Edit ${transactionCategories[editingBudget.category as keyof typeof transactionCategories]?.label || editingBudget.category} Budget` : 'Edit Budget'}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Monthly Limit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
              <Input type="number" min="1" step="1" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} className="pl-7" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Alert Threshold: {alertThreshold}%</label>
            <input type="range" min="50" max="100" step="5" value={alertThreshold} onChange={(e) => setAlertThreshold(e.target.value)} className="w-full mt-1 accent-primary" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => { setEditingBudget(null); resetForm() }}>Cancel</Button>
            <Button className="flex-1" onClick={handleUpdate} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No budgets set</p>
            <p className="mt-1 text-xs text-muted-foreground">Set spending limits for different categories to track your monthly spending.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const catInfo = transactionCategories[budget.category as keyof typeof transactionCategories]
            const Icon = catInfo?.icon || Target
            const config = statusConfig[budget.status]
            const pct = Math.min(budget.percentage, 100)

            return (
              <Card key={budget.id} variant="raised" interactive onClick={() => openEdit(budget)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('rounded-xl p-2.5', catInfo?.bg || 'bg-muted')}>
                        <Icon className={cn('h-4 w-4', catInfo?.color || 'text-muted-foreground')} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{catInfo?.label || budget.category}</p>
                        <Badge variant={config.variant} className="text-[10px] mt-0.5">{config.label}</Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(budget.id) }}
                      disabled={isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>

                  <Progress value={pct} className={cn('h-2 mb-2', config.indicator)} />

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold tabular-nums">{formatGBP(budget.spent)}</span>
                    <span className="text-muted-foreground tabular-nums">of {formatGBP(Number(budget.monthly_limit))}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{budget.percentage.toFixed(0)}% used</span>
                    {budget.remaining >= 0 ? (
                      <span className="tabular-nums">{formatGBP(budget.remaining)} left</span>
                    ) : (
                      <span className="text-destructive font-medium tabular-nums">{formatGBP(Math.abs(budget.remaining))} over</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
