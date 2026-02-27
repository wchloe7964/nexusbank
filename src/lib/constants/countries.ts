export interface Country {
  code: string // ISO 3166-1 alpha-2
  name: string
}

export const COUNTRIES: Country[] = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'EG', name: 'Egypt' },
  { code: 'PH', name: 'Philippines' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RO', name: 'Romania' },
  { code: 'GR', name: 'Greece' },
  { code: 'IL', name: 'Israel' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PE', name: 'Peru' },
]

/** Popular countries shown at the top of the selector */
export const POPULAR_COUNTRY_CODES = ['GB', 'US', 'CA', 'AU', 'IE', 'DE', 'FR', 'IN'] as const

/** Convert ISO 3166-1 alpha-2 code to flag emoji */
export function countryCodeToFlag(code: string): string {
  const codePoints = code
    .toUpperCase()
    .split('')
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65)
  return String.fromCodePoint(...codePoints)
}

/**
 * Detect the user's country from their browser locale.
 * Returns an ISO 3166-1 alpha-2 code, or empty string if it can't be determined
 * or the country isn't in our supported list.
 */
export function detectBrowserCountry(): string {
  if (typeof navigator === 'undefined') return ''
  const locale = navigator.language || ''
  // Locale is like "en-GB", "en-US", "fr-FR", "de" — we want the region part
  const parts = locale.split('-')
  if (parts.length >= 2) {
    const region = parts[parts.length - 1].toUpperCase()
    if (COUNTRIES.some((c) => c.code === region)) return region
  }
  return ''
}

/** Maps ISO country code → default currency code */
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  GB: 'GBP',
  US: 'USD',
  CA: 'CAD',
  AU: 'AUD',
  NZ: 'NZD',
  IE: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  PT: 'EUR',
  AT: 'EUR',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  FI: 'EUR',
  PL: 'PLN',
  CZ: 'CZK',
  JP: 'JPY',
  KR: 'KRW',
  SG: 'SGD',
  HK: 'HKD',
  AE: 'AED',
  SA: 'SAR',
  IN: 'INR',
  BR: 'BRL',
  MX: 'MXN',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  EG: 'EGP',
  PH: 'PHP',
  MY: 'MYR',
  TH: 'THB',
  VN: 'VND',
  ID: 'IDR',
  TR: 'TRY',
  RO: 'RON',
  GR: 'EUR',
  IL: 'ILS',
  CL: 'CLP',
  CO: 'COP',
  AR: 'ARS',
  PE: 'PEN',
}

/** Get the default currency for a country code, falling back to USD */
export function getCurrencyForCountry(countryCode: string): string {
  return COUNTRY_CURRENCY_MAP[countryCode] || 'USD'
}

/** Get country name by code */
export function getCountryName(code: string): string {
  return COUNTRIES.find((c) => c.code === code)?.name || code
}
