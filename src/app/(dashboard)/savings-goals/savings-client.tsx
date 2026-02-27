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
import { Plus, PiggyBank, Target, Palmtree, Home, Wallet, RotateCcw, Sparkles, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { SavingsGoal, Account, SavingsGoalType, SavingsGoalColor } from '@/lib/types'
import { createSavingsGoal } from './actions'

interface SavingsClientProps {
  goals: SavingsGoal[]
  savingsAccounts: Account[]
}

const goalTypeLabels: Record<SavingsGoalType, string> = {
  'emergency-fund': 'Emergency Fund',
  'holiday': 'Holiday',
  'home-deposit': 'Home Deposit',
  'general': 'General',
  'retirement': 'Retirement',
  'other': 'Other',
}

const goalTypeIcons: Record<SavingsGoalType, typeof PiggyBank> = {
  'emergency-fund': Target,
  'holiday': Palmtree,
  'home-deposit': Home,
  'general': PiggyBank,
  'retirement': RotateCcw,
  'other': Sparkles,
}

const colorClasses: Record<SavingsGoalColor, { bg: string; text: string; indicator: string; dot: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', indicator: '[&>div]:bg-blue-500', dot: 'bg-blue-500' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', indicator: '[&>div]:bg-emerald-500', dot: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', indicator: '[&>div]:bg-purple-500', dot: 'bg-purple-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', indicator: '[&>div]:bg-orange-500', dot: 'bg-orange-500' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', indicator: '[&>div]:bg-pink-500', dot: 'bg-pink-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', indicator: '[&>div]:bg-cyan-500', dot: 'bg-cyan-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', indicator: '[&>div]:bg-amber-500', dot: 'bg-amber-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500', indicator: '[&>div]:bg-red-500', dot: 'bg-red-500' },
}

const ALL_COLORS: SavingsGoalColor[] = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'amber', 'red']

export function SavingsClient({ goals, savingsAccounts }: SavingsClientProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [goalType, setGoalType] = useState<SavingsGoalType>('general')
  const [targetAmount, setTargetAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [accountId, setAccountId] = useState(savingsAccounts[0]?.id || '')
  const [color, setColor] = useState<SavingsGoalColor>('blue')
  const [error, setError] = useState('')

  const activeGoals = goals.filter((g) => !g.is_completed)
  const completedGoals = goals.filter((g) => g.is_completed)
  const totalSaved = activeGoals.reduce((s, g) => s + Number(g.current_amount), 0)
  const totalTarget = activeGoals.reduce((s, g) => s + Number(g.target_amount), 0)

  function resetForm() {
    setName(''); setGoalType('general'); setTargetAmount(''); setTargetDate('')
    setAccountId(savingsAccounts[0]?.id || ''); setColor('blue'); setError('')
  }

  function handleCreate() {
    const amount = parseFloat(targetAmount)
    if (!name.trim()) { setError('Please enter a goal name'); return }
    if (!amount || amount <= 0) { setError('Please enter a valid target amount'); return }
    if (!accountId) { setError('Please select an account'); return }

    startTransition(async () => {
      try {
        await createSavingsGoal({ name: name.trim(), goalType, targetAmount: amount, targetDate: targetDate || undefined, accountId, color })
        resetForm()
        setIsDialogOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create goal')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Card className="flex-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">{formatGBP(totalSaved)}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{activeGoals.length} active goal{activeGoals.length !== 1 ? 's' : ''}</p>
                {totalTarget > 0 && <p className="tabular-nums">Target: {formatGBP(totalTarget)}</p>}
              </div>
            </div>
            {totalTarget > 0 && (
              <Progress value={Math.min((totalSaved / totalTarget) * 100, 100)} className="mt-3 [&>div]:bg-primary" />
            )}
          </CardContent>
        </Card>

        <Button size="sm" onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Goal
        </Button>
      </div>

      <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); resetForm() }} title="Create Savings Goal">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Goal Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Holiday Fund" />
          </div>
          <div>
            <label className="text-sm font-medium">Goal Type</label>
            <Select value={goalType} onChange={(e) => setGoalType(e.target.value as SavingsGoalType)}>
              {Object.entries(goalTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Target Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
              <Input type="number" min="1" step="0.01" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} className="pl-7" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Target Date (optional)</label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Linked Account</label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {savingsAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.account_name} ({formatGBP(a.balance)})</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Color</label>
            <div className="flex gap-2 mt-1">
              {ALL_COLORS.map((c) => (
                <button key={c} onClick={() => setColor(c)} className={cn('h-7 w-7 rounded-full transition-all', colorClasses[c].dot, color === c ? 'ring-2 ring-offset-2 ring-primary' : 'opacity-60 hover:opacity-100')} />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleCreate} disabled={isPending} className="w-full">
            {isPending ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </Dialog>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <PiggyBank className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No savings goals yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Create your first savings goal to start tracking your progress.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map((goal) => {
                const Icon = goalTypeIcons[goal.goal_type as SavingsGoalType] || PiggyBank
                const colors = colorClasses[goal.color] || colorClasses.blue
                const pct = Number(goal.target_amount) > 0 ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100) : 0
                const rem = Number(goal.target_amount) - Number(goal.current_amount)
                return (
                  <Link key={goal.id} href={`/savings-goals/${goal.id}`}>
                    <Card variant="raised" interactive className="h-full">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('rounded-xl p-2.5', colors.bg)}><Icon className={cn('h-4 w-4', colors.text)} /></div>
                            <div>
                              <p className="font-medium text-sm">{goal.name}</p>
                              <Badge variant="secondary" className="text-[10px] mt-0.5">{goalTypeLabels[goal.goal_type as SavingsGoalType]}</Badge>
                            </div>
                          </div>
                        </div>
                        <Progress value={pct} className={cn('h-2 mb-2', colors.indicator)} />
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold tabular-nums">{formatGBP(Number(goal.current_amount))}</span>
                          <span className="text-muted-foreground tabular-nums">of {formatGBP(Number(goal.target_amount))}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>{pct.toFixed(0)}% complete</span>
                          {rem > 0 ? <span className="tabular-nums">{formatGBP(rem)} to go</span> : <span className="text-success font-medium">Goal reached!</span>}
                        </div>
                        {goal.target_date && <p className="text-[11px] text-muted-foreground mt-2">Target: {formatDistanceToNow(new Date(goal.target_date), { addSuffix: true })}</p>}
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
          {completedGoals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Completed Goals</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map((goal) => (
                  <Link key={goal.id} href={`/savings-goals/${goal.id}`}>
                    <Card variant="raised" interactive className="opacity-75">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-emerald-500/10 p-2.5"><CheckCircle className="h-4 w-4 text-emerald-500" /></div>
                          <div>
                            <p className="font-medium text-sm">{goal.name}</p>
                            <p className="text-xs text-muted-foreground tabular-nums">{formatGBP(Number(goal.current_amount))} saved</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
