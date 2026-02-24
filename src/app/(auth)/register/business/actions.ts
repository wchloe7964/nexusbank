'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BusinessEnrollmentData } from '@/lib/types'

function generateMembershipNumber(): string {
  // 12-digit number starting with 7 (business prefix)
  return '7' + String(Math.floor(10000000000 + Math.random() * 90000000000))
}

export async function enrollBusinessUser(data: BusinessEnrollmentData): Promise<{ error?: string; membershipNumber?: string }> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const fullName = `${data.firstName} ${data.lastName}`
  const membershipNumber = generateMembershipNumber()
  const sortCode = `${data.sortCode1}-${data.sortCode2}-${data.sortCode3}`

  // 1. Create auth user with membership number in metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: fullName,
        title: data.title,
        last_name: data.lastName.toLowerCase(),
        membership_number: membershipNumber,
        sort_code: sortCode,
        account_number: data.accountNumber,
        business_name: data.businessName,
        account_type: 'business',
      },
    },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'Failed to create user account' }

  const userId = authData.user.id

  // Auto-confirm email so user can sign in immediately (dev/demo convenience)
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
    account_number: data.accountNumber,
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

  // 4. Create a welcome notification
  await admin.from('notifications').insert({
    user_id: userId,
    title: 'Welcome to NexusBank Business Banking',
    message: `Your Business Online Banking for ${data.businessName} has been set up. Your membership number is ${membershipNumber}. Keep it safe — you'll use it to log in.`,
    type: 'system',
    is_read: false,
  })

  return { membershipNumber }
}
