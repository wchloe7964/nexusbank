'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/dates'
import {
  Bell, CheckCheck, CreditCard, ArrowLeftRight, AlertTriangle,
  Shield, Info, Trash2
} from 'lucide-react'
import type { Notification } from '@/lib/types'

const mockNotifications: Notification[] = [
  { id: '1', user_id: '1', title: 'Payment Received', message: 'You received £3,200.00 from ACME Corp Ltd — Monthly Salary', type: 'transaction', is_read: false, action_url: '/transactions', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', user_id: '1', title: 'Direct Debit Due', message: 'Your direct debit of £65.00 to British Gas is due in 3 days', type: 'payment', is_read: false, action_url: '/payments', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', user_id: '1', title: 'Card Used Abroad', message: 'Your debit card ending 4829 was used for a transaction in Paris, France', type: 'security', is_read: false, action_url: '/cards', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', user_id: '1', title: 'Transfer Complete', message: '£500.00 transferred from Current Account to Rainy Day Saver', type: 'transfer', is_read: true, action_url: '/transfers', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '5', user_id: '1', title: 'Low Balance Alert', message: 'Your Current Account balance is below £500. Current balance: £347.85', type: 'alert', is_read: true, action_url: '/accounts/1', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '6', user_id: '1', title: 'Security Update', message: 'We\'ve updated our terms and conditions. Please review the changes.', type: 'system', is_read: true, action_url: null, created_at: new Date(Date.now() - 604800000).toISOString() },
]

const typeIcons: Record<string, typeof Bell> = {
  transaction: CreditCard,
  transfer: ArrowLeftRight,
  payment: CreditCard,
  security: Shield,
  alert: AlertTriangle,
  system: Info,
}

const typeColors: Record<string, string> = {
  transaction: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  transfer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  payment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  security: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  alert: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
  system: 'bg-gray-100 dark:bg-gray-800/30 text-gray-600',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up'}
        action={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark All Read
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Bell className="mx-auto mb-3 h-8 w-8 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell
                const colorClass = typeColors[notification.type] || typeColors.system
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-muted/30 cursor-pointer ${
                      !notification.is_read ? 'bg-primary/[0.04]' : ''
                    }`}
                    onClick={() => markRead(notification.id)}
                  >
                    <div className={`rounded-full p-2.5 mt-0.5 ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${!notification.is_read ? 'font-semibold' : 'font-medium'}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id) }}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
