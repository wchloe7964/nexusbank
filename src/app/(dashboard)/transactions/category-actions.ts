'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const validCategories = [
  'transfer', 'salary', 'bills', 'groceries', 'shopping',
  'transport', 'entertainment', 'dining', 'health', 'education',
  'subscriptions', 'cash', 'other',
]

export async function updateTransactionCategory(transactionId: string, newCategory: string) {
  if (!validCategories.includes(newCategory)) throw new Error('Invalid category')

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  // Fetch current transaction to preserve original category
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('category, original_category')
    .eq('id', transactionId)
    .single()

  if (fetchError || !tx) throw new Error('Transaction not found')

  // Store original category on first edit only
  const originalCategory = tx.original_category || tx.category

  const { error } = await supabase
    .from('transactions')
    .update({
      category: newCategory,
      original_category: originalCategory,
      category_edited_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  if (error) {
    console.error('Category update error:', error.message)
    throw new Error('Failed to update category. Please try again.')
  }

  revalidatePath('/transactions')
  revalidatePath('/insights')
  revalidatePath('/budgets')
}

export async function resetTransactionCategory(transactionId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Not authenticated')

  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('original_category')
    .eq('id', transactionId)
    .single()

  if (fetchError || !tx) throw new Error('Transaction not found')
  if (!tx.original_category) throw new Error('Category has not been edited')

  const { error } = await supabase
    .from('transactions')
    .update({
      category: tx.original_category,
      original_category: null,
      category_edited_at: null,
    })
    .eq('id', transactionId)

  if (error) throw new Error('Failed to reset category')

  revalidatePath('/transactions')
  revalidatePath('/insights')
  revalidatePath('/budgets')
}
