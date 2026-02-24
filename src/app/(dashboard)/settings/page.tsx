import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getLoginActivity } from '@/lib/queries/security'
import { calculateSecurityScore } from '@/lib/queries/security'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/auth/login')
  }

  const loginActivity = await getLoginActivity()
  const securityScore = calculateSecurityScore(profile, loginActivity)

  return (
    <SettingsClient
      profile={profile}
      loginActivity={loginActivity}
      securityScore={securityScore}
    />
  )
}
