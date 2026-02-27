'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toggleFraudRule } from '../actions'
import { Settings2, ToggleLeft, ToggleRight } from 'lucide-react'
import type { FraudRule } from '@/lib/types/fraud'

interface FraudRulesClientProps {
  rules: FraudRule[]
}

export function FraudRulesClient({ rules }: FraudRulesClientProps) {
  const router = useRouter()
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleToggle = async (ruleId: string, currentActive: boolean) => {
    setTogglingId(ruleId)
    try {
      await toggleFraudRule(ruleId, !currentActive)
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to toggle rule')
    } finally {
      setTogglingId(null)
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'velocity': return 'default'
      case 'amount': return 'warning'
      case 'geographic': return 'default'
      case 'behavioural': return 'destructive'
      case 'device': return 'secondary'
      case 'time_based': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      {rules.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-10 text-center">
          <Settings2 className="h-8 w-8 text-muted-foreground/25 mx-auto mb-2" />
          <p className="text-[13px] font-medium text-muted-foreground">No fraud rules configured</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-lg border border-border bg-card p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[14px] font-semibold">{rule.name}</h3>
                  <Badge variant={typeColor(rule.rule_type) as 'default' | 'secondary' | 'warning' | 'destructive'}>
                    {rule.rule_type.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant={rule.is_active ? 'success' : 'secondary'}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {rule.description && (
                  <p className="text-[12px] text-muted-foreground">{rule.description}</p>
                )}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1">
                  <span>Weight: <strong className="text-foreground">{rule.weight}</strong>/100</span>
                  <span>Conditions: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{JSON.stringify(rule.conditions)}</code></span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggle(rule.id, rule.is_active)}
                disabled={togglingId === rule.id}
                className="shrink-0"
              >
                {rule.is_active
                  ? <ToggleRight className="h-5 w-5 text-[#00703C]" />
                  : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
