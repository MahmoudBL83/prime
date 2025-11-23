'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { 
    Play, 
    Users, 
    BookOpen, 
    CheckCircle, 
    Clock,
    Calendar,
    MessageCircle,
    Video,
    FileText,
    Download,
    Star,
    TrendingUp,
    Award,
    Zap,
    ArrowLeft,
    ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'

interface ChannelTier {
    tier: string
    price: number
    benefits: string[]
}

interface ChannelPost {
    id: string
    type: 'VIDEO' | 'POST' | 'RESOURCE' | 'LIVE'
    title: string
    content?: string
    videoUrl?: string
    resourceUrl?: string
    createdAt: string
    requiresTier: string
}

interface ChannelData {
    id: string
    name: string
    nameAr?: string
    description: string
    descriptionAr?: string
    coverImage?: string
    creator: {
        id: string
        name: string
        arabicName?: string
        profileImage?: string
        bio?: string
    }
    tiers: ChannelTier[]
    stats: {
        totalSubscribers: number
        totalPosts: number
    }
    isSubscribed: boolean
    userTier?: string
    recentPosts?: ChannelPost[]
}

export default function ChannelPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const channelId = params.id as string
    const locale = params.locale as string || 'en'
    
    const [channel, setChannel] = useState<ChannelData | null>(null)
    const [loading, setLoading] = useState(true)
    const [subscribing, setSubscribing] = useState(false)
    const [selectedTier, setSelectedTier] = useState<string>('')
    
    const isArabic = locale === 'ar'

    useEffect(() => {
        fetchChannelData()
    }, [channelId])

    const fetchChannelData = async () => {
        try {
            const response = await fetch(`/api/channels/${channelId}`)
            if (response.ok) {
                const data = await response.json()
                setChannel(data)
                if (data.userTier) {
                    setSelectedTier(data.userTier)
                }
            } else {
                toast.error(isArabic ? 'فشل تحميل القناة' : 'Failed to load channel')
            }
        } catch (error) {
            console.error('Error fetching channel:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (tier: string) => {
        if (!session?.user) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول للاشتراك' : 'Please log in to subscribe')
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/channels/${channelId}`)
            return
        }

        setSubscribing(true)
        try {
            const response = await fetch(`/api/channels/${channelId}/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tier })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم الاشتراك بنجاح!' : 'Successfully subscribed!')
                fetchChannelData()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل الاشتراك' : 'Failed to subscribe'))
            }
        } catch (error) {
            console.error('Subscription error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSubscribing(false)
        }
    }

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'BRONZE': return 'from-orange-600 to-amber-700'
            case 'SILVER': return 'from-gray-400 to-gray-600'
            case 'GOLD': return 'from-yellow-500 to-yellow-700'
            default: return 'from-purple-600 to-blue-600'
        }
    }

    const getTierBadgeColor = (tier: string) => {
        switch (tier) {
            case 'BRONZE': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
            case 'SILVER': return 'bg-gray-400/20 text-gray-300 border-gray-400/30'
            case 'GOLD': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            default: return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        }
    }

    const getPostIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return <Video className="w-5 h-5" />
            case 'LIVE': return <Play className="w-5 h-5" />
            case 'RESOURCE': return <Download className="w-5 h-5" />
            default: return <FileText className="w-5 h-5" />
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500/30 rounded-full animate-ping"></div>
                        <div className="w-16 h-16 border-4 border-[#0a84ff]/30 border-t-[#0a84ff] rounded-full animate-spin mx-auto mb-6"></div>
                    </div>
                    <p className="text-purple-200 text-lg font-medium">{isArabic ? 'جاري تحميل القناة...' : 'Loading channel...'}</p>
                </div>
            </div>
        )
    }

    if (!channel) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-6">
                <Card className="max-w-md bg-gray-800/60 backdrop-blur-md border-gray-700/50 text-white">
                    <CardContent className="p-8 text-center">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                        <h2 className="text-2xl font-bold mb-2">
                            {isArabic ? 'القناة غير موجودة' : 'Channel Not Found'}
                        </h2>
                        <p className="text-gray-300 mb-6">
                            {isArabic 
                                ? 'القناة التي تبحث عنها غير موجودة أو تم حذفها'
                                : 'The channel you are looking for does not exist or has been removed'}
                        </p>
                        <Link href={`/${locale}/channels`}>
                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90">
                                {isArabic ? 'تصفح القنوات' : 'Browse Channels'}
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const channelName = isArabic && channel.nameAr ? channel.nameAr : channel.name
    const channelDescription = isArabic && channel.descriptionAr ? channel.descriptionAr : channel.description
    const creatorName = isArabic && channel.creator.arabicName ? channel.creator.arabicName : channel.creator.name

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Header */}
            <div className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                </div>
                
                {/* Cover Image */}
                {channel.coverImage && (
                    <div className="relative h-64 md:h-80 overflow-hidden">
                        <Image 
                            src={channel.coverImage} 
                            alt={channelName}
                            fill
                            className="object-cover opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black"></div>
                    </div>
                )}
                
                <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/30 to-blue-900/30 py-12 px-6 border-b border-white/10">
                    <div className="max-w-7xl mx-auto">
                        {/* Back Button */}
                        <Link href={`/${locale}/channels`}>
                            <Button 
                                variant="ghost" 
                                className="text-purple-200 hover:text-white hover:bg-purple-600/20 mb-6 -ml-2"
                            >
                                <ArrowLeft className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
                                <span className="ml-2">{isArabic ? 'العودة إلى القنوات' : 'Back to Channels'}</span>
                            </Button>
                        </Link>

                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            {/* Creator Avatar */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative"
                            >
                                <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-purple-500/30 shadow-2xl">
                                    {channel.creator.profileImage ? (
                                        <Image
                                            src={channel.creator.profileImage}
                                            alt={creatorName}
                                            width={128}
                                            height={128}
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                            <span className="text-white text-4xl font-bold">
                                                {creatorName.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {/* Channel Info */}
                            <motion.div 
                                className="flex-1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                {/* Badge */}
                                <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-4 py-2 mb-4">
                                    <Play className="w-4 h-4 text-purple-400" />
                                    <span className="text-purple-200 text-sm font-medium">
                                        {isArabic ? 'قناة منشئ' : 'Creator Channel'}
                                    </span>
                                </div>

                                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-3 leading-tight">
                                    {channelName}
                                </h1>
                                
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-purple-200 text-lg">
                                        {isArabic ? 'بواسطة' : 'by'} <span className="font-semibold">{creatorName}</span>
                                    </span>
                                    {channel.isSubscribed && (
                                        <Badge className={getTierBadgeColor(channel.userTier || '')}>
                                            {channel.userTier} {isArabic ? 'عضو' : 'Member'}
                                        </Badge>
                                    )}
                                </div>

                                <p className="text-purple-100/80 text-lg mb-6 leading-relaxed max-w-3xl">
                                    {channelDescription}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-6 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-purple-400" />
                                        <span className="text-white font-semibold">{channel.stats.totalSubscribers.toLocaleString()}</span>
                                        <span className="text-gray-400 text-sm">{isArabic ? 'مشترك' : 'subscribers'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-400" />
                                        <span className="text-white font-semibold">{channel.stats.totalPosts}</span>
                                        <span className="text-gray-400 text-sm">{isArabic ? 'منشور' : 'posts'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Subscription Tiers */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        {isArabic ? 'خطط الاشتراك' : 'Subscription Plans'}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {channel.tiers.map((tier, index) => (
                            <motion.div
                                key={tier.tier}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`relative group ${channel.userTier === tier.tier ? 'ring-2 ring-purple-500' : ''}`}
                            >
                                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-purple-400/60 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
                                    {/* Popular Badge for Middle Tier */}
                                    {index === 1 && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none">
                                                {isArabic ? 'الأكثر شعبية' : 'Most Popular'}
                                            </Badge>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h3 className="text-2xl font-bold text-white mb-2">{tier.tier}</h3>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                                {tier.price}
                                            </span>
                                            <span className="text-gray-400">
                                                {isArabic ? 'ج.م / شهر' : 'EGP / month'}
                                            </span>
                                        </div>
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {tier.benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-300 text-sm">{benefit}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {channel.isSubscribed && channel.userTier === tier.tier ? (
                                        <Button 
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                            disabled
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            {isArabic ? 'مشترك حالياً' : 'Current Plan'}
                                        </Button>
                                    ) : channel.isSubscribed ? (
                                        // User is subscribed but to a different tier
                                        (() => {
                                            const tierOrder = ['BRONZE', 'SILVER', 'GOLD']
                                            const currentTierIndex = tierOrder.indexOf(channel.userTier || '')
                                            const thisTierIndex = tierOrder.indexOf(tier.tier)
                                            const isUpgrade = thisTierIndex > currentTierIndex
                                            
                                            return (
                                                <Button 
                                                    className={`w-full ${
                                                        isUpgrade 
                                                            ? `bg-gradient-to-r ${getTierColor(tier.tier)} hover:opacity-90`
                                                            : 'bg-gray-600 hover:bg-gray-700 cursor-not-allowed'
                                                    } text-white`}
                                                    onClick={() => isUpgrade && handleSubscribe(tier.tier)}
                                                    disabled={subscribing || !isUpgrade}
                                                >
                                                    {subscribing ? (
                                                        isArabic ? 'جاري الاشتراك...' : 'Subscribing...'
                                                    ) : isUpgrade ? (
                                                        isArabic ? 'ترقية الخطة' : 'Upgrade Plan'
                                                    ) : (
                                                        isArabic ? 'خطة أقل' : 'Lower Tier'
                                                    )}
                                                </Button>
                                            )
                                        })()
                                    ) : (
                                        <Button 
                                            className={`w-full bg-gradient-to-r ${getTierColor(tier.tier)} hover:opacity-90 text-white`}
                                            onClick={() => handleSubscribe(tier.tier)}
                                            disabled={subscribing}
                                        >
                                            {subscribing ? (
                                                isArabic ? 'جاري الاشتراك...' : 'Subscribing...'
                                            ) : (
                                                isArabic ? 'اشترك الآن' : 'Subscribe Now'
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Content Feed */}
                {channel.isSubscribed ? (
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            {isArabic ? 'المحتوى الحصري' : 'Exclusive Content'}
                        </h2>

                        {channel.recentPosts && channel.recentPosts.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {channel.recentPosts.map((post) => (
                                    <Card key={post.id} className="bg-gray-800/60 backdrop-blur-sm border-gray-700/50 hover:border-purple-400/60 transition-all">
                                        <CardContent className="p-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                                    {getPostIcon(post.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-xl font-bold text-white">{post.title}</h3>
                                                        <Badge className={getTierBadgeColor(post.requiresTier)}>
                                                            {post.requiresTier}+
                                                        </Badge>
                                                    </div>
                                                    {post.content && (
                                                        <p className="text-gray-300 mb-3">{post.content}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {new Date(post.createdAt).toLocaleDateString(locale)}
                                                        </span>
                                                        <Badge variant="outline" className="text-gray-400">
                                                            {post.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                <p className="text-gray-300 text-lg">
                                    {isArabic ? 'لا يوجد محتوى حصري حتى الآن' : 'No exclusive content yet'}
                                </p>
                                <p className="text-gray-500 text-sm mt-2">
                                    {isArabic ? 'ترقب المنشورات القادمة!' : 'Stay tuned for upcoming posts!'}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-2xl"></div>
                            <div className="relative bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-full p-8">
                                <Play className="w-16 h-16 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">
                            {isArabic ? 'افتح المحتوى الحصري' : 'Unlock Exclusive Content'}
                        </h3>
                        <p className="text-gray-300 mb-6 max-w-md mx-auto">
                            {isArabic 
                                ? 'اشترك في أي خطة للوصول إلى دروس حصرية، جلسات مباشرة، موارد، والمزيد!'
                                : 'Subscribe to any plan to access exclusive lessons, live sessions, resources, and more!'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
