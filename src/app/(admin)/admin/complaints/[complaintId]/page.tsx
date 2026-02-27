import { getComplaintDetail } from '@/lib/queries/regulatory'
import { ComplaintDetailClient } from './detail-client'

interface Props {
  params: Promise<{ complaintId: string }>
}

export default async function ComplaintDetailPage({ params }: Props) {
  const { complaintId } = await params
  const complaint = await getComplaintDetail(complaintId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">
          Complaint {complaint.reference}
        </h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          {complaint.subject}
        </p>
      </div>
      <ComplaintDetailClient complaint={complaint} />
    </div>
  )
}
