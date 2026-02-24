import { createClient } from '@/lib/supabase/server'
import type { Card } from '@/lib/types'

export async function getCards(): Promise<Card[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('created_at')

  if (error) throw error
  return data as Card[]
}

export async function getCardById(cardId: string): Promise<Card | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .single()

  if (error) return null
  return data as Card
}
