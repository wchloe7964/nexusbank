'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

type LoginMethod = 'membership' | 'card' | 'account'

interface LoginPayload {
  method: LoginMethod
  lastName: string
  // Membership method
  membershipNumber?: string
  // Card method
  cardNumber?: string
  // Account method
  sortCode?: string
  accountNumber?: string
}

export async function signInWithIdentifier(payload: LoginPayload) {
  const admin = createAdminClient()
  const supabase = await createClient()

  const { method, lastName } = payload

  if (!lastName.trim()) {
    return { error: 'Please enter your last name' }
  }

  // Use Supabase admin API to find the user by their identifier in user_metadata
  // listUsers with page/perPage to search through all users
  const { data: usersData, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })

  if (listError) {
    console.error('Failed to list users:', listError)
    return { error: 'Unable to verify your identity. Please try again later.' }
  }

  const users = usersData?.users || []
  const lastNameLower = lastName.trim().toLowerCase()

  let matchedUser = null

  for (const user of users) {
    const meta = user.user_metadata || {}
    const userLastName = (meta.last_name || '').toLowerCase()

    // Last name must match
    if (userLastName !== lastNameLower) continue

    if (method === 'membership') {
      if (meta.membership_number === payload.membershipNumber) {
        matchedUser = user
        break
      }
    } else if (method === 'card') {
      // Match by card number (16 digits)
      if (meta.card_number === payload.cardNumber) {
        matchedUser = user
        break
      }
    } else if (method === 'account') {
      // Match by sort code + account number
      const inputSortCode = payload.sortCode?.replace(/-/g, '') || ''
      const storedSortCode = (meta.sort_code || '').replace(/-/g, '')

      if (storedSortCode === inputSortCode && meta.account_number === payload.accountNumber) {
        matchedUser = user
        break
      }
    }
  }

  if (!matchedUser) {
    // Log failed login attempt
    try {
      await admin.from('login_activity').insert({
        user_id: users[0]?.id || '00000000-0000-0000-0000-000000000000',
        event_type: 'login_failed',
        device_type: 'unknown',
        metadata: { method, reason: 'no_matching_account' },
      })
    } catch { /* ignore logging errors */ }
    return { error: 'We couldn\'t find an account matching those details. Please check and try again.' }
  }

  // Found the user — now sign them in using their email + a generated token
  // Since we don't have the user's password (that's the point — no password login),
  // we use the admin API to generate a magic link or directly create a session
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: matchedUser.email!,
  })

  if (linkError || !linkData) {
    console.error('Failed to generate sign-in link:', linkError)
    return { error: 'Unable to sign you in. Please try again.' }
  }

  // Extract the token from the link and verify it server-side to create a session
  const url = new URL(linkData.properties.action_link)
  const token = url.searchParams.get('token')
  const tokenType = url.searchParams.get('type') || 'magiclink'

  if (!token) {
    return { error: 'Unable to complete sign-in. Please try again.' }
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: tokenType as 'magiclink',
  })

  if (verifyError) {
    console.error('OTP verification failed:', verifyError)
    return { error: 'Sign-in verification failed. Please try again.' }
  }

  // Log successful login
  try {
    await supabase.from('login_activity').insert({
      user_id: matchedUser.id,
      event_type: 'login_success',
      device_type: 'unknown',
      metadata: { method },
    })
  } catch { /* ignore logging errors */ }

  // Check if user has MFA enrolled — redirect to 2FA challenge if needed
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (
    aalData &&
    aalData.nextLevel === 'aal2' &&
    aalData.currentLevel !== aalData.nextLevel
  ) {
    redirect('/login/verify-2fa')
  }

  redirect('/dashboard')
}

// Keep email+password login for backward compat and biometric
export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // Log successful login
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('login_activity').insert({
        user_id: user.id,
        event_type: 'login_success',
        device_type: 'unknown',
        metadata: { method: 'email_password' },
      })
    }
  } catch { /* ignore logging errors */ }

  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

  if (
    aalData &&
    aalData.nextLevel === 'aal2' &&
    aalData.currentLevel !== aalData.nextLevel
  ) {
    redirect('/login/verify-2fa')
  }

  redirect('/dashboard')
}
