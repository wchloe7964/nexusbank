/**
 * IBAN validation and formatting utilities.
 * Follows ISO 13616 standard.
 */

/** Country-specific IBAN lengths */
const IBAN_LENGTHS: Record<string, number> = {
  AL: 28, AD: 28, AT: 20, AZ: 28, BH: 22, BY: 28, BE: 16, BA: 20,
  BR: 29, BG: 22, CR: 22, HR: 21, CY: 28, CZ: 24, DK: 18, DO: 28,
  TL: 23, EG: 29, SV: 28, EE: 20, FO: 18, FI: 18, FR: 27, GE: 22,
  DE: 22, GI: 23, GR: 27, GL: 18, GT: 28, HU: 28, IS: 26, IQ: 23,
  IE: 22, IL: 23, IT: 27, JO: 30, KZ: 20, XK: 20, KW: 30, LV: 21,
  LB: 28, LY: 25, LI: 21, LT: 20, LU: 20, MK: 19, MT: 31, MR: 27,
  MU: 30, MC: 27, MD: 24, ME: 22, NL: 18, NO: 15, PK: 24, PS: 29,
  PL: 28, PT: 25, QA: 29, RO: 24, LC: 32, SM: 27, SA: 24, RS: 22,
  SC: 31, SK: 24, SI: 19, ES: 24, SD: 18, SE: 24, CH: 21, TN: 24,
  TR: 26, UA: 29, AE: 23, GB: 22, VA: 22, VG: 24,
}

/** SEPA zone country codes */
export const SEPA_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU',
  'MT', 'MC', 'NL', 'NO', 'PL', 'PT', 'RO', 'SM', 'SK', 'SI',
  'ES', 'SE', 'CH', 'GB', 'VA',
])

/** Strip whitespace and convert to uppercase */
export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase()
}

/** Format IBAN with spaces every 4 characters */
export function formatIban(iban: string): string {
  const clean = normalizeIban(iban)
  return clean.replace(/(.{4})/g, '$1 ').trim()
}

/** Extract country code from IBAN */
export function ibanCountryCode(iban: string): string {
  return normalizeIban(iban).slice(0, 2)
}

/** Validate IBAN structure and checksum */
export function validateIban(iban: string): { valid: boolean; error?: string } {
  const clean = normalizeIban(iban)

  if (clean.length < 5) {
    return { valid: false, error: 'IBAN is too short' }
  }

  const country = clean.slice(0, 2)
  if (!/^[A-Z]{2}$/.test(country)) {
    return { valid: false, error: 'IBAN must start with a two-letter country code' }
  }

  const expectedLength = IBAN_LENGTHS[country]
  if (!expectedLength) {
    return { valid: false, error: `Country code ${country} is not recognised for IBAN` }
  }

  if (clean.length !== expectedLength) {
    return { valid: false, error: `IBAN for ${country} must be ${expectedLength} characters (got ${clean.length})` }
  }

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(clean)) {
    return { valid: false, error: 'IBAN contains invalid characters' }
  }

  // MOD 97 check (ISO 7064)
  const rearranged = clean.slice(4) + clean.slice(0, 4)
  const numericStr = rearranged
    .split('')
    .map((ch) => {
      const code = ch.charCodeAt(0)
      return code >= 65 ? String(code - 55) : ch
    })
    .join('')

  // Compute mod 97 on the large number using chunking
  let remainder = 0
  for (let i = 0; i < numericStr.length; i += 7) {
    const chunk = String(remainder) + numericStr.slice(i, i + 7)
    remainder = parseInt(chunk, 10) % 97
  }

  if (remainder !== 1) {
    return { valid: false, error: 'IBAN check digits are invalid' }
  }

  return { valid: true }
}

/** Check if a country is in the SEPA zone */
export function isSepaCountry(countryCode: string): boolean {
  return SEPA_COUNTRIES.has(countryCode.toUpperCase())
}

/** Determine payment method based on destination country */
export function suggestPaymentMethod(
  sourceCountry: string,
  destinationCountry: string
): 'sepa' | 'swift' {
  if (isSepaCountry(sourceCountry) && isSepaCountry(destinationCountry)) {
    return 'sepa'
  }
  return 'swift'
}

/** Validate SWIFT/BIC code */
export function validateSwiftBic(bic: string): { valid: boolean; error?: string } {
  const clean = bic.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(clean)) {
    return { valid: false, error: 'Invalid SWIFT/BIC code format (expected 8 or 11 characters)' }
  }
  return { valid: true }
}
