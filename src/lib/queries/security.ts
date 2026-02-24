import { createClient } from '@/lib/supabase/server'
import type { LoginActivity, SecurityScore, Profile } from '@/lib/types'

export async function getLoginActivity(limit = 20): Promise<LoginActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('login_activity')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('getLoginActivity error:', error.message)
    return []
  }
  return (data ?? []) as LoginActivity[]
}

export async function getSuspiciousActivity(): Promise<LoginActivity[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('login_activity')
    .select('*')
    .eq('is_suspicious', true)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('getSuspiciousActivity error:', error.message)
    return []
  }
  return (data ?? []) as LoginActivity[]
}

export function calculateSecurityScore(profile: Profile, loginActivity: LoginActivity[]): SecurityScore {
  const factors: SecurityScore['factors'] = []

  // 2FA enabled: 25 pts
  factors.push({
    label: 'Two-factor authentication',
    points: profile.two_factor_enabled ? 25 : 0,
    maxPoints: 25,
    achieved: profile.two_factor_enabled,
  })

  // Email notifications on: 15 pts
  factors.push({
    label: 'Email notifications enabled',
    points: profile.notification_email ? 15 : 0,
    maxPoints: 15,
    achieved: profile.notification_email,
  })

  // Push notifications on: 10 pts
  factors.push({
    label: 'Push notifications enabled',
    points: profile.notification_push ? 10 : 0,
    maxPoints: 10,
    achieved: profile.notification_push,
  })

  // No suspicious activity: 20 pts
  const hasSuspicious = loginActivity.some((a) => a.is_suspicious)
  factors.push({
    label: 'No suspicious activity detected',
    points: hasSuspicious ? 0 : 20,
    maxPoints: 20,
    achieved: !hasSuspicious,
  })

  // Profile complete (has name, phone, address, postcode): 10 pts
  const profileComplete = !!(
    profile.full_name &&
    profile.phone_number &&
    profile.address_line_1 &&
    profile.postcode
  )
  factors.push({
    label: 'Profile information complete',
    points: profileComplete ? 10 : 0,
    maxPoints: 10,
    achieved: profileComplete,
  })

  // Recent login activity (indicates account is actively used): 20 pts
  const hasRecentActivity = loginActivity.length > 0
  factors.push({
    label: 'Account activity monitored',
    points: hasRecentActivity ? 20 : 0,
    maxPoints: 20,
    achieved: hasRecentActivity,
  })

  const score = factors.reduce((sum, f) => sum + f.points, 0)

  return { score, factors }
}
