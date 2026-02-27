'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { logAuditEvent } from '@/lib/audit'
import {
  generateComplaintReference,
  calculateDeadline,
} from '@/lib/regulatory/complaints'
import type { ComplaintCategory } from '@/lib/types/regulatory'

export async function submitComplaint(input: {
  category: ComplaintCategory
  subject: string
  description: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const reference = generateComplaintReference()
  const deadline = calculateDeadline(new Date())

  const { data, error } = await supabase
    .from('complaints')
    .insert({
      user_id: user.id,
      reference,
      category: input.category,
      subject: input.subject,
      description: input.description,
      status: 'received',
      priority: 'standard',
      deadline_at: deadline.toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error

  await logAuditEvent({
    eventType: 'compliance_event',
    actorId: user.id,
    actorRole: 'customer',
    targetTable: 'complaints',
    targetId: data.id,
    action: 'submit_complaint',
    details: {
      reference,
      category: input.category,
      subject: input.subject,
    },
  })

  revalidatePath('/my-complaints')
}
