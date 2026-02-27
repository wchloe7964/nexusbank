'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import { alertTypeConfigs, presetAlertSuggestions } from '@/lib/constants/spending-alerts'
import { transactionCategories } from '@/lib/constants/categories'
import { Plus, Trash2, Bell, BellOff, Zap, AlertTriangle } from 'lucide-react'
import type { SpendingAlert, SpendingAlertType, Account } from '@/lib/types'
import { createSpendingAlert, deleteSpendingAlert, toggleSpendingAlert } from './actions'

interface AlertsClientProps {
  alerts: SpendingAlert[]
  accounts: Account[]
  triggeredAlertIds: string[]
}

export function AlertsClient({ alerts: initialAlerts, accounts, triggeredAlertIds }: AlertsClientProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [showCreate, setShowCreate] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedType, setSelectedType] = useState<SpendingAlertType | null>(null)
  const [alertName, setAlertName] = useState('')
  const [threshold, setThreshold] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [merchantName, setMerchantName] = useState('')
  const [createError, setCreateError] = useState('')
  const [isPending, startTransition] = useTransition()

  const activeCount = alerts.filter(a => a.is_active).length
  const triggeredCount = alerts.filter(a => triggeredAlertIds.includes(a.id)).length

  function openCreateDialog() {
    setStep(1)
    setSelectedType(null)
    setAlertName('')
    setThreshold('')
    setSelectedAccountId('')
    setSelectedCategory('')
    setMerchantName('')
    setCreateError('')
    setShowCreate(true)
  }

  function selectType(type: SpendingAlertType) {
    setSelectedType(type)
    setStep(2)
  }

  function goToStep3() {
    if (!threshold || parseFloat(threshold) <= 0) {
      setCreateError('Please enter a valid threshold amount')
      return
    }
    if (selectedType === 'category_monthly' && !selectedCategory) {
      setCreateError('Please select a category')
      return
    }
    if (selectedType === 'merchant_payment' && !merchantName.trim()) {
      setCreateError('Please enter a merchant name')
      return
    }
    setCreateError('')
    const config = alertTypeConfigs[selectedType!]
    setAlertName(`${config.label} - ${formatGBP(parseFloat(threshold))}`)
    setStep(3)
  }

  function handleCreate() {
    if (!alertName.trim()) {
      setCreateError('Please enter a name')
      return
    }
    setCreateError('')
    startTransition(async () => {
      try {
        await createSpendingAlert({
          name: alertName.trim(),
          alertType: selectedType!,
          accountId: selectedAccountId || undefined,
          category: selectedCategory || undefined,
          merchantName: merchantName || undefined,
          thresholdAmount: parseFloat(threshold),
        })
        // Optimistic add
        setAlerts(prev => [{
          id: 'temp-' + Date.now(),
          user_id: '',
          name: alertName.trim(),
          alert_type: selectedType!,
          account_id: selectedAccountId || null,
          category: selectedCategory || null,
          merchant_name: merchantName || null,
          threshold_amount: parseFloat(threshold),
          is_active: true,
          last_triggered_at: null,
          trigger_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev])
        setShowCreate(false)
      } catch (e) {
        setCreateError(e instanceof Error ? e.message : 'Failed to create alert')
      }
    })
  }

  function handleQuickCreate(suggestion: typeof presetAlertSuggestions[0]) {
    startTransition(async () => {
      try {
        await createSpendingAlert({
          name: suggestion.name,
          alertType: suggestion.alert_type,
          category: suggestion.category,
          thresholdAmount: suggestion.threshold_amount,
        })
        setAlerts(prev => [{
          id: 'temp-' + Date.now(),
          user_id: '',
          name: suggestion.name,
          alert_type: suggestion.alert_type,
          account_id: null,
          category: suggestion.category || null,
          merchant_name: null,
          threshold_amount: suggestion.threshold_amount,
          is_active: true,
          last_triggered_at: null,
          trigger_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, ...prev])
      } catch {
        // Silently fail for quick create
      }
    })
  }

  function handleToggle(alertId: string, isActive: boolean) {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_active: isActive } : a))
    startTransition(async () => {
      try {
        await toggleSpendingAlert(alertId, isActive)
      } catch {
        setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_active: !isActive } : a))
      }
    })
  }

  function handleDelete(alertId: string) {
    const prev = alerts
    setAlerts(a => a.filter(x => x.id !== alertId))
    startTransition(async () => {
      try {
        await deleteSpendingAlert(alertId)
      } catch {
        setAlerts(prev)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Total Alerts</p>
            <p className="text-xl font-bold tracking-tight mt-1 tabular-nums">{alerts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-xl font-bold tracking-tight mt-1 tabular-nums text-emerald-500">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Triggered</p>
            <p className={`text-xl font-bold tracking-tight mt-1 tabular-nums ${triggeredCount > 0 ? 'text-amber-500' : ''}`}>{triggeredCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Suggestions */}
      {alerts.length === 0 && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base tracking-tight flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Quick Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">Get started with these popular alert rules:</p>
            <div className="space-y-2">
              {presetAlertSuggestions.map((suggestion) => {
                const config = alertTypeConfigs[suggestion.alert_type]
                const SugIcon = config.icon
                return (
                  <button
                    key={suggestion.name}
                    type="button"
                    onClick={() => handleQuickCreate(suggestion)}
                    disabled={isPending}
                    className="flex items-center justify-between w-full p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2 ${config.bg}`}>
                        <SugIcon className={`h-3.5 w-3.5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{suggestion.name}</p>
                        <p className="text-xs text-muted-foreground">Threshold: {formatGBP(suggestion.threshold_amount)}</p>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert List */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base tracking-tight">Your Alerts</CardTitle>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              New Alert
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No spending alerts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first alert to start monitoring</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const config = alertTypeConfigs[alert.alert_type]
                const AlertIcon = config.icon
                const isTriggered = triggeredAlertIds.includes(alert.id)
                return (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      isTriggered ? 'border-amber-500/50 bg-amber-500/[0.03]' : ''
                    } ${!alert.is_active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-xl p-2.5 ${config.bg}`}>
                        <AlertIcon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{alert.name}</p>
                          {isTriggered && (
                            <Badge variant="warning" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Triggered
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.label} &middot; {formatGBP(alert.threshold_amount)}
                          {alert.category && ` · ${transactionCategories[alert.category as keyof typeof transactionCategories]?.label || alert.category}`}
                          {alert.merchant_name && ` · ${alert.merchant_name}`}
                        </p>
                        {alert.trigger_count > 0 && (
                          <p className="text-[10px] text-muted-foreground">Triggered {alert.trigger_count} time{alert.trigger_count !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) => handleToggle(alert.id, checked)}
                      />
                      <button
                        type="button"
                        onClick={() => handleDelete(alert.id)}
                        className="rounded-lg p-1.5 hover:bg-destructive/10 transition-colors"
                        title="Delete alert"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={step === 1 ? 'Choose Alert Type' : step === 2 ? 'Configure Alert' : 'Name Your Alert'}
      >
        {step === 1 && (
          <div className="space-y-2">
            {(Object.entries(alertTypeConfigs) as [SpendingAlertType, typeof alertTypeConfigs[SpendingAlertType]][]).map(([type, config]) => {
              const TypeIcon = config.icon
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectType(type)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className={`rounded-xl p-2.5 ${config.bg}`}>
                    <TypeIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && selectedType && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Threshold Amount (£)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={alertTypeConfigs[selectedType].placeholder}
                className="mt-1"
              />
            </div>

            {(selectedType === 'balance_below' || selectedType === 'single_transaction' || selectedType === 'large_incoming') && accounts.length > 1 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Account (optional)</label>
                <Select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)} className="mt-1">
                  <option value="">All accounts</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.nickname || acc.account_name}</option>
                  ))}
                </Select>
              </div>
            )}

            {selectedType === 'category_monthly' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mt-1">
                  <option value="">Select category...</option>
                  {Object.entries(transactionCategories).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </Select>
              </div>
            )}

            {selectedType === 'merchant_payment' && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">Merchant Name</label>
                <Input
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. Amazon"
                  className="mt-1"
                />
              </div>
            )}

            {createError && <p className="text-sm text-destructive">{createError}</p>}

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={goToStep3}>Next</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Alert Name</label>
              <Input
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                placeholder="Give your alert a name..."
                maxLength={50}
                className="mt-1"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="font-medium">{alertTypeConfigs[selectedType!].label}</p>
              <p className="text-muted-foreground text-xs mt-1">
                Threshold: {formatGBP(parseFloat(threshold) || 0)}
                {selectedCategory && ` · ${transactionCategories[selectedCategory as keyof typeof transactionCategories]?.label || selectedCategory}`}
                {merchantName && ` · ${merchantName}`}
              </p>
            </div>

            {createError && <p className="text-sm text-destructive">{createError}</p>}

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={isPending}>
                {isPending ? 'Creating...' : 'Create Alert'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
