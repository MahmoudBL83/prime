'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Reply, Trash2, User, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface DiscussionComment {
    id: string
    content: string
    createdAt: string
    user: {
        id: string
        name: string
        arabicName: string | null
        profileImage: string | null
    }
    post: {
        id: string
        title: string
        titleAr: string | null
    }
    replies: DiscussionComment[]
}

interface DiscussionsSectionProps {
    mentorId: string
    postId?: string
    isArabic: boolean
    currentSubscription?: string | null
}

export default function DiscussionsSection({ 
    mentorId, 
    postId, 
    isArabic,
    currentSubscription 
}: DiscussionsSectionProps) {
    const { data: session } = useSession()
    const [comments, setComments] = useState<DiscussionComment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyContent, setReplyContent] = useState('')
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchDiscussions()
    }, [mentorId, postId])

    const fetchDiscussions = async () => {
        try {
            setLoading(true)
            const url = postId 
                ? `/api/mentors/${mentorId}/discussions?postId=${postId}`
                : `/api/mentors/${mentorId}/discussions`
            
            const response = await fetch(url)
            
            if (response.ok) {
                const data = await response.json()
                setComments(data.comments || [])
            }
        } catch (error) {
            console.error('Error fetching discussions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitComment = async (parentId?: string) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        if (!currentSubscription) {
            toast.error(isArabic ? 'يجب الاشتراك للتعليق' : 'Subscribe to comment')
            return
        }

        const content = parentId ? replyContent.trim() : newComment.trim()
        if (!content) {
            toast.error(isArabic ? 'الرجاء كتابة تعليق' : 'Please write a comment')
            return
        }

        if (!postId) {
            toast.error(isArabic ? 'يجب تحديد منشور' : 'Please select a post')
            return
        }

        setSubmitting(true)

        try {
            const response = await fetch(`/api/mentors/${mentorId}/discussions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    postId,
                    content,
                    parentId: parentId || undefined
                })
            })

            if (response.ok) {
                const data = await response.json()
                
                // Add new comment or reply to the list
                if (parentId) {
                    setComments(prev => prev.map(comment => {
                        if (comment.id === parentId) {
                            return {
                                ...comment,
                                replies: [...comment.replies, data.comment]
                            }
                        }
                        return comment
                    }))
                    setReplyContent('')
                    setReplyingTo(null)
                } else {
                    setComments(prev => [data.comment, ...prev])
                    setNewComment('')
                }
                
                toast.success(isArabic ? 'تم إضافة التعليق' : 'Comment added!')
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل إضافة التعليق' : 'Failed to add comment'))
            }
        } catch (error) {
            console.error('Error submitting comment:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!session) return

        if (!confirm(isArabic ? 'هل تريد حذف هذا التعليق؟' : 'Delete this comment?')) {
            return
        }

        try {
            const response = await fetch(`/api/mentors/${mentorId}/discussions?commentId=${commentId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setComments(prev => prev.filter(comment => comment.id !== commentId))
                toast.success(isArabic ? 'تم حذف التعليق' : 'Comment deleted')
            } else {
                toast.error(isArabic ? 'فشل حذف التعليق' : 'Failed to delete comment')
            }
        } catch (error) {
            console.error('Error deleting comment:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-24 bg-card animate-pulse rounded-lg" />
                <div className="h-24 bg-card animate-pulse rounded-lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* New Comment Form - Only for subscribers */}
            {session && currentSubscription ? (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex gap-3">
                        {session.user?.image ? (
                            <Image
                                src={session.user.image}
                                alt={session.user.name || 'User'}
                                width={40}
                                height={40}
                                className="rounded-full object-cover w-10 h-10 flex-shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        )}
                        
                        <div className="flex-1">
                            <Textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder={isArabic ? 'شارك أفكارك...' : 'Share your thoughts...'}
                                rows={3}
                                className="bg-background border-border resize-none mb-3"
                                maxLength={1000}
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                    {newComment.length}/1000
                                </span>
                                <Button
                                    onClick={() => handleSubmitComment()}
                                    disabled={submitting || !newComment.trim()}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    {submitting ? (isArabic ? 'جاري...' : 'Posting...') : (isArabic ? 'نشر' : 'Post')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-2xl p-6 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-muted-foreground mb-4">
                        {isArabic ? 'اشترك للانضمام إلى النقاش' : 'Subscribe to join the discussion'}
                    </p>
                </div>
            )}

            {/* Comments List */}
            <AnimatePresence mode="popLayout">
                {comments.length === 0 && !loading ? (
                    <div className="text-center py-12">
                        <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                            {isArabic ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                        </h3>
                        <p className="text-muted-foreground">
                            {isArabic ? 'كن أول من يشارك أفكاره' : 'Be the first to share your thoughts'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {comments.map((comment, index) => (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-card border border-border rounded-2xl p-6 hover:border-purple-500/30 transition-all"
                            >
                                {/* Comment Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    {comment.user.profileImage ? (
                                        <Image
                                            src={comment.user.profileImage}
                                            alt={comment.user.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full object-cover w-10 h-10"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                            <span className="font-semibold text-foreground">
                                                {isArabic && comment.user.arabicName ? comment.user.arabicName : comment.user.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(comment.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                {session?.user?.id === comment.user.id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="p-1 hover:bg-red-500/10 rounded text-muted-foreground hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <p className="text-muted-foreground leading-relaxed mb-3">
                                            {comment.content}
                                        </p>
                                        
                                        {/* Reply Button */}
                                        {session && currentSubscription && (
                                            <button
                                                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                className="text-sm text-purple-500 hover:text-purple-400 flex items-center gap-1 transition-colors"
                                            >
                                                <Reply className="w-4 h-4" />
                                                {isArabic ? 'رد' : 'Reply'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Reply Form */}
                                {replyingTo === comment.id && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="ml-14 mt-4 border-l-2 border-purple-500/30 pl-4"
                                    >
                                        <Textarea
                                            value={replyContent}
                                            onChange={(e) => setReplyContent(e.target.value)}
                                            placeholder={isArabic ? 'اكتب ردك...' : 'Write your reply...'}
                                            rows={2}
                                            className="bg-background border-border resize-none mb-2"
                                            maxLength={1000}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={() => handleSubmitComment(comment.id)}
                                                disabled={submitting || !replyContent.trim()}
                                                size="sm"
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                            >
                                                {submitting ? (isArabic ? 'جاري...' : 'Posting...') : (isArabic ? 'رد' : 'Reply')}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setReplyingTo(null)
                                                    setReplyContent('')
                                                }}
                                                size="sm"
                                                variant="outline"
                                            >
                                                {isArabic ? 'إلغاء' : 'Cancel'}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Replies */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="ml-14 mt-4 space-y-4 border-l-2 border-border pl-4">
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="flex items-start gap-3">
                                                {reply.user.profileImage ? (
                                                    <Image
                                                        src={reply.user.profileImage}
                                                        alt={reply.user.name}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full object-cover w-8 h-8"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                                        <span className="font-semibold text-sm text-foreground">
                                                            {isArabic && reply.user.arabicName ? reply.user.arabicName : reply.user.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(reply.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                                        {reply.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
