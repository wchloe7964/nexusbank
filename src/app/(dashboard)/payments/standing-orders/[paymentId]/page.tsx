import { getStandingOrderById, getStandingOrderPaymentHistory } from '@/lib/queries/standing-orders'
import { SODetailClient } from './so-detail-client'
import { notFound } from 'next/navigation'

interface SODetailPageProps {
  params: Promise<{ paymentId: string }>
}

export default async function SODetailPage({ params }: SODetailPageProps) {
  const { paymentId } = await params

  const standingOrder = await getStandingOrderById(paymentId)
  if (!standingOrder) notFound()

  const counterpartyName = standingOrder.payee?.name || standingOrder.description || ''
  const history = counterpartyName
    ? await getStandingOrderPaymentHistory(counterpartyName, standingOrder.from_account_id)
    : []

  return <SODetailClient standingOrder={standingOrder} history={history} />
}
