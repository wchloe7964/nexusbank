import { createClient } from '@/lib/supabase/server'
import type { SpendingAlert } from '@/lib/types'

export async function getSpendingAlerts(): Promise<SpendingAlert[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('spending_alerts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as SpendingAlert[]
}

export async function evaluateAlerts(): Promise<{
  triggered: { alert: SpendingAlert; currentValue: number }[]
}> {
  const supabase = await createClient()

  const { data: alerts } = await supabase
    .from('spending_alerts')
    .select('*')
    .eq('is_active', true)

  if (!alerts || alerts.length === 0) return { triggered: [] }

  const triggered: { alert: SpendingAlert; currentValue: number }[] = []

  for (const alert of alerts as SpendingAlert[]) {
    switch (alert.alert_type) {
      case 'balance_below': {
        // Check if any account balance is below threshold
        const query = alert.account_id
          ? supabase.from('accounts').select('balance').eq('id', alert.account_id)
          : supabase.from('accounts').select('balance')
        const { data: accs } = await query
        for (const acc of accs ?? []) {
          if (Number(acc.balance) < alert.threshold_amount) {
            triggered.push({ alert, currentValue: Number(acc.balance) })
            break
          }
        }
        break
      }
      case 'category_monthly': {
        if (!alert.category) break
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        const { data: txs } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'debit')
          .eq('category', alert.category)
          .gte('transaction_date', monthStart)
        const total = (txs ?? []).reduce((s, t) => s + Number(t.amount), 0)
        if (total > alert.threshold_amount) {
          triggered.push({ alert, currentValue: total })
        }
        break
      }
      // Other alert types checked on transaction insertion (not polled)
      default:
        break
    }
  }

  return { triggered }
}
