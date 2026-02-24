export type AccountType = 'current' | 'savings' | 'isa' | 'business'

// Enrollment types
export type Title = 'Mr' | 'Mrs' | 'Ms' | 'Miss' | 'Dr' | 'Prof' | 'Other'

export type EmploymentStatus =
  | 'employed'
  | 'self-employed'
  | 'retired'
  | 'student'
  | 'unemployed'
  | 'other'

export type SavingsGoal =
  | 'emergency-fund'
  | 'holiday'
  | 'home-deposit'
  | 'general'
  | 'retirement'
  | 'other'

export interface EnrollmentData {
  // Step 1 — Your Details
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
  postcode: string
  // Contact details
  email: string
  confirmEmail: string
  marketingOptOut: boolean
  // Step 2 — Review (no additional data)
  // Step 3 — Complete (security + acceptance)
  password: string
  confirmPassword: string
  acceptTerms: boolean
  acceptPrivacyPolicy: boolean
}

export interface EnrollmentResult {
  error?: string
  membershipNumber?: string
  sortCode?: string
  accountNumber?: string
  cardLast4?: string
}

export type BusinessRelationship =
  | 'owner-sole-trader'
  | 'partner'
  | 'director'
  | 'receiver'
  | 'official'
  | 'administrator'
  | 'trustee-bankruptcy'
  | 'supervisor'
  | 'company-secretary'

export type MembershipType = 'business-only' | 'business-and-personal'

export interface BusinessEnrollmentData {
  // Step 1 — Your details
  title: Title | ''
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
  postcode: string
  email: string
  confirmEmail: string
  // Your business
  businessName: string
  businessContactNumber: string
  membershipType: MembershipType | ''
  businessRelationship: BusinessRelationship | ''
  hasAuthorisedAccess: boolean
  // Your address history
  addressLine1: string
  street: string
  district: string
  city: string
  county: string
  addressPostcode: string
  moveMonth: string
  moveYear: string
  // Step 2 — Check your details (no extra data)
  // Step 3 — Finish (security + acceptance)
  password: string
  confirmPassword: string
  acceptTerms: boolean
  acceptPrivacyPolicy: boolean
}

export type TransactionType = 'credit' | 'debit'

export type TransactionCategory =
  | 'transfer' | 'salary' | 'bills' | 'groceries' | 'shopping'
  | 'transport' | 'entertainment' | 'dining' | 'health'
  | 'education' | 'subscriptions' | 'cash' | 'other'

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'

export type CardType = 'debit' | 'credit'

export type CardStatus = 'active' | 'frozen' | 'expired' | 'cancelled' | 'reported_lost'

export type PaymentType = 'standing_order' | 'direct_debit' | 'scheduled'

export type PaymentFrequency = 'once' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly'

export type PaymentStatus = 'active' | 'paused' | 'cancelled' | 'completed'

export type NotificationType = 'transaction' | 'transfer' | 'payment' | 'security' | 'alert' | 'system'

export interface Profile {
  id: string
  email: string
  full_name: string
  date_of_birth: string | null
  phone_number: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  postcode: string | null
  country: string
  avatar_url: string | null
  two_factor_enabled: boolean
  notification_email: boolean
  notification_sms: boolean
  notification_push: boolean
  theme_preference: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  account_name: string
  account_type: AccountType
  sort_code: string
  account_number: string
  balance: number
  available_balance: number
  currency_code: string
  interest_rate: number
  overdraft_limit: number
  is_primary: boolean
  is_active: boolean
  opened_at: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  account_id: string
  type: TransactionType
  category: TransactionCategory | string
  amount: number
  currency_code: string
  description: string
  reference: string | null
  counterparty_name: string | null
  counterparty_sort_code: string | null
  counterparty_account_number: string | null
  balance_after: number | null
  transfer_reference: string | null
  status: TransactionStatus
  transaction_date: string
  created_at: string
}

export interface Card {
  id: string
  account_id: string
  user_id: string
  card_type: CardType
  card_number_last_four: string
  card_holder_name: string
  expiry_date: string
  is_frozen: boolean
  is_contactless_enabled: boolean
  online_payments_enabled: boolean
  atm_withdrawals_enabled: boolean
  spending_limit_daily: number
  spending_limit_monthly: number
  status: CardStatus
  created_at: string
  updated_at: string
}

export interface Payee {
  id: string
  user_id: string
  name: string
  sort_code: string
  account_number: string
  bank_name: string | null
  reference: string | null
  is_favourite: boolean
  created_at: string
  updated_at: string
}

export interface ScheduledPayment {
  id: string
  account_id: string
  payee_name: string
  payee_sort_code: string
  payee_account_number: string
  amount: number
  currency_code: string
  reference: string | null
  frequency: PaymentFrequency
  next_payment_date: string
  end_date: string | null
  payment_type: PaymentType
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  action_url: string | null
  created_at: string
}
