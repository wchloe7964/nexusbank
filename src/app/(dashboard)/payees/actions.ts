'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/validation'
import { modulusCheck } from '@/lib/payments/modulus-check'
import { confirmPayee, getCopMessage } from '@/lib/payments/cop'
import { logAuditEvent } from '@/lib/audit'

export async function addPayee(data: {
  name: string
  sortCode: string
  accountNumber: string
  reference?: string
}): Promise<{
  success: boolean
  blocked?: boolean
  blockReason?: string
  copResult?: string
  copMessage?: string
}> {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  if (!data.name.trim()) throw new Error('Payee name is required')
  if (!data.sortCode.trim()) throw new Error('Sort code is required')
  if (!data.accountNumber.trim()) throw new Error('Account number is required')

  const payeeName = data.name.trim()
  const sortCode = data.sortCode.trim()
  const accountNumber = data.accountNumber.trim()

  // ── Modulus check (sort code / account number validation) ──
  const modCheck = modulusCheck(sortCode, accountNumber)
  if (!modCheck.valid) {
    return {
      success: false,
      blocked: true,
      blockReason: modCheck.error || 'Invalid sort code or account number',
    }
  }

  // ── Confirmation of Payee ──
  const copCheck = confirmPayee(sortCode, accountNumber, payeeName)
  const copMsg = getCopMessage(copCheck.result, copCheck.matchedName)

  if (!copMsg.canProceed) {
    await logAuditEvent({
      eventType: 'payment_event',
      actorId: userId,
      actorRole: 'customer',
      targetTable: 'payees',
      targetId: null,
      action: 'payee_blocked_cop',
      details: {
        payee_name: payeeName,
        cop_result: copCheck.result,
        sort_code: sortCode,
      },
    })
    return {
      success: false,
      blocked: true,
      blockReason: copMsg.description,
      copResult: copCheck.result,
      copMessage: copMsg.title,
    }
  }

  // ── Check for duplicate payee ──
  const { data: existingPayee } = await supabase
    .from('payees')
    .select('id')
    .eq('user_id', userId)
    .eq('sort_code', sortCode)
    .eq('account_number', accountNumber)
    .maybeSingle()

  if (existingPayee) {
    return {
      success: false,
      blocked: true,
      blockReason: 'A payee with this sort code and account number already exists.',
    }
  }

  const { error } = await supabase.from('payees').insert({
    user_id: userId,
    name: payeeName,
    sort_code: sortCode,
    account_number: accountNumber,
    reference: data.reference?.trim() || null,
    is_favourite: false,
  })

  if (error) throw error

  revalidatePath('/payees')
  return { success: true, copResult: copCheck.result }
}

export async function togglePayeeFavourite(payeeId: string, isFavourite: boolean) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('payees')
    .update({ is_favourite: isFavourite })
    .eq('id', payeeId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/payees')
}

export async function deletePayee(payeeId: string) {
  const supabase = await createClient()
  const userId = await requireAuth(supabase)

  const { error } = await supabase
    .from('payees')
    .delete()
    .eq('id', payeeId)
    .eq('user_id', userId)

  if (error) throw error
  revalidatePath('/payees')
}
