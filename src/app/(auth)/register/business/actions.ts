'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomInt } from 'crypto'
import type { BusinessEnrollmentData, EnrollmentResult } from '@/lib/types'

function generateAccountNumber(): string {
  return String(randomInt(10000000, 100000000))
}

function generateMembershipNumber(): string {
  // 12-digit number starting with 7 (business prefix)
  const suffix = String(randomInt(10000000000, 100000000000))
  return '7' + suffix
}

function generateSortCode(): string {
  const part2 = String(randomInt(10, 100))
  const part3 = String(randomInt(10, 100))
  return `20-${part2}-${part3}`
}

function generateCardLast4(): string {
  return String(randomInt(1000, 10000))
}

export async function enrollBusinessUser(data: BusinessEnrollmentData): Promise<EnrollmentResult> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const fullName = `${data.firstName} ${data.lastName}`
  const membershipNumber = generateMembershipNumber()
  const sortCode = generateSortCode()
  const accountNumber = generateAccountNumber()
  const cardLast4 = generateCardLast4()

  // 1. Create auth user — do NOT store full card number in metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: fullName,
        title: data.title,
        last_name: data.lastName.toLowerCase(),
        membership_number: membershipNumber,
        card_last4: cardLast4,
        sort_code: sortCode,
        account_number: accountNumber,
        business_name: data.businessName,
        account_type: 'business',
      },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create user account' }

  const userId = authData.user.id

  // Auto-confirm email so user can sign in immediately
  await admin.auth.admin.updateUserById(userId, { email_confirm: true })

  // 2. Update profile with enrollment data
  const dob =
    data.dobYear && data.dobMonth && data.dobDay
      ? `${data.dobYear}-${data.dobMonth.padStart(2, '0')}-${data.dobDay.padStart(2, '0')}`
      : null

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      date_of_birth: dob,
      phone_number: data.businessContactNumber || null,
      address_line_1: `${data.addressLine1}, ${data.street}`,
      address_line_2: data.district || null,
      city: data.city || null,
      postcode: data.addressPostcode || data.postcode || null,
      country: 'GB',
      notification_email: true,
      notification_sms: true,
      membership_number: membershipNumber,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Profile update failed:', profileError)
  }

  // 3. Create the business bank account
  const { error: accountError } = await admin.from('accounts').insert({
    user_id: userId,
    account_name: `${data.businessName} – Business Account`,
    account_type: 'business',
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
    return { error: 'Account was created but we had trouble setting up your business account. Please contact support.' }
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

  // 5. Store login identifiers in user_metadata — NO full card number
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: fullName,
      title: data.title,
      last_name: data.lastName.toLowerCase(),
      membership_number: membershipNumber,
      card_last4: cardLast4,
      sort_code: sortCode,
      account_number: accountNumber,
      business_name: data.businessName,
    },
  })

  // 6. Create a welcome notification
  await admin.from('notifications').insert({
    user_id: userId,
    title: 'Welcome to NexusBank Business Banking',
    message: `Your Business Online Banking for ${data.businessName} has been set up. Your membership number is ${membershipNumber}. Keep it safe — you'll use it to log in.`,
    type: 'system',
    is_read: false,
  })

  return { membershipNumber, sortCode, accountNumber, cardLast4 }
}
