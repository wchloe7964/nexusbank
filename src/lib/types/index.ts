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

export type SavingsGoalType =
  | 'emergency-fund'
  | 'holiday'
  | 'home-deposit'
  | 'general'
  | 'retirement'
  | 'other'

export type SavingsGoalColor =
  | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan' | 'amber' | 'red'

export interface SavingsGoal {
  id: string
  user_id: string
  account_id: string
  name: string
  goal_type: SavingsGoalType
  target_amount: number
  current_amount: number
  currency_code: string
  target_date: string | null
  icon: string
  color: SavingsGoalColor
  is_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
  account?: Account | null
}

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

export type PaymentType = 'standing_order' | 'direct_debit' | 'scheduled_transfer' | 'bill_payment'

export type PaymentFrequency = 'once' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'annually'

export type PaymentStatus = 'active' | 'paused' | 'cancelled' | 'completed'

export type NotificationType = 'transaction' | 'security' | 'account' | 'promotion' | 'system'

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
  rewards_balance: number
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
  nickname: string | null
  color: string
  icon: string
  hide_from_dashboard: boolean
  opened_at: string
  created_at: string
  updated_at: string
}

export interface TransactionNote {
  id: string
  user_id: string
  transaction_id: string
  note: string | null
  tags: string[]
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
  original_category: string | null
  category_edited_at: string | null
  status: TransactionStatus
  transaction_date: string
  created_at: string
  note?: TransactionNote | null
}

// Payment Calendar
export interface CalendarPaymentDay {
  date: string
  payments: {
    id: string
    name: string
    amount: number
    type: 'standing_order' | 'direct_debit'
    status: string
  }[]
}

// Spending Alerts
export type SpendingAlertType = 'single_transaction' | 'category_monthly' | 'balance_below' | 'merchant_payment' | 'large_incoming'

export interface SpendingAlert {
  id: string
  user_id: string
  name: string
  alert_type: SpendingAlertType
  account_id: string | null
  category: string | null
  merchant_name: string | null
  threshold_amount: number
  is_active: boolean
  last_triggered_at: string | null
  trigger_count: number
  created_at: string
  updated_at: string
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
  reference: string | null
  is_favourite: boolean
  created_at: string
  updated_at: string
}

export interface ScheduledPayment {
  id: string
  user_id: string
  from_account_id: string
  payee_id: string | null
  to_account_id: string | null
  payment_type: PaymentType
  amount: number
  currency_code: string
  reference: string | null
  description: string | null
  frequency: PaymentFrequency
  next_payment_date: string
  end_date: string | null
  status: PaymentStatus
  last_executed_at: string | null
  created_at: string
  updated_at: string
  // Joined fields (from payee)
  payee?: Payee | null
  from_account?: Account | null
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

// Budget types
export interface Budget {
  id: string
  user_id: string
  category: TransactionCategory
  monthly_limit: number
  currency_code: string
  is_active: boolean
  alert_threshold: number
  created_at: string
  updated_at: string
}

export interface BudgetWithSpending extends Budget {
  spent: number
  remaining: number
  percentage: number
  status: 'on-track' | 'warning' | 'exceeded'
}

// Direct Debit types
export interface DirectDebitWithHistory extends ScheduledPayment {
  total_paid: number
  payment_count: number
  last_payment_date: string | null
  last_payment_amount: number | null
}

// Account Opening types
export interface AccountOpeningConfig {
  type: AccountType
  label: string
  description: string
  features: string[]
  interestRate: number
  overdraftAvailable: boolean
  defaultOverdraft: number
}

// Security types
export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_changed'
  | 'two_factor_enabled'
  | 'two_factor_disabled'
  | 'profile_updated'
  | 'session_expired'
  | 'suspicious_activity'

export interface LoginActivity {
  id: string
  user_id: string
  event_type: SecurityEventType
  ip_address: string | null
  user_agent: string | null
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser: string | null
  os: string | null
  location: string | null
  is_suspicious: boolean
  metadata: Record<string, unknown>
  created_at: string
}

export interface SecurityScore {
  score: number
  factors: {
    label: string
    points: number
    maxPoints: number
    achieved: boolean
  }[]
}

// Dispute types
export type DisputeReason = 'unauthorized' | 'duplicate' | 'wrong_amount' | 'not_received' | 'defective' | 'cancelled' | 'other'
export type DisputeStatus = 'submitted' | 'under_review' | 'information_requested' | 'resolved_refunded' | 'resolved_denied' | 'closed'

export interface Dispute {
  id: string
  user_id: string
  transaction_id: string
  reason: DisputeReason
  description: string | null
  status: DisputeStatus
  resolution: string | null
  created_at: string
  updated_at: string
  transaction?: Transaction | null
}

// Reward types
export type RewardType = 'cashback_dining' | 'cashback_shopping' | 'cashback_subscriptions' | 'cashback_other'
export type RewardStatus = 'earned' | 'redeemed' | 'expired'

export interface Reward {
  id: string
  user_id: string
  transaction_id: string | null
  amount: number
  reward_type: RewardType
  category: string
  status: RewardStatus
  redeemed_at: string | null
  created_at: string
}

export interface RewardsSummary {
  totalBalance: number
  totalEarned: number
  totalRedeemed: number
  monthlyEarnings: { month: string; amount: number }[]
  categoryBreakdown: { category: string; amount: number; count: number }[]
}

// Analytics types
export interface MerchantSpending {
  counterparty_name: string
  total: number
  count: number
  category: string
  lastDate: string
}

export interface DetectedSubscription {
  counterparty_name: string
  amount: number
  frequency: 'monthly' | 'weekly' | 'annual'
  category: string
  lastDate: string
  nextExpectedDate: string
}

export interface SpendingForecast {
  date: string
  actual: number | null
  forecast: number
}

export interface PeerComparison {
  category: string
  userAmount: number
  averageAmount: number
}
