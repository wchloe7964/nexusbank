'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { cn } from '@/lib/utils/cn'
import {
  ArrowDownToLine, ArrowUpFromLine, CheckCircle, Trash2, ArrowLeft,
  PiggyBank, Target, Palmtree, Home, Wallet, RotateCcw, Sparkles,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SavingsGoal, SavingsGoalType, SavingsGoalColor } from '@/lib/types'
import { adjustSavingsGoal, deleteSavingsGoal } from '../actions'

interface GoalDetailClientProps {
  goal: SavingsGoal
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

const colorClasses: Record<SavingsGoalColor, { bg: string; text: string; indicator: string }> = {
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-500', indicator: '[&>div]:bg-blue-500' },
  green: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', indicator: '[&>div]:bg-emerald-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', indicator: '[&>div]:bg-purple-500' },
  orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', indicator: '[&>div]:bg-orange-500' },
  pink: { bg: 'bg-pink-500/10', text: 'text-pink-500', indicator: '[&>div]:bg-pink-500' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', indicator: '[&>div]:bg-cyan-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', indicator: '[&>div]:bg-amber-500' },
  red: { bg: 'bg-red-500/10', text: 'text-red-500', indicator: '[&>div]:bg-red-500' },
}

type Step = 'idle' | 'form' | 'confirm' | 'success'
type FlowType = 'deposit' | 'withdraw'

export function GoalDetailClient({ goal }: GoalDetailClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('idle')
  const [flowType, setFlowType] = useState<FlowType>('deposit')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const Icon = goalTypeIcons[goal.goal_type as SavingsGoalType] || PiggyBank
  const colors = colorClasses[goal.color] || colorClasses.blue
  const percentage = Number(goal.target_amount) > 0
    ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)
    : 0
  const remaining = Number(goal.target_amount) - Number(goal.current_amount)

  function startFlow(type: FlowType) {
    setFlowType(type)
    setAmount('')
    setError('')
    setStep('form')
  }

  function handleConfirm() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { setError('Please enter a valid amount'); return }

    if (flowType === 'withdraw' && amt > Number(goal.current_amount)) {
      setError(`Maximum withdrawal is ${formatGBP(Number(goal.current_amount))}`)
      return
    }

    setError('')
    setStep('confirm')
  }

  function handleExecute() {
    const amt = parseFloat(amount)
    startTransition(async () => {
      try {
        await adjustSavingsGoal(goal.id, amt, flowType === 'deposit')
        setStep('success')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
        setStep('form')
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteSavingsGoal(goal.id)
        router.push('/savings-goals')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete goal')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Link href="/savings-goals" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Savings Goals
      </Link>

      {/* Progress Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className={cn('rounded-xl p-3', colors.bg)}>
                <Icon className={cn('h-6 w-6', colors.text)} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{goal.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{goalTypeLabels[goal.goal_type as SavingsGoalType]}</Badge>
                  {goal.is_completed && (
                    <Badge variant="success" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
            <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} title="Delete Savings Goal">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete &ldquo;{goal.name}&rdquo;?
                {Number(goal.current_amount) > 0 && (
                  <> The remaining {formatGBP(Number(goal.current_amount))} will be returned to your linked account.</>
                )}
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={isPending}>
                  {isPending ? 'Deleting...' : 'Delete Goal'}
                </Button>
              </div>
            </Dialog>
          </div>

          {/* Large progress */}
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold tracking-tight tabular-nums">{formatGBP(Number(goal.current_amount))}</p>
                <p className="text-sm text-muted-foreground">of {formatGBP(Number(goal.target_amount))} target</p>
              </div>
              <p className="text-2xl font-bold tabular-nums">{percentage.toFixed(0)}%</p>
            </div>
            <Progress value={percentage} className={cn('h-3', colors.indicator)} />
            <div className="flex justify-between text-xs text-muted-foreground">
              {remaining > 0 ? (
                <span className="tabular-nums">{formatGBP(remaining)} remaining</span>
              ) : (
                <span className="text-success font-medium">Target reached!</span>
              )}
              {goal.target_date && (
                <span>Target: {format(new Date(goal.target_date), 'd MMM yyyy')} ({formatDistanceToNow(new Date(goal.target_date), { addSuffix: true })})</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      {goal.account && (
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground mb-1">Linked Account</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2">
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{goal.account.account_name}</p>
                  <p className="text-xs text-muted-foreground">Available: {formatGBP(goal.account.available_balance)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions / Flow */}
      {step === 'idle' && !goal.is_completed && (
        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => startFlow('deposit')}>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Add Money
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => startFlow('withdraw')} disabled={Number(goal.current_amount) === 0}>
            <ArrowUpFromLine className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>
      )}

      {step === 'form' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">
              {flowType === 'deposit' ? 'Add Money to Goal' : 'Withdraw from Goal'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={flowType === 'withdraw' ? Number(goal.current_amount) : undefined}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
                {flowType === 'withdraw' && (
                  <p className="text-xs text-muted-foreground mt-1">Maximum: {formatGBP(Number(goal.current_amount))}</p>
                )}
                {flowType === 'deposit' && goal.account && (
                  <p className="text-xs text-muted-foreground mt-1">Available in account: {formatGBP(goal.account.available_balance)}</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setStep('idle')}>Cancel</Button>
                <Button className="flex-1" onClick={handleConfirm}>Continue</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'confirm' && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4">Confirm {flowType === 'deposit' ? 'Deposit' : 'Withdrawal'}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">{flowType === 'deposit' ? 'Add to' : 'Withdraw from'}</span>
                <span className="font-medium">{goal.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold tabular-nums">{formatGBP(parseFloat(amount))}</span>
              </div>
              {goal.account && (
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">{flowType === 'deposit' ? 'From account' : 'To account'}</span>
                  <span className="font-medium">{goal.account.account_name}</span>
                </div>
              )}
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">New goal balance</span>
                <span className="font-semibold tabular-nums">
                  {formatGBP(Number(goal.current_amount) + (flowType === 'deposit' ? parseFloat(amount) : -parseFloat(amount)))}
                </span>
              </div>
            </div>
            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => setStep('form')}>Back</Button>
              <Button className="flex-1" onClick={handleExecute} disabled={isPending}>
                {isPending ? 'Processing...' : `Confirm ${flowType === 'deposit' ? 'Deposit' : 'Withdrawal'}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'success' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {flowType === 'deposit' ? 'Money Added' : 'Money Withdrawn'}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatGBP(parseFloat(amount))} has been {flowType === 'deposit' ? 'added to' : 'withdrawn from'} your goal.
            </p>
            <div className="flex gap-2 mt-6">
              <Button variant="ghost" className="flex-1" onClick={() => { setStep('idle'); setAmount('') }}>Done</Button>
              <Link href="/savings-goals" className="flex-1">
                <Button variant="secondary" className="w-full">Back to Goals</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Info */}
      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-3">Goal Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(goal.created_at), 'd MMM yyyy')}</span>
            </div>
            {goal.completed_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completed</span>
                <span>{format(new Date(goal.completed_at), 'd MMM yyyy')}</span>
              </div>
            )}
            {goal.target_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Date</span>
                <span>{format(new Date(goal.target_date), 'd MMM yyyy')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
