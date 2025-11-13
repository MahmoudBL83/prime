'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Star,
    Users,
    Heart,
    MessageCircle,
    Lock,
    Crown,
    Sparkles,
    Video,
    Image as ImageIcon,
    Calendar,
    CheckCircle,
    Play,
    ArrowLeft,
    Share2,
    Bell,
    TrendingUp,
    Eye,
    MessageSquare,
    Send,
    Smile,
    Paperclip,
    MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { toast } from 'react-hot-toast'

interface MentorData {
    id: string
    user: {
        id: string
        name: string
        arabicName: string
        bio: string
        profileImage: string | null
    }
    expertise: string
    totalSubscribers: number
    basicMonthlyPrice?: number
    premiumMonthlyPrice?: number
    vipMonthlyPrice?: number
    stats: {
        totalFollowers: number
        totalCourses: number
        averageRating: number
        yearsOfExperience: number
        totalPosts: number
    }
}

interface Post {
    id: string
    type: 'text' | 'image' | 'video' | 'quote'
    content: string
    media?: string
    tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP'
    likes: number
    comments: number
    views: number
    timestamp: string
    isLocked: boolean
}

export default function OnlyFansMentorProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const locale = (params.locale as string) || 'en'
    const isArabic = locale === 'ar'

    const [mentor, setMentor] = useState<MentorData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [currentSubscription, setCurrentSubscription] = useState<string | null>(null) // 'BASIC' | 'PREMIUM' | 'VIP' | null
    const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'about'>('posts')
    const [commentText, setCommentText] = useState('')

    // Demo posts
    const [posts, setPosts] = useState<Post[]>([
        {
            id: '1',
            type: 'text',
            content: 'Just wrapped up an amazing trading session! 📈 My VIP members are seeing incredible results. If you want to learn the strategies that actually work, join my VIP tier today! 💎',
            tier: 'FREE',
            likes: 234,
            comments: 45,
            views: 1890,
            timestamp: '2h',
            isLocked: false
        },
        {
            id: '2',
            type: 'image',
            content: 'Exclusive: My personal trading setup and the 5 indicators I use every single day. Premium members get access to my full indicator list! 🔥',
            media: '/images/trading-setup.jpg',
            tier: 'PREMIUM',
            likes: 567,
            comments: 89,
            views: 3240,
            timestamp: '5h',
            isLocked: true
        },
        {
            id: '3',
            type: 'video',
            content: 'LIVE Market Analysis - Breaking down today\'s biggest moves and what to watch for tomorrow. VIP members join me for Q&A! 💼',
            media: '/videos/market-analysis.mp4',
            tier: 'VIP',
            likes: 892,
            comments: 156,
            views: 5120,
            timestamp: '8h',
            isLocked: true
        },
        {
            id: '4',
            type: 'quote',
            content: 'The market rewards patience and punishes emotion. Master your psychology, master the market. 🧠',
            tier: 'FREE',
            likes: 445,
            comments: 67,
            views: 2890,
            timestamp: '1d',
            isLocked: false
        },
        {
            id: '5',
            type: 'image',
            content: '🎯 My Weekly Trading Results - Up 23.5% this week! VIP members get my daily trade alerts and can follow along in real-time.',
            media: '/images/weekly-results.jpg',
            tier: 'VIP',
            likes: 1234,
            comments: 234,
            views: 8920,
            timestamp: '1d',
            isLocked: true
        }
    ])

    useEffect(() => {
        if (params.id) {
            fetchMentorData()
        }
    }, [params.id])

    const fetchMentorData = async () => {
        try {
            const response = await fetch(`/api/instructors/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                const transformedMentor = {
                    ...data.instructor,
                    stats: {
                        ...data.instructor.stats,
                        totalPosts: Math.floor(Math.random() * 200) + 50
                    }
                }
                setMentor(transformedMentor)
                
                // Simulate subscription check
                const mockSub = Math.random() > 0.5 ? ['BASIC', 'PREMIUM', 'VIP'][Math.floor(Math.random() * 3)] : null
                setCurrentSubscription(mockSub as any)
            } else {
                toast.error(isArabic ? 'لم يتم العثور على المنشئ' : 'Mentor not found')
                router.push(`/${locale}/mentors`)
            }
        } catch (error) {
            console.error('Error fetching mentor:', error)
            toast.error(isArabic ? 'فشل التحميل' : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }

    const handleFollow = () => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }
        setIsFollowing(!isFollowing)
        toast.success(isFollowing ? (isArabic ? 'تم إلغاء المتابعة' : 'Unfollowed') : (isArabic ? 'تمت المتابعة' : 'Following!'))
    }

    const handleSubscribe = (tier: 'BASIC' | 'PREMIUM' | 'VIP') => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }
        setCurrentSubscription(tier)
        toast.success(isArabic ? `تم الاشتراك في ${tier}!` : `Subscribed to ${tier}!`)
    }

    const handleLikePost = (postId: string) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }
        setPosts(posts.map(post => 
            post.id === postId 
                ? { ...post, likes: post.likes + 1 }
                : post
        ))
    }

    const handleShare = () => {
        const url = window.location.href
        if (navigator.share) {
            navigator.share({ url })
        } else {
            navigator.clipboard.writeText(url)
            toast.success(isArabic ? 'تم النسخ!' : 'Link copied!')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (!mentor) return null

    const getMentorName = () => isArabic && mentor.user.arabicName ? mentor.user.arabicName : mentor.user.name

    const canViewPost = (post: Post) => {
        if (post.tier === 'FREE') return true
        if (!currentSubscription) return false
        
        const tierHierarchy = { 'BASIC': 1, 'PREMIUM': 2, 'VIP': 3 }
        return tierHierarchy[currentSubscription] >= tierHierarchy[post.tier as keyof typeof tierHierarchy]
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Top Navigation */}
            <div className="sticky top-0 z-50 bg-black/95 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="font-semibold">{isArabic ? 'رجوع' : 'Back'}</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleShare}
                                className="p-2 hover:bg-white/[0.02] rounded-full transition-colors"
                            >
                                <Share2 className="w-5 h-5 text-gray-400" />
                            </button>
                            <button className="p-2 hover:bg-white/[0.02] rounded-full transition-colors">
                                <MoreVertical className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cover & Profile Section */}
            <div className="relative">
                {/* Cover Image */}
                <div className="h-48 sm:h-64 bg-gradient-to-br from-purple-900 via-black to-pink-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-5" />
                </div>

                {/* Profile Info */}
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="relative -mt-16 sm:-mt-20">
                        <div className="flex items-end justify-between mb-6">
                            {/* Profile Image */}
                            <div className="relative">
                                {mentor.user.profileImage ? (
                                    <Image
                                        src={mentor.user.profileImage}
                                        alt={getMentorName()}
                                        width={120}
                                        height={120}
                                        className="rounded-full border-4 border-black object-cover"
                                    />
                                ) : (
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-black bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white">
                                            {getMentorName()[0]}
                                        </span>
                                    </div>
                                )}
                                {mentor.stats.averageRating >= 4.5 && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-4 border-black">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleFollow}
                                    className={`px-6 py-2 rounded-full font-semibold transition-all ${
                                        isFollowing
                                            ? 'bg-white/10 text-white hover:bg-white/20'
                                            : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                                >
                                    {isFollowing ? (isArabic ? 'متابع' : 'Following') : (isArabic ? 'متابعة' : 'Follow')}
                                </button>
                                {!currentSubscription && (
                                    <Button
                                        onClick={() => {
                                            // Open subscription modal or scroll to pricing
                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                        }}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-2 rounded-full"
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        {isArabic ? 'اشترك' : 'Subscribe'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Name & Bio */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-black text-white">
                                    {getMentorName()}
                                </h1>
                                {currentSubscription && (
                                    <Badge className={`${
                                        currentSubscription === 'VIP' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                        currentSubscription === 'PREMIUM' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                        'bg-gradient-to-r from-blue-500 to-cyan-500'
                                    } text-white border-0`}>
                                        <Crown className="w-3 h-3 mr-1" />
                                        {currentSubscription}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-gray-400 text-lg mb-3">{mentor.expertise}</p>
                            <p className="text-gray-300 max-w-2xl">{mentor.user.bio}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                            <div>
                                <span className="font-bold text-white text-lg">{mentor.stats.totalPosts}</span>
                                <span className="text-gray-400 text-sm ml-1">{isArabic ? 'منشورات' : 'posts'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-white text-lg">{(mentor.totalSubscribers / 1000).toFixed(1)}K</span>
                                <span className="text-gray-400 text-sm ml-1">{isArabic ? 'مشتركين' : 'subscribers'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-white text-lg">{(mentor.stats.totalFollowers / 1000).toFixed(1)}K</span>
                                <span className="text-gray-400 text-sm ml-1">{isArabic ? 'متابعين' : 'followers'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-white text-lg">{mentor.stats.averageRating.toFixed(1)}</span>
                                <span className="text-gray-400 text-sm">{isArabic ? 'تقييم' : 'rating'}</span>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-8 pt-4">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`pb-4 font-semibold transition-colors relative ${
                                    activeTab === 'posts' ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {isArabic ? 'المنشورات' : 'Posts'}
                                {activeTab === 'posts' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('media')}
                                className={`pb-4 font-semibold transition-colors relative ${
                                    activeTab === 'media' ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {isArabic ? 'الوسائط' : 'Media'}
                                {activeTab === 'media' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('about')}
                                className={`pb-4 font-semibold transition-colors relative ${
                                    activeTab === 'about' ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {isArabic ? 'حول' : 'About'}
                                {activeTab === 'about' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-full" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <AnimatePresence mode="wait">
                    {/* Posts Tab */}
                    {activeTab === 'posts' && (
                        <motion.div
                            key="posts"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Subscription Tiers (if not subscribed) */}
                            {!currentSubscription && (
                                <div id="subscription-tiers" className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 mb-6">
                                    <h3 className="text-2xl font-black text-white mb-4">
                                        🔥 {isArabic ? 'اشترك للوصول الحصري' : 'Subscribe for Exclusive Content'}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Basic Tier */}
                                        {mentor.basicMonthlyPrice && (
                                            <div className="bg-white/[0.02] border border-blue-500/30 rounded-xl p-5 hover:border-blue-400 transition-all cursor-pointer"
                                                onClick={() => handleSubscribe('BASIC')}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                                    <h4 className="font-bold text-white text-lg">Basic</h4>
                                                </div>
                                                <div className="text-3xl font-black text-white mb-1">
                                                    {mentor.basicMonthlyPrice} EGP
                                                </div>
                                                <div className="text-sm text-gray-400 mb-4">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                <ul className="space-y-2 text-sm text-gray-300 mb-4">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-blue-400" />
                                                        All posts access
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-blue-400" />
                                                        Weekly updates
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-blue-400" />
                                                        Community access
                                                    </li>
                                                </ul>
                                                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                                                    {isArabic ? 'اشترك' : 'Subscribe'}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Premium Tier */}
                                        {mentor.premiumMonthlyPrice && (
                                            <div className="bg-white/[0.02] border-2 border-purple-500/50 rounded-xl p-5 hover:border-purple-400 transition-all cursor-pointer relative overflow-hidden"
                                                onClick={() => handleSubscribe('PREMIUM')}>
                                                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                                    POPULAR
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Star className="w-5 h-5 text-purple-400" />
                                                    <h4 className="font-bold text-white text-lg">Premium</h4>
                                                </div>
                                                <div className="text-3xl font-black text-white mb-1">
                                                    {mentor.premiumMonthlyPrice} EGP
                                                </div>
                                                <div className="text-sm text-gray-400 mb-4">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                <ul className="space-y-2 text-sm text-gray-300 mb-4">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                                        Everything in Basic
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                                        Monthly Q&A sessions
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                                        Priority support
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-purple-400" />
                                                        Exclusive resources
                                                    </li>
                                                </ul>
                                                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                                                    {isArabic ? 'اشترك' : 'Subscribe'}
                                                </Button>
                                            </div>
                                        )}

                                        {/* VIP Tier */}
                                        {mentor.vipMonthlyPrice && (
                                            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-xl p-5 hover:border-yellow-400 transition-all cursor-pointer"
                                                onClick={() => handleSubscribe('VIP')}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Crown className="w-5 h-5 text-yellow-400" />
                                                    <h4 className="font-bold text-white text-lg">VIP</h4>
                                                </div>
                                                <div className="text-3xl font-black text-white mb-1">
                                                    {mentor.vipMonthlyPrice} EGP
                                                </div>
                                                <div className="text-sm text-gray-400 mb-4">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                <ul className="space-y-2 text-sm text-gray-300 mb-4">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-yellow-400" />
                                                        Everything in Premium
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-yellow-400" />
                                                        1-on-1 coaching
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-yellow-400" />
                                                        Direct messaging
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-yellow-400" />
                                                        Custom content requests
                                                    </li>
                                                </ul>
                                                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                                                    {isArabic ? 'اشترك' : 'Subscribe'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Posts Feed */}
                            {posts.map((post, i) => {
                                const isLocked = post.isLocked && !canViewPost(post)
                                
                                return (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                                    >
                                        {/* Post Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            {mentor.user.profileImage ? (
                                                <Image
                                                    src={mentor.user.profileImage}
                                                    alt={getMentorName()}
                                                    width={48}
                                                    height={48}
                                                    className="rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-white">{getMentorName()[0]}</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-white">{getMentorName()}</span>
                                                    <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                                                    {post.tier !== 'FREE' && (
                                                        <Badge className={`${
                                                            post.tier === 'VIP' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                                            post.tier === 'PREMIUM' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                                            'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                        } text-white border-0 text-xs`}>
                                                            <Crown className="w-3 h-3 mr-1" />
                                                            {post.tier}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-400">{post.timestamp}</span>
                                            </div>
                                        </div>

                                        {/* Post Content */}
                                        {isLocked ? (
                                            <div className="relative">
                                                <div className="blur-sm">
                                                    <p className="text-white mb-4">{post.content.slice(0, 50)}...</p>
                                                </div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl">
                                                    <Lock className="w-12 h-12 text-gray-400 mb-3" />
                                                    <p className="text-white font-semibold mb-2">{isArabic ? 'محتوى حصري' : 'Exclusive Content'}</p>
                                                    <p className="text-gray-400 text-sm mb-4">{isArabic ? `اشترك في ${post.tier} للمشاهدة` : `Subscribe to ${post.tier} to unlock`}</p>
                                                    <Button 
                                                        onClick={() => handleSubscribe(post.tier as any)}
                                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                                                    >
                                                        <Crown className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-white mb-4 whitespace-pre-wrap">{post.content}</p>
                                                
                                                {/* Media */}
                                                {post.media && post.type === 'image' && (
                                                    <div className="relative rounded-xl overflow-hidden border border-white/10 mb-4">
                                                        <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                                                            <ImageIcon className="w-16 h-16 text-purple-500" />
                                                        </div>
                                                    </div>
                                                )}
                                                {post.media && post.type === 'video' && (
                                                    <div className="relative rounded-xl overflow-hidden border border-white/10 mb-4">
                                                        <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                                                                <Play className="w-8 h-8 text-white ml-1" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Engagement Stats */}
                                                <div className="flex items-center justify-between text-gray-500 text-sm border-t border-white/10 pt-4">
                                                    <button 
                                                        onClick={() => handleLikePost(post.id)}
                                                        className="flex items-center gap-2 hover:text-pink-400 transition-colors group"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                                                            <Heart className="w-5 h-5" />
                                                        </div>
                                                        <span>{post.likes.toLocaleString()}</span>
                                                    </button>

                                                    <button className="flex items-center gap-2 hover:text-purple-400 transition-colors group">
                                                        <div className="p-2 rounded-full group-hover:bg-purple-500/10">
                                                            <MessageSquare className="w-5 h-5" />
                                                        </div>
                                                        <span>{post.comments}</span>
                                                    </button>

                                                    <button className="flex items-center gap-2 hover:text-gray-300 transition-colors group">
                                                        <div className="p-2 rounded-full group-hover:bg-white/5">
                                                            <Eye className="w-5 h-5" />
                                                        </div>
                                                        <span>{post.views.toLocaleString()}</span>
                                                    </button>

                                                    <button 
                                                        onClick={handleShare}
                                                        className="flex items-center gap-2 hover:text-blue-400 transition-colors group"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                                                            <Share2 className="w-5 h-5" />
                                                        </div>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )
                            })}
                        </motion.div>
                    )}

                    {/* Media Tab */}
                    {activeTab === 'media' && (
                        <motion.div
                            key="media"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-3 gap-1"
                        >
                            {posts.filter(p => p.media).map((post, i) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg flex items-center justify-center relative group cursor-pointer"
                                >
                                    {canViewPost(post) ? (
                                        <>
                                            {post.type === 'video' && (
                                                <Play className="w-8 h-8 text-white opacity-80 group-hover:opacity-100" />
                                            )}
                                            {post.type === 'image' && (
                                                <ImageIcon className="w-8 h-8 text-white opacity-80 group-hover:opacity-100" />
                                            )}
                                        </>
                                    ) : (
                                        <Lock className="w-8 h-8 text-gray-400" />
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* About Tab */}
                    {activeTab === 'about' && (
                        <motion.div
                            key="about"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-white mb-4">{isArabic ? 'حول' : 'About'}</h3>
                                <p className="text-gray-300 leading-relaxed mb-6">{mentor.user.bio}</p>
                                
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">{isArabic ? 'الخبرة' : 'Experience'}</span>
                                        <span className="text-white font-semibold">{mentor.stats.yearsOfExperience}+ {isArabic ? 'سنوات' : 'years'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">{isArabic ? 'التقييم' : 'Rating'}</span>
                                        <span className="text-white font-semibold flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            {mentor.stats.averageRating.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400">{isArabic ? 'المنشورات' : 'Total Posts'}</span>
                                        <span className="text-white font-semibold">{mentor.stats.totalPosts}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
