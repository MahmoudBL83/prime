'use client'

import { useState, useEffect } from 'react'
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
    Video,
    FileText,
    TrendingUp,
    Gift,
    Clock,
    AlertCircle,
    Info,
    CheckCircle,
    XCircle,
    Loader2,
    Mail,
    MailOpen,
    Archive,
    Search,
    MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLocaleSafe } from '@/hooks/useTranslationsSafe'
import { useNavigationLoading } from '@/hooks/useNavigationLoading'
import toast from 'react-hot-toast'

interface Notification {
    id: string
    type: 'MESSAGE' | 'COMMENT' | 'LIKE' | 'FOLLOW' | 'COURSE' | 'MEETING' | 'ACHIEVEMENT' | 'REVIEW' | 'LIVE' | 'ANNOUNCEMENT' | 'REWARD'
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
    const [showSettings, setShowSettings] = useState(false)

    useEffect(() => {
        if (!session?.user) {
            router.push('/auth/login')
            return
        }
        fetchNotifications()
    }, [session?.user])

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/notifications')
            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications || [])
            } else {
                // Demo data for development
                setNotifications(generateDemoNotifications())
            }
        } catch (error) {
            console.error('Error fetching notifications:', error)
            // Use demo data on error
            setNotifications(generateDemoNotifications())
        } finally {
            setLoading(false)
        }
    }

    const generateDemoNotifications = (): Notification[] => {
        return [
            {
                id: '1',
                type: 'MESSAGE',
                title: 'New Message',
                message: 'Ahmed sent you a message about the upcoming study session',
                read: false,
                createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                actionUrl: '/messaging',
                priority: 'high',
                sender: {
                    id: '1',
                    name: 'Ahmed Mohammed'
                }
            },
            {
                id: '2',
                type: 'LIVE',
                title: 'Live Session Starting Soon',
                message: 'Your mentor Dr. Sarah will start a live session in 15 minutes',
                read: false,
                createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                actionUrl: '/creator/live-studio',
                priority: 'high'
            },
            {
                id: '3',
                type: 'ACHIEVEMENT',
                title: 'Achievement Unlocked!',
                message: 'You completed 10 courses! Keep up the great work 🎉',
                read: false,
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/achievements',
                priority: 'medium'
            },
            {
                id: '4',
                type: 'COMMENT',
                title: 'New Comment',
                message: 'Fatima commented on your course "Advanced JavaScript"',
                read: true,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/courses/123',
                sender: {
                    id: '2',
                    name: 'Fatima Ali'
                }
            },
            {
                id: '5',
                type: 'MEETING',
                title: 'Meeting Reminder',
                message: 'Your 1-on-1 session with Dr. Hassan starts in 1 hour',
                read: true,
                createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/dashboard/meetings',
                priority: 'high'
            },
            {
                id: '6',
                type: 'LIKE',
                title: 'New Like',
                message: '5 people liked your study note on "React Hooks"',
                read: true,
                createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/profile'
            },
            {
                id: '7',
                type: 'FOLLOW',
                title: 'New Follower',
                message: 'Mohamed started following you',
                read: true,
                createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/profile',
                sender: {
                    id: '3',
                    name: 'Mohamed Hassan'
                }
            },
            {
                id: '8',
                type: 'COURSE',
                title: 'Course Update',
                message: 'New lesson added to "Python for Data Science"',
                read: true,
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/courses/456'
            },
            {
                id: '9',
                type: 'REWARD',
                title: 'Reward Earned',
                message: 'You earned 50 points for completing a course!',
                read: true,
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/rewards',
                priority: 'medium'
            },
            {
                id: '10',
                type: 'ANNOUNCEMENT',
                title: 'Platform Update',
                message: 'New features available! Check out our latest updates.',
                read: true,
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                actionUrl: '/dashboard'
            }
        ]
    }

    const getNotificationIcon = (type: Notification['type']) => {
        const iconClass = "w-5 h-5"
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
            case 'ANNOUNCEMENT':
                return <Bell className={iconClass} />
            case 'REWARD':
                return <Gift className={iconClass} />
            default:
                return <Bell className={iconClass} />
        }
    }

    const getNotificationColor = (type: Notification['type']) => {
        switch (type) {
            case 'MESSAGE':
                return 'from-blue-500 to-cyan-500'
            case 'COMMENT':
                return 'from-purple-500 to-pink-500'
            case 'LIKE':
                return 'from-pink-500 to-rose-500'
            case 'FOLLOW':
                return 'from-green-500 to-emerald-500'
            case 'COURSE':
                return 'from-orange-500 to-amber-500'
            case 'MEETING':
                return 'from-indigo-500 to-blue-500'
            case 'ACHIEVEMENT':
                return 'from-yellow-500 to-orange-500'
            case 'REVIEW':
                return 'from-amber-500 to-yellow-500'
            case 'LIVE':
                return 'from-red-500 to-pink-500'
            case 'ANNOUNCEMENT':
                return 'from-gray-500 to-slate-500'
            case 'REWARD':
                return 'from-purple-500 to-indigo-500'
            default:
                return 'from-gray-500 to-gray-600'
        }
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
        return date.toLocaleDateString()
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ))

            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH'
            })

            if (!response.ok) {
                setNotifications(prev => prev.map(n =>
                    n.id === notificationId ? { ...n, read: false } : n
                ))
            }
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            toast.loading('Marking all as read...')
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))

            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST'
            })

            toast.dismiss()
            if (response.ok) {
                toast.success('All notifications marked as read')
            }
        } catch (error) {
            console.error('Error marking all as read:', error)
            toast.dismiss()
            toast.error('Failed to mark all as read')
        }
    }

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            setNotifications(prev => prev.filter(n => n.id !== notificationId))

            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                toast.error('Failed to delete notification')
                fetchNotifications()
            } else {
                toast.success('Notification deleted')
            }
        } catch (error) {
            console.error('Error deleting notification:', error)
            fetchNotifications()
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

    const toggleSelectNotification = (notificationId: string) => {
        setSelectedNotifications(prev =>
            prev.includes(notificationId)
                ? prev.filter(id => id !== notificationId)
                : [...prev, notificationId]
        )
    }

    const handleBulkDelete = async () => {
        if (selectedNotifications.length === 0) return

        try {
            toast.loading('Deleting notifications...')
            setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)))
            setSelectedNotifications([])

            const response = await fetch('/api/notifications/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedNotifications })
            })

            toast.dismiss()
            if (response.ok) {
                toast.success(`${selectedNotifications.length} notifications deleted`)
            }
        } catch (error) {
            console.error('Error bulk deleting:', error)
            toast.dismiss()
            toast.error('Failed to delete notifications')
            fetchNotifications()
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

    const unreadCount = notifications.filter(n => !n.read).length

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950">
                {/* Header Skeleton */}
                <div className="bg-gradient-to-r from-purple-900 via-gray-900 to-pink-900 border-b border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-800 rounded w-48 mb-2" />
                            <div className="h-4 bg-gray-800 rounded w-64" />
                        </div>
                        <div className="mt-6 flex gap-4">
                            <div className="h-10 bg-gray-800 rounded w-64 animate-pulse" />
                            <div className="h-10 bg-gray-800 rounded w-24 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Notifications Skeleton */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-gray-900/80 rounded-xl p-4 border border-gray-800 animate-pulse">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-5 bg-gray-800 rounded w-3/4" />
                                        <div className="h-4 bg-gray-800 rounded w-full" />
                                        <div className="h-3 bg-gray-800 rounded w-32" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-900 via-gray-900 to-pink-900 border-b border-gray-800 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between mb-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative">
                                    <Bell className="w-8 h-8 text-purple-400" />
                                    {unreadCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
                                        >
                                            <span className="text-xs font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                        </motion.div>
                                    )}
                                </div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
                                    Notifications
                                </h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-gray-400">
                                    {unreadCount > 0 ? `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}` : ''}
                                </p>
                                {unreadCount === 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full"
                                    >
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-green-400 font-medium">All caught up!</span>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                        
                        <motion.div 
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <AnimatePresence>
                                {selectedNotifications.length > 0 && (
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                    >
                                        <Button
                                            onClick={handleBulkDelete}
                                            variant="outline"
                                            className="border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete ({selectedNotifications.length})
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {unreadCount > 0 && (
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        onClick={handleMarkAllAsRead}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
                                    >
                                        <CheckCheck className="w-4 h-4 mr-2" />
                                        Mark All Read
                                    </Button>
                                </motion.div>
                            )}
                            
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSettings(!showSettings)}
                                    className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800 hover:border-gray-600"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Filters */}
                    <motion.div 
                        className="flex flex-wrap items-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        {/* Filter Buttons */}
                        <div className="flex gap-2 p-1 bg-gray-900/50 rounded-xl border border-gray-800">
                            {[
                                { id: 'all', label: 'All', count: notifications.length },
                                { id: 'unread', label: 'Unread', icon: Mail, count: unreadCount },
                                { id: 'read', label: 'Read', icon: MailOpen, count: notifications.filter(n => n.read).length }
                            ].map((item) => (
                                <motion.button
                                    key={item.id}
                                    onClick={() => setFilter(item.id as any)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        filter === item.id
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                                            : 'text-gray-300 hover:bg-gray-800/50'
                                    }`}
                                >
                                    {item.icon && <item.icon className="w-4 h-4" />}
                                    {item.label}
                                    {item.count > 0 && (
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            filter === item.id ? 'bg-white/20' : 'bg-gray-800'
                                        }`}>
                                            {item.count}
                                        </span>
                                    )}
                                </motion.button>
                            ))}
                        </div>

                        {/* Type Filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                            >
                                <option value="all">All Types</option>
                                <option value="MESSAGE">💬 Messages</option>
                                <option value="LIVE">🔴 Live Sessions</option>
                                <option value="MEETING">📅 Meetings</option>
                                <option value="ACHIEVEMENT">🏆 Achievements</option>
                                <option value="COURSE">📚 Courses</option>
                                <option value="REWARD">🎁 Rewards</option>
                                <option value="FOLLOW">👥 Followers</option>
                                <option value="COMMENT">💭 Comments</option>
                                <option value="LIKE">❤️ Likes</option>
                            </select>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredNotifications.length === 0 ? (
                    <motion.div 
                        className="text-center py-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <motion.div 
                            className="relative w-32 h-32 mx-auto mb-6"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl" />
                            <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-full flex items-center justify-center border border-gray-700">
                                <BellOff className="w-16 h-16 text-gray-500" />
                            </div>
                        </motion.div>
                        
                        <motion.h3 
                            className="text-2xl font-bold text-white mb-3"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {filter === 'unread' ? "All caught up! 🎉" : 'No notifications yet'}
                        </motion.h3>
                        
                        <motion.p 
                            className="text-gray-400 mb-6 max-w-md mx-auto"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {filter === 'unread' 
                                ? "You've read all your notifications. Great job staying on top of things!"
                                : searchQuery 
                                    ? 'No notifications match your search. Try different keywords.'
                                    : 'Start interacting with courses and mentors to receive notifications.'}
                        </motion.p>

                        {searchQuery && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                <Button
                                    onClick={() => setSearchQuery('')}
                                    variant="outline"
                                    className="border-gray-700 bg-gray-800/50 text-gray-300 hover:bg-gray-800"
                                >
                                    Clear Search
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.map((notification, index) => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: -100, scale: 0.95 }}
                                    transition={{ 
                                        delay: index * 0.03,
                                        layout: { type: "spring", stiffness: 300, damping: 30 }
                                    }}
                                    whileHover={{ scale: 1.01, y: -2 }}
                                    className={`group relative bg-gradient-to-r from-gray-900/90 to-gray-900/50 backdrop-blur-sm rounded-xl p-5 border transition-all cursor-pointer overflow-hidden ${
                                        notification.read 
                                            ? 'border-gray-800 hover:border-gray-700' 
                                            : 'border-purple-500/40 bg-gradient-to-r from-purple-900/20 to-pink-900/10 hover:border-purple-500/60 shadow-lg shadow-purple-500/10'
                                    } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-purple-500 border-purple-500' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    
                                    {/* Unread indicator bar */}
                                    {!notification.read && (
                                        <motion.div 
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-pink-500"
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            transition={{ delay: index * 0.03 + 0.2 }}
                                        />
                                    )}
                                    
                                    <div className="relative flex items-start gap-4">
                                        {/* Checkbox */}
                                        <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedNotifications.includes(notification.id)}
                                                onChange={(e) => {
                                                    e.stopPropagation()
                                                    toggleSelectNotification(notification.id)
                                                }}
                                                className="mt-1 w-4 h-4 rounded border-gray-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                            />
                                        </motion.div>

                                        {/* Icon */}
                                        <motion.div 
                                            className={`relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${getNotificationColor(notification.type)} flex items-center justify-center shadow-lg`}
                                            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            <div className="absolute inset-0 bg-white/10 rounded-xl" />
                                            <div className="relative text-white">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            {notification.priority === 'high' && (
                                                <motion.div 
                                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-gray-900"
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                >
                                                    <AlertCircle className="w-3 h-3 text-white" />
                                                </motion.div>
                                            )}
                                        </motion.div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h3 className={`font-semibold text-lg mb-1 ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    {notification.sender && (
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs text-white font-bold">
                                                                {notification.sender.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm text-gray-400">{notification.sender.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    {notification.priority === 'high' && (
                                                        <Badge variant="outline" className="border-red-500/50 bg-red-500/10 text-red-400 animate-pulse">
                                                            Urgent
                                                        </Badge>
                                                    )}
                                                    {!notification.read && (
                                                        <motion.div 
                                                            className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"
                                                            animate={{ scale: [1, 1.2, 1] }}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <p className="text-sm text-gray-400 mb-3 leading-relaxed">{notification.message}</p>
                                            
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-800/50 rounded-full">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                                                        {notification.type}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!notification.read && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleMarkAsRead(notification.id)
                                                            }}
                                                            className="p-2 hover:bg-green-500/10 rounded-lg transition-colors border border-transparent hover:border-green-500/50"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4 text-gray-400 hover:text-green-400" />
                                                        </motion.button>
                                                    )}
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteNotification(notification.id)
                                                        }}
                                                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 rounded-2xl p-8 border border-gray-800 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                        <Settings className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
                                </div>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                {[
                                    { id: 'email', label: 'Email Notifications', icon: Mail, description: 'Receive updates via email' },
                                    { id: 'push', label: 'Push Notifications', icon: Bell, description: 'Browser push notifications' },
                                    { id: 'messages', label: 'Message Notifications', icon: MessageCircle, description: 'New message alerts' },
                                    { id: 'courses', label: 'Course Updates', icon: BookOpen, description: 'New lessons and updates' },
                                    { id: 'live', label: 'Live Session Alerts', icon: Radio, description: 'Upcoming live events' },
                                ].map((setting, index) => (
                                    <motion.div
                                        key={setting.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all">
                                                <setting.icon className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium">{setting.label}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">{setting.description}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                                        </label>
                                    </motion.div>
                                ))}
                            </div>
                            
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowSettings(false)}
                                    variant="outline"
                                    className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSettings(false)
                                        toast.success('Settings saved!')
                                    }}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/25"
                                >
                                    Save Settings
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
