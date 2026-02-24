'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { EnrollmentData } from '@/lib/types'

function generateAccountNumber(): string {
  return String(Math.floor(10000000 + Math.random() * 90000000))
}

function generateMembershipNumber(): string {
  // 12-digit number starting with 5 (NexusBank prefix)
  return '5' + String(Math.floor(10000000000 + Math.random() * 90000000000))
}

const accountTypeMap: Record<string, { name: string; type: string; interestRate: number }> = {
  current_savings: { name: 'Everyday Current Account', type: 'current', interestRate: 0.0 },
  mortgage: { name: 'Mortgage Account', type: 'current', interestRate: 0.0 },
  merchant: { name: 'Merchant Account', type: 'current', interestRate: 0.0 },
}

export async function enrollUser(data: EnrollmentData): Promise<{ error?: string; membershipNumber?: string }> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const membershipNumber = generateMembershipNumber()
  const sortCode = `${data.sortCode1}-${data.sortCode2}-${data.sortCode3}`
  const accountNum = generateAccountNumber()
  const acctInfo = accountTypeMap[data.registrationAccountType] || accountTypeMap.current_savings

  // 1. Create auth user with membership number in metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.lastName,
        last_name: data.lastName.toLowerCase(),
        membership_number: membershipNumber,
        card_number: data.cardNumber,
        sort_code: sortCode,
        account_number: accountNum,
      },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create user account' }

  const userId = authData.user.id

  // Auto-confirm email so user can sign in immediately (dev/demo convenience)
  await admin.auth.admin.updateUserById(userId, { email_confirm: true })

  // 2. Update profile with enrollment data (bypass RLS with admin client)
  const dob =
    data.dobYear && data.dobMonth && data.dobDay
      ? `${data.dobYear}-${data.dobMonth.padStart(2, '0')}-${data.dobDay.padStart(2, '0')}`
      : null

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      full_name: data.lastName,
      date_of_birth: dob,
      postcode: data.postcode || null,
      country: 'GB',
      notification_email: !data.marketingOptOut,
      notification_sms: false,
    })
    .eq('id', userId)

  if (profileError) {
    console.error('Profile update failed:', profileError)
  }

  // 3. Create the bank account
  const { error: accountError } = await admin.from('accounts').insert({
    user_id: userId,
    account_name: acctInfo.name,
    account_type: acctInfo.type,
    sort_code: sortCode,
    account_number: accountNum,
    balance: 0,
    available_balance: 0,
    currency_code: 'GBP',
    interest_rate: acctInfo.interestRate,
    overdraft_limit: 0,
    is_primary: true,
    is_active: true,
  })

  if (accountError) {
    console.error('Account creation failed:', accountError)
    return { error: 'Account was created but we had trouble setting up your bank account. Please contact support.' }
  }

  // 4. Create a debit card using the provided card number
  const cardLast4 = data.cardNumber.slice(-4)
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
      card_holder_name: data.lastName.toUpperCase(),
      expiry_date: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(new Date().getFullYear() + 4).slice(-2)}`,
      status: 'active',
    })
  }

  // 5. Store all login identifiers in user_metadata
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      full_name: data.lastName,
      last_name: data.lastName.toLowerCase(),
      membership_number: membershipNumber,
      card_number: data.cardNumber,
      card_last4: cardLast4,
      sort_code: sortCode,
      account_number: accountNum,
    },
  })

  // 6. Create a welcome notification
  await admin.from('notifications').insert({
    user_id: userId,
    title: 'Welcome to NexusBank',
    message: `Your ${acctInfo.name} has been created. Your membership number is ${membershipNumber}. Keep it safe — you'll use it to log in.`,
    type: 'system',
    is_read: false,
  })

  return { membershipNumber }
}
