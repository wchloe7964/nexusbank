'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Gauge, ShieldCheck, Clock, Pencil, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { updateTransactionLimit, updateCoolingPeriod } from './actions'
import type { TransactionLimit, CoolingPeriodConfig } from '@/lib/types/limits'

interface LimitsClientProps {
  limits: TransactionLimit[]
  cooling: CoolingPeriodConfig[]
  scaConfig: { config_key: string; config_value: Record<string, unknown>; description: string | null }[]
}

function formatGBP(amount: number) {
  return `£${amount.toLocaleString()}`
}

const inputClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]'
const labelClass = 'text-[13px] font-medium text-foreground'

export function LimitsClient({ limits, cooling, scaConfig }: LimitsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [editingLimit, setEditingLimit] = useState<TransactionLimit | null>(null)
  const [editingCooling, setEditingCooling] = useState<CoolingPeriodConfig | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className={cn(
          'fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-top-2 text-[13px] font-medium',
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
        )}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {feedback.message}
        </div>
      )}

      {/* Transaction Limits */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-[#00AEEF]" />
          <h2 className="text-[14px] font-semibold text-foreground">Transaction Limits by KYC Level</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">Super admin can edit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">KYC Level</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Single Limit</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Daily Limit</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Monthly Limit</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {limits.map((limit) => (
                <tr key={limit.id} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5">
                    <div>
                      <span className="font-medium text-foreground capitalize">{limit.kyc_level}</span>
                      {limit.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{limit.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{formatGBP(Number(limit.single_transaction_limit))}</td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{formatGBP(Number(limit.daily_limit))}</td>
                  <td className="px-4 py-2.5 font-mono text-foreground">{formatGBP(Number(limit.monthly_limit))}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={limit.is_active ? 'success' : 'secondary'}>
                      {limit.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingLimit(limit)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCA Configuration */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#00AEEF]" />
          <h2 className="text-[14px] font-semibold text-foreground">Strong Customer Authentication (SCA)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Setting</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Value</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody>
              {scaConfig.map((row) => (
                <tr key={row.config_key} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.config_key.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5 font-mono text-[#00AEEF]">
                    {JSON.stringify((row.config_value as Record<string, unknown>)?.value ?? row.config_value)}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row.description || '\u2014'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cooling Period Configuration */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#00AEEF]" />
          <h2 className="text-[14px] font-semibold text-foreground">Payee Cooling Periods</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">Super admin can edit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Payment Rail</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cooling Period</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {cooling.map((config) => (
                <tr key={config.id} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground uppercase">{config.payment_rail}</td>
                  <td className="px-4 py-2.5 font-mono text-foreground">
                    {config.cooling_hours === 0 ? 'None' : `${config.cooling_hours} hours`}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={config.is_active ? 'success' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{config.description || '\u2014'}</td>
                  <td className="px-4 py-2.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingCooling(config)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Limit Modal */}
      {editingLimit && (
        <EditLimitModal
          limit={editingLimit}
          isPending={isPending}
          onClose={() => setEditingLimit(null)}
          onSubmit={(updates) => {
            startTransition(async () => {
              try {
                await updateTransactionLimit(editingLimit.id, updates)
                showFeedback('success', `${editingLimit.kyc_level} limits updated`)
                setEditingLimit(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to update limits')
              }
            })
          }}
        />
      )}

      {/* Edit Cooling Period Modal */}
      {editingCooling && (
        <EditCoolingModal
          config={editingCooling}
          isPending={isPending}
          onClose={() => setEditingCooling(null)}
          onSubmit={(updates) => {
            startTransition(async () => {
              try {
                await updateCoolingPeriod(editingCooling.id, updates)
                showFeedback('success', `${editingCooling.payment_rail} cooling period updated`)
                setEditingCooling(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to update cooling period')
              }
            })
          }}
        />
      )}
    </div>
  )
}

function EditLimitModal({
  limit,
  isPending,
  onClose,
  onSubmit,
}: {
  limit: TransactionLimit
  isPending: boolean
  onClose: () => void
  onSubmit: (updates: { single_transaction_limit?: number; daily_limit?: number; monthly_limit?: number; is_active?: boolean }) => void
}) {
  const [single, setSingle] = useState(String(Number(limit.single_transaction_limit)))
  const [daily, setDaily] = useState(String(Number(limit.daily_limit)))
  const [monthly, setMonthly] = useState(String(Number(limit.monthly_limit)))
  const [isActive, setIsActive] = useState(limit.is_active)

  return (
    <Dialog open onClose={onClose} title="Edit Transaction Limits">
      <DialogHeader>
        <DialogTitle>Edit Transaction Limits</DialogTitle>
        <DialogDescription>Update limits for KYC level: <strong className="capitalize">{limit.kyc_level}</strong>. Changes take effect immediately.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>Single Transaction Limit (£)</span>
          <input type="number" className={inputClass} value={single} onChange={(e) => setSingle(e.target.value)} min="0" step="100" />
        </label>
        <label className="block">
          <span className={labelClass}>Daily Limit (£)</span>
          <input type="number" className={inputClass} value={daily} onChange={(e) => setDaily(e.target.value)} min="0" step="100" />
        </label>
        <label className="block">
          <span className={labelClass}>Monthly Limit (£)</span>
          <input type="number" className={inputClass} value={monthly} onChange={(e) => setMonthly(e.target.value)} min="0" step="1000" />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-border" />
          <span className={labelClass}>Active</span>
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
          onClick={() => onSubmit({
            single_transaction_limit: parseFloat(single),
            daily_limit: parseFloat(daily),
            monthly_limit: parseFloat(monthly),
            is_active: isActive,
          })}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function EditCoolingModal({
  config,
  isPending,
  onClose,
  onSubmit,
}: {
  config: CoolingPeriodConfig
  isPending: boolean
  onClose: () => void
  onSubmit: (updates: { cooling_hours?: number; is_active?: boolean }) => void
}) {
  const [hours, setHours] = useState(String(config.cooling_hours))
  const [isActive, setIsActive] = useState(config.is_active)

  return (
    <Dialog open onClose={onClose} title="Edit Cooling Period">
      <DialogHeader>
        <DialogTitle>Edit Cooling Period</DialogTitle>
        <DialogDescription>Update cooling period for <strong className="uppercase">{config.payment_rail}</strong> payments.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>Cooling Period (hours)</span>
          <input type="number" className={inputClass} value={hours} onChange={(e) => setHours(e.target.value)} min="0" step="1" />
          <p className="text-[11px] text-muted-foreground mt-1">Set to 0 to disable cooling period for this rail</p>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-border" />
          <span className={labelClass}>Active</span>
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
          onClick={() => onSubmit({ cooling_hours: parseInt(hours), is_active: isActive })}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
