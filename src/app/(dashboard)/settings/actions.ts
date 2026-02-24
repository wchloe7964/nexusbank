'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

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

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone_number: data.phone_number,
        address_line_1: data.address_line_1,
        city: data.city,
        postcode: data.postcode,
        updated_at: new Date().toISOString(),
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

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<{ error?: string; success?: boolean }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return { error: 'Not authenticated' }
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

    return { success: true }
  } catch {
    return { error: 'An unexpected error occurred' }
  }
}

export async function updateTwoFactorEnabled(
  enabled: boolean
): Promise<{ error?: string; success?: boolean }> {
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
        two_factor_enabled: enabled,
        updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
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
