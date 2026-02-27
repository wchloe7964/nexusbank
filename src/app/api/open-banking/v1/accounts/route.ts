import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Open Banking AISP — Account Information endpoint.
 * Follows UK Open Banking Standard (v3.1).
 *
 * Authorization: Bearer <access_token>
 * The access_token maps to an active consent.
 */
export async function GET(request: NextRequest) {
  const admin = createAdminClient()
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    )
  }

  const token = authHeader.slice(7)

  // Look up consent by access token hash
  const { data: consent } = await admin
    .from('open_banking_consents')
    .select('*, provider:third_party_providers!provider_id(name, provider_type)')
    .eq('access_token_hash', token)
    .eq('status', 'authorised')
    .eq('consent_type', 'account_access')
    .single()

  if (!consent) {
    return NextResponse.json(
      { error: 'Invalid or expired consent' },
      { status: 403 }
    )
  }

  // Check expiry
  if (consent.expires_at && new Date(consent.expires_at) < new Date()) {
    await admin
      .from('open_banking_consents')
      .update({ status: 'expired' })
      .eq('id', consent.id)
    return NextResponse.json({ error: 'Consent has expired' }, { status: 403 })
  }

  // Check permissions
  if (!consent.permissions?.includes('ReadAccountsBasic') && !consent.permissions?.includes('ReadAccountsDetail')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Fetch consented accounts
  const accountIds = consent.account_ids || []
  let query = admin.from('accounts').select('id, account_name, account_type, sort_code, account_number, balance, available_balance, currency_code, is_active, opened_at')
    .eq('user_id', consent.user_id)
    .eq('is_active', true)

  if (accountIds.length > 0) {
    query = query.in('id', accountIds)
  }

  const { data: accounts } = await query

  // Log API access
  await admin.from('open_banking_api_log').insert({
    consent_id: consent.id,
    provider_id: consent.provider_id,
    endpoint: '/api/open-banking/v1/accounts',
    method: 'GET',
    status_code: 200,
    request_ip: request.headers.get('x-forwarded-for') || 'unknown',
  })

  // Update last accessed
  await admin
    .from('open_banking_consents')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', consent.id)

  // Return in OB standard format
  return NextResponse.json({
    Data: {
      Account: (accounts || []).map((acc) => ({
        AccountId: acc.id,
        Currency: acc.currency_code,
        AccountType: acc.account_type === 'current' ? 'Personal' : 'Savings',
        AccountSubType: acc.account_type,
        Nickname: acc.account_name,
        Account: [{
          SchemeName: 'UK.OBIE.SortCodeAccountNumber',
          Identification: `${acc.sort_code.replace(/-/g, '')}${acc.account_number}`,
          Name: acc.account_name,
        }],
        ...(consent.permissions?.includes('ReadAccountsDetail') ? {
          Balance: [{
            Amount: { Amount: String(acc.balance), Currency: acc.currency_code },
            CreditDebitIndicator: acc.balance >= 0 ? 'Credit' : 'Debit',
            Type: 'InterimAvailable',
          }],
        } : {}),
      })),
    },
    Links: { Self: '/api/open-banking/v1/accounts' },
    Meta: { TotalPages: 1 },
  })
}
