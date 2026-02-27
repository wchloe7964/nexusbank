'use client'

import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Profile, Account, Transaction, Card as CardType, LoginActivity, Dispute } from '@/lib/types'

interface CustomerDetailClientProps {
  profile: Profile
  accounts: Account[]
  recentTransactions: Transaction[]
  cards: CardType[]
  loginActivity: LoginActivity[]
  disputes: Dispute[]
}

export function CustomerDetailClient({
  profile,
  accounts,
  recentTransactions,
  cards,
  loginActivity,
  disputes,
}: CustomerDetailClientProps) {
  const initials = profile.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?'

  const securityScore = profile.security_score ?? 0
  const scoreVariant = securityScore >= 80 ? 'success' : securityScore >= 50 ? 'warning' : 'destructive'

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {/* Avatar */}
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
    </div>
  )
}

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
