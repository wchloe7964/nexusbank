'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Percent, Pencil, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { updateInterestRate } from './actions'
import type { InterestConfig } from '@/lib/types/limits'

interface InterestClientProps {
  configs: InterestConfig[]
}

const inputClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]'
const labelClass = 'text-[13px] font-medium text-foreground'

export function InterestClient({ configs }: InterestClientProps) {
  const [isPending, startTransition] = useTransition()
  const [editingConfig, setEditingConfig] = useState<InterestConfig | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const savingsConfigs = configs.filter((c) => !c.account_type.includes('loan') && !c.account_type.includes('mortgage'))
  const loanConfigs = configs.filter((c) => c.account_type.includes('loan') || c.account_type.includes('mortgage'))

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  function renderTable(title: string, iconColor: string, items: InterestConfig[], rateColor: string) {
    return (
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
          <Percent className={`h-4 w-4 ${iconColor}`} />
          <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
          <span className="ml-auto text-[11px] text-muted-foreground">Super admin can edit</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title.includes('Lending') ? 'Product' : 'Account Type'}</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Annual Rate</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Effective From</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((config) => (
                <tr key={config.id} className="border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors">
                  <td className="px-4 py-2.5 font-medium text-foreground capitalize">{config.account_type.replace(/_/g, ' ')}</td>
                  <td className={`px-4 py-2.5 font-mono ${rateColor} font-medium`}>
                    {(Number(config.annual_rate) * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(config.effective_from).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant={config.is_active ? 'success' : 'secondary'}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-[12px]">{config.description || '\u2014'}</td>
                  <td className="px-4 py-2.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingConfig(config)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
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

      {renderTable('Deposit Rates (AER)', 'text-[#00AEEF]', savingsConfigs, 'text-[#00AEEF]')}
      {loanConfigs.length > 0 && renderTable('Lending Rates (APR)', 'text-orange-500', loanConfigs, 'text-orange-500')}

      {/* Edit Interest Rate Modal */}
      {editingConfig && (
        <EditInterestModal
          config={editingConfig}
          isPending={isPending}
          onClose={() => setEditingConfig(null)}
          onSubmit={(updates) => {
            startTransition(async () => {
              try {
                await updateInterestRate(editingConfig.id, updates)
                showFeedback('success', `${editingConfig.account_type.replace(/_/g, ' ')} rate updated`)
                setEditingConfig(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to update interest rate')
              }
            })
          }}
        />
      )}
    </div>
  )
}

function EditInterestModal({
  config,
  isPending,
  onClose,
  onSubmit,
}: {
  config: InterestConfig
  isPending: boolean
  onClose: () => void
  onSubmit: (updates: { annual_rate?: number; is_active?: boolean; description?: string }) => void
}) {
  const [rate, setRate] = useState(String((Number(config.annual_rate) * 100).toFixed(2)))
  const [isActive, setIsActive] = useState(config.is_active)
  const [description, setDescription] = useState(config.description || '')

  return (
    <Dialog open onClose={onClose} title="Edit Interest Rate">
      <DialogHeader>
        <DialogTitle>Edit Interest Rate</DialogTitle>
        <DialogDescription>
          Update rate for <strong className="capitalize">{config.account_type.replace(/_/g, ' ')}</strong>.
          Changes take effect immediately.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>Annual Rate (%)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            className={inputClass}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground mt-1">Enter as percentage (e.g. 3.50 for 3.50%)</p>
        </label>
        <label className="block">
          <span className={labelClass}>Description</span>
          <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Standard savings rate" />
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
            annual_rate: parseFloat(rate) / 100,
            is_active: isActive,
            description,
          })}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
