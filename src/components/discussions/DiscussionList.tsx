/**
 * Discussion List Component
 * Displays all discussions for a course with filtering and sorting
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
    MessageSquare,
    ThumbsUp,
    CheckCircle,
    Pin,
    Clock,
    TrendingUp,
    HelpCircle,
    Filter,
    Plus,
    Search,
    Loader,
    MessageCircle,
    Bookmark,
    BookmarkCheck
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Discussion {
    id: string
    title: string
    content: string
    createdAt: string
    upvotes: number
    isPinned: boolean
    isSolved: boolean
    tags: string[]
    author: {
        id: string
        name: string
        image: string | null
    }
    lesson?: {
        id: string
        title: string
        titleAr: string
    }
    replies: any[]
    _count: {
        replies: number
    }
}

interface DiscussionListProps {
    courseId: string
    lessonId?: string
    onNewDiscussion: () => void
    lang?: string
}

export default function DiscussionList({
    courseId,
    lessonId,
    onNewDiscussion,
    lang = 'en'
}: DiscussionListProps) {
    const { data: session } = useSession()
    const isArabic = lang === 'de'

    const [discussions, setDiscussions] = useState<Discussion[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered' | 'most-replied'>('recent')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchDiscussions()
        if (session?.user) {
            fetchBookmarks()
        }
    }, [courseId, lessonId, sortBy, page, session])

    const fetchBookmarks = async () => {
        try {
            const response = await fetch(`/api/discussions/bookmarks`)
            if (response.ok) {
                const data = await response.json()
                const ids = new Set<string>(data.bookmarks.map((b: any) => b.discussionId))
                setBookmarkedIds(ids)
            }
        } catch (error) {
            console.error('Fetch bookmarks error:', error)
        }
    }

    const fetchDiscussions = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                sort: sortBy
            })

            if (lessonId) {
                params.append('lessonId', lessonId)
            }

            const response = await fetch(`/api/courses/${courseId}/discussions?${params}`)
            
            if (response.ok) {
                const data = await response.json()
                setDiscussions(data.data.discussions)
                setTotalPages(data.data.pagination.totalPages)
            } else {
                throw new Error('Failed to fetch discussions')
            }
        } catch (error) {
            console.error('Fetch discussions error:', error)
            toast.error(isArabic ? 'فشل تحميل المناقشات' : 'Failed to load discussions')
        } finally {
            setLoading(false)
        }
    }

    const handleVote = async (discussionId: string, hasVoted: boolean) => {
        if (!session) {
            toast.error(isArabic ? 'يجب تسجيل الدخول للتصويت' : 'Please sign in to vote')
            return
        }

        try {
            const response = await fetch(`/api/discussions/${discussionId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'discussion',
                    action: hasVoted ? 'remove' : 'upvote'
                })
            })

            if (response.ok) {
                // Optimistic update
                setDiscussions(prev => prev.map(d => {
                    if (d.id === discussionId) {
                        return {
                            ...d,
                            upvotes: hasVoted ? d.upvotes - 1 : d.upvotes + 1
                        }
                    }
                    return d
                }))
            }
        } catch (error) {
            console.error('Vote error:', error)
            toast.error(isArabic ? 'فشل التصويت' : 'Failed to vote')
        }
    }

    const handleBookmark = async (discussionId: string) => {
        if (!session) {
            toast.error(isArabic ? 'يجب تسجيل الدخول للحفظ' : 'Please sign in to bookmark')
            return
        }

        const isBookmarked = bookmarkedIds.has(discussionId)

        try {
            const response = await fetch(`/api/discussions/${discussionId}/bookmark`, {
                method: isBookmarked ? 'DELETE' : 'POST'
            })

            if (response.ok) {
                // Optimistic update
                setBookmarkedIds(prev => {
                    const newSet = new Set(prev)
                    if (isBookmarked) {
                        newSet.delete(discussionId)
                        toast.success(isArabic ? 'تم إلغاء الحفظ' : 'Bookmark removed')
                    } else {
                        newSet.add(discussionId)
                        toast.success(isArabic ? 'تم الحفظ' : 'Bookmarked!')
                    }
                    return newSet
                })
            }
        } catch (error) {
            console.error('Bookmark error:', error)
            toast.error(isArabic ? 'فشل الحفظ' : 'Failed to bookmark')
        }
    }

    const filteredDiscussions = discussions.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-purple-400" />
                        {isArabic ? 'المناقشات' : 'Discussions'}
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isArabic 
                            ? 'اطرح أسئلتك وشارك أفكارك مع المتعلمين الآخرين'
                            : 'Ask questions and share ideas with other learners'}
                    </p>
                </div>

                <button
                    onClick={onNewDiscussion}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-foreground px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-purple-500/50"
                >
                    <Plus className="w-5 h-5" />
                    {isArabic ? 'مناقشة جديدة' : 'New Discussion'}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-gray-800/40 backdrop-blur-xl border border-border/50 rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isArabic ? 'ابحث في المناقشات...' : 'Search discussions...'}
                            className="w-full bg-gray-900/50 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Sort */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSortBy('recent')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                sortBy === 'recent'
                                    ? 'bg-purple-500 text-foreground'
                                    : 'bg-gray-700/50 text-muted-foreground hover:bg-gray-700'
                            }`}
                        >
                            <Clock className="w-4 h-4" />
                            {isArabic ? 'الأحدث' : 'Recent'}
                        </button>
                        <button
                            onClick={() => setSortBy('popular')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                sortBy === 'popular'
                                    ? 'bg-purple-500 text-foreground'
                                    : 'bg-gray-700/50 text-muted-foreground hover:bg-gray-700'
                            }`}
                        >
                            <TrendingUp className="w-4 h-4" />
                            {isArabic ? 'الأكثر شعبية' : 'Popular'}
                        </button>
                        <button
                            onClick={() => setSortBy('unanswered')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                sortBy === 'unanswered'
                                    ? 'bg-purple-500 text-foreground'
                                    : 'bg-gray-700/50 text-muted-foreground hover:bg-gray-700'
                            }`}
                        >
                            <HelpCircle className="w-4 h-4" />
                            {isArabic ? 'بدون إجابة' : 'Unanswered'}
                        </button>
                        <button
                            onClick={() => setSortBy('most-replied')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                                sortBy === 'most-replied'
                                    ? 'bg-purple-500 text-foreground'
                                    : 'bg-gray-700/50 text-muted-foreground hover:bg-gray-700'
                            }`}
                        >
                            <MessageCircle className="w-4 h-4" />
                            {isArabic ? 'الأكثر تعليقاً' : 'Most Replied'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Discussion List */}
            {filteredDiscussions.length === 0 ? (
                <div className="bg-gray-800/40 backdrop-blur-xl border border-border/50 rounded-xl p-12 text-center">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                        {isArabic ? 'لا توجد مناقشات بعد' : 'No discussions yet'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                        {isArabic 
                            ? 'كن أول من يبدأ مناقشة!'
                            : 'Be the first to start a discussion!'}
                    </p>
                    <button
                        onClick={onNewDiscussion}
                        className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-foreground px-6 py-3 rounded-lg font-semibold transition"
                    >
                        <Plus className="w-5 h-5" />
                        {isArabic ? 'إنشاء مناقشة' : 'Create Discussion'}
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredDiscussions.map((discussion) => (
                        <div
                            key={discussion.id}
                            className="bg-gray-800/40 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover:border-purple-500/50 transition cursor-pointer group"
                            onClick={() => window.location.href = `/courses/${courseId}/discussions/${discussion.id}`}
                        >
                            {/* Header */}
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col gap-2">
                                    {/* Vote Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleVote(discussion.id, false)
                                        }}
                                        className="flex flex-col items-center gap-1 min-w-[60px] bg-gray-900/50 rounded-lg p-3 hover:bg-background transition"
                                    >
                                        <ThumbsUp className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition" />
                                        <span className="text-sm font-bold text-foreground">{discussion.upvotes}</span>
                                        <span className="text-xs text-muted-foreground">{isArabic ? 'تصويت' : 'votes'}</span>
                                    </button>

                                    {/* Bookmark Button */}
                                    {session?.user && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleBookmark(discussion.id)
                                            }}
                                            className="flex items-center justify-center min-w-[60px] bg-gray-900/50 rounded-lg p-3 hover:bg-background transition"
                                            title={bookmarkedIds.has(discussion.id) 
                                                ? (isArabic ? 'إلغاء الحفظ' : 'Remove bookmark')
                                                : (isArabic ? 'حفظ' : 'Bookmark')}
                                        >
                                            {bookmarkedIds.has(discussion.id) ? (
                                                <BookmarkCheck className="w-5 h-5 text-yellow-400" />
                                            ) : (
                                                <Bookmark className="w-5 h-5 text-muted-foreground group-hover:text-yellow-400 transition" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Title */}
                                    <div className="flex items-start gap-2 mb-2">
                                        {discussion.isPinned && (
                                            <Pin className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                                        )}
                                        <h3 className="text-lg font-semibold text-foreground group-hover:text-purple-400 transition">
                                            {discussion.title}
                                        </h3>
                                        {discussion.isSolved && (
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        )}
                                    </div>

                                    {/* Preview */}
                                    <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                                        {discussion.content}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={discussion.author.image || '/default-avatar.png'}
                                                alt={discussion.author.name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span>{discussion.author.name}</span>
                                        </div>

                                        <span>•</span>

                                        <span>
                                            {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                                        </span>

                                        {discussion.lesson && (
                                            <>
                                                <span>•</span>
                                                <span className="text-purple-400">
                                                    {isArabic ? discussion.lesson.titleAr : discussion.lesson.title}
                                                </span>
                                            </>
                                        )}

                                        <span>•</span>

                                        <div className="flex items-center gap-1">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>{discussion._count.replies} {isArabic ? 'رد' : 'replies'}</span>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {discussion.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {discussion.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-card text-foreground rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isArabic ? 'السابق' : 'Previous'}
                    </button>
                    <span className="text-muted-foreground">
                        {isArabic ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 bg-card text-foreground rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isArabic ? 'التالي' : 'Next'}
                    </button>
                </div>
            )}
        </div>
    )
}
