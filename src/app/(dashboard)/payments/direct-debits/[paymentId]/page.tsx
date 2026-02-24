import { getDirectDebitById, getDirectDebitPaymentHistory } from '@/lib/queries/direct-debits'
import { DDDetailClient } from './dd-detail-client'
import { notFound } from 'next/navigation'

interface DDDetailPageProps {
  params: Promise<{ paymentId: string }>
}

export default async function DDDetailPage({ params }: DDDetailPageProps) {
  const { paymentId } = await params

  const directDebit = await getDirectDebitById(paymentId)
  if (!directDebit) notFound()

  // Fetch payment history using payee name and account
  const counterpartyName = directDebit.payee?.name || directDebit.description || ''
  const history = counterpartyName
    ? await getDirectDebitPaymentHistory(counterpartyName, directDebit.from_account_id)
    : []

  return <DDDetailClient directDebit={directDebit} history={history} />
}
