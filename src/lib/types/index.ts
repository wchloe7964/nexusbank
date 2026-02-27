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
  country: string
  postcode: string
  addressLine1: string
  addressLine2: string
  city: string
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
  country: string
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

export type UserRole = 'customer' | 'admin' | 'super_admin' | 'auditor'

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
  role: UserRole
  membership_number: string | null
  security_score: number
  kyc_status: KycProfileStatus
  risk_rating: string | null
  customer_category: string | null
  pep_status: boolean
  sanctions_clear: boolean
  kyc_verified_at: string | null
  kyc_next_review: string | null
  created_at: string
  updated_at: string
}

export type KycProfileStatus = 'not_started' | 'pending' | 'verified' | 'failed' | 'expired'

export type AccountStatus = 'active' | 'frozen' | 'suspended' | 'closed'

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
  status: AccountStatus
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
  first_used_at: string | null
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

// Credit Card types
export type CreditCardNetwork = 'visa' | 'mastercard'
export type CreditCardStatus = 'active' | 'frozen' | 'closed'

export interface CreditCard {
  id: string
  user_id: string
  card_name: string
  card_number_last_four: string
  card_network: CreditCardNetwork
  credit_limit: number
  current_balance: number
  available_credit: number
  minimum_payment: number
  apr: number
  payment_due_date: string | null
  statement_date: string | null
  status: CreditCardStatus
  rewards_rate: number
  linked_account_id: string | null
  created_at: string
  updated_at: string
  linked_account?: Account | null
}

// Loan types
export type LoanType = 'personal' | 'mortgage' | 'auto' | 'student'
export type LoanStatus = 'active' | 'paid_off' | 'defaulted'

export interface Loan {
  id: string
  user_id: string
  loan_name: string
  loan_type: LoanType
  original_amount: number
  remaining_balance: number
  monthly_payment: number
  interest_rate: number
  term_months: number
  months_remaining: number
  start_date: string
  end_date: string
  next_payment_date: string | null
  status: LoanStatus
  linked_account_id: string | null
  created_at: string
  updated_at: string
  linked_account?: Account | null
}

// Investment types
export type InvestmentAccountType = 'stocks_isa' | 'lifetime_isa' | 'general_investment' | 'pension'
export type AssetType = 'stock' | 'bond' | 'etf' | 'fund' | 'cash'

export interface InvestmentAccount {
  id: string
  user_id: string
  account_name: string
  account_type: InvestmentAccountType
  total_value: number
  total_invested: number
  total_gain_loss: number
  currency_code: string
  opened_at: string
  created_at: string
  updated_at: string
  holdings?: Holding[]
}

export interface Holding {
  id: string
  investment_account_id: string
  asset_name: string
  asset_type: AssetType
  ticker: string | null
  quantity: number
  avg_buy_price: number
  current_price: number
  current_value: number
  gain_loss: number
  gain_loss_pct: number
  allocation_pct: number
  created_at: string
  updated_at: string
}

// Insurance types
export type InsurancePolicyType = 'home' | 'car' | 'life' | 'travel' | 'health' | 'pet'
export type InsurancePolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending'
export type InsuranceClaimStatus = 'submitted' | 'under_review' | 'approved' | 'denied' | 'paid'

export interface InsurancePolicy {
  id: string
  user_id: string
  policy_name: string
  policy_number: string
  policy_type: InsurancePolicyType
  provider: string
  premium_monthly: number
  coverage_amount: number
  excess_amount: number
  start_date: string
  end_date: string
  auto_renew: boolean
  status: InsurancePolicyStatus
  created_at: string
  updated_at: string
  claims?: InsuranceClaim[]
}

export interface InsuranceClaim {
  id: string
  policy_id: string
  user_id: string
  claim_reference: string
  claim_type: string
  description: string | null
  amount_claimed: number
  amount_approved: number | null
  status: InsuranceClaimStatus
  submitted_at: string
  resolved_at: string | null
  created_at: string
  updated_at: string
  policy?: InsurancePolicy | null
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

// Admin types
export interface AdminDashboardStats {
  total_customers: number
  total_deposits: number
  new_signups_30d: number
  flagged_activity_30d: number
  open_disputes: number
  total_accounts: number
}

export interface CustomerListItem {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
  phone_number: string | null
  city: string | null
  postcode: string | null
  two_factor_enabled: boolean
  membership_number: string | null
  date_of_birth: string | null
  country: string
  security_score: number
  account_count?: number
}

// ── Secure Messaging ──

export type ConversationStatus = 'open' | 'awaiting_customer' | 'awaiting_bank' | 'resolved' | 'closed'
export type ConversationCategory = 'general' | 'payment' | 'account' | 'card' | 'loan' | 'dispute' | 'complaint' | 'fraud' | 'technical' | 'other'
export type MessageSenderRole = 'customer' | 'advisor' | 'system'

export interface Conversation {
  id: string
  customer_id: string
  subject: string
  category: ConversationCategory
  status: ConversationStatus
  priority: string
  assigned_to: string | null
  last_message_at: string
  created_at: string
  updated_at: string
  // Joined
  latest_message?: SecureMessage | null
  unread_count?: number
}

export interface SecureMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_role: MessageSenderRole
  body: string
  attachments: Array<{ name: string; url: string; type: string }>
  is_read: boolean
  read_at: string | null
  created_at: string
}

// ── Email / SMS Notification Delivery ──

export type EmailStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced'
export type SmsStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed'

export interface NotificationTemplate {
  id: string
  name: string
  channel: 'email' | 'sms' | 'push'
  category: string
  subject_template: string
  body_template: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailLogEntry {
  id: string
  user_id: string | null
  template_name: string | null
  to_address: string
  subject: string
  body_preview: string | null
  status: EmailStatus
  provider: string | null
  provider_id: string | null
  error_message: string | null
  created_at: string
  sent_at: string | null
  delivered_at: string | null
}

// ── International Payments ──

export type InternationalPaymentMethod = 'swift' | 'sepa' | 'target2'
export type InternationalPaymentStatus = 'pending' | 'processing' | 'sent' | 'in_transit' | 'completed' | 'failed' | 'cancelled' | 'returned'
export type ChargeType = 'shared' | 'our' | 'beneficiary'

export interface InternationalPayment {
  id: string
  user_id: string
  from_account_id: string
  beneficiary_name: string
  beneficiary_iban: string | null
  beneficiary_account_number: string | null
  beneficiary_swift_bic: string | null
  beneficiary_bank_name: string
  beneficiary_bank_country: string
  beneficiary_address: string | null
  amount: number
  source_currency: string
  target_currency: string
  exchange_rate: number | null
  converted_amount: number | null
  fee_amount: number
  fee_currency: string
  payment_method: InternationalPaymentMethod
  charge_type: ChargeType
  purpose_code: string | null
  reference: string | null
  status: InternationalPaymentStatus
  tracking_reference: string | null
  estimated_delivery: string | null
  source_of_funds: string | null
  declaration_accepted: boolean
  screening_status: string
  created_at: string
  submitted_at: string | null
  completed_at: string | null
  // Joined
  from_account?: Account | null
}

export interface ExchangeRate {
  base_currency: string
  target_currency: string
  rate: number
  fetched_at: string
  expires_at: string
}

// ── Open Banking (PSD2) ──

export type ProviderType = 'aisp' | 'pisp' | 'cbpii'
export type ConsentType = 'account_access' | 'payment_initiation' | 'funds_confirmation'
export type ConsentStatus = 'awaiting_authorisation' | 'authorised' | 'rejected' | 'revoked' | 'expired'

export interface ThirdPartyProvider {
  id: string
  name: string
  provider_type: ProviderType
  fca_reference: string | null
  client_id: string
  logo_url: string | null
  website: string | null
  contact_email: string | null
  status: string
  created_at: string
}

export interface OpenBankingConsent {
  id: string
  user_id: string
  provider_id: string
  consent_type: ConsentType
  account_ids: string[]
  permissions: string[]
  status: ConsentStatus
  expires_at: string | null
  last_accessed_at: string | null
  created_at: string
  authorised_at: string | null
  revoked_at: string | null
  // Joined
  provider?: ThirdPartyProvider | null
}

// ── Joint Accounts ──

export type AccountHolderRole = 'primary' | 'joint' | 'authorized_signatory' | 'power_of_attorney' | 'guardian'
export type AccountHolderStatus = 'pending_acceptance' | 'active' | 'suspended' | 'removed'

export interface AccountHolder {
  id: string
  account_id: string
  user_id: string
  role: AccountHolderRole
  permissions: string[]
  status: AccountHolderStatus
  added_by: string | null
  accepted_at: string | null
  created_at: string
  removed_at: string | null
  // Joined
  profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
  account?: Account | null
}
