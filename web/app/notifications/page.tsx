"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import { Header } from "@/components/layout/header"
import { BrutalCard } from "@/components/ui/brutal-card"
import { Bell, CheckCircle2, AlertCircle, Info, Clock, ArrowUpRight, Shield } from "lucide-react"

interface Notification {
  id: string
  type: "success" | "warning" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
  actionLabel?: string
  actionHref?: string
}

// Mock notifications data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "info",
    title: "KYC Verification Required",
    message: "Complete your identity verification to unlock higher transaction limits.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    read: false,
    actionLabel: "Verify Now",
    actionHref: "/profile/verify",
  },
  {
    id: "2",
    type: "success",
    title: "Account Created Successfully",
    message: "Welcome to Remitt! Your account and wallet have been created.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: "3",
    type: "info",
    title: "Add Your First Recipient",
    message: "Start sending money by adding a recipient to your list.",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionLabel: "Add Recipient",
    actionHref: "/recipients",
  },
]

export default function NotificationsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-accent" />
      case "warning":
        return <AlertCircle className="w-5 h-5 text-primary" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMs = now.getTime() - past.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
      return `${diffInDays}d ago`
    } else if (diffInHours > 0) {
      return `${diffInHours}h ago`
    } else {
      const diffInMins = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMins}m ago`
    }
  }

  return (
    <main className="min-h-screen bg-background pb-24">
      <Header title="Notifications" showBack showNotifications={false} />

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header Actions */}
        {unreadCount > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{unreadCount}</span> unread notification
              {unreadCount !== 1 && "s"}
            </p>
            <button
              onClick={markAllAsRead}
              className="text-sm font-bold uppercase text-primary hover:underline"
            >
              Mark all read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <BrutalCard className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-bold uppercase mb-2">No Notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! We'll notify you when something important happens.
              </p>
            </BrutalCard>
          ) : (
            notifications.map((notification) => (
              <BrutalCard
                key={notification.id}
                className={`p-4 ${!notification.read ? "bg-primary/5" : ""}`}
                hover
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-sm">{notification.title}</h4>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-destructive rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(notification.timestamp)}</span>
                      </div>
                      {notification.actionLabel && notification.actionHref && (
                        <button
                          onClick={() => {
                            markAsRead(notification.id)
                            router.push(notification.actionHref!)
                          }}
                          className="text-xs font-bold uppercase text-primary hover:underline flex items-center gap-1"
                        >
                          {notification.actionLabel}
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </BrutalCard>
            ))
          )}
        </div>

        {/* Empty State Illustration (when no notifications) */}
        {notifications.length === 0 && (
          <div className="mt-8 text-center">
            <div className="inline-block border-3 border-foreground bg-card p-6 brutal-shadow">
              <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
