'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

type LoginMethod = 'membership' | 'card' | 'account'

// Use a consistent generic error to prevent user enumeration
const GENERIC_LOGIN_ERROR = 'We couldn\'t find an account matching those details. Please check and try again.'

// Nil UUID for failed login attempts — avoids leaking real user IDs
const NIL_UUID = '00000000-0000-0000-0000-000000000000'

interface LoginPayload {
  method: LoginMethod
  lastName: string
  // Membership method
  membershipNumber?: string
  // Card method — now uses last 4 digits only
  cardLast4?: string
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

  // Paginated user search — never fetch all 1000 at once
  const PAGE_SIZE = 50
  let page = 1
  let matchedUser = null
  let hasMore = true

  const lastNameLower = lastName.trim().toLowerCase()

  while (hasMore && !matchedUser) {
    const { data: usersData, error: listError } = await admin.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    })

    if (listError) {
      console.error('Failed to list users:', listError)
      return { error: 'Unable to verify your identity. Please try again later.' }
    }

    const users = usersData?.users || []
    if (users.length < PAGE_SIZE) hasMore = false

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
        // Match by card last 4 digits only — no full card number
        if (meta.card_last4 === payload.cardLast4) {
          matchedUser = user
          break
        }
      } else if (method === 'account') {
        const inputSortCode = payload.sortCode?.replace(/-/g, '') || ''
        const storedSortCode = (meta.sort_code || '').replace(/-/g, '')

        if (storedSortCode === inputSortCode && meta.account_number === payload.accountNumber) {
          matchedUser = user
          break
        }
      }
    }

    page++
  }

  if (!matchedUser) {
    // Log failed login attempt with nil UUID — never leak real user IDs
    try {
      await admin.from('login_activity').insert({
        user_id: NIL_UUID,
        event_type: 'login_failed',
        device_type: 'unknown',
        metadata: { method, reason: 'no_matching_account' },
      })
    } catch { /* ignore logging errors */ }
    return { error: GENERIC_LOGIN_ERROR }
  }

  // Found the user — sign them in using a magic link token
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: matchedUser.email!,
  })

  if (linkError || !linkData) {
    console.error('Failed to generate sign-in link:', linkError)
    return { error: 'Unable to sign you in. Please try again.' }
  }

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

  // Check if user has MFA enrolled
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
