'use client'
import { ArrowLeft as LucideArrowLeft, Home as LucideHome, Play as LucidePlay, Bell as LucideBell, BarChart3 as LucideBarChart3, Video as LucideVideo, TrendingUp as LucideTrendingUp, Users as LucideUsers, DollarSign as LucideDollarSign, Settings as LucideSettings, MessageCircle as LucideMessageCircle, Heart as LucideHeart, Loader2 as LucideLoader2, ThumbsUp as LucideThumbsUp, Reply as LucideReply, CheckCircle as LucideCheckCircle, Trash2 as LucideTrash2 } from 'lucide-react'

import { useState, useEffect, lazy, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { CreatorSidebar, CreatorHeader } from '@/components/creator'

// Icon Components with lazy loading
const IconComponents = {
    ArrowLeft: LucideArrowLeft,
    Home: LucideHome,
    Play: LucidePlay,
    Bell: LucideBell,
    BarChart3: LucideBarChart3,
    Video: LucideVideo,
    TrendingUp: LucideTrendingUp,
    Users: LucideUsers,
    DollarSign: LucideDollarSign,
    Settings: LucideSettings,
    MessageCircle: LucideMessageCircle,
    Heart: LucideHeart,
    Loader2: LucideLoader2,
    ThumbsUp: LucideThumbsUp,
    Reply: LucideReply,
    CheckCircle: LucideCheckCircle,
    Trash2: LucideTrash2
}

// Dynamic Icon Component
const DynamicIcon = ({ name, className, ...props }: { name: keyof typeof IconComponents; className?: string; [key: string]: any }) => {
    const IconComponent = IconComponents[name]
    
    return (
        <Suspense fallback={<div className={className} />}>
            <IconComponent className={className} {...props} />
        </Suspense>
    )
}

interface Comment {
    id: string
    postTitle: string
    userName: string
    userImage: string
    content: string
    likes: number
    replies: number
    createdAt: string
    status: 'PENDING' | 'APPROVED' | 'SPAM'
}

export default function CreatorCommunity() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED'>('ALL')

    useEffect(() => {
        if (session?.user) {
            fetchComments()
        }
    }, [session])

    const fetchComments = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/creator/community/comments')
            if (response.ok) {
                const data = await response.json()
                setComments(data.comments || [])
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error)
            toast.error(isArabic ? 'فشل تحميل التعليقات' : 'Failed to load comments')
        } finally {
            setLoading(false)
        }
    }

    const handleApprove = async (commentId: string) => {
        try {
            const response = await fetch(`/api/creator/community/comments/${commentId}/approve`, {
                method: 'POST'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تمت الموافقة' : 'Comment approved')
                fetchComments()
            }
        } catch (error) {
            toast.error(isArabic ? 'فشل' : 'Failed')
        }
    }

    const handleDelete = async (commentId: string) => {
        if (!confirm(isArabic ? 'هل تريد حذف هذا التعليق؟' : 'Delete this comment?')) return

        try {
            const response = await fetch(`/api/creator/community/comments/${commentId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم الحذف' : 'Comment deleted')
                fetchComments()
            }
        } catch (error) {
            toast.error(isArabic ? 'فشل الحذف' : 'Delete failed')
        }
    }

    if (!session?.user) {
        router.push(`/${locale}/login`)
        return null
    }

    const filteredComments = comments.filter(comment => {
        if (filter === 'ALL') return true
        return comment.status === filter
    })

    return (
        <div className="min-h-screen bg-background">
            <CreatorHeader title="Community" titleAr="المجتمع" />

            <div className="flex">
                <CreatorSidebar />

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {isArabic ? 'المجتمع' : 'Community'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isArabic ? 'إدارة التعليقات والتفاعل مع جمهورك' : 'Manage comments and engage with your audience'}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">
                                    {isArabic ? 'إجمالي التعليقات' : 'Total comments'}
                                </span>
                                <DynamicIcon name="MessageCircle" className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="text-3xl font-bold">{comments.length}</div>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">
                                    {isArabic ? 'بانتظار المراجعة' : 'Pending review'}
                                </span>
                                <DynamicIcon name="Bell" className="w-5 h-5 text-yellow-500" />
                            </div>
                            <div className="text-3xl font-bold">
                                {comments.filter(c => c.status === 'PENDING').length}
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="bg-card border border-border rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">
                                    {isArabic ? 'إجمالي الإعجابات' : 'Total likes'}
                                </span>
                                <DynamicIcon name="Heart" className="w-5 h-5 text-pink-500" />
                            </div>
                            <div className="text-3xl font-bold">
                                {comments.reduce((sum, c) => sum + c.likes, 0)}
                            </div>
                        </motion.div>
                    </div>

                    {/* Filters */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 inline-flex">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    filter === 'ALL'
                                        ? 'bg-accent text-foreground font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {isArabic ? 'الكل' : 'All'}
                            </button>
                            <button
                                onClick={() => setFilter('PENDING')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    filter === 'PENDING'
                                        ? 'bg-accent text-foreground font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {isArabic ? 'قيد المراجعة' : 'Pending'}
                            </button>
                            <button
                                onClick={() => setFilter('APPROVED')}
                                className={`px-4 py-2 rounded-md transition-colors ${
                                    filter === 'APPROVED'
                                        ? 'bg-accent text-foreground font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {isArabic ? 'موافق عليها' : 'Approved'}
                            </button>
                        </div>
                    </div>

                    {/* Comments List */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        {loading ? (
                            <div className="text-center py-12">
                                <DynamicIcon name="Loader2" className="w-12 h-12 animate-spin mx-auto text-purple-500 mb-4" />
                                <p className="text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
                            </div>
                        ) : filteredComments.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                {isArabic ? 'لا توجد تعليقات' : 'No comments'}
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredComments.map((comment) => (
                                    <div key={comment.id} className="p-6 hover:bg-accent/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 overflow-hidden">
                                                {comment.userImage ? (
                                                    <Image src={comment.userImage} alt="" width={40} height={40} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                                        {comment.userName[0]?.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold">{comment.userName}</span>
                                                    <span className="text-sm text-muted-foreground">{comment.createdAt}</span>
                                                    {comment.status === 'PENDING' && (
                                                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                                            {isArabic ? 'قيد المراجعة' : 'Pending'}
                                                        </Badge>
                                                    )}
                                                    {comment.status === 'APPROVED' && (
                                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                                                            {isArabic ? 'موافق عليه' : 'Approved'}
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {isArabic ? 'على:' : 'On:'} <span className="font-semibold text-foreground">{comment.postTitle}</span>
                                                </p>

                                                <p className="mb-3">{comment.content}</p>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <DynamicIcon name="ThumbsUp" className="w-4 h-4" />
                                                        <span>{comment.likes}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <DynamicIcon name="Reply" className="w-4 h-4" />
                                                        <span>{comment.replies}</span>
                                                    </div>

                                                    <div className="ml-auto flex items-center gap-2">
                                                        {comment.status === 'PENDING' && (
                                                            <Button
                                                                onClick={() => handleApprove(comment.id)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-green-500/30 hover:bg-green-500/10 text-green-500"
                                                            >
                                                                <DynamicIcon name="CheckCircle" className="w-4 h-4 mr-1" />
                                                                {isArabic ? 'موافقة' : 'Approve'}
                                                            </Button>
                                                        )}
                                                        <Button
                                                            onClick={() => handleDelete(comment.id)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-500/30 hover:bg-red-500/10 text-red-500"
                                                        >
                                                            <DynamicIcon name="Trash2" className="w-4 h-4 mr-1" />
                                                            {isArabic ? 'حذف' : 'Delete'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
