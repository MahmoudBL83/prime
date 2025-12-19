'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Bell,
    BellOff,
    Check,
    CheckCheck,
    Trash2,
    Filter,
    Settings,
    MessageCircle,
    Heart,
    Users,
    BookOpen,
    Calendar,
    Award,
    Star,
    Radio,
    Clock,
    AlertCircle,
    CheckCircle,
    Loader2,
    Mail,
    MailOpen,
    Search,
    ChevronRight,
    ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLocaleSafe } from '@/hooks/useTranslationsSafe'
import { useNavigationLoading } from '@/hooks/useNavigationLoading'
import toast from 'react-hot-toast'

export const dynamic = 'force-dynamic'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    read: boolean
    createdAt: string
    actionUrl?: string
    imageUrl?: string
    priority?: 'low' | 'medium' | 'high'
    sender?: {
        id: string
        name: string
        image?: string
    }
}

export default function NotificationsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const currentLocale = useLocaleSafe()
    const { navigateWithLoading } = useNavigationLoading()

    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
    const [typeFilter, setTypeFilter] = useState<string>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/notifications')
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications || [])
                setUnreadCount(data.unreadCount || 0)
            } else {
                setNotifications([])
                setUnreadCount(0)
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
            setNotifications([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (session?.user) {
            fetchNotifications()
        }
    }, [session?.user, fetchNotifications])

    const getNotificationIcon = (type: string) => {
        const iconClass = "w-6 h-6"
        switch (type) {
            case 'MESSAGE':
                return <MessageCircle className={iconClass} />
            case 'COMMENT':
                return <MessageCircle className={iconClass} />
            case 'LIKE':
                return <Heart className={iconClass} />
            case 'FOLLOW':
                return <Users className={iconClass} />
            case 'COURSE':
                return <BookOpen className={iconClass} />
            case 'MEETING':
                return <Calendar className={iconClass} />
            case 'ACHIEVEMENT':
                return <Award className={iconClass} />
            case 'REVIEW':
                return <Star className={iconClass} />
            case 'LIVE':
                return <Radio className={iconClass} />
            case 'REWARD':
                return <Award className={iconClass} />
            default:
                return <Bell className={iconClass} />
        }
    }

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'MESSAGE': return 'bg-blue-500'
            case 'COMMENT': return 'bg-purple-500'
            case 'LIKE': return 'bg-rose-500'
            case 'FOLLOW': return 'bg-emerald-500'
            case 'COURSE': return 'bg-amber-500'
            case 'MEETING': return 'bg-indigo-500'
            case 'ACHIEVEMENT': return 'bg-yellow-500'
            case 'LIVE': return 'bg-red-500'
            default: return 'bg-slate-500'
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`
        return date.toLocaleDateString()
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ))
            setUnreadCount(prev => Math.max(0, prev - 1))

            await fetch(`/api/notifications`, {
                method: 'PATCH',
                body: JSON.stringify({ notificationIds: [notificationId] })
            })
        } catch (error) {
            console.error('Error marking as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
            if (unreadIds.length === 0) return

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)

            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ notificationIds: unreadIds })
            })
            toast.success('All marked as read')
        } catch (error) {
            console.error('Error marking all as read:', error)
        }
    }

    const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
        e.stopPropagation()
        try {
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
            await fetch(`/api/notifications?id=${notificationId}`, { method: 'DELETE' })
            toast.success('Deleted')
        } catch (error) {
            console.error('Error deleting:', error)
        }
    }

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification.id)
        }
        if (notification.actionUrl) {
            navigateWithLoading(notification.actionUrl, 'notification')
        }
    }

    const filteredNotifications = notifications
        .filter(n => {
            if (filter === 'unread') return !n.read
            if (filter === 'read') return n.read
            return true
        })
        .filter(n => {
            if (typeFilter === 'all') return true
            return n.type === typeFilter
        })
        .filter(n => {
            if (!searchQuery) return true
            return n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.message.toLowerCase().includes(searchQuery.toLowerCase())
        })

    if (!session?.user && !loading) return null

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            {/* Apple TV Style Top Header */}
            <div className="sticky top-0 z-50 bg-black/60 backdrop-blur-2xl border-b border-white/5">
                <div className="max-w-6xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <motion.button
                                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.back()}
                                className="p-3 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-white/60" />
                            </motion.button>
                            <div>
                                <h1 className="text-4xl font-extrabold tracking-tight text-white/90">
                                    Notifications
                                </h1>
                                <p className="text-white/40 font-medium mt-1">
                                    {unreadCount > 0
                                        ? `${unreadCount} new items waiting for you`
                                        : "You're all caught up"}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {unreadCount > 0 && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleMarkAllAsRead}
                                    className="px-6 py-2.5 bg-white text-black font-bold rounded-full text-sm transition-transform"
                                >
                                    Mark All Read
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Quick Filters */}
                    <div className="mt-8 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'unread', label: 'Unread' },
                            { id: 'read', label: 'Read' }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setFilter(item.id as any)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${filter === item.id
                                        ? 'bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/20'
                                        : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                    }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-10 h-10 text-white/20 animate-spin" />
                        <p className="text-white/20 font-medium">Refreshing your feed...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-40 text-center"
                    >
                        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 ring-1 ring-white/10">
                            <BellOff className="w-10 h-10 text-white/20" />
                        </div>
                        <h3 className="text-2xl font-bold text-white/80 mb-2">
                            No notifications to show
                        </h3>
                        <p className="text-white/40 max-w-sm font-medium">
                            Check back later for updates on your courses, messages, and matches.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.map((notif, idx) => (
                                <motion.div
                                    key={notif.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`group relative overflow-hidden rounded-[24px] p-6 transition-all duration-500 cursor-pointer ${notif.read
                                            ? 'bg-white/[0.02] border border-white/5 opacity-80'
                                            : 'bg-white/[0.04] border border-white/10 shadow-[0_10px_40px_-15px_rgba(255,255,255,0.05)]'
                                        } hover:bg-white/[0.08] hover:scale-[1.01] hover:border-white/20 hover:shadow-[0_20px_60px_-10px_rgba(255,255,255,0.08)]`}
                                >
                                    <div className="flex gap-6 items-start">
                                        <div className={`relative flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110 ${getNotificationColor(notif.type)}`}>
                                            <div className="absolute inset-0 bg-black/10 rounded-2xl" />
                                            <span className="relative text-white z-10">
                                                {getNotificationIcon(notif.type)}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-4 mb-1">
                                                <h4 className={`text-lg font-bold leading-tight truncate ${notif.read ? 'text-white/60' : 'text-white/90'}`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-xs font-bold text-white/30 uppercase tracking-widest flex-shrink-0">
                                                    {formatTimeAgo(notif.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`text-[15px] font-medium leading-relaxed max-w-3xl line-clamp-2 ${notif.read ? 'text-white/30' : 'text-white/50'}`}>
                                                {notif.message}
                                            </p>

                                            <div className="mt-4 flex items-center gap-3">
                                                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-black text-white/40 uppercase tracking-widest ring-1 ring-white/5">
                                                    {notif.type.replace('_', ' ')}
                                                </span>
                                                {!notif.read && (
                                                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-between self-stretch">
                                            <button
                                                onClick={(e) => handleDeleteNotification(e, notif.id)}
                                                className="p-2.5 rounded-full text-white/0 group-hover:text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                            <div className="p-2 rounded-full text-white/0 group-hover:text-white/40 transition-all duration-300">
                                                <ChevronRight className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mirror shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-1000" />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    )
}
