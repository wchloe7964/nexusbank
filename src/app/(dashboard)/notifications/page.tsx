import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Bell } from 'lucide-react'
import { getNotifications, getUnreadCount } from '@/lib/queries/notifications'
import { NotificationsClient } from './notifications-client'
import { MarkAllReadButton } from './mark-all-read-button'

export default async function NotificationsPage() {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ])

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        title="Notifications"
        description={unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up'}
        action={unreadCount > 0 ? <MarkAllReadButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-5 lg:p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No notifications</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You&apos;re all caught up! Notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <NotificationsClient initialNotifications={notifications} />
      )}
    </div>
  )
}
