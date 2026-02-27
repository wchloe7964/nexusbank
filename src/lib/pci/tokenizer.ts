import { createAdminClient } from '@/lib/supabase/admin'
import type { CardToken } from '@/lib/types/pci'

/**
 * Generate a PCI-compliant token for a card.
 * Token format: tok_[random 32-char hex]
 * Tokens are stored in the `card_tokens` table and never expose full PAN.
 */
export async function tokenizeCard(
  userId: string,
  cardId: string,
  lastFour: string,
  tokenType: 'payment' | 'display' | 'recurring' = 'payment',
  expiryMonth?: number,
  expiryYear?: number
): Promise<CardToken> {
  const admin = createAdminClient()

  // Generate cryptographic token
  const tokenBytes = new Uint8Array(16)
  crypto.getRandomValues(tokenBytes)
  const token = 'tok_' + Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  // Set expiry: payment tokens last 24 hours, recurring last until card expiry
  let expiresAt: string | null = null
  if (tokenType === 'payment') {
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  } else if (tokenType === 'display') {
    expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
  }

  const { data, error } = await admin
    .from('card_tokens')
    .insert({
      user_id: userId,
      token,
      card_id: cardId,
      token_type: tokenType,
      last_four: lastFour,
      expiry_month: expiryMonth ?? null,
      expiry_year: expiryYear ?? null,
      is_active: true,
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) {
    console.error('Tokenization error:', error.message)
    throw new Error('Tokenization failed. Please try again.')
  }

  return data as CardToken
}

/**
 * Detokenize: resolve a token back to card details.
 * Returns only the token metadata — never returns full PAN.
 */
export async function detokenize(token: string): Promise<CardToken | null> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('card_tokens')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    // Mark as inactive
    await admin.from('card_tokens').update({ is_active: false }).eq('id', data.id)
    return null
  }

  return data as CardToken
}

/**
 * Revoke a token.
 */
export async function revokeToken(tokenId: string): Promise<void> {
  const admin = createAdminClient()
  await admin.from('card_tokens').update({ is_active: false }).eq('id', tokenId)
}
