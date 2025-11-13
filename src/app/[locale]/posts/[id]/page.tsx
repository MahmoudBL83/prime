'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    Send,
    Image as ImageIcon,
    Smile,
    CheckCircle,
    Crown,
    Lock,
    Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Post {
    id: string
    channelId: string
    title?: string
    titleAr?: string
    content: string
    contentAr?: string
    type: 'TEXT' | 'VIDEO' | 'IMAGE' | 'DOCUMENT' | 'POLL' | 'ANNOUNCEMENT'
    mediaUrl?: string
    thumbnailUrl?: string
    duration?: number
    publishedAt: string
    tier: string
    isPinned: boolean
    viewCount: number
    channel: {
        id: string
        name: string
        nameAr?: string
        creator: {
            user: {
                id: string
                name: string
                arabicName?: string
                profileImage: string | null
            }
            expertise: string
        }
    }
    likes: { id: string; userId: string }[]
    comments: Comment[]
    _count?: {
        likes: number
        comments: number
    }
}

interface Comment {
    id: string
    userId: string
    content: string
    imageUrl?: string
    createdAt: string
    updatedAt: string
    user?: {
        id: string
        name: string
        arabicName?: string
        profileImage: string | null
    }
}

export default function PostDetailPage() {
    const router = useRouter()
    const params = useParams()
    const { data: session } = useSession()
    const locale = (params.locale as string) || 'en'
    const isArabic = locale === 'ar'
    const postId = params.id as string

    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [commentText, setCommentText] = useState('')
    const [submittingComment, setSubmittingComment] = useState(false)
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [isBookmarked, setIsBookmarked] = useState(false)
    const [hasAccess, setHasAccess] = useState(false)
    const [fetchedPosts, setFetchedPosts] = useState<Set<string>>(new Set()) // Track fetched posts to prevent multiple calls
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [commentImage, setCommentImage] = useState<string | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const emojiPickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (postId && !fetchedPosts.has(postId)) {
            fetchPost()
        }
    }, [postId, fetchedPosts])

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false)
            }
        }

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showEmojiPicker])

    const fetchPost = async () => {
        if (fetchedPosts.has(postId)) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/posts/${postId}`)
            if (response.ok) {
                const data = await response.json()
                setPost(data.post)
                setLikeCount(data.post._count?.likes || data.post.likes?.length || 0)
                setIsLiked(data.post.likes?.some((like: any) => like.userId === session?.user?.id) || false)
                setHasAccess(data.hasAccess || false)
                
                // Mark this post as fetched to prevent multiple calls
                setFetchedPosts(prev => new Set(prev).add(postId))
                
                // Check if post is bookmarked
                if (session?.user?.id) {
                    checkBookmarkStatus()
                }
            } else {
                toast.error(isArabic ? 'فشل في تحميل المنشور' : 'Failed to load post')
                router.push(`/${locale}/mentors`)
            }
        } catch (error) {
            console.error('Failed to fetch post:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    // Check if post is bookmarked
    const checkBookmarkStatus = async () => {
        try {
            const response = await fetch('/api/bookmarks')
            if (response.ok) {
                const data = await response.json()
                const bookmarkedPostIds = data.bookmarks?.map((bookmark: any) => bookmark.postId || bookmark.id) || []
                setIsBookmarked(bookmarkedPostIds.includes(postId))
            }
        } catch (error) {
            console.error('Failed to check bookmark status:', error)
        }
    }

    const handleLike = async () => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: isLiked ? 'DELETE' : 'POST',
            })

            if (response.ok) {
                setIsLiked(!isLiked)
                setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
            }
        } catch (error) {
            console.error('Failed to like post:', error)
        }
    }

    // Handle image upload for comments
    const handleImageUpload = async (file: File) => {
        if (!file) return

        setUploadingImage(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', 'comment')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (response.ok) {
                const data = await response.json()
                setCommentImage(data.url)
                toast.success(isArabic ? 'تم رفع الصورة' : 'Image uploaded')
            } else {
                throw new Error('Upload failed')
            }
        } catch (error) {
            console.error('Failed to upload image:', error)
            toast.error(isArabic ? 'فشل رفع الصورة' : 'Failed to upload image')
        } finally {
            setUploadingImage(false)
        }
    }

    // Handle emoji selection
    const addEmoji = (emoji: string) => {
        setCommentText(prev => prev + emoji)
        setShowEmojiPicker(false)
    }

    // Common emojis for quick access
    const commonEmojis = ['😀', '😂', '😊', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉', '👏', '🙏', '💪', '🌟', '✨']

    const handleComment = async () => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        if (!commentText.trim() && !commentImage) {
            toast.error(isArabic ? 'الرجاء كتابة تعليق أو إضافة صورة' : 'Please write a comment or add an image')
            return
        }

        if (!hasAccess) {
            toast.error(isArabic ? 'يجب الاشتراك للتعليق' : 'Subscribe to comment')
            return
        }

        setSubmittingComment(true)
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: commentText,
                    imageUrl: commentImage 
                }),
            })

            if (response.ok) {
                const data = await response.json()
                setPost(prev => prev ? {
                    ...prev,
                    comments: [data.comment, ...prev.comments]
                } : null)
                setCommentText('')
                setCommentImage(null)
                toast.success(isArabic ? 'تم إضافة التعليق' : 'Comment added')
            } else {
                toast.error(isArabic ? 'فشل في إضافة التعليق' : 'Failed to add comment')
            }
        } catch (error) {
            console.error('Failed to comment:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSubmittingComment(false)
        }
    }

    const handleBookmark = async () => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        try {
            const response = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            })

            if (response.ok) {
                const data = await response.json()
                setIsBookmarked(data.bookmarked)
                toast.success(
                    isArabic 
                        ? (data.bookmarked ? 'تم حفظ المنشور' : 'تم إلغاء حفظ المنشور') 
                        : (data.bookmarked ? 'Post bookmarked' : 'Bookmark removed')
                )
            } else {
                throw new Error('Failed to toggle bookmark')
            }
        } catch (error) {
            console.error('Failed to bookmark post:', error)
            toast.error(isArabic ? 'فشل في حفظ المنشور' : 'Failed to bookmark post')
        }
    }

    const handleShare = () => {
        const url = `${window.location.origin}/${locale}/posts/${postId}`
        navigator.clipboard.writeText(url)
        toast.success(isArabic ? 'تم نسخ الرابط!' : 'Link copied!')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {isArabic ? 'المنشور غير موجود' : 'Post not found'}
                    </h2>
                    <Button
                        onClick={() => router.push(`/${locale}/mentors`)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-full"
                    >
                        {isArabic ? 'العودة' : 'Go Back'}
                    </Button>
                </div>
            </div>
        )
    }

    const tierColors = {
        BRONZE: 'from-orange-700 to-orange-500',
        SILVER: 'from-gray-400 to-gray-200',
        GOLD: 'from-yellow-500 to-yellow-300',
        VIP: 'from-purple-500 to-pink-500',
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{isArabic ? 'المنشور' : 'Post'}</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto max-w-3xl">
                {/* Post */}
                <div className="border-b border-white/10 p-6">
                    {/* Creator Info */}
                    <div className="flex items-start gap-4 mb-4">
                        <div
                            className="cursor-pointer"
                            onClick={() => router.push(`/${locale}/mentors/${post.channel.creator.user.id}`)}
                        >
                            {post.channel.creator.user.profileImage ? (
                                <Image
                                    src={post.channel.creator.user.profileImage}
                                    alt={post.channel.creator.user.name}
                                    width={48}
                                    height={48}
                                    className="rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                    <span className="text-xl font-bold">
                                        {post.channel.creator.user.name[0]}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="font-bold text-white hover:underline cursor-pointer"
                                    onClick={() => router.push(`/${locale}/mentors/${post.channel.creator.user.id}`)}
                                >
                                    {isArabic && post.channel.creator.user.arabicName
                                        ? post.channel.creator.user.arabicName
                                        : post.channel.creator.user.name}
                                </span>
                                <CheckCircle className="w-5 h-5 text-purple-500 fill-purple-500" />
                                {post.tier !== 'BRONZE' && (
                                    <Crown className={`w-5 h-5 bg-gradient-to-r ${tierColors[post.tier as keyof typeof tierColors]} bg-clip-text text-transparent`} />
                                )}
                            </div>
                            <p className="text-sm text-gray-400">{post.channel.creator.expertise}</p>
                            <p className="text-sm text-gray-500">
                                {new Date(post.publishedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    {post.title && (
                        <h2 className="text-2xl font-bold text-white mb-4">
                            {isArabic && post.titleAr ? post.titleAr : post.title}
                        </h2>
                    )}

                    {/* Content */}
                    <div className="text-lg text-white mb-4 whitespace-pre-wrap">
                        {isArabic && post.contentAr ? post.contentAr : post.content}
                    </div>

                    {/* Media */}
                    {!hasAccess && post.tier !== 'BRONZE' ? (
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                            <div className="aspect-video flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                                <Lock className="w-16 h-16 text-purple-400 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {isArabic ? 'محتوى حصري' : 'Exclusive Content'}
                                </h3>
                                <p className="text-gray-400 text-center mb-4">
                                    {isArabic
                                        ? `اشترك في باقة ${post.tier} أو أعلى لمشاهدة هذا المحتوى`
                                        : `Subscribe to ${post.tier} tier or higher to view this content`}
                                </p>
                                <Button
                                    onClick={() => router.push(`/${locale}/mentors/${post.channel.creator.user.id}`)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-full"
                                >
                                    <Crown className="w-5 h-5 mr-2" />
                                    {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {post.type === 'IMAGE' && post.mediaUrl && (
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-4">
                                    <Image
                                        src={post.mediaUrl}
                                        alt="Post media"
                                        width={800}
                                        height={600}
                                        className="w-full object-cover"
                                    />
                                </div>
                            )}

                            {post.type === 'VIDEO' && post.mediaUrl && (
                                <div className="relative rounded-2xl overflow-hidden border border-white/10 mb-4">
                                    <video
                                        controls
                                        poster={post.thumbnailUrl}
                                        className="w-full"
                                    >
                                        <source src={post.mediaUrl} type="video/mp4" />
                                    </video>
                                </div>
                            )}
                        </>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            <span>{likeCount} {isArabic ? 'إعجاب' : 'likes'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments.length} {isArabic ? 'تعليق' : 'comments'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            <span>{post.viewCount.toLocaleString()} {isArabic ? 'مشاهدة' : 'views'}</span>
                        </div>
                        {isBookmarked && (
                            <div className="flex items-center gap-2 text-blue-400">
                                <Bookmark className="w-4 h-4 fill-blue-400" />
                                <span className="text-xs">{isArabic ? 'محفوظ' : 'Saved'}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions - OnlyFans Style */}
                    <div className="flex items-center justify-between py-3 border-t border-b border-white/10">
                        <button
                            onClick={handleLike}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full hover:bg-pink-500/10 transition-all group ${
                                isLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'
                            }`}
                        >
                            <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                                <Heart className={`w-5 h-5 ${isLiked ? 'fill-pink-500' : ''} group-hover:scale-110 transition-transform`} />
                            </div>
                            <span className="font-semibold hidden sm:inline">{isArabic ? 'إعجاب' : 'Like'}</span>
                        </button>

                        <button
                            onClick={() => document.getElementById('comment-input')?.focus()}
                            className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-blue-500/10 text-gray-400 hover:text-blue-400 transition-all group"
                        >
                            <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                                <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="font-semibold hidden sm:inline">{isArabic ? 'تعليق' : 'Comment'}</span>
                        </button>

                        <button
                            onClick={handleShare}
                            className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-green-500/10 text-gray-400 hover:text-green-400 transition-all group"
                        >
                            <div className="p-2 rounded-full group-hover:bg-green-500/10">
                                <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <span className="font-semibold hidden sm:inline">{isArabic ? 'مشاركة' : 'Share'}</span>
                        </button>

                        <button
                            onClick={handleBookmark}
                            className={`flex items-center gap-2 px-3 py-2 rounded-full hover:bg-purple-500/10 transition-all group ${
                                isBookmarked ? 'text-purple-500' : 'text-gray-400 hover:text-purple-400'
                            }`}
                        >
                            <div className="p-2 rounded-full group-hover:bg-purple-500/10">
                                <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-purple-500' : ''} group-hover:scale-110 transition-transform`} />
                            </div>
                            <span className="font-semibold hidden sm:inline">{isArabic ? 'حفظ' : 'Save'}</span>
                        </button>

                        <button className="p-3 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Comment Input - OnlyFans Style */}
                {session && hasAccess ? (
                    <div className="p-4 border-b border-white/10 bg-white/[0.01]">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                    <span className="text-sm font-bold">
                                        {session.user?.name?.[0] || 'U'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 focus-within:border-purple-500/50 transition-colors">
                                    <Textarea
                                        id="comment-input"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        placeholder={isArabic ? 'اكتب تعليقك الرائع...' : 'Write your amazing comment...'}
                                        className="bg-transparent border-0 text-white placeholder:text-gray-500 min-h-[60px] resize-none focus:ring-0 focus:outline-none p-0"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                handleComment()
                                            }
                                        }}
                                    />
                                    
                                    {/* Comment Image Preview */}
                                    {commentImage && (
                                        <div className="relative mt-3 inline-block">
                                            <Image
                                                src={commentImage}
                                                alt="Comment image"
                                                width={200}
                                                height={150}
                                                className="rounded-xl object-cover border border-white/10"
                                            />
                                            <button
                                                onClick={() => setCommentImage(null)}
                                                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-sm transition-colors shadow-lg"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                                        <div className="flex items-center gap-2 relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleImageUpload(file)
                                                }}
                                                className="hidden"
                                                id="comment-image-upload"
                                            />
                                            <button
                                                onClick={() => document.getElementById('comment-image-upload')?.click()}
                                                disabled={uploadingImage}
                                                className="p-2 hover:bg-purple-500/20 rounded-full transition-colors text-purple-400 hover:text-purple-300 disabled:opacity-50"
                                                title={isArabic ? 'إضافة صورة' : 'Add image'}
                                            >
                                                {uploadingImage ? (
                                                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5" />
                                                )}
                                            </button>
                                            
                                            <button
                                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                className="p-2 hover:bg-purple-500/20 rounded-full transition-colors text-purple-400 hover:text-purple-300"
                                                title={isArabic ? 'إضافة رموز تعبيرية' : 'Add emoji'}
                                            >
                                                <Smile className="w-5 h-5" />
                                            </button>

                                            {/* Emoji Picker - OnlyFans Style */}
                                            {showEmojiPicker && (
                                                <div 
                                                    ref={emojiPickerRef}
                                                    className="absolute bottom-full left-0 mb-2 bg-gray-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-2xl z-10 min-w-[320px]"
                                                >
                                                    <div className="mb-3">
                                                        <h4 className="text-white font-bold text-sm mb-2">
                                                            {isArabic ? 'الرموز التعبيرية المفضلة' : 'Popular Emojis'}
                                                        </h4>
                                                    </div>
                                                    <div className="grid grid-cols-8 gap-2">
                                                        {commonEmojis.map((emoji, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => addEmoji(emoji)}
                                                                className="text-2xl hover:bg-purple-500/20 rounded-lg p-2 transition-all hover:scale-110"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-white/10">
                                                        <p className="text-xs text-gray-400 text-center">
                                                            {isArabic ? 'انقر لإضافة رمز تعبيري إلى تعليقك' : 'Click to add emoji to your comment'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleComment}
                                            disabled={submittingComment || (!commentText.trim() && !commentImage)}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                        >
                                            {submittingComment ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span className="text-sm">{isArabic ? 'نشر...' : 'Posting...'}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'نشر' : 'Post'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !session ? (
                    <div className="p-6 border-b border-white/10 text-center">
                        <p className="text-gray-400 mb-4">
                            {isArabic ? 'يجب تسجيل الدخول للتعليق' : 'Sign in to comment'}
                        </p>
                        <Button
                            onClick={() => router.push(`/${locale}/login`)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-2 rounded-full"
                        >
                            {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                        </Button>
                    </div>
                ) : (
                    <div className="p-6 border-b border-white/10 text-center">
                        <Lock className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">
                            {isArabic ? 'اشترك لإضافة تعليق' : 'Subscribe to comment'}
                        </p>
                        <Button
                            onClick={() => router.push(`/${locale}/mentors/${post.channel.creator.user.id}`)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-2 rounded-full"
                        >
                            <Crown className="w-5 h-5 mr-2" />
                            {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                        </Button>
                    </div>
                )}

                {/* Comments List - OnlyFans Style */}
                <div className="divide-y divide-white/10">
                    {post.comments.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-10 h-10 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">
                                {isArabic ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                            </h3>
                            <p className="text-gray-400 mb-4">
                                {isArabic ? 'كن أول من يعلق على هذا المنشور الرائع!' : 'Be the first to comment on this amazing post!'}
                            </p>
                            <div className="flex items-center justify-center gap-2 text-purple-400">
                                <Heart className="w-5 h-5" />
                                <span className="text-sm font-semibold">
                                    {isArabic ? 'أظهر حبك للمحتوى!' : 'Show some love for the content!'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-white/10 bg-white/[0.01]">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">
                                        {post.comments.length} {isArabic ? 'تعليق' : 'Comments'}
                                    </h3>
                                    <div className="text-sm text-gray-400">
                                        {isArabic ? 'الأحدث أولاً' : 'Most recent first'}
                                    </div>
                                </div>
                            </div>
                            {post.comments.map((comment, index) => (
                                <motion.div
                                    key={comment.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 hover:bg-white/[0.01] transition-colors group"
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0">
                                            {comment.user?.profileImage ? (
                                                <Image
                                                    src={comment.user.profileImage}
                                                    alt={comment.user.name}
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full object-cover border-2 border-transparent group-hover:border-purple-500/30 transition-colors"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center border-2 border-transparent group-hover:border-purple-500/30 transition-colors">
                                                    <span className="text-sm font-bold">
                                                        {comment.user?.name?.[0] || 'U'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="font-bold text-white hover:text-purple-400 transition-colors cursor-pointer">
                                                    {isArabic && comment.user?.arabicName
                                                        ? comment.user.arabicName
                                                        : comment.user?.name || 'User'}
                                                </span>
                                                <span className="text-gray-500 text-xs">
                                                    {new Date(comment.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                            
                                            {comment.content && (
                                                <div className="mb-3 bg-white/[0.02] rounded-2xl p-3 border border-white/5">
                                                    <p className="text-white whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                                                </div>
                                            )}
                                            
                                            {/* Comment Image */}
                                            {comment.imageUrl && (
                                                <div className="mb-3">
                                                    <Image
                                                        src={comment.imageUrl}
                                                        alt="Comment image"
                                                        width={300}
                                                        height={200}
                                                        className="rounded-xl object-cover border border-white/10 max-w-full h-auto cursor-pointer hover:brightness-110 transition-all"
                                                        onClick={() => window.open(comment.imageUrl, '_blank')}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-6 mt-3">
                                                <button className="flex items-center gap-2 text-gray-400 hover:text-pink-400 text-sm font-semibold transition-colors group">
                                                    <div className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors">
                                                        <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <span>{isArabic ? 'إعجاب' : 'Like'}</span>
                                                    <span className="text-xs text-gray-500">0</span>
                                                </button>
                                                <button className="flex items-center gap-2 text-gray-400 hover:text-purple-400 text-sm font-semibold transition-colors group">
                                                    <div className="p-1.5 rounded-full group-hover:bg-purple-500/10 transition-colors">
                                                        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    </div>
                                                    <span>{isArabic ? 'رد' : 'Reply'}</span>
                                                </button>
                                                <button className="text-gray-500 hover:text-gray-400 text-sm transition-colors">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
