'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/dates'
import {
  Bell, CreditCard, ArrowLeftRight, AlertTriangle,
  Shield, Info, Trash2
} from 'lucide-react'
import type { Notification } from '@/lib/types'
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationAction,
} from './actions'

interface NotificationsClientProps {
  initialNotifications: Notification[]
}

const typeIcons: Record<string, typeof Bell> = {
  transaction: CreditCard,
  transfer: ArrowLeftRight,
  account: CreditCard,
  security: Shield,
  promotion: Info,
  system: Info,
  alert: AlertTriangle,
  payment: CreditCard,
}

const typeColors: Record<string, string> = {
  transaction: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  transfer: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  account: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  security: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  promotion: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
  system: 'bg-gray-100 dark:bg-gray-800/30 text-gray-600',
  alert: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
  payment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    startTransition(async () => {
      try {
        await markAllNotificationsRead()
      } catch {
        // Revert not practical here - page will refresh
      }
    })
  }

  function handleMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n))
    startTransition(async () => {
      try {
        await markNotificationRead(id)
      } catch {
        // Ignore
      }
    })
  }

  function handleDelete(id: string) {
    const removed = notifications.find((n) => n.id === id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    startTransition(async () => {
      try {
        await deleteNotificationAction(id)
      } catch {
        if (removed) setNotifications((prev) => [...prev, removed])
      }
    })
  }

  return (
    <>
      {/* Mark all read button exposed to parent */}
      {unreadCount > 0 && (
        <button id="mark-all-read-trigger" className="hidden" onClick={handleMarkAllRead} />
      )}

      <Card>
        <CardContent className="p-0">
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
                  onClick={() => handleMarkRead(notification.id)}
                >
                  <div className={`rounded-xl p-2.5 mt-0.5 ${colorClass}`}>
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
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(notification.id) }} disabled={isPending}>
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
        </CardContent>
      </Card>
    </>
  )
}
