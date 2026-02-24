import { getDisputeById } from '@/lib/queries/disputes'
import { DisputeDetailClient } from './dispute-detail-client'
import { notFound } from 'next/navigation'

interface DisputeDetailPageProps {
  params: Promise<{ disputeId: string }>
}

export default async function DisputeDetailPage({ params }: DisputeDetailPageProps) {
  const { disputeId } = await params

  const dispute = await getDisputeById(disputeId)
  if (!dispute) notFound()

  return <DisputeDetailClient dispute={dispute} />
}
