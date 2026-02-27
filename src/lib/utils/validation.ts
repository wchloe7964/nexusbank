import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const transferSchema = z.object({
  fromAccountId: z.string().uuid('Please select an account'),
  toAccountId: z.string().uuid('Please select a destination'),
  amount: z.number().positive('Amount must be greater than 0').max(250000, 'Maximum transfer is £250,000'),
  description: z.string().min(1, 'Please enter a description').max(200),
  reference: z.string().max(18).optional(),
})

export const sortCodeSchema = z.string().regex(/^\d{2}-\d{2}-\d{2}$/, 'Sort code must be in format XX-XX-XX')

export const accountNumberSchema = z.string().regex(/^\d{8}$/, 'Account number must be 8 digits')

export const payeeSchema = z.object({
  name: z.string().min(1, 'Please enter a name').max(100),
  sortCode: sortCodeSchema,
  accountNumber: accountNumberSchema,
  reference: z.string().max(18).optional(),
})

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ---------- Enrollment Schemas (3-step personal) ----------

// Step 1 — Your Details
export const enrollmentStep1Schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  dobDay: z.string().min(1, 'Day is required').max(2),
  dobMonth: z.string().min(1, 'Month is required').max(2),
  dobYear: z.string().length(4, 'Year is required'),
  country: z.string().min(2, 'Please select a country').max(2),
  postcode: z.string().min(1, 'Postal / zip code is required').max(15),
  addressLine1: z.string().min(1, 'Address line 1 is required').max(200),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().min(1, 'Town or city is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  confirmEmail: z.string().email('Please confirm your email address'),
}).refine((data) => data.email === data.confirmEmail, {
  message: 'Email addresses do not match',
  path: ['confirmEmail'],
}).refine((data) => {
  const day = parseInt(data.dobDay, 10)
  const month = parseInt(data.dobMonth, 10)
  const year = parseInt(data.dobYear, 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return false
  const dob = new Date(year, month - 1, day)
  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return age >= 16
}, { message: 'You must be at least 16 years old', path: ['dobYear'] })

// Step 2 — Review (no validation, just confirmation)

// Step 3 — Complete (security + acceptance)
export const enrollmentStep3Schema_personal = z.object({
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    message: 'You must accept the Terms and Conditions',
  }),
  acceptPrivacyPolicy: z.literal(true, {
    message: 'You must accept the Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ---------- Business Enrollment Schemas ----------

export const businessStep1Schema = z.object({
  // Personal details
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Other'], {
    message: 'Please select a title',
  }),
  firstName: z.string().min(1, 'First name(s) is required').max(50),
  lastName: z.string().min(2, 'Surname is required').max(50),
  dobDay: z.string().min(1, 'Required').max(2),
  dobMonth: z.string().min(1, 'Required').max(2),
  dobYear: z.string().length(4, 'Required'),
  country: z.string().min(2, 'Please select a country').max(2),
  postcode: z.string().min(1, 'Postal / zip code is required').max(15),
  email: z.string().email('Please enter a valid email address'),
  confirmEmail: z.string().email('Please confirm your email address'),
  // Business details
  businessName: z.string().min(1, 'Business name is required').max(200),
  businessContactNumber: z.string().min(1, 'Business contact number is required'),
  membershipType: z.enum(['business-only', 'business-and-personal'], {
    message: 'Please select a membership type',
  }),
  businessRelationship: z.enum(
    ['owner-sole-trader', 'partner', 'director', 'receiver', 'official', 'administrator', 'trustee-bankruptcy', 'supervisor', 'company-secretary'],
    { message: 'Please select your business relationship' }
  ),
  // Address
  addressLine1: z.string().min(1, 'House/flat name and number is required'),
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'Town/city is required'),
  addressPostcode: z.string().min(1, 'Postal / zip code is required').max(15),
  moveMonth: z.string().min(1, 'Required'),
  moveYear: z.string().length(4, 'Required'),
}).refine((data) => data.email === data.confirmEmail, {
  message: 'Email addresses do not match',
  path: ['confirmEmail'],
}).refine((data) => {
  const day = parseInt(data.dobDay, 10)
  const month = parseInt(data.dobMonth, 10)
  const year = parseInt(data.dobYear, 10)
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return false
  const dob = new Date(year, month - 1, day)
  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return age >= 18
}, { message: 'You must be at least 18 years old', path: ['dobYear'] })

export const businessStep3Schema = z.object({
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/\d/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    message: 'You must accept the Terms and Conditions',
  }),
  acceptPrivacyPolicy: z.literal(true, {
    message: 'You must accept the Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ---------- Savings Goals ----------

export const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(50),
  goalType: z.enum(['emergency-fund', 'holiday', 'home-deposit', 'general', 'retirement', 'other']),
  targetAmount: z.number().positive('Target must be greater than 0').max(1000000, 'Maximum target is £1,000,000'),
  targetDate: z.string().optional(),
  accountId: z.string().min(1, 'Please select an account'),
  color: z.enum(['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'amber', 'red']).default('blue'),
})

export const savingsAdjustmentSchema = z.object({
  goalId: z.string().min(1),
  amount: z.number().positive('Amount must be greater than 0').max(250000),
})

// ---------- Budgets ----------

export const budgetSchema = z.object({
  category: z.string().min(1, 'Please select a category'),
  monthlyLimit: z.number().positive('Limit must be greater than 0').max(100000, 'Maximum budget is £100,000'),
  alertThreshold: z.number().min(0.5).max(1).default(0.8),
})

// ---------- Account Opening ----------

export const accountOpeningSchema = z.object({
  accountType: z.enum(['current', 'savings', 'isa', 'business']),
  accountName: z.string().min(1, 'Account name is required').max(50),
  overdraftLimit: z.number().min(0).max(25000).default(0),
})

// ---------- Standing Orders ----------

export const standingOrderSchema = z.object({
  fromAccountId: z.string().min(1, 'Please select an account'),
  payeeId: z.string().min(1, 'Please select a payee'),
  amount: z.number().positive('Amount must be greater than 0').max(250000, 'Maximum is £250,000'),
  reference: z.string().max(18).optional(),
  frequency: z.enum(['weekly', 'fortnightly', 'monthly', 'quarterly', 'annually']),
  nextPaymentDate: z.string().min(1, 'Please select a start date'),
})

// ---------- Overdraft ----------

export const overdraftIncreaseSchema = z.object({
  accountId: z.string().min(1, 'Please select an account'),
  requestedLimit: z.number().positive('Limit must be greater than 0').max(25000, 'Maximum overdraft is £25,000'),
  reason: z.string().max(500).optional(),
})

// ---------- Disputes ----------

export const disputeSchema = z.object({
  transactionId: z.string().min(1, 'Transaction is required'),
  reason: z.enum(['unauthorized', 'duplicate', 'wrong_amount', 'not_received', 'defective', 'cancelled', 'other']),
  description: z.string().max(1000).optional(),
})

// ---------- Rewards ----------

export const redeemRewardsSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['cash', 'charity']),
  accountId: z.string().optional(),
})

// ---------- Account Preferences ----------

export const accountPreferencesSchema = z.object({
  nickname: z.string().max(30, 'Nickname must be 30 characters or less').optional().nullable(),
  color: z.enum(['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'amber', 'red']).default('blue'),
  icon: z.enum(['wallet', 'piggy-bank', 'briefcase', 'home', 'plane', 'car', 'graduation-cap', 'heart']).default('wallet'),
  hideFromDashboard: z.boolean().default(false),
})

// ---------- Transaction Notes ----------

export const transactionNoteSchema = z.object({
  transactionId: z.string().min(1),
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags').default([]),
})

// ---------- Category Editing ----------

export const categoryEditSchema = z.object({
  transactionId: z.string().min(1),
  category: z.enum(['transfer', 'salary', 'bills', 'groceries', 'shopping', 'transport', 'entertainment', 'dining', 'health', 'education', 'subscriptions', 'cash', 'other']),
})

// ---------- Spending Alerts ----------

// ---------- Credit Card Payment ----------

export const creditCardPaymentSchema = z.object({
  creditCardId: z.string().min(1),
  fromAccountId: z.string().min(1, 'Please select an account'),
  amount: z.number().positive('Amount must be greater than 0').max(100000, 'Maximum payment is £100,000'),
})

// ---------- Loan Overpayment ----------

export const loanOverpaymentSchema = z.object({
  loanId: z.string().min(1),
  fromAccountId: z.string().min(1, 'Please select an account'),
  amount: z.number().positive('Amount must be greater than 0').max(500000, 'Maximum overpayment is £500,000'),
})

// ---------- Insurance Claim ----------

export const insuranceClaimSchema = z.object({
  policyId: z.string().min(1, 'Please select a policy'),
  claimType: z.string().min(1, 'Please select a claim type').max(100),
  description: z.string().min(10, 'Please provide a description (at least 10 characters)').max(1000),
  amountClaimed: z.number().positive('Amount must be greater than 0').max(1000000),
})

// ---------- Spending Alerts ----------

export const spendingAlertSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  alertType: z.enum(['single_transaction', 'category_monthly', 'balance_below', 'merchant_payment', 'large_incoming']),
  accountId: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  merchantName: z.string().max(100).optional().nullable(),
  thresholdAmount: z.number().positive('Threshold must be greater than 0').max(1000000),
})

// ---------- Secure Messaging ----------

export const messageComposeSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject must be under 200 characters'),
  category: z.enum(['general', 'payment', 'account', 'card', 'loan', 'dispute', 'fraud', 'technical', 'other']),
  body: z.string().min(1, 'Message is required').max(5000, 'Message must be under 5000 characters'),
})

export const messageReplySchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().min(1, 'Reply is required').max(5000, 'Reply must be under 5000 characters'),
})

// ---------- International Payments ----------

export const internationalPaymentSchema = z.object({
  fromAccountId: z.string().uuid('Please select an account'),
  beneficiaryName: z.string().min(1, 'Recipient name is required').max(200),
  beneficiaryIban: z.string().max(34).optional().or(z.literal('')),
  beneficiarySwiftBic: z.string().max(11).optional().or(z.literal('')),
  beneficiaryBankName: z.string().min(1, 'Bank name is required').max(200),
  beneficiaryBankCountry: z.string().length(2, 'Please enter a 2-letter country code'),
  beneficiaryAddress: z.string().max(300).optional().or(z.literal('')),
  amount: z.number().positive('Amount must be greater than 0').max(250000, 'Maximum is 250,000'),
  targetCurrency: z.string().length(3, 'Please select a currency'),
  chargeType: z.enum(['shared', 'our', 'beneficiary']),
  purposeCode: z.string().min(1, 'Please select a purpose'),
  reference: z.string().max(35).optional().or(z.literal('')),
  sourceOfFunds: z.string().min(1, 'Please select source of funds'),
})
