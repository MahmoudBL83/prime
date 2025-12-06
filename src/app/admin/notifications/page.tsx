'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Bell,
    CheckCheck,
    RefreshCw,
    MessageCircle,
    Users,
    Calendar,
    X as XIcon,
    Shield,
    Link as LinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface NotificationItem {
    id: string
    type: string
    title: string
    message: string
    data?: { actionUrl?: string }
    isRead: boolean
    createdAt: string
}

const iconForType = (type: string) => {
    switch (type) {
        case 'MESSAGE':
        case 'MENTION':
            return <MessageCircle className="w-4 h-4 text-blue-400" />
        case 'STUDY_BUDDY_MATCH':
            return <Users className="w-4 h-4 text-green-400" />
        case 'STUDY_SESSION_SCHEDULED':
        case 'STUDY_SESSION_REMINDER':
            return <Calendar className="w-4 h-4 text-orange-400" />
        case 'STUDY_SESSION_CANCELLED':
            return <XIcon className="w-4 h-4 text-red-400" />
        default:
            return <Shield className="w-4 h-4 text-muted-foreground" />
    }
}

const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const past = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
}

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const unreadCount = notifications.filter((n) => !n.isRead).length

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/notifications?limit=50', {
                cache: 'no-store',
                credentials: 'include',
            })

            if (!response.ok) {
                throw new Error('Failed to load notifications')
            }

            const data = await response.json()
            setNotifications(data.notifications || [])
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [])

    const markAsRead = useCallback(async (ids?: string[]) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    notificationIds: ids,
                    markAllRead: !ids,
                }),
            })
            fetchNotifications()
        } catch (err) {
            console.error('Failed to mark notifications as read', err)
        }
    }, [fetchNotifications])

    const handleNotificationClick = (notification: NotificationItem) => {
        if (!notification.isRead) {
            markAsRead([notification.id])
        }

        if (notification.data?.actionUrl) {
            router.push(notification.data.actionUrl)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Admin Notifications</h1>
                        <p className="text-muted-foreground">Centralized view of recent system and user notifications</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            className="bg-white/5 border border-border"
                            onClick={() => markAsRead()}
                            disabled={unreadCount === 0 || loading}
                        >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark all read
                        </Button>
                        <Button
                            className="bg-white/10 border border-border text-foreground"
                            onClick={fetchNotifications}
                            disabled={loading}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="bg-white/5 border border-border rounded-2xl overflow-hidden shadow-lg">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-foreground" />
                            <span className="text-sm text-muted-foreground">{notifications.length} total</span>
                        </div>
                        <Badge className="bg-blue-600 text-foreground text-xs">
                            {unreadCount} unread
                        </Badge>
                    </div>

                    {error && (
                        <div className="px-6 py-4 text-sm text-red-300">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="px-6 py-10 text-center text-muted-foreground">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="px-6 py-10 text-center text-muted-foreground">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            No notifications yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {notifications.map((notification) => (
                                <button
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full text-left px-6 py-4 hover:bg-white/5 transition-colors ${notification.isRead ? 'text-muted-foreground' : 'text-foreground bg-blue-500/5'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {iconForType(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold truncate">{notification.title}</h3>
                                                {!notification.isRead && (
                                                    <Badge className="bg-blue-600 text-foreground text-[10px]">New</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                <span>{formatTimeAgo(notification.createdAt)}</span>
                                                {notification.data?.actionUrl && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <LinkIcon className="w-3 h-3" />
                                                        {notification.data.actionUrl}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
