import { createClient } from '@/lib/supabase/server'
import type { TransactionNote } from '@/lib/types'

export async function getNotesForTransactions(transactionIds: string[]): Promise<Map<string, TransactionNote>> {
  if (transactionIds.length === 0) return new Map()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transaction_notes')
    .select('*')
    .in('transaction_id', transactionIds)

  if (error) {
    console.error('getNotesForTransactions error:', error.message)
    return new Map()
  }

  const map = new Map<string, TransactionNote>()
  for (const note of (data ?? []) as TransactionNote[]) {
    map.set(note.transaction_id, note)
  }
  return map
}

export async function getNoteForTransaction(transactionId: string): Promise<TransactionNote | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transaction_notes')
    .select('*')
    .eq('transaction_id', transactionId)
    .maybeSingle()

  if (error) {
    console.error('getNoteForTransaction error:', error.message)
    return null
  }
  return data as TransactionNote | null
}

export async function getAllUserTags(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('transaction_notes')
    .select('tags')

  if (error) {
    console.error('getAllUserTags error:', error.message)
    return []
  }

  const tagSet = new Set<string>()
  for (const row of (data ?? [])) {
    if (Array.isArray(row.tags)) {
      for (const tag of row.tags) {
        tagSet.add(tag)
      }
    }
  }
  return Array.from(tagSet).sort()
}
