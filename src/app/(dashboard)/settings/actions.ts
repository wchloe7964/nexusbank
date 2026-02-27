'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { validatePinForUser } from '@/lib/pin/pin-service'

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
      console.error('Profile update error:', error.message)
      return { error: 'Failed to update profile. Please try again.' }
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
  pin: string
}): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return { error: 'Not authenticated' }
    }

    // ── Transfer PIN required for password changes ──
    const pinValid = await validatePinForUser(user.id, data.pin)
    if (!pinValid) {
      return { error: 'Incorrect transfer PIN. Please try again.' }
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
      console.error('Password update error:', updateError.message)
      return { error: 'Failed to update password. Please try again.' }
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
  pin?: string
): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // ── Transfer PIN required when called from settings toggle ──
    // When called from the 2FA disable dialog, the user has already verified via TOTP code
    if (pin) {
      const pinValid = await validatePinForUser(user.id, pin)
      if (!pinValid) {
        return { error: 'Incorrect transfer PIN. Please try again.' }
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: enabled,
      })
      .eq('id', user.id)

    if (error) {
      console.error('2FA update error:', error.message)
      return { error: 'Failed to update two-factor settings. Please try again.' }
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
      console.error('Notification preferences error:', error.message)
      return { error: 'Failed to update notification preferences. Please try again.' }
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
    console.error('Sign out error:', error.message)
    return { error: 'Failed to sign out all devices. Please try again.' }
  }

  revalidatePath('/')
  redirect('/login')
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
