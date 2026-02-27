'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { isScaChallengeVerified } from '@/lib/sca/sca-service'

export async function updateProfile(data: {
  full_name: string
  phone_number: string
  address_line_1: string
  city: string
  postcode: string
}): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Fetch old profile for audit diff
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('full_name, phone_number, address_line_1, city, postcode')
      .eq('id', user.id)
      .single()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone_number: data.phone_number,
        address_line_1: data.address_line_1,
        city: data.city,
        postcode: data.postcode,
      })
      .eq('id', user.id)

    if (error) {
      return { error: error.message }
    }

    // Audit log — record what changed
    const changes: Record<string, { from: string; to: string }> = {}
    if (oldProfile) {
      const fields = ['full_name', 'phone_number', 'address_line_1', 'city', 'postcode'] as const
      for (const field of fields) {
        if (oldProfile[field] !== data[field]) {
          changes[field] = { from: oldProfile[field] || '', to: data[field] || '' }
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      await supabase.from('login_activity').insert({
        user_id: user.id,
        event_type: 'profile_updated',
        metadata: { action: 'profile_fields_changed', changes },
      })
    }

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
  scaChallengeId?: string
}): Promise<{ error?: string; success?: boolean; requiresSca?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return { error: 'Not authenticated' }
    }

    // ── SCA required for password changes ──
    if (!data.scaChallengeId) {
      return { requiresSca: true }
    }
    const scaVerified = await isScaChallengeVerified(data.scaChallengeId)
    if (!scaVerified) {
      return { error: 'Security verification failed or expired. Please try again.' }
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: data.currentPassword,
    })

    if (signInError) {
      return { error: 'Current password is incorrect' }
    }

    // Update to new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    })

    if (updateError) {
      return { error: updateError.message }
    }

    // Audit log
    await supabase.from('login_activity').insert({
      user_id: user.id,
      event_type: 'password_changed',
      metadata: { action: 'password_changed' },
    })

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateTwoFactorEnabled(
  enabled: boolean,
  scaChallengeId?: string
): Promise<{ error?: string; success?: boolean; requiresSca?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // ── SCA required for 2FA toggle ──
    if (!scaChallengeId) {
      return { requiresSca: true }
    }
    const scaVerified = await isScaChallengeVerified(scaChallengeId)
    if (!scaVerified) {
      return { error: 'Security verification failed or expired. Please try again.' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: enabled,
      })
      .eq('id', user.id)

    if (error) {
      return { error: error.message }
    }

    // Audit log
    await supabase.from('login_activity').insert({
      user_id: user.id,
      event_type: enabled ? 'two_factor_enabled' : 'two_factor_disabled',
      metadata: { action: enabled ? 'two_factor_enabled' : 'two_factor_disabled' },
    })

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateNotificationPreferences(data: {
  notification_email: boolean
  notification_sms: boolean
  notification_push: boolean
}): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        notification_email: data.notification_email,
        notification_sms: data.notification_sms,
        notification_push: data.notification_push,
      })
      .eq('id', user.id)

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

export async function signOutAllDevices(): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut({ scope: 'global' })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  redirect('/auth/login')
}

export async function logSecurityEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('login_activity').insert({
      user_id: user.id,
      event_type: eventType,
      metadata: metadata || {},
    })
  } catch {
    console.error('Failed to log security event')
  }
}
