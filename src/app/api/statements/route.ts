import { NextRequest, NextResponse } from 'next/server'
import { getStatementSummaries, getMonthlyStatementData } from '@/lib/queries/transactions'

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('accountId')
  const year = request.nextUrl.searchParams.get('year')
  const month = request.nextUrl.searchParams.get('month')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
  }

  // If year and month provided, return transaction data for that month
  if (year && month) {
    const transactions = await getMonthlyStatementData(accountId, Number(year), Number(month))
    return NextResponse.json({ transactions })
  }

  // Otherwise return summaries
  const summaries = await getStatementSummaries(accountId)
  return NextResponse.json({ summaries })
}
