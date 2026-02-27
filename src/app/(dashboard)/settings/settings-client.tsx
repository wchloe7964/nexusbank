'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'
import {
  User, Shield, Bell, Smartphone, Mail, Eye, EyeOff, CheckCircle, AlertCircle,
  Loader2, Fingerprint, LogIn, LogOut, Key, ShieldAlert, XCircle, Monitor,
  Tablet, Phone, ChevronRight, Zap,
} from 'lucide-react'
import Link from 'next/link'
import { updateProfile, changePassword, updateNotificationPreferences, signOutAllDevices, updateTwoFactorEnabled } from './actions'
import { PinEntryDialog, PinSetupDialog } from '@/components/shared/pin-dialog'
import { TwoFactorSetupDialog } from '@/components/two-factor/two-factor-setup-dialog'
import { TwoFactorDisableDialog } from '@/components/two-factor/two-factor-disable-dialog'
import { formatDistanceToNow } from 'date-fns'
import type { Profile, LoginActivity, SecurityScore } from '@/lib/types'

const eventIcons: Record<string, typeof LogIn> = {
  login_success: LogIn,
  login_failed: ShieldAlert,
  logout: LogOut,
  password_changed: Key,
  two_factor_enabled: Shield,
  two_factor_disabled: Shield,
  profile_updated: User,
  session_expired: XCircle,
  suspicious_activity: ShieldAlert,
}

const eventLabels: Record<string, string> = {
  login_success: 'Successful login',
  login_failed: 'Failed login attempt',
  logout: 'Logged out',
  password_changed: 'Password changed',
  two_factor_enabled: '2FA enabled',
  two_factor_disabled: '2FA disabled',
  profile_updated: 'Profile updated',
  session_expired: 'Session expired',
  suspicious_activity: 'Suspicious activity',
}

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Phone,
  tablet: Tablet,
  unknown: Monitor,
}

function maskIp(ip: string | null): string {
  if (!ip) return 'Unknown'
  const parts = ip.split('.')
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.***.*${parts[3].slice(-1)}`
  return ip.slice(0, 8) + '***'
}

interface SettingsClientProps {
  profile: Profile
  loginActivity: LoginActivity[]
  securityScore: SecurityScore
  hasPinSet: boolean
}

export default function SettingsClient({ profile, loginActivity, securityScore, hasPinSet }: SettingsClientProps) {
  // Profile state
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [email] = useState(profile.email ?? '')
  const [phone, setPhone] = useState(profile.phone_number ?? '')
  const [addressLine1, setAddressLine1] = useState(profile.address_line_1 ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [postcode, setPostcode] = useState(profile.postcode ?? '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Security state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [twoFactor, setTwoFactor] = useState(profile.two_factor_enabled)
  const [showSetup2FA, setShowSetup2FA] = useState(false)
  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [biometric, setBiometric] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Notification preferences
  const [emailNotifs, setEmailNotifs] = useState(profile.notification_email)
  const [pushNotifs, setPushNotifs] = useState(profile.notification_push)
  const [smsNotifs, setSmsNotifs] = useState(profile.notification_sms)
  const [transactionAlerts, setTransactionAlerts] = useState(true)
  const [lowBalance, setLowBalance] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifMessage, setNotifMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sign out all devices
  const [showSignOutDialog, setShowSignOutDialog] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // PIN verification state
  const [showPinDialog, setShowPinDialog] = useState(false)
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pinAction, setPinAction] = useState<'password' | '2fa_enable' | '2fa_disable' | null>(null)

  // Read biometric preference from localStorage (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nexusbank_biometric_preference')
      if (stored === 'true') setBiometric(true)
    } catch {
      // localStorage unavailable
    }
  }, [])

  async function handleProfileSave() {
    setProfileSaving(true)
    setProfileMessage(null)
    const result = await updateProfile({
      full_name: fullName,
      phone_number: phone,
      address_line_1: addressLine1,
      city,
      postcode,
    })
    setProfileSaving(false)
    if (result.error) {
      setProfileMessage({ type: 'error', text: result.error })
    } else {
      setProfileMessage({ type: 'success', text: 'Profile updated successfully' })
    }
    setTimeout(() => setProfileMessage(null), 4000)
  }

  function handlePasswordChangeClick() {
    if (!hasPinSet) {
      setShowPinSetup(true)
      return
    }
    setPinAction('password')
    setShowPinDialog(true)
  }

  async function handlePasswordChange(pin: string) {
    setShowPinDialog(false)
    setPinAction(null)
    setPasswordSaving(true)
    setPasswordMessage(null)
    const result = await changePassword({
      currentPassword,
      newPassword,
      pin,
    })
    setPasswordSaving(false)

    if (result.error) {
      setPasswordMessage({ type: 'error', text: result.error })
    } else {
      setPasswordMessage({ type: 'success', text: 'Password updated successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setTimeout(() => setPasswordMessage(null), 4000)
  }

  async function handleNotificationSave() {
    setNotifSaving(true)
    setNotifMessage(null)
    const result = await updateNotificationPreferences({
      notification_email: emailNotifs,
      notification_sms: smsNotifs,
      notification_push: pushNotifs,
    })
    setNotifSaving(false)
    if (result.error) {
      setNotifMessage({ type: 'error', text: result.error })
    } else {
      setNotifMessage({ type: 'success', text: 'Notification preferences saved' })
    }
    setTimeout(() => setNotifMessage(null), 4000)
  }

  async function handleSignOutAll() {
    setSigningOut(true)
    const result = await signOutAllDevices()
    setSigningOut(false)
    if (result.error) {
      setNotifMessage({ type: 'error', text: result.error })
    }
    // If successful, the user will be redirected to login
  }

  // Security score color
  const scoreColor = securityScore.score >= 71 ? 'text-emerald-500' : securityScore.score >= 41 ? 'text-amber-500' : 'text-red-500'
  const scoreIndicator = securityScore.score >= 71 ? '[&>div]:bg-emerald-500' : securityScore.score >= 41 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader title="Settings" description="Manage your account preferences" />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-1.5 h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-1.5 h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base tracking-tight">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input type="email" value={email} disabled className="rounded-full bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-full" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Address Line 1" className="rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-full" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postcode</label>
                  <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} className="rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={handleProfileSave} disabled={profileSaving}>
                  {profileSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                {profileMessage && (
                  <span className={`flex items-center gap-1 text-sm ${profileMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
                    {profileMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {profileMessage.text}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base tracking-tight">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="rounded-full"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                    >
                      {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="rounded-full"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowNewPw(!showNewPw)}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="rounded-full"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handlePasswordChangeClick}
                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || passwordSaving}
                  >
                    {passwordSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                  {passwordMessage && (
                    <span className={`flex items-center gap-1 text-sm ${passwordMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
                      {passwordMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {passwordMessage.text}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base tracking-tight">Security Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {twoFactor && <Badge variant="success">Enabled</Badge>}
                    <Switch
                      checked={twoFactor}
                      onCheckedChange={() => {
                        if (!hasPinSet) {
                          setShowPinSetup(true)
                          return
                        }
                        setPinAction(twoFactor ? '2fa_disable' : '2fa_enable')
                        setShowPinDialog(true)
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Fingerprint className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Biometric Login</p>
                      <p className="text-xs text-muted-foreground">Use fingerprint or Face ID</p>
                    </div>
                  </div>
                  <Switch
                    checked={biometric}
                    onCheckedChange={(checked) => {
                      setBiometric(checked)
                      try {
                        localStorage.setItem('nexusbank_biometric_preference', String(checked))
                      } catch {
                        // localStorage unavailable
                      }
                    }}
                  />
                </div>
                {biometric && (
                  <p className="text-xs text-muted-foreground pl-[52px]">
                    Biometric login is available on devices that support Face ID, Touch ID, or Windows Hello.
                  </p>
                )}
              </CardContent>
            </Card>

            <TwoFactorSetupDialog
              open={showSetup2FA}
              onClose={() => setShowSetup2FA(false)}
              onSuccess={() => {
                setTwoFactor(true)
                setShowSetup2FA(false)
              }}
            />
            <TwoFactorDisableDialog
              open={showDisable2FA}
              onClose={() => setShowDisable2FA(false)}
              onSuccess={() => {
                setTwoFactor(false)
                setShowDisable2FA(false)
              }}
            />

            {/* Security Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base tracking-tight">Security Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <p className={cn('text-4xl font-bold tabular-nums', scoreColor)}>{securityScore.score}</p>
                    <p className="text-xs text-muted-foreground">out of 100</p>
                  </div>
                  <div className="flex-1">
                    <Progress value={securityScore.score} className={cn('h-3', scoreIndicator)} />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {securityScore.score >= 71 ? 'Your account is well protected' :
                       securityScore.score >= 41 ? 'Your account has moderate protection' :
                       'Your account needs attention'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {securityScore.factors.map((factor) => (
                    <div key={factor.label} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {factor.achieved ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={factor.achieved ? '' : 'text-muted-foreground'}>{factor.label}</span>
                      </div>
                      <span className={cn('text-xs tabular-nums', factor.achieved ? 'text-emerald-500' : 'text-muted-foreground')}>
                        {factor.points}/{factor.maxPoints}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base tracking-tight">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {loginActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent login activity recorded.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {loginActivity.slice(0, 10).map((event) => {
                      const EventIcon = eventIcons[event.event_type] || LogIn
                      const DeviceIcon = deviceIcons[event.device_type] || Monitor
                      const isSuspicious = event.is_suspicious || event.event_type === 'login_failed' || event.event_type === 'suspicious_activity'

                      return (
                        <div key={event.id} className="flex items-start gap-3 py-3">
                          <div className={cn(
                            'rounded-xl p-2 shrink-0 mt-0.5',
                            isSuspicious ? 'bg-red-500/10' : 'bg-primary/10'
                          )}>
                            <EventIcon className={cn('h-3.5 w-3.5', isSuspicious ? 'text-red-500' : 'text-primary')} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{eventLabels[event.event_type] || event.event_type}</p>
                              {isSuspicious && <Badge variant="destructive" className="text-[10px]">Suspicious</Badge>}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}</span>
                              {event.browser && (
                                <>
                                  <span>&middot;</span>
                                  <span className="flex items-center gap-1">
                                    <DeviceIcon className="h-3 w-3" />
                                    {event.browser}{event.os ? ` on ${event.os}` : ''}
                                  </span>
                                </>
                              )}
                            </div>
                            {event.ip_address && (
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                IP: {maskIp(event.ip_address)}
                                {event.location && ` · ${event.location}`}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sign Out All Devices */}
            <Card className="border-destructive/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sign Out All Devices</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This will sign you out of all browsers and devices, including this one.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setShowSignOutDialog(true)}>
                    Sign Out All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* PIN verification for password change / 2FA toggle */}
            {showPinDialog && pinAction && (
              <PinEntryDialog
                onVerified={async (pin: string) => {
                  setShowPinDialog(false)
                  const action = pinAction
                  setPinAction(null)

                  if (action === 'password') {
                    handlePasswordChange(pin)
                  } else if (action === '2fa_enable') {
                    const result = await updateTwoFactorEnabled(true, pin)
                    if (result.error) {
                      setPasswordMessage({ type: 'error', text: result.error })
                    } else {
                      setShowSetup2FA(true)
                    }
                  } else if (action === '2fa_disable') {
                    const result = await updateTwoFactorEnabled(false, pin)
                    if (result.error) {
                      setPasswordMessage({ type: 'error', text: result.error })
                    } else {
                      setShowDisable2FA(true)
                    }
                  }
                }}
                onCancel={() => {
                  setShowPinDialog(false)
                  setPinAction(null)
                }}
                title={
                  pinAction === 'password'
                    ? 'Verify Password Change'
                    : 'Verify Security Change'
                }
                description="Enter your 4-digit transfer PIN to authorise this change."
              />
            )}

            {/* PIN setup dialog for first-time users */}
            {showPinSetup && (
              <PinSetupDialog
                onComplete={() => {
                  setShowPinSetup(false)
                  setPasswordMessage({ type: 'success', text: 'Transfer PIN set successfully. Please try again.' })
                  setTimeout(() => setPasswordMessage(null), 4000)
                }}
                onCancel={() => setShowPinSetup(false)}
              />
            )}

            <Dialog open={showSignOutDialog} onClose={() => setShowSignOutDialog(false)} title="Sign Out All Devices">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to sign out of all devices? You will need to log in again on this and all other devices.
              </p>
              <div className="flex gap-2 mt-4">
                <Button variant="ghost" className="flex-1" onClick={() => setShowSignOutDialog(false)}>Cancel</Button>
                <Button variant="destructive" className="flex-1" onClick={handleSignOutAll} disabled={signingOut}>
                  {signingOut ? 'Signing out...' : 'Sign Out All Devices'}
                </Button>
              </div>
            </Dialog>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base tracking-tight">Notification Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                    </div>
                  </div>
                  <Switch checked={emailNotifs} onCheckedChange={() => setEmailNotifs(!emailNotifs)} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary/10 p-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive push notifications on your device</p>
                    </div>
                  </div>
                  <Switch checked={pushNotifs} onCheckedChange={() => setPushNotifs(!pushNotifs)} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base tracking-tight">Alert Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">Transaction Alerts</p>
                      <p className="text-xs text-muted-foreground">Get notified for every transaction</p>
                    </div>
                    <Switch checked={transactionAlerts} onCheckedChange={() => setTransactionAlerts(!transactionAlerts)} />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">Low Balance Warnings</p>
                      <p className="text-xs text-muted-foreground">Alert when balance drops below threshold</p>
                    </div>
                    <Switch checked={lowBalance} onCheckedChange={() => setLowBalance(!lowBalance)} />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">Security Alerts</p>
                      <p className="text-xs text-muted-foreground">Unusual activity and login attempts</p>
                    </div>
                    <Switch checked={securityAlerts} onCheckedChange={() => setSecurityAlerts(!securityAlerts)} />
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-sm font-medium">Marketing Emails</p>
                      <p className="text-xs text-muted-foreground">Product offers and updates</p>
                    </div>
                    <Switch checked={marketingEmails} onCheckedChange={() => setMarketingEmails(!marketingEmails)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Button onClick={handleNotificationSave} disabled={notifSaving}>
                {notifSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
              {notifMessage && (
                <span className={`flex items-center gap-1 text-sm ${notifMessage.type === 'success' ? 'text-success' : 'text-destructive'}`}>
                  {notifMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {notifMessage.text}
                </span>
              )}
            </div>

            {/* Spending Alerts Link */}
            <Link href="/settings/alerts" className="block">
              <Card variant="raised" interactive>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-500/10 p-2.5">
                        <Zap className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Spending Alerts</p>
                        <p className="text-xs text-muted-foreground">Set custom rules to monitor your spending</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
