'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar as CalendarIcon,
    Clock,
    Eye,
    Heart,
    MessageCircle,
    MoreVertical,
    Edit,
    Trash2,
    Send,
    X,
    ChevronLeft,
    ChevronRight,
    Filter,
    Plus,
    Image as ImageIcon,
    Video,
    FileText,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

interface ScheduledPost {
    id: string
    channelId: string
    channelName: string
    title: string | null
    content: string
    type: 'TEXT' | 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'POLL' | 'ANNOUNCEMENT'
    mediaUrl: string | null
    thumbnailUrl: string | null
    duration: number | null
    tier: string
    isPinned: boolean
    scheduledAt: string | null
    publishedAt: string | null
    viewCount: number
    likeCount: number
    commentCount: number
    status: 'draft' | 'scheduled' | 'published'
    createdAt: string
    updatedAt: string
}

interface ContentCalendarProps {
    isArabic?: boolean
    creatorId?: string  // Add optional creatorId prop
    onEditPost?: (post: ScheduledPost) => void
    onCreateNew?: () => void
}

export default function ContentCalendar({ isArabic = false, creatorId, onEditPost, onCreateNew }: ContentCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [posts, setPosts] = useState<ScheduledPost[]>([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month')
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'scheduled' | 'published'>('all')
    const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
    const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

    useEffect(() => {
        fetchPosts()
    }, [currentDate, filterStatus, creatorId])

    const fetchPosts = async () => {
        setLoading(true)
        try {
            // Get start and end of current month
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

            const params = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            })
            
            // Add creatorId if provided (for viewing other creators' calendars)
            if (creatorId) {
                params.append('creatorId', creatorId)
                console.log('ContentCalendar: Fetching posts for creatorId:', creatorId)
            } else {
                console.log('ContentCalendar: Fetching posts for logged-in user')
            }

            if (filterStatus !== 'all') {
                params.append('status', filterStatus)
            }

            console.log('ContentCalendar: API call to /api/scheduled-posts with params:', params.toString())
            const response = await fetch(`/api/scheduled-posts?${params}`)
            const data = await response.json()

            console.log('ContentCalendar: API response status:', response.status, 'data:', data)

            if (response.ok) {
                setPosts(data.posts || [])
                console.log('ContentCalendar: Loaded posts:', data.posts?.length || 0)
            } else {
                console.error('ContentCalendar: API error:', data)
                toast.error(isArabic ? 'فشل تحميل المنشورات' : 'Failed to load posts')
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            console.log('ContentCalendar: Setting loading to false')
            setLoading(false)
        }
    }

    const handlePublishNow = async (postId: string) => {
        try {
            const response = await fetch('/api/scheduled-posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    action: 'publish'
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم النشر بنجاح!' : 'Published successfully!')
                fetchPosts()
            } else {
                const data = await response.json()
                toast.error(data.error || (isArabic ? 'فشل النشر' : 'Failed to publish'))
            }
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const handleReschedule = async (postId: string, newDate: Date) => {
        try {
            const response = await fetch('/api/scheduled-posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    scheduledAt: newDate.toISOString(),
                    action: 'reschedule'
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تمت إعادة الجدولة!' : 'Rescheduled successfully!')
                fetchPosts()
            } else {
                toast.error(isArabic ? 'فشلت إعادة الجدولة' : 'Failed to reschedule')
            }
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const handleDeletePost = async (postId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?')) {
            return
        }

        try {
            const response = await fetch(`/api/scheduled-posts?postId=${postId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم الحذف بنجاح!' : 'Deleted successfully!')
                fetchPosts()
            } else {
                toast.error(isArabic ? 'فشل الحذف' : 'Failed to delete')
            }
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const handleCancelSchedule = async (postId: string) => {
        try {
            const response = await fetch('/api/scheduled-posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId,
                    action: 'cancel'
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إلغاء الجدولة!' : 'Schedule cancelled!')
                fetchPosts()
            } else {
                toast.error(isArabic ? 'فشل الإلغاء' : 'Failed to cancel')
            }
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    // Calendar generation
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startDayOfWeek = firstDay.getDay()

        const days = []
        
        // Add empty days for alignment
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null)
        }
        
        // Add actual days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        return days
    }

    const getPostsForDate = (date: Date) => {
        return posts.filter(post => {
            const postDate = post.scheduledAt ? new Date(post.scheduledAt) : post.publishedAt ? new Date(post.publishedAt) : null
            if (!postDate) return false
            
            return (
                postDate.getDate() === date.getDate() &&
                postDate.getMonth() === date.getMonth() &&
                postDate.getFullYear() === date.getFullYear()
            )
        })
    }

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    const getPostIcon = (type: string) => {
        switch (type) {
            case 'VIDEO':
                return <Video className="w-4 h-4" />
            case 'IMAGE':
                return <ImageIcon className="w-4 h-4" />
            case 'DOCUMENT':
                return <FileText className="w-4 h-4" />
            default:
                return <FileText className="w-4 h-4" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-500'
            case 'scheduled':
                return 'bg-blue-500'
            case 'draft':
                return 'bg-gray-500'
            default:
                return 'bg-gray-500'
        }
    }

    const days = getDaysInMonth(currentDate)
    const monthNames = isArabic
        ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    
    const weekDays = isArabic
        ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-purple-500" />
                        {isArabic ? 'تقويم المحتوى' : 'Content Calendar'}
                    </h2>
                    <Button
                        onClick={goToToday}
                        variant="outline"
                        size="sm"
                        className="border-border"
                    >
                        {isArabic ? 'اليوم' : 'Today'}
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                    >
                        <option value="all">{isArabic ? 'الكل' : 'All'}</option>
                        <option value="draft">{isArabic ? 'مسودة' : 'Draft'}</option>
                        <option value="scheduled">{isArabic ? 'مجدول' : 'Scheduled'}</option>
                        <option value="published">{isArabic ? 'منشور' : 'Published'}</option>
                    </select>

                    {/* View Mode */}
                    <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                viewMode === 'month'
                                    ? 'bg-purple-500 text-white'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {isArabic ? 'شهر' : 'Month'}
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-purple-500 text-white'
                                    : 'text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {isArabic ? 'قائمة' : 'List'}
                        </button>
                    </div>

                    {/* Create New */}
                    <Button
                        onClick={onCreateNew}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {isArabic ? 'إنشاء منشور' : 'Create Post'}
                    </Button>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4 bg-card border border-border rounded-lg p-4">
                <Button
                    onClick={goToPreviousMonth}
                    variant="ghost"
                    size="sm"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>

                <h3 className="text-lg font-bold text-foreground">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>

                <Button
                    onClick={goToNextMonth}
                    variant="ghost"
                    size="sm"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
            ) : viewMode === 'month' ? (
                /* Calendar Grid */
                <div className="bg-card border border-border rounded-lg overflow-hidden">
                    {/* Week Days Header */}
                    <div className="grid grid-cols-7 border-b border-border">
                        {weekDays.map((day, index) => (
                            <div
                                key={index}
                                className="p-3 text-center text-sm font-semibold text-muted-foreground border-r border-border last:border-r-0"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7">
                        {days.map((day, index) => {
                            if (!day) {
                                return <div key={index} className="h-24 border-r border-b border-border" />
                            }

                            const dayPosts = getPostsForDate(day)
                            const isToday =
                                day.getDate() === new Date().getDate() &&
                                day.getMonth() === new Date().getMonth() &&
                                day.getFullYear() === new Date().getFullYear()

                            return (
                                <div
                                    key={index}
                                    className={`min-h-24 border-r border-b border-border p-2 hover:bg-card-hover transition-colors cursor-pointer ${
                                        isToday ? 'bg-purple-500/10' : ''
                                    }`}
                                    onClick={() => setSelectedDate(day)}
                                >
                                    <div className={`text-sm font-semibold mb-1 ${
                                        isToday ? 'text-purple-500' : 'text-foreground'
                                    }`}>
                                        {day.getDate()}
                                    </div>

                                    {/* Posts for this day */}
                                    <div className="space-y-1">
                                        {dayPosts.slice(0, 3).map((post) => (
                                            <div
                                                key={post.id}
                                                className={`text-xs p-1 rounded ${getStatusColor(post.status)} text-white truncate flex items-center gap-1`}
                                                title={post.content}
                                            >
                                                {getPostIcon(post.type)}
                                                <span className="truncate flex-1">
                                                    {post.title || post.content.substring(0, 20)}
                                                </span>
                                            </div>
                                        ))}
                                        {dayPosts.length > 3 && (
                                            <div className="text-xs text-muted-foreground">
                                                +{dayPosts.length - 3} {isArabic ? 'المزيد' : 'more'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ) : (
                /* List View */
                <div className="space-y-3">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-card border border-border rounded-lg">
                            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">
                                {isArabic ? 'لا توجد منشورات مجدولة' : 'No scheduled posts'}
                            </p>
                        </div>
                    ) : (
                        posts.map((post) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-card border border-border rounded-lg p-4 hover:border-purple-500 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`} />
                                            {getPostIcon(post.type)}
                                            <h4 className="font-semibold text-foreground">
                                                {post.title || post.content.substring(0, 50)}
                                            </h4>
                                            <span className="text-xs px-2 py-1 bg-card-hover rounded text-muted-foreground">
                                                {post.tier}
                                            </span>
                                        </div>

                                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                            {post.content}
                                        </p>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {post.scheduledAt 
                                                    ? new Date(post.scheduledAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')
                                                    : new Date(post.publishedAt!).toLocaleString(isArabic ? 'ar-EG' : 'en-US')
                                                }
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {post.viewCount}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Heart className="w-3 h-3" />
                                                {post.likeCount}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MessageCircle className="w-3 h-3" />
                                                {post.commentCount}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="relative">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setShowActionMenu(showActionMenu === post.id ? null : post.id)}
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>

                                        {showActionMenu === post.id && (
                                            <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-xl z-10 min-w-[160px]">
                                                {post.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => handlePublishNow(post.id)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover transition-colors flex items-center gap-2"
                                                    >
                                                        <Send className="w-4 h-4" />
                                                        {isArabic ? 'نشر الآن' : 'Publish Now'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onEditPost?.(post)}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover transition-colors flex items-center gap-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    {isArabic ? 'تعديل' : 'Edit'}
                                                </button>
                                                {post.status === 'scheduled' && (
                                                    <button
                                                        onClick={() => handleCancelSchedule(post.id)}
                                                        className="w-full px-4 py-2 text-left text-sm hover:bg-card-hover transition-colors flex items-center gap-2"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        {isArabic ? 'إلغاء الجدولة' : 'Cancel Schedule'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeletePost(post.id)}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    {isArabic ? 'حذف' : 'Delete'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Selected Date Detail Modal */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setSelectedDate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {selectedDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDate(null)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {getPostsForDate(selectedDate).map((post) => (
                                        <div
                                            key={post.id}
                                            className="bg-card border border-border rounded-lg p-4"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                {getPostIcon(post.type)}
                                                <span className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`} />
                                                <span className="font-semibold text-foreground">
                                                    {post.title || post.content.substring(0, 50)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {post.content}
                                            </p>
                                        </div>
                                    ))}

                                    {getPostsForDate(selectedDate).length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">
                                            {isArabic ? 'لا توجد منشورات لهذا اليوم' : 'No posts for this day'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
