import { NextRequest, NextResponse } from 'next/server'
import { getSpendingByCategory, getDailySpending, getMonthlyComparison, getIncomeVsExpenses } from '@/lib/queries/transactions'

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get('accountId') || undefined

  const [categorySpending, dailySpending, monthlyComparison, incomeVsExpenses] = await Promise.all([
    getSpendingByCategory(accountId),
    getDailySpending(accountId),
    getMonthlyComparison(accountId),
    getIncomeVsExpenses(accountId),
  ])

  return NextResponse.json({
    categorySpending,
    dailySpending,
    monthlyComparison,
    incomeVsExpenses,
  })
}
