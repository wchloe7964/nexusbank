/**
 * Foreign exchange rate service.
 * Uses the ECB (European Central Bank) API for indicative rates.
 * Configure FX_PROVIDER env var to switch to CurrencyCloud / Wise.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export interface FxQuote {
  baseCurrency: string
  targetCurrency: string
  rate: number
  inverseRate: number
  convertedAmount: number
  fee: number
  totalCost: number
  expiresAt: string
}

/** Indicative fee schedule by payment method */
const FEE_SCHEDULE: Record<string, { fixedFee: number; percentFee: number }> = {
  sepa:   { fixedFee: 0,     percentFee: 0 },
  swift:  { fixedFee: 25,    percentFee: 0.003 },
  target2:{ fixedFee: 35,    percentFee: 0.002 },
}

/**
 * Fetch exchange rate — checks DB cache first, then falls back to ECB.
 * Returns 1.0 for same-currency pairs.
 */
export async function getExchangeRate(
  base: string,
  target: string
): Promise<{ rate: number; source: string }> {
  if (base === target) return { rate: 1, source: 'identity' }

  const admin = createAdminClient()

  // Check cache first
  const { data: cached } = await admin
    .from('exchange_rates')
    .select('rate, source')
    .eq('base_currency', base)
    .eq('target_currency', target)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (cached) return { rate: Number(cached.rate), source: cached.source ?? 'cache' }

  // Fetch from ECB (free, no API key)
  try {
    const rate = await fetchEcbRate(base, target)

    // Cache for 1 hour
    await admin
      .from('exchange_rates')
      .upsert({
        base_currency: base,
        target_currency: target,
        rate,
        source: 'ecb',
        fetched_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      }, { onConflict: 'base_currency,target_currency' })

    return { rate, source: 'ecb' }
  } catch {
    // Fallback: use indicative rates if ECB fails
    const fallbackRate = FALLBACK_RATES[`${base}_${target}`] || FALLBACK_RATES[`${target}_${base}`]
    if (fallbackRate) {
      const rate = FALLBACK_RATES[`${base}_${target}`] || 1 / FALLBACK_RATES[`${target}_${base}`]!
      return { rate, source: 'fallback' }
    }
    throw new Error(`Unable to fetch exchange rate for ${base}/${target}`)
  }
}

/**
 * Get a full FX quote including fees.
 */
export async function getFxQuote(
  amount: number,
  baseCurrency: string,
  targetCurrency: string,
  paymentMethod: 'sepa' | 'swift' | 'target2'
): Promise<FxQuote> {
  const { rate } = await getExchangeRate(baseCurrency, targetCurrency)
  const schedule = FEE_SCHEDULE[paymentMethod] || FEE_SCHEDULE.swift
  const fee = schedule.fixedFee + amount * schedule.percentFee
  const convertedAmount = Math.round(amount * rate * 100) / 100
  const totalCost = Math.round((amount + fee) * 100) / 100

  return {
    baseCurrency,
    targetCurrency,
    rate,
    inverseRate: Math.round((1 / rate) * 1000000) / 1000000,
    convertedAmount,
    fee: Math.round(fee * 100) / 100,
    totalCost,
    expiresAt: new Date(Date.now() + 300000).toISOString(), // 5 min validity
  }
}

/**
 * Calculate estimated delivery based on payment method.
 */
export function estimateDelivery(paymentMethod: 'sepa' | 'swift' | 'target2'): Date {
  const now = new Date()
  const businessDays: Record<string, number> = {
    sepa: 1,
    target2: 0,    // same day (if before cutoff)
    swift: 3,
  }
  const days = businessDays[paymentMethod] || 3
  let added = 0
  const result = new Date(now)
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

// ── Internal helpers ──

async function fetchEcbRate(base: string, target: string): Promise<number> {
  // ECB publishes rates against EUR
  const res = await fetch(
    'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
    { next: { revalidate: 3600 } }
  )
  if (!res.ok) throw new Error('ECB API unavailable')

  const xml = await res.text()
  const rateMap = parseEcbXml(xml)
  rateMap['EUR'] = 1 // EUR is always 1

  const baseRate = rateMap[base]
  const targetRate = rateMap[target]

  if (!baseRate || !targetRate) {
    throw new Error(`ECB does not publish rates for ${base} or ${target}`)
  }

  // Cross rate: target/base in EUR terms
  return Math.round((targetRate / baseRate) * 1000000) / 1000000
}

function parseEcbXml(xml: string): Record<string, number> {
  const rates: Record<string, number> = {}
  const regex = /currency='([A-Z]{3})'\s+rate='([0-9.]+)'/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    rates[match[1]] = parseFloat(match[2])
  }
  return rates
}

/** Fallback indicative rates (last known) in case ECB is unreachable */
const FALLBACK_RATES: Record<string, number> = {
  GBP_USD: 1.27, GBP_EUR: 1.17, GBP_JPY: 190.5, GBP_AUD: 1.94,
  GBP_CAD: 1.73, GBP_CHF: 1.12, GBP_INR: 106.2, GBP_SGD: 1.71,
  EUR_USD: 1.08, EUR_GBP: 0.855, EUR_JPY: 163.0, EUR_CHF: 0.96,
  USD_EUR: 0.925, USD_GBP: 0.787, USD_JPY: 150.5, USD_CAD: 1.36,
}
