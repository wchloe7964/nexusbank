'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ScaChallengeResult, ScaConfig } from '@/lib/types/limits'

/**
 * Get the current SCA configuration.
 */
export async function getScaConfig(): Promise<ScaConfig> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('sca_config')
    .select('config_key, config_value')

  const config: ScaConfig = {
    amount_threshold: 25,
    enabled: true,
    max_attempts: 3,
    expiry_seconds: 300,
    sensitive_actions: ['change_password', 'toggle_2fa', 'add_payee', 'large_payment'],
  }

  for (const row of data ?? []) {
    const val = (row.config_value as Record<string, unknown>)?.value
    switch (row.config_key) {
      case 'amount_threshold': config.amount_threshold = Number(val) || 25; break
      case 'enabled': config.enabled = val !== false; break
      case 'max_attempts': config.max_attempts = Number(val) || 3; break
      case 'expiry_seconds': config.expiry_seconds = Number(val) || 300; break
      case 'sensitive_actions': config.sensitive_actions = (val as string[]) || []; break
    }
  }

  return config
}

/**
 * Determine whether SCA is required for a given action/amount.
 */
export async function requiresSca(
  amount?: number,
  action?: string
): Promise<boolean> {
  const config = await getScaConfig()

  if (!config.enabled) return false

  // Always require SCA for sensitive actions
  if (action && config.sensitive_actions.includes(action)) return true

  // Require SCA for amounts above threshold
  if (amount !== undefined && amount > config.amount_threshold) return true

  return false
}

/**
 * Create a new SCA challenge for the authenticated user.
 * Returns the challengeId (the code is NOT returned to the client — in production
 * it would be sent via SMS/email/push. Here we store it for verification).
 */
export async function createScaChallenge(
  action: string,
  metadata: Record<string, unknown> = {}
): Promise<ScaChallengeResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const config = await getScaConfig()

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000))

  const expiresAt = new Date(Date.now() + config.expiry_seconds * 1000).toISOString()

  const { data, error } = await supabase
    .from('sca_challenges')
    .insert({
      user_id: user.id,
      challenge_code: code,
      action,
      metadata,
      max_attempts: config.max_attempts,
      expires_at: expiresAt,
    })
    .select('id, expires_at')
    .single()

  if (error) throw new Error('Failed to create SCA challenge')

  // In production, send code via SMS/email/push notification here.
  // For demo purposes, we log it (would be removed in production).
  console.log(`[SCA] Challenge ${data.id}: Code ${code} for action "${action}"`)

  return {
    challengeId: data.id,
    expiresAt: data.expires_at,
  }
}

/**
 * Verify an SCA challenge code.
 * Returns true if the code matches and the challenge is still valid.
 */
export async function verifyScaChallenge(
  challengeId: string,
  code: string
): Promise<{ verified: boolean; error?: string; attemptsRemaining?: number }> {
  const admin = createAdminClient()

  // Fetch the challenge
  const { data: challenge, error } = await admin
    .from('sca_challenges')
    .select('*')
    .eq('id', challengeId)
    .single()

  if (error || !challenge) {
    return { verified: false, error: 'Challenge not found' }
  }

  // Check if already verified
  if (challenge.verified) {
    return { verified: true }
  }

  // Check if expired
  if (new Date(challenge.expires_at) < new Date()) {
    return { verified: false, error: 'Challenge has expired. Please request a new code.' }
  }

  // Check if max attempts exceeded
  if (challenge.attempts >= challenge.max_attempts) {
    return { verified: false, error: 'Too many attempts. Please request a new code.' }
  }

  // Increment attempt count
  await admin
    .from('sca_challenges')
    .update({ attempts: challenge.attempts + 1 })
    .eq('id', challengeId)

  // Check code
  if (challenge.challenge_code !== code) {
    const remaining = challenge.max_attempts - challenge.attempts - 1
    return {
      verified: false,
      error: `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      attemptsRemaining: remaining,
    }
  }

  // Mark as verified
  await admin
    .from('sca_challenges')
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
    })
    .eq('id', challengeId)

  return { verified: true }
}

/**
 * Check if an SCA challenge has been verified (for server-side validation).
 */
export async function isScaChallengeVerified(challengeId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('sca_challenges')
    .select('verified, expires_at')
    .eq('id', challengeId)
    .single()

  if (!data) return false
  if (new Date(data.expires_at) < new Date()) return false
  return data.verified === true
}
