import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/queries/profile'
import { getLoginActivity } from '@/lib/queries/security'
import { calculateSecurityScore } from '@/lib/queries/security'
import { hasTransferPin } from '@/lib/pin/pin-service'
import SettingsClient from './settings-client'

export default async function SettingsPage() {
  const profile = await getProfile()

  if (!profile) {
    redirect('/login')
  }

  const [loginActivity, hasPinSet] = await Promise.all([
    getLoginActivity(),
    hasTransferPin(),
  ])
  const securityScore = calculateSecurityScore(profile, loginActivity)

  return (
    <SettingsClient
      profile={profile}
      loginActivity={loginActivity}
      securityScore={securityScore}
      hasPinSet={hasPinSet}
    />
  )
}
