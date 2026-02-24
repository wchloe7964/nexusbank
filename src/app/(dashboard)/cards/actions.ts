'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleCardFreeze(cardId: string, isFrozen: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({ is_frozen: isFrozen, status: isFrozen ? 'frozen' : 'active' })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}

export async function toggleCardContactless(cardId: string, isEnabled: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('cards')
    .update({ is_contactless_enabled: isEnabled })
    .eq('id', cardId)

  if (error) throw error
  revalidatePath('/cards')
}
