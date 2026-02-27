'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { formatGBP } from '@/lib/utils/currency'
import {
  User,
  ShieldCheck,
  Calendar,
  Phone,
  MapPin,
  Mail,
  CreditCard,
  History,
  Shield,
  ShieldAlert,
  Wallet,
  Hash,
  Globe,
  Cake,
  Star,
  Lock,
  Snowflake,
  Ban,
  Power,
  XCircle,
  Pencil,
  Bell,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Send,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import {
  updateAccountStatus,
  updateCardStatus,
  updateCustomerProfile,
  forcePasswordReset,
  sendAdminNotification,
  processBankingOperation,
  triggerKycReverification,
} from './actions'
import type { Profile, Account, Transaction, Card as CardType, LoginActivity, Dispute } from '@/lib/types'

interface CustomerDetailClientProps {
  profile: Profile
  accounts: Account[]
  recentTransactions: Transaction[]
  cards: CardType[]
  loginActivity: LoginActivity[]
  disputes: Dispute[]
}

type ModalType =
  | null
  | 'editProfile'
  | 'sendNotification'
  | 'forcePasswordReset'
  | 'kycReverification'
  | { type: 'accountStatus'; accountId: string; accountName: string; currentActive: boolean }
  | { type: 'cardStatus'; cardId: string; cardLastFour: string; currentStatus: string }
  | { type: 'adjustBalance'; accountId: string; accountName: string; balance: number }

export function CustomerDetailClient({
  profile,
  accounts,
  recentTransactions,
  cards,
  loginActivity,
  disputes,
}: CustomerDetailClientProps) {
  const [modal, setModal] = useState<ModalType>(null)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const initials = profile.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  const securityScore = profile.security_score ?? 0
  const scoreVariant = securityScore >= 80 ? 'success' : securityScore >= 50 ? 'warning' : 'destructive'

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  return (
    <div className="space-y-6">
      {/* Feedback Toast */}
      {feedback && (
        <div className={cn(
          'fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-top-2 text-[13px] font-medium',
          feedback.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200'
        )}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {feedback.message}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="h-14 w-14 rounded-lg bg-[#00395D]/10 dark:bg-[#00AEEF]/10 flex items-center justify-center text-lg font-bold text-[#00395D] dark:text-[#00AEEF] shrink-0">
            {initials}
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[16px] font-bold text-foreground">{profile.full_name}</h2>
              <Badge variant={profile.role === 'customer' ? 'secondary' : 'destructive'}>
                {profile.role.replace('_', ' ')}
              </Badge>
              {profile.two_factor_enabled && (
                <Badge variant="success" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  2FA
                </Badge>
              )}
              <Badge variant={scoreVariant}>Security: {securityScore}%</Badge>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 text-[13px]">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                <span className="font-mono text-[12px]">{profile.membership_number || 'No member ID'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                {profile.email}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                {profile.phone_number || 'No phone'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Cake className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                {profile.date_of_birth
                  ? new Date(profile.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : 'No DOB'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                {[profile.address_line_1, profile.address_line_2, profile.city, profile.postcode].filter(Boolean).join(', ') || 'No address'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                {profile.country || 'Unknown'}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                Joined {new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Star className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                Rewards: {profile.rewards_balance?.toLocaleString() ?? 0} pts
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-3.5 w-3.5 shrink-0 text-[#00AEEF]" />
                Notifications: {[
                  profile.notification_email && 'Email',
                  profile.notification_sms && 'SMS',
                  profile.notification_push && 'Push',
                ].filter(Boolean).join(', ') || 'None'}
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
              <Button size="sm" variant="outline" className="gap-1.5 text-[12px]" onClick={() => setModal('editProfile')}>
                <Pencil className="h-3 w-3" /> Edit Profile
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-[12px]" onClick={() => setModal('sendNotification')}>
                <Bell className="h-3 w-3" /> Send Notification
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-[12px]" onClick={() => setModal('kycReverification')}>
                <RefreshCw className="h-3 w-3" /> KYC Re-verification
              </Button>
              <Button size="sm" variant="destructive" className="gap-1.5 text-[12px]" onClick={() => setModal('forcePasswordReset')}>
                <KeyRound className="h-3 w-3" /> Force Password Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Accounts" value={accounts.length} />
        <MiniStat
          label="Total Balance"
          value={formatGBP(accounts.reduce((sum, a) => sum + a.balance, 0))}
        />
        <MiniStat label="Transactions" value={recentTransactions.length} />
        <MiniStat label="Cards" value={cards.length} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="accounts">
        <TabsList className="w-full justify-start overflow-x-auto bg-muted/30 border border-border/60 rounded-lg">
          <TabsTrigger value="accounts" className="text-[13px]">Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="transactions" className="text-[13px]">Transactions ({recentTransactions.length})</TabsTrigger>
          <TabsTrigger value="cards" className="text-[13px]">Cards ({cards.length})</TabsTrigger>
          <TabsTrigger value="activity" className="text-[13px]">Activity ({loginActivity.length})</TabsTrigger>
          <TabsTrigger value="disputes" className="text-[13px]">Disputes ({disputes.length})</TabsTrigger>
        </TabsList>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          {accounts.length === 0 ? (
            <EmptyState icon={Wallet} text="No accounts" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-lg border border-border bg-card p-4 border-l-[3px] border-l-[#00AEEF]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{account.account_name}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary">{account.account_type}</Badge>
                        {account.is_primary && <Badge variant="default">Primary</Badge>}
                        <Badge variant={account.is_active ? 'success' : 'destructive'}>
                          {account.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-bold tabular-nums text-foreground">{formatGBP(account.balance)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Available: {formatGBP(account.available_balance)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">{account.sort_code} &middot; {account.account_number}</span>
                    <span>{account.currency_code}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                    {account.interest_rate > 0 && (
                      <span>Rate: {account.interest_rate}%</span>
                    )}
                    {account.overdraft_limit > 0 && (
                      <span>Overdraft: {formatGBP(account.overdraft_limit)}</span>
                    )}
                    {account.opened_at && (
                      <span>Opened: {new Date(account.opened_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                    )}
                  </div>
                  {/* Account Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-2">
                    {account.is_active ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-[11px] h-7 px-2.5"
                          onClick={() => setModal({ type: 'accountStatus', accountId: account.id, accountName: account.account_name, currentActive: true })}
                        >
                          <Snowflake className="h-3 w-3" /> Freeze
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1 text-[11px] h-7 px-2.5"
                          onClick={() => setModal({ type: 'accountStatus', accountId: account.id, accountName: account.account_name, currentActive: true })}
                        >
                          <Ban className="h-3 w-3" /> Close
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-[11px] h-7 px-2.5"
                        onClick={() => setModal({ type: 'accountStatus', accountId: account.id, accountName: account.account_name, currentActive: false })}
                      >
                        <Power className="h-3 w-3" /> Reactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-[11px] h-7 px-2.5"
                      onClick={() => setModal({ type: 'adjustBalance', accountId: account.id, accountName: account.account_name, balance: account.balance })}
                    >
                      <DollarSign className="h-3 w-3" /> Process Transaction
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          {recentTransactions.length === 0 ? (
            <EmptyState icon={History} text="No transactions" />
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                      <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((tx, i) => (
                      <tr key={tx.id} className={cn(
                        'border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors',
                        i % 2 === 1 && 'bg-muted/15'
                      )}>
                        <td className="px-4 py-2.5 text-[12px] text-muted-foreground whitespace-nowrap">
                          {new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                        <td className="px-4 py-2.5 font-medium">{tx.description}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="secondary">{tx.category}</Badge>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-medium tabular-nums ${tx.type === 'credit' ? 'text-[#00703C] dark:text-emerald-400' : 'text-foreground'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{formatGBP(tx.amount)}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge
                            variant={
                              tx.status === 'completed' ? 'success' :
                              tx.status === 'pending' ? 'warning' :
                              tx.status === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Cards Tab */}
        <TabsContent value="cards">
          {cards.length === 0 ? (
            <EmptyState icon={CreditCard} text="No cards" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <div key={card.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{card.card_holder_name}</p>
                      <p className="text-[12px] text-muted-foreground font-mono">
                        **** {card.card_number_last_four} &middot; Exp {card.expiry_date}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary">{card.card_type}</Badge>
                      <Badge
                        variant={
                          card.status === 'active' ? 'success' :
                          card.status === 'frozen' ? 'warning' :
                          'destructive'
                        }
                      >
                        {card.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {/* Card Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-2">
                    {card.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-[11px] h-7 px-2.5"
                          onClick={() => setModal({ type: 'cardStatus', cardId: card.id, cardLastFour: card.card_number_last_four, currentStatus: card.status })}
                        >
                          <Snowflake className="h-3 w-3" /> Freeze
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1 text-[11px] h-7 px-2.5"
                          onClick={() => setModal({ type: 'cardStatus', cardId: card.id, cardLastFour: card.card_number_last_four, currentStatus: card.status })}
                        >
                          <XCircle className="h-3 w-3" /> Cancel
                        </Button>
                      </>
                    )}
                    {card.status === 'frozen' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-[11px] h-7 px-2.5"
                          onClick={() => setModal({ type: 'cardStatus', cardId: card.id, cardLastFour: card.card_number_last_four, currentStatus: card.status })}
                        >
                          <Power className="h-3 w-3" /> Unfreeze
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1 text-[11px] h-7 px-2.5"
                          onClick={() => setModal({ type: 'cardStatus', cardId: card.id, cardLastFour: card.card_number_last_four, currentStatus: card.status })}
                        >
                          <XCircle className="h-3 w-3" /> Cancel
                        </Button>
                      </>
                    )}
                    {(card.status === 'cancelled' || card.status === 'reported_lost') && (
                      <span className="text-[11px] text-muted-foreground italic">No actions available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          {loginActivity.length === 0 ? (
            <EmptyState icon={Shield} text="No activity" />
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30">
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">IP Address</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Device</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
                      <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginActivity.map((event, i) => (
                      <tr key={event.id} className={cn(
                        'border-b border-border/20 hover:bg-[#00AEEF]/[0.03] transition-colors',
                        i % 2 === 1 && 'bg-muted/15'
                      )}>
                        <td className="px-4 py-2.5">
                          <Badge variant={event.is_suspicious ? 'destructive' : 'secondary'}>
                            {event.event_type.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-muted-foreground font-mono">{event.ip_address || '\u2014'}</td>
                        <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{event.device_type}</td>
                        <td className="px-4 py-2.5 text-[12px] text-muted-foreground">{event.location || '\u2014'}</td>
                        <td className="px-4 py-2.5 text-[12px] text-muted-foreground whitespace-nowrap">
                          {new Date(event.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes">
          {disputes.length === 0 ? (
            <EmptyState icon={ShieldAlert} text="No disputes" />
          ) : (
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-semibold text-foreground capitalize">{dispute.reason.replace(/_/g, ' ')}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{dispute.description || 'No description'}</p>
                      {dispute.transaction && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Transaction: {dispute.transaction.description} &middot; {formatGBP(dispute.transaction.amount)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        dispute.status === 'resolved_refunded' ? 'success' :
                        dispute.status === 'resolved_denied' || dispute.status === 'closed' ? 'secondary' :
                        'warning'
                      }
                    >
                      {dispute.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      {/* Edit Profile Modal */}
      {modal === 'editProfile' && (
        <EditProfileModal
          profile={profile}
          isPending={isPending}
          onClose={() => setModal(null)}
          onSubmit={(updates) => {
            startTransition(async () => {
              try {
                await updateCustomerProfile(profile.id, updates)
                showFeedback('success', 'Customer profile updated successfully')
                setModal(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to update profile')
              }
            })
          }}
        />
      )}

      {/* Send Notification Modal */}
      {modal === 'sendNotification' && (
        <SendNotificationModal
          customerName={profile.full_name}
          isPending={isPending}
          onClose={() => setModal(null)}
          onSubmit={(title, message, type) => {
            startTransition(async () => {
              try {
                await sendAdminNotification(profile.id, title, message, type)
                showFeedback('success', 'Notification sent to customer')
                setModal(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to send notification')
              }
            })
          }}
        />
      )}

      {/* Force Password Reset Confirmation */}
      {modal === 'forcePasswordReset' && (
        <ConfirmModal
          title="Force Password Reset"
          description={`This will immediately sign out ${profile.full_name} from all devices and require them to reset their password. This action is restricted to super admins.`}
          confirmLabel="Reset Password"
          variant="destructive"
          isPending={isPending}
          onClose={() => setModal(null)}
          onConfirm={() => {
            startTransition(async () => {
              try {
                await forcePasswordReset(profile.id)
                showFeedback('success', 'Password reset forced. Customer has been signed out.')
                setModal(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to force password reset')
              }
            })
          }}
        />
      )}

      {/* KYC Re-verification Modal */}
      {modal === 'kycReverification' && (
        <ReasonModal
          title="Trigger KYC Re-verification"
          description={`Request ${profile.full_name} to re-verify their identity. They will receive a notification to update their documents.`}
          reasonLabel="Reason for re-verification"
          reasonPlaceholder="e.g. Suspicious account activity detected"
          confirmLabel="Trigger Re-verification"
          isPending={isPending}
          onClose={() => setModal(null)}
          onSubmit={(reason) => {
            startTransition(async () => {
              try {
                await triggerKycReverification(profile.id, reason)
                showFeedback('success', 'KYC re-verification requested')
                setModal(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to trigger KYC re-verification')
              }
            })
          }}
        />
      )}

      {/* Account Status Modal */}
      {modal !== null && typeof modal === 'object' && modal.type === 'accountStatus' && (
        <AccountStatusModal
          accountName={modal.accountName}
          currentActive={modal.currentActive}
          isPending={isPending}
          onClose={() => setModal(null)}
          onSubmit={(status, reason) => {
            const accountId = (modal as { accountId: string }).accountId
            startTransition(async () => {
              try {
                await updateAccountStatus(accountId, status, reason)
                showFeedback('success', `Account ${status === 'active' ? 'reactivated' : status} successfully`)
                setModal(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to update account status')
              }
            })
          }}
        />
      )}

      {/* Card Status Modal */}
      {modal !== null && typeof modal === 'object' && modal.type === 'cardStatus' && (
        <CardStatusModal
          cardLastFour={modal.cardLastFour}
          currentStatus={modal.currentStatus}
          isPending={isPending}
          onClose={() => setModal(null)}
          onSubmit={(status, reason) => {
            const cardId = (modal as { cardId: string }).cardId
            startTransition(async () => {
              try {
                await updateCardStatus(cardId, status, reason)
                showFeedback('success', `Card ****${(modal as { cardLastFour: string }).cardLastFour} ${status.replace('_', ' ')} successfully`)
                setModal(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to update card status')
              }
            })
          }}
        />
      )}

      {/* Banking Operation Modal */}
      {modal !== null && typeof modal === 'object' && modal.type === 'adjustBalance' && (
        <BankingOperationModal
          accountName={modal.accountName}
          currentBalance={modal.balance}
          isPending={isPending}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            const accountId = (modal as { accountId: string }).accountId
            startTransition(async () => {
              try {
                await processBankingOperation(accountId, data)
                showFeedback('success', `£${data.amount.toFixed(2)} ${data.direction} processed via ${data.operationType.replace(/_/g, ' ')}`)
                setModal(null)
              } catch (err) {
                showFeedback('error', err instanceof Error ? err.message : 'Failed to process banking operation')
              }
            })
          }}
        />
      )}
    </div>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-[16px] font-bold tabular-nums text-foreground mt-0.5">{value}</p>
    </div>
  )
}

function EmptyState({ icon: Icon, text }: { icon: typeof User; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10">
      <Icon className="h-8 w-8 text-muted-foreground/25" />
      <p className="text-[13px] text-muted-foreground">{text}</p>
    </div>
  )
}

// ─── Form field helpers ───────────────────────────────────────────────────────

const inputClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]'
const labelClass = 'text-[13px] font-medium text-foreground'
const selectClass = 'mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/30 focus:border-[#00AEEF]'

// ─── Modal Components ─────────────────────────────────────────────────────────

function EditProfileModal({
  profile,
  isPending,
  onClose,
  onSubmit,
}: {
  profile: Profile
  isPending: boolean
  onClose: () => void
  onSubmit: (updates: Record<string, string>) => void
}) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [phone, setPhone] = useState(profile.phone_number || '')
  const [addressLine1, setAddressLine1] = useState(profile.address_line_1 || '')
  const [addressLine2, setAddressLine2] = useState(profile.address_line_2 || '')
  const [city, setCity] = useState(profile.city || '')
  const [postcode, setPostcode] = useState(profile.postcode || '')

  return (
    <Dialog open onClose={onClose} title="Edit Customer Profile">
      <DialogHeader>
        <DialogTitle>Edit Customer Profile</DialogTitle>
        <DialogDescription>Update the customer&apos;s personal details. Changes are audited.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>Full Name</span>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Phone Number</span>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44..." />
        </label>
        <label className="block">
          <span className={labelClass}>Address Line 1</span>
          <input className={inputClass} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Address Line 2</span>
          <input className={inputClass} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>City</span>
            <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Postcode</span>
            <input className={inputClass} value={postcode} onChange={(e) => setPostcode(e.target.value)} />
          </label>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
          onClick={() => {
            const updates: Record<string, string> = {}
            if (fullName !== profile.full_name) updates.full_name = fullName
            if (phone !== (profile.phone_number || '')) updates.phone_number = phone
            if (addressLine1 !== (profile.address_line_1 || '')) updates.address_line_1 = addressLine1
            if (addressLine2 !== (profile.address_line_2 || '')) updates.address_line_2 = addressLine2
            if (city !== (profile.city || '')) updates.city = city
            if (postcode !== (profile.postcode || '')) updates.postcode = postcode
            if (Object.keys(updates).length === 0) {
              onClose()
              return
            }
            onSubmit(updates)
          }}
        >
          Save Changes
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function SendNotificationModal({
  customerName,
  isPending,
  onClose,
  onSubmit,
}: {
  customerName: string
  isPending: boolean
  onClose: () => void
  onSubmit: (title: string, message: string, type: 'info' | 'account' | 'security' | 'payment') => void
}) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'info' | 'account' | 'security' | 'payment'>('info')

  return (
    <Dialog open onClose={onClose} title="Send Notification">
      <DialogHeader>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogDescription>Send a manual notification to {customerName}.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>Notification Type</span>
          <select className={selectClass} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="info">General Info</option>
            <option value="account">Account</option>
            <option value="security">Security</option>
            <option value="payment">Payment</option>
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Title</span>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title" />
        </label>
        <label className="block">
          <span className={labelClass}>Message</span>
          <textarea
            className={cn(inputClass, 'resize-none h-20')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message"
          />
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          disabled={!title.trim() || !message.trim()}
          className="bg-[#00AEEF] hover:bg-[#0098d1] text-white gap-1"
          onClick={() => onSubmit(title, message, type)}
        >
          <Send className="h-3 w-3" /> Send
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  variant = 'destructive',
  isPending,
  onClose,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel: string
  variant?: 'destructive' | 'default'
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Dialog open onClose={onClose} title={title}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-[13px] text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>This action cannot be easily undone.</span>
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button variant={variant} size="sm" loading={isPending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function ReasonModal({
  title,
  description,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel,
  isPending,
  onClose,
  onSubmit,
}: {
  title: string
  description: string
  reasonLabel: string
  reasonPlaceholder: string
  confirmLabel: string
  isPending: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}) {
  const [reason, setReason] = useState('')

  return (
    <Dialog open onClose={onClose} title={title}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>

      <label className="block">
        <span className={labelClass}>{reasonLabel}</span>
        <textarea
          className={cn(inputClass, 'resize-none h-20')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={reasonPlaceholder}
        />
      </label>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          disabled={!reason.trim()}
          className="bg-[#00AEEF] hover:bg-[#0098d1] text-white"
          onClick={() => onSubmit(reason)}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function AccountStatusModal({
  accountName,
  currentActive,
  isPending,
  onClose,
  onSubmit,
}: {
  accountName: string
  currentActive: boolean
  isPending: boolean
  onClose: () => void
  onSubmit: (status: 'active' | 'frozen' | 'suspended' | 'closed', reason: string) => void
}) {
  const [status, setStatus] = useState<'active' | 'frozen' | 'suspended' | 'closed'>(
    currentActive ? 'frozen' : 'active'
  )
  const [reason, setReason] = useState('')

  return (
    <Dialog open onClose={onClose} title="Update Account Status">
      <DialogHeader>
        <DialogTitle>Update Account Status</DialogTitle>
        <DialogDescription>Change the status of {accountName}. The customer will be notified.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>New Status</span>
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {currentActive ? (
              <>
                <option value="frozen">Frozen — Temporarily restrict access</option>
                <option value="suspended">Suspended — Under investigation</option>
                <option value="closed">Closed — Permanently close account</option>
              </>
            ) : (
              <option value="active">Active — Reactivate account</option>
            )}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Reason (min 5 characters)</span>
          <textarea
            className={cn(inputClass, 'resize-none h-20')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Account frozen due to suspected fraudulent activity"
          />
        </label>

        {(status === 'closed') && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-[13px] text-red-800 dark:text-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Closing an account is a significant action. The customer will lose access immediately.</span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          disabled={reason.trim().length < 5}
          variant={status === 'closed' ? 'destructive' : 'default'}
          className={status !== 'closed' ? 'bg-[#00AEEF] hover:bg-[#0098d1] text-white' : ''}
          onClick={() => onSubmit(status, reason)}
        >
          {status === 'active' ? 'Reactivate Account' : `${status.charAt(0).toUpperCase() + status.slice(1)} Account`}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

function CardStatusModal({
  cardLastFour,
  currentStatus,
  isPending,
  onClose,
  onSubmit,
}: {
  cardLastFour: string
  currentStatus: string
  isPending: boolean
  onClose: () => void
  onSubmit: (status: 'active' | 'frozen' | 'cancelled' | 'reported_lost', reason: string) => void
}) {
  const defaultStatus = currentStatus === 'frozen' ? 'active' : 'frozen'
  const [status, setStatus] = useState<'active' | 'frozen' | 'cancelled' | 'reported_lost'>(defaultStatus)
  const [reason, setReason] = useState('')

  return (
    <Dialog open onClose={onClose} title="Update Card Status">
      <DialogHeader>
        <DialogTitle>Update Card Status</DialogTitle>
        <DialogDescription>Change the status of card ending ****{cardLastFour}. The customer will be notified.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <span className={labelClass}>New Status</span>
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {currentStatus === 'active' && (
              <>
                <option value="frozen">Frozen — Temporarily block card</option>
                <option value="cancelled">Cancelled — Permanently cancel card</option>
                <option value="reported_lost">Reported Lost — Mark as lost/stolen</option>
              </>
            )}
            {currentStatus === 'frozen' && (
              <>
                <option value="active">Active — Unfreeze card</option>
                <option value="cancelled">Cancelled — Permanently cancel card</option>
                <option value="reported_lost">Reported Lost — Mark as lost/stolen</option>
              </>
            )}
          </select>
        </label>
        <label className="block">
          <span className={labelClass}>Reason</span>
          <textarea
            className={cn(inputClass, 'resize-none h-20')}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Card frozen at customer request"
          />
        </label>

        {(status === 'cancelled' || status === 'reported_lost') && (
          <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-[13px] text-red-800 dark:text-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{status === 'cancelled' ? 'This card will be permanently deactivated.' : 'This card will be blocked immediately and marked as lost.'}</span>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          disabled={!reason.trim()}
          variant={status === 'cancelled' || status === 'reported_lost' ? 'destructive' : 'default'}
          className={status === 'active' ? 'bg-[#00AEEF] hover:bg-[#0098d1] text-white' : ''}
          onClick={() => onSubmit(status, reason)}
        >
          {status === 'active' ? 'Unfreeze Card' : `${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')} Card`}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

const CREDIT_OPS = [
  { value: 'bacs_credit', label: 'BACS Credit' },
  { value: 'faster_payment_in', label: 'Faster Payment' },
  { value: 'chaps_credit', label: 'CHAPS Payment' },
  { value: 'wire_transfer_in', label: 'International Wire Transfer' },
  { value: 'refund', label: 'Refund' },
  { value: 'compensation', label: 'Compensation Payment' },
  { value: 'interest_payment', label: 'Interest Payment' },
  { value: 'direct_credit', label: 'Direct Credit' },
  { value: 'settlement', label: 'Settlement Payment' },
] as const

const DEBIT_OPS = [
  { value: 'chargeback', label: 'Chargeback' },
  { value: 'bank_fee', label: 'Bank Charge' },
  { value: 'correction', label: 'Balance Correction' },
  { value: 'recovery', label: 'Debt Recovery' },
  { value: 'regulatory_levy', label: 'Regulatory Levy' },
] as const

type BankingOperationData = {
  direction: 'credit' | 'debit'
  operationType: string
  amount: number
  counterpartyName: string
  reference: string
  narrative: string
  internalReason: string
}

function BankingOperationModal({
  accountName,
  currentBalance,
  isPending,
  onClose,
  onSubmit,
}: {
  accountName: string
  currentBalance: number
  isPending: boolean
  onClose: () => void
  onSubmit: (data: BankingOperationData) => void
}) {
  const [direction, setDirection] = useState<'credit' | 'debit'>('credit')
  const [operationType, setOperationType] = useState('bacs_credit')
  const [amount, setAmount] = useState('')
  const [counterpartyName, setCounterpartyName] = useState('')
  const [reference, setReference] = useState('')
  const [narrative, setNarrative] = useState('')
  const [internalReason, setInternalReason] = useState('')

  const ops = direction === 'credit' ? CREDIT_OPS : DEBIT_OPS
  const parsedAmount = parseFloat(amount)
  const isValid =
    parsedAmount > 0 &&
    counterpartyName.trim().length > 0 &&
    narrative.trim().length > 0 &&
    internalReason.trim().length >= 10

  // Reset operation type when direction changes
  function handleDirectionChange(dir: 'credit' | 'debit') {
    setDirection(dir)
    setOperationType(dir === 'credit' ? 'bacs_credit' : 'chargeback')
  }

  return (
    <Dialog open onClose={onClose} title="Process Banking Operation">
      <DialogHeader>
        <DialogTitle>Process Banking Operation</DialogTitle>
        <DialogDescription>
          Process a transaction on {accountName}. Current balance: {formatGBP(currentBalance)}.
          This creates a visible transaction for the customer and requires super admin privileges.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        {/* Direction */}
        <label className="block">
          <span className={labelClass}>Direction</span>
          <select className={selectClass} value={direction} onChange={(e) => handleDirectionChange(e.target.value as 'credit' | 'debit')}>
            <option value="credit">Credit — Incoming funds</option>
            <option value="debit">Debit — Outgoing funds</option>
          </select>
        </label>

        {/* Operation Type */}
        <label className="block">
          <span className={labelClass}>Operation Type</span>
          <select className={selectClass} value={operationType} onChange={(e) => setOperationType(e.target.value)}>
            {ops.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
        </label>

        {/* Amount */}
        <label className="block">
          <span className={labelClass}>Amount (£)</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </label>

        {/* Counterparty Name */}
        <label className="block">
          <span className={labelClass}>
            {direction === 'credit' ? 'Originator / Sender Name' : 'Payee / Recipient Name'}
          </span>
          <input
            className={inputClass}
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            placeholder={direction === 'credit' ? 'e.g. HMRC, Employer Ltd, John Smith' : 'e.g. Account holder, Card services'}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            This name is visible to the customer on their transaction history
          </p>
        </label>

        {/* Reference */}
        <label className="block">
          <span className={labelClass}>Reference <span className="text-muted-foreground font-normal">(optional)</span></span>
          <input
            className={inputClass}
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. INV-2026-0042, SALARY FEB 2026"
            maxLength={18}
          />
        </label>

        {/* Narrative / Description (customer-facing) */}
        <label className="block">
          <span className={labelClass}>Transaction Description</span>
          <input
            className={inputClass}
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            placeholder={
              direction === 'credit'
                ? 'e.g. Salary payment, Tax refund, Insurance settlement'
                : 'e.g. Annual card fee, Disputed transaction reversal'
            }
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Shown to the customer as the transaction description
          </p>
        </label>

        {/* Internal Reason (admin-only, audit) */}
        <label className="block">
          <span className={labelClass}>Internal Reason <span className="text-muted-foreground font-normal">(admin only, min 10 chars)</span></span>
          <textarea
            className={cn(inputClass, 'resize-none h-16')}
            value={internalReason}
            onChange={(e) => setInternalReason(e.target.value)}
            placeholder="e.g. Processing refund per customer complaint #4521. Approved by ops manager."
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Not visible to the customer — stored in audit log only
          </p>
        </label>

        {/* Balance Preview */}
        {parsedAmount > 0 && (
          <div className={cn(
            'rounded-lg p-3 text-[13px] border',
            direction === 'credit'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
          )}>
            <div className="flex justify-between items-center">
              <span>New balance:</span>
              <strong>{formatGBP(currentBalance + (direction === 'credit' ? parsedAmount : -parsedAmount))}</strong>
            </div>
            <div className="flex justify-between items-center mt-1 text-[12px] opacity-80">
              <span>Customer will see:</span>
              <span>
                {direction === 'credit' ? '+' : '-'}{formatGBP(parsedAmount)} from {counterpartyName || '...'}
              </span>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button
          size="sm"
          loading={isPending}
          disabled={!isValid}
          variant={direction === 'debit' ? 'destructive' : 'default'}
          className={direction === 'credit' ? 'bg-[#00AEEF] hover:bg-[#0098d1] text-white' : ''}
          onClick={() => onSubmit({
            direction,
            operationType,
            amount: parsedAmount,
            counterpartyName: counterpartyName.trim(),
            reference: reference.trim(),
            narrative: narrative.trim(),
            internalReason: internalReason.trim(),
          })}
        >
          Process {direction === 'credit' ? 'Credit' : 'Debit'}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
