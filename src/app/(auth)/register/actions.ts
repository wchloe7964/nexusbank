'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EnrollmentData, EnrollmentResult } from '@/lib/types'

function generateAccountNumber(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000))
}

function generateMembershipNumber(): string {
  // 12-digit number starting with 5 (NexusBank personal prefix)
  return '5' + String(Math.floor(10000000000 + Math.random() * 90000000000))
}

function generateSortCode(): string {
  // NexusBank sort codes start with 20 (like a real UK bank prefix)
  const part2 = String(Math.floor(10 + Math.random() * 90))
  const part3 = String(Math.floor(10 + Math.random() * 90))
  return `20-${part2}-${part3}`
}

function generateCardNumber(): string {
  // 16-digit card number starting with 4 (Visa-style)
  let num = '4539'
  for (let i = 0; i < 12; i++) {
    num += String(Math.floor(Math.random() * 10))
  }
  return num
}

export async function enrollUser(data: EnrollmentData): Promise<EnrollmentResult> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const fullName = `${data.firstName} ${data.lastName}`
  const membershipNumber = generateMembershipNumber()
  const sortCode = generateSortCode()
  const accountNumber = generateAccountNumber()
  const cardNumber = generateCardNumber()
  const cardLast4 = cardNumber.slice(-4)

  // 1. Create auth user with all identifiers in metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: fullName,
        last_name: data.lastName.toLowerCase(),
        membership_number: membershipNumber,
        card_number: cardNumber,
        sort_code: sortCode,
        account_number: accountNumber,
      },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create user account' }

  const userId = authData.user.id

  // Auto-confirm email so user can sign in immediately
  await admin.auth.admin.updateUserById(userId, { email_confirm: true })

  // 2. Update profile with enrollment data (bypass RLS with admin client)
  const dob =
    data.dobYear && data.dobMonth && data.dobDay
      ? `${data.dobYear}-${data.dobMonth.padStart(2, '0')}-${data.dobDay.padStart(2, '0')}`
      : null

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      date_of_birth: dob,
      postcode: data.postcode || null,
      country: 'GB',
      notification_email: !data.marketingOptOut,
      notification_sms: false,
      membership_number: membershipNumber,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Profile update failed:', profileError)
  }

  // 3. Create the bank account
  const { error: accountError } = await admin.from('accounts').insert({
    user_id: userId,
    account_name: 'Everyday Current Account',
    account_type: 'current',
    sort_code: sortCode,
    account_number: accountNumber,
    balance: 0,
    available_balance: 0,
    currency_code: 'GBP',
    interest_rate: 0,
    overdraft_limit: 0,
    is_primary: true,
    is_active: true,
  })

  if (accountError) {
    console.error('Account creation failed:', accountError)
    return { error: 'Account was created but we had trouble setting up your bank account. Please contact support.' }
  }

  // 4. Create a debit card
  const { data: accountData } = await admin
    .from('accounts')
    .select('id')
    .eq('user_id', userId)
    .single()

  if (accountData) {
    await admin.from('cards').insert({
      account_id: accountData.id,
      user_id: userId,
      card_type: 'debit',
      card_number_last_four: cardLast4,
      card_holder_name: fullName.toUpperCase(),
      expiry_date: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getFullYear() + 4).slice(-2)}`,
      status: 'active',
    })
  }

  // 5. Store all login identifiers in user_metadata
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: fullName,
      last_name: data.lastName.toLowerCase(),
      membership_number: membershipNumber,
      card_number: cardNumber,
      card_last4: cardLast4,
      sort_code: sortCode,
      account_number: accountNumber,
    },
  })

  // 6. Create a welcome notification
  await admin.from('notifications').insert({
    user_id: userId,
    title: 'Welcome to NexusBank',
    message: `Your Everyday Current Account has been created. Your membership number is ${membershipNumber}. Keep it safe — you'll use it to log in.`,
    type: 'system',
    is_read: false,
  })

  return { membershipNumber, sortCode, accountNumber, cardLast4 }
}

export async function signInAfterRegistration(email: string): Promise<{ error?: string }> {
  const admin = createAdminClient()
  const supabase = await createClient()

  // Generate a magic link and verify it to create a session
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (linkError || !linkData) {
    console.error('Failed to generate sign-in link:', linkError)
    return { error: 'Unable to sign you in automatically. Please use the login page.' }
  }

  const url = new URL(linkData.properties.action_link)
  const token = url.searchParams.get('token')

  if (!token) {
    return { error: 'Unable to complete auto sign-in. Please use the login page.' }
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'magiclink',
  })

  if (verifyError) {
    console.error('Auto sign-in failed:', verifyError)
    return { error: 'Unable to sign you in automatically. Please use the login page.' }
  }

  return {}
}
