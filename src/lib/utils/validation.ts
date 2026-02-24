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

const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i

// Step 1 — Your Details
export const enrollmentStep1Schema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  dobDay: z.string().min(1, 'Day is required').max(2),
  dobMonth: z.string().min(1, 'Month is required').max(2),
  dobYear: z.string().length(4, 'Year is required'),
  postcode: z.string().regex(ukPostcodeRegex, 'Please enter a valid UK postcode'),
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
  postcode: z.string().regex(ukPostcodeRegex, 'Please enter a valid UK postcode'),
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
  addressPostcode: z.string().regex(ukPostcodeRegex, 'Please enter a valid postcode'),
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
