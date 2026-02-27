import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CustomerComplaintsClient } from './complaints-client'
import type { Complaint } from '@/lib/types/regulatory'

export default async function CustomerComplaintsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: complaints } = await supabase
    .from('complaints')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight text-foreground">My Complaints</h1>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Submit and track complaints. We aim to resolve all complaints within 8 weeks.
        </p>
      </div>
      <CustomerComplaintsClient complaints={(complaints ?? []) as Complaint[]} />
    </div>
  )
}
