'use server'

import { createHash, pbkdf2Sync, timingSafeEqual } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const PIN_ITERATIONS = 100_000
const PIN_KEY_LENGTH = 64
const PIN_DIGEST = 'sha512'

/**
 * Hash a 4-digit PIN using PBKDF2 with the user's ID as salt.
 * PBKDF2 with 100k iterations makes brute-forcing the 10,000 possible
 * 4-digit PINs computationally expensive even if the database is compromised.
 */
function hashPin(pin: string, userId: string): string {
  return pbkdf2Sync(pin, userId, PIN_ITERATIONS, PIN_KEY_LENGTH, PIN_DIGEST).toString('hex')
}

/**
 * Legacy SHA-256 hash for backward compatibility during migration.
 * Used to verify PINs set before the PBKDF2 upgrade.
 */
function legacyHashPin(pin: string, userId: string): string {
  return createHash('sha256')
    .update(`${userId}:${pin}`)
    .digest('hex')
}

/**
 * Constant-time comparison of two hex-encoded hashes to prevent timing attacks.
 */
function compareHashes(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Verify a PIN against a stored hash, trying PBKDF2 first and falling back
 * to legacy SHA-256. If the legacy hash matches, transparently upgrade to PBKDF2.
 */
async function verifyAndUpgrade(
  pin: string,
  userId: string,
  storedHash: string
): Promise<boolean> {
  // Try PBKDF2 first (new format — 128 hex chars)
  const pbkdf2Hash = hashPin(pin, userId)
  if (pbkdf2Hash.length === storedHash.length) {
    if (compareHashes(pbkdf2Hash, storedHash)) return true
  }

  // Fall back to legacy SHA-256 (64 hex chars)
  const legacyHash = legacyHashPin(pin, userId)
  if (legacyHash.length === storedHash.length && compareHashes(legacyHash, storedHash)) {
    // Transparently upgrade to PBKDF2
    const admin = createAdminClient()
    await admin
      .from('profiles')
      .update({ transfer_pin_hash: pbkdf2Hash })
      .eq('id', userId)
    return true
  }

  return false
}

/**
 * Check whether the authenticated user has set a transfer PIN.
 */
export async function hasTransferPin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('transfer_pin_hash')
    .eq('id', user.id)
    .single()

  return !!data?.transfer_pin_hash
}

/**
 * Set (or update) the authenticated user's transfer PIN.
 * Validates the PIN format and stores its PBKDF2 hash.
 */
export async function setTransferPin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (!pin || !/^\d{4}$/.test(pin)) {
    return { success: false, error: 'PIN must be exactly 4 digits' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const hash = hashPin(pin, user.id)

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ transfer_pin_hash: hash })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: 'Failed to save PIN' }
  }

  return { success: true }
}

/**
 * Verify the authenticated user's transfer PIN.
 * Returns true if the PIN matches. Transparently upgrades legacy hashes.
 */
export async function verifyTransferPin(pin: string): Promise<{ verified: boolean; error?: string }> {
  if (!pin || !/^\d{4}$/.test(pin)) {
    return { verified: false, error: 'PIN must be exactly 4 digits' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { verified: false, error: 'Not authenticated' }

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('transfer_pin_hash')
    .eq('id', user.id)
    .single()

  if (!data?.transfer_pin_hash) {
    return { verified: false, error: 'No transfer PIN set' }
  }

  const valid = await verifyAndUpgrade(pin, user.id, data.transfer_pin_hash)

  if (!valid) {
    return { verified: false, error: 'Incorrect PIN' }
  }

  return { verified: true }
}

/**
 * Server-side PIN validation for use inside transfer actions.
 * Takes a userId and pin, returns whether it's valid.
 * Transparently upgrades legacy SHA-256 hashes to PBKDF2.
 */
export async function validatePinForUser(userId: string, pin: string): Promise<boolean> {
  if (!pin || !/^\d{4}$/.test(pin)) return false

  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('transfer_pin_hash')
    .eq('id', userId)
    .single()

  if (!data?.transfer_pin_hash) return false

  return verifyAndUpgrade(pin, userId, data.transfer_pin_hash)
}
