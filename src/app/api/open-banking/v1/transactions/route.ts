import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Open Banking AISP — Transaction Information endpoint.
 * Follows UK Open Banking Standard (v3.1).
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient()
  const authHeader = request.headers.get('Authorization')
  const { searchParams } = request.nextUrl
  const accountId = searchParams.get('accountId')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing Authorization' }, { status: 401 })
  }

  const token = authHeader.slice(7)

  const { data: consent } = await admin
    .from('open_banking_consents')
    .select('*')
    .eq('access_token_hash', token)
    .eq('status', 'authorised')
    .eq('consent_type', 'account_access')
    .single()

  if (!consent) {
    return NextResponse.json({ error: 'Invalid consent' }, { status: 403 })
  }

  if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Consent expired' }, { status: 403 })
  }

  if (!consent.permissions?.includes('ReadTransactionsBasic') && !consent.permissions?.includes('ReadTransactionsDetail')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Build transaction query
  let query = admin
    .from('transactions')
    .select('id, account_id, type, category, amount, currency_code, description, reference, counterparty_name, balance_after, status, transaction_date, created_at')
    .eq('status', 'completed')
    .order('transaction_date', { ascending: false })
    .limit(100)

  // Filter by account if provided
  if (accountId) {
    // Verify this account is in the consent
    if (consent.account_ids?.length > 0 && !consent.account_ids.includes(accountId)) {
      return NextResponse.json({ error: 'Account not in consent scope' }, { status: 403 })
    }
    query = query.eq('account_id', accountId)
  } else {
    // Return transactions from all consented accounts
    const { data: accounts } = await admin
      .from('accounts')
      .select('id')
      .eq('user_id', consent.user_id)

    const ids = consent.account_ids?.length > 0
      ? consent.account_ids
      : (accounts?.map(a => a.id) || [])
    query = query.in('account_id', ids)
  }

  // Date range filtering from consent
  if (consent.transaction_from_date) {
    query = query.gte('transaction_date', consent.transaction_from_date)
  }
  if (consent.transaction_to_date) {
    query = query.lte('transaction_date', consent.transaction_to_date)
  }

  const { data: transactions } = await query

  // Log
  await admin.from('open_banking_api_log').insert({
    consent_id: consent.id,
    provider_id: consent.provider_id,
    endpoint: '/api/open-banking/v1/transactions',
    method: 'GET',
    status_code: 200,
    request_ip: request.headers.get('x-forwarded-for') || 'unknown',
  })

  return NextResponse.json({
    Data: {
      Transaction: (transactions || []).map((tx) => ({
        TransactionId: tx.id,
        AccountId: tx.account_id,
        CreditDebitIndicator: tx.type === 'credit' ? 'Credit' : 'Debit',
        Status: tx.status === 'completed' ? 'Booked' : 'Pending',
        BookingDateTime: tx.transaction_date,
        Amount: { Amount: String(tx.amount), Currency: tx.currency_code },
        ...(consent.permissions?.includes('ReadTransactionsDetail') ? {
          TransactionInformation: tx.description,
          TransactionReference: tx.reference,
          Balance: tx.balance_after !== null ? {
            Amount: { Amount: String(tx.balance_after), Currency: tx.currency_code },
            CreditDebitIndicator: tx.balance_after >= 0 ? 'Credit' : 'Debit',
            Type: 'InterimBooked',
          } : undefined,
          CreditorAgent: tx.type === 'debit' ? { Name: tx.counterparty_name } : undefined,
          DebtorAgent: tx.type === 'credit' ? { Name: tx.counterparty_name } : undefined,
        } : {}),
      })),
    },
    Links: { Self: '/api/open-banking/v1/transactions' },
    Meta: { TotalPages: 1 },
  })
}
