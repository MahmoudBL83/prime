/**
 * Discussion Thread Component
 * Displays a single discussion with all replies
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
    ThumbsUp,
    MessageSquare,
    CheckCircle,
    Pin,
    Flag,
    MoreVertical,
    Award,
    Reply,
    Loader,
    Bookmark,
    BookmarkCheck
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Reply {
    id: string
    content: string
    createdAt: string
    upvotes: number
    isInstructorReply: boolean
    isPinned: boolean
    isBestAnswer: boolean
    author: {
        id: string
        name: string
        image: string | null
    }
    parentReplyId: string | null
}

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
}

interface DiscussionThreadProps {
    discussionId: string
    courseId: string
    lang?: string
}

export default function DiscussionThread({
    discussionId,
    courseId,
    lang = 'en'
}: DiscussionThreadProps) {
    const { data: session } = useSession()
    const isArabic = lang === 'ar'

    const [discussion, setDiscussion] = useState<Discussion | null>(null)
    const [replies, setReplies] = useState<Reply[]>([])
    const [loading, setLoading] = useState(true)
    const [replyText, setReplyText] = useState('')
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [isBookmarked, setIsBookmarked] = useState(false)

    useEffect(() => {
        fetchDiscussionAndReplies()
        if (session?.user) {
            checkBookmarkStatus()
        }
    }, [discussionId, session])

    const checkBookmarkStatus = async () => {
        try {
            const response = await fetch(`/api/discussions/bookmarks`)
            if (response.ok) {
                const data = await response.json()
                const isBookmarked = data.bookmarks.some((b: any) => b.discussionId === discussionId)
                setIsBookmarked(isBookmarked)
            }
        } catch (error) {
            console.error('Check bookmark error:', error)
        }
    }

    const handleBookmark = async () => {
        if (!session) {
            toast.error(isArabic ? 'يجب تسجيل الدخول' : 'Please sign in')
            return
        }

        try {
            const response = await fetch(`/api/discussions/${discussionId}/bookmark`, {
                method: isBookmarked ? 'DELETE' : 'POST'
            })

            if (response.ok) {
                setIsBookmarked(!isBookmarked)
                toast.success(isBookmarked 
                    ? (isArabic ? 'تم إلغاء الحفظ' : 'Bookmark removed')
                    : (isArabic ? 'تم الحفظ' : 'Bookmarked!'))
            }
        } catch (error) {
            console.error('Bookmark error:', error)
            toast.error(isArabic ? 'فشل الحفظ' : 'Failed to bookmark')
        }
    }

    const fetchDiscussionAndReplies = async () => {
        try {
            setLoading(true)
            
            // Fetch discussion details
            const discussionRes = await fetch(`/api/courses/${courseId}/discussions`)
            if (discussionRes.ok) {
                const data = await discussionRes.json()
                const disc = data.data.discussions.find((d: any) => d.id === discussionId)
                if (disc) setDiscussion(disc)
            }

            // Fetch all replies
            const repliesRes = await fetch(`/api/discussions/${discussionId}/replies`)
            if (repliesRes.ok) {
                const data = await repliesRes.json()
                setReplies(data.data)
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error(isArabic ? 'فشل تحميل المناقشة' : 'Failed to load discussion')
        } finally {
            setLoading(false)
        }
    }

    const handleVoteDiscussion = async (hasVoted: boolean) => {
        if (!session) {
            toast.error(isArabic ? 'يجب تسجيل الدخول' : 'Please sign in')
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

            if (response.ok && discussion) {
                setDiscussion({
                    ...discussion,
                    upvotes: hasVoted ? discussion.upvotes - 1 : discussion.upvotes + 1
                })
            }
        } catch (error) {
            console.error('Vote error:', error)
        }
    }

    const handleVoteReply = async (replyId: string, hasVoted: boolean) => {
        if (!session) {
            toast.error(isArabic ? 'يجب تسجيل الدخول' : 'Please sign in')
            return
        }

        try {
            const response = await fetch(`/api/discussions/${replyId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'reply',
                    action: hasVoted ? 'remove' : 'upvote'
                })
            })

            if (response.ok) {
                setReplies(prev => prev.map(r => {
                    if (r.id === replyId) {
                        return {
                            ...r,
                            upvotes: hasVoted ? r.upvotes - 1 : r.upvotes + 1
                        }
                    }
                    return r
                }))
            }
        } catch (error) {
            console.error('Vote error:', error)
        }
    }

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!session) {
            toast.error(isArabic ? 'يجب تسجيل الدخول' : 'Please sign in')
            return
        }

        if (replyText.trim().length < 10) {
            toast.error(isArabic ? 'الرد يجب أن يكون 10 أحرف على الأقل' : 'Reply must be at least 10 characters')
            return
        }

        try {
            setSubmitting(true)
            const response = await fetch(`/api/discussions/${discussionId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: replyText,
                    parentReplyId: replyingTo
                })
            })

            if (response.ok) {
                const data = await response.json()
                setReplies([...replies, data.data])
                setReplyText('')
                setReplyingTo(null)
                toast.success(isArabic ? 'تم إضافة الرد' : 'Reply posted!')
            } else {
                throw new Error('Failed to post reply')
            }
        } catch (error) {
            console.error('Submit error:', error)
            toast.error(isArabic ? 'فشل إضافة الرد' : 'Failed to post reply')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading || !discussion) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        )
    }

    // Group replies by parent
    const topLevelReplies = replies.filter(r => !r.parentReplyId)
    const getRepliesForParent = (parentId: string) => {
        return replies.filter(r => r.parentReplyId === parentId)
    }

    const ReplyComponent = ({ reply, depth = 0 }: { reply: Reply; depth?: number }) => {
        const childReplies = getRepliesForParent(reply.id)

        return (
            <div className={`${depth > 0 ? 'ml-12 border-l-2 border-border pl-4' : ''}`}>
                <div className="bg-gray-800/40 backdrop-blur-xl border border-border/50 rounded-xl p-4 mb-3">
                    <div className="flex gap-4">
                        {/* Vote */}
                        <button
                            onClick={() => handleVoteReply(reply.id, false)}
                            className="flex flex-col items-center gap-1 min-w-[50px]"
                        >
                            <ThumbsUp className="w-4 h-4 text-muted-foreground hover:text-purple-400 transition" />
                            <span className="text-sm font-semibold text-foreground">{reply.upvotes}</span>
                        </button>

                        {/* Content */}
                        <div className="flex-1">
                            {/* Author */}
                            <div className="flex items-center gap-2 mb-2">
                                <img
                                    src={reply.author.image || '/default-avatar.png'}
                                    alt={reply.author.name}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="font-semibold text-foreground">{reply.author.name}</span>
                                {reply.isBestAnswer && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full font-bold">
                                        <Award className="w-3 h-3 fill-yellow-400" />
                                        {isArabic ? '⭐ أفضل إجابة' : '⭐ Best Answer'}
                                    </span>
                                )}
                                {reply.isInstructorReply && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                        <Award className="w-3 h-3" />
                                        {isArabic ? 'مدرس' : 'Instructor'}
                                    </span>
                                )}
                                {reply.isPinned && !reply.isBestAnswer && (
                                    <Pin className="w-4 h-4 text-yellow-400" />
                                )}
                                <span className="text-sm text-muted-foreground ml-auto">
                                    {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                            </div>

                            {/* Reply Text */}
                            <p className="text-muted-foreground mb-3 whitespace-pre-wrap">{reply.content}</p>

                            {/* Actions */}
                            <div className="flex items-center gap-4 text-sm">
                                <button
                                    onClick={() => setReplyingTo(reply.id)}
                                    className="flex items-center gap-1 text-muted-foreground hover:text-purple-400 transition"
                                >
                                    <Reply className="w-4 h-4" />
                                    {isArabic ? 'رد' : 'Reply'}
                                </button>
                                {/* Mark as Best Answer */}
                                {session?.user && discussion && (
                                    session.user.id === discussion.author.id || 
                                    session.user.id === discussion.lesson?.id
                                ) && !reply.isBestAnswer && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`/api/discussions/${discussionId}/best-answer`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ replyId: reply.id })
                                                })
                                                if (response.ok) {
                                                    toast.success(isArabic ? 'تم تحديد أفضل إجابة!' : 'Best answer marked!')
                                                    fetchDiscussionAndReplies()
                                                }
                                            } catch (error) {
                                                toast.error(isArabic ? 'فشل تحديد أفضل إجابة' : 'Failed to mark best answer')
                                            }
                                        }}
                                        className="flex items-center gap-1 text-muted-foreground hover:text-yellow-400 transition"
                                    >
                                        <Award className="w-4 h-4" />
                                        {isArabic ? 'أفضل إجابة' : 'Best Answer'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nested replies */}
                {childReplies.length > 0 && (
                    <div className="space-y-3">
                        {childReplies.map(childReply => (
                            <ReplyComponent key={childReply.id} reply={childReply} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Main Discussion */}
            <div className="bg-gray-800/40 backdrop-blur-xl border border-border/50 rounded-xl p-8">
                <div className="flex gap-6">
                    <div className="flex flex-col gap-3">
                        {/* Vote */}
                        <button
                            onClick={() => handleVoteDiscussion(false)}
                            className="flex flex-col items-center gap-2 min-w-[70px]"
                        >
                            <ThumbsUp className="w-6 h-6 text-muted-foreground hover:text-purple-400 transition" />
                            <span className="text-xl font-bold text-foreground">{discussion.upvotes}</span>
                            <span className="text-sm text-muted-foreground">{isArabic ? 'تصويت' : 'votes'}</span>
                        </button>

                        {/* Bookmark */}
                        {session?.user && (
                            <button
                                onClick={handleBookmark}
                                className="flex items-center justify-center p-3 rounded-lg bg-gray-900/50 hover:bg-background transition"
                                title={isBookmarked 
                                    ? (isArabic ? 'إلغاء الحفظ' : 'Remove bookmark')
                                    : (isArabic ? 'حفظ' : 'Bookmark')}
                            >
                                {isBookmarked ? (
                                    <BookmarkCheck className="w-6 h-6 text-yellow-400" />
                                ) : (
                                    <Bookmark className="w-6 h-6 text-muted-foreground hover:text-yellow-400 transition" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                        {/* Title */}
                        <div className="flex items-start gap-3 mb-4">
                            {discussion.isPinned && (
                                <Pin className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                            )}
                            <h1 className="text-3xl font-bold text-foreground flex-1">
                                {discussion.title}
                            </h1>
                            {discussion.isSolved && (
                                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                            )}
                        </div>

                        {/* Meta */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                            <div className="flex items-center gap-2">
                                <img
                                    src={discussion.author.image || '/default-avatar.png'}
                                    alt={discussion.author.name}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="font-semibold text-foreground">{discussion.author.name}</span>
                            </div>
                            <span>•</span>
                            <span>{formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}</span>
                            {discussion.lesson && (
                                <>
                                    <span>•</span>
                                    <span className="text-purple-400">
                                        {isArabic ? discussion.lesson.titleAr : discussion.lesson.title}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Body */}
                        <div className="prose prose-invert max-w-none mb-6">
                            <p className="text-muted-foreground text-lg whitespace-pre-wrap">{discussion.content}</p>
                        </div>

                        {/* Tags */}
                        {discussion.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {discussion.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply Form */}
            <div className="bg-gray-800/40 backdrop-blur-xl border border-border/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    {isArabic ? 'إضافة رد' : 'Add Reply'}
                </h3>
                <form onSubmit={handleSubmitReply} className="space-y-4">
                    {replyingTo && (
                        <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                            <span className="text-sm text-purple-300">
                                {isArabic ? 'الرد على تعليق' : 'Replying to a comment'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setReplyingTo(null)}
                                className="text-muted-foreground hover:text-foreground transition"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={isArabic ? 'اكتب ردك هنا...' : 'Write your reply here...'}
                        rows={4}
                        className="w-full bg-gray-900/50 border border-border rounded-lg p-4 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={submitting || replyText.trim().length < 10}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-foreground px-6 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <Loader className="w-5 h-5 animate-spin" />
                            ) : (
                                <MessageSquare className="w-5 h-5" />
                            )}
                            {isArabic ? 'نشر الرد' : 'Post Reply'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Replies */}
            <div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">
                    {replies.length} {isArabic ? 'رد' : 'Replies'}
                </h3>
                <div className="space-y-4">
                    {topLevelReplies.map(reply => (
                        <ReplyComponent key={reply.id} reply={reply} />
                    ))}
                </div>
            </div>
        </div>
    )
}
