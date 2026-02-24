import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const accountId = searchParams.get('accountId')
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  let query = supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })

  if (accountId) query = query.eq('account_id', accountId)
  if (category) query = query.eq('category', category)
  if (type) query = query.eq('type', type)
  if (startDate) query = query.gte('transaction_date', startDate)
  if (endDate) query = query.lte('transaction_date', endDate)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }

  const transactions = data ?? []

  const csvHeader = 'Date,Description,Counterparty,Category,Type,Amount,Balance After,Status'

  const csvRows = transactions.map((tx) => {
    const dateStr = format(new Date(tx.transaction_date), 'dd/MM/yyyy')
    const description = escapeCsvField(tx.description ?? '')
    const counterparty = escapeCsvField(tx.counterparty_name ?? '')
    const categoryVal = escapeCsvField(tx.category ?? '')
    const typeVal = tx.type ?? ''
    const amount = tx.type === 'debit' ? -Math.abs(tx.amount) : Math.abs(tx.amount)
    const balanceAfter = tx.balance_after != null ? tx.balance_after : ''
    const status = tx.status ?? ''

    return `${dateStr},${description},${counterparty},${categoryVal},${typeVal},${amount},${balanceAfter},${status}`
  })

  const csv = [csvHeader, ...csvRows].join('\n')
  const today = format(new Date(), 'yyyy-MM-dd')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="nexusbank-transactions-${today}.csv"`,
    },
  })
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
