import { createClient } from '@/lib/supabase/server'

/**
 * Verify that the current user has admin or super_admin role.
 * Returns the user ID. Throws if not authenticated or not admin.
 * Uses the regular (RLS) client — reads own profile row via auth.uid() = id policy.
 */
export async function requireAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'super_admin', 'auditor'].includes(profile.role)) {
    throw new Error('Unauthorized: admin access required')
  }

  return user.id
}

/**
 * Verify the current user is a super_admin.
 * Returns the user ID. Throws if not super_admin.
 */
export async function requireSuperAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Unauthorized: super admin access required')
  }

  return user.id
}
