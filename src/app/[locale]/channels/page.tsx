'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
    CheckCircle,
    Users,
    Star,
    TrendingUp,
    ArrowRight,
    Search,
    Filter,
    Calendar,
    MessageCircle,
    Video
} from 'lucide-react'
import toast from 'react-hot-toast'

interface CreatorChannel {
    id: string
    name: string
    nameAr?: string
    description: string
    descriptionAr?: string
    coverImage?: string
    totalSubscribers: number
    tiers: ChannelTier[]
    creator: {
        id: string
        user: {
            name: string
            arabicName?: string
            profileImage?: string
        }
    }
}

interface ChannelTier {
    tier: string
    price: number
    benefits: string[]
}

export default function CreatorChannelsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string || 'en'
    const isArabic = locale === 'ar'

    const [channels, setChannels] = useState<CreatorChannel[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'coaching' | 'content'>('all')
    const [selectedTiers, setSelectedTiers] = useState<Record<string, string>>({})
    const [userSubscribedChannels, setUserSubscribedChannels] = useState<string[]>([])

    // Helper function to check if channel has coaching tier
    const hasCoachingTier = (channel: CreatorChannel) => {
        return channel.tiers.some(tier => 
            tier.tier.toLowerCase() === 'coaching' || 
            tier.tier.toLowerCase() === 'vip'
        )
    }

    useEffect(() => {
        fetchChannels()
    }, [])

    const fetchChannels = async () => {
        try {
            const response = await fetch('/api/channels')
            if (response.ok) {
                const data = await response.json()
                const subscribedChannelIds = data.userSubscriptions || []
                setUserSubscribedChannels(subscribedChannelIds)
                
                // Filter out channels user is already subscribed to
                const availableChannels = (data.channels || []).filter(
                    (channel: CreatorChannel) => !subscribedChannelIds.includes(channel.id)
                )
                setChannels(availableChannels)
            } else {
                toast.error(isArabic ? 'فشل تحميل القنوات' : 'Failed to load channels')
            }
        } catch (error) {
            console.error('Failed to fetch channels:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (channelId: string, tier: string) => {
        if (!session) {
            router.push(`/${locale}/auth/login?callbackUrl=/${locale}/channels`)
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'CATEGORY_C',
                    channelId,
                    tier,
                    billingCycle: 'monthly'
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(
                    isArabic 
                        ? 'تم الاشتراك بنجاح! 🎉'
                        : 'Successfully subscribed! 🎉'
                )
                router.push(`/${locale}/dashboard/my-learning`)
            } else {
                toast.error(data.error || (isArabic ? 'فشل الاشتراك' : 'Subscription failed'))
            }
        } catch (error) {
            console.error('Subscription error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const filteredChannels = channels.filter(channel => {
        const searchLower = searchQuery.toLowerCase()
        return (
            channel.name.toLowerCase().includes(searchLower) ||
            channel.nameAr?.toLowerCase().includes(searchLower) ||
            channel.creator.user.name.toLowerCase().includes(searchLower)
        )
    })

    if (loading && channels.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            {/* Hero Section */}
            <section className="py-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-12">
                        <Badge className="mb-4 bg-purple-600/20 text-purple-300 border-purple-500/30">
                            {isArabic ? 'قنوات المبدعين' : 'Creator Channels'}
                        </Badge>
                        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            {isArabic ? 'تابع منشئي المحتوى المفضلين لديك' : 'Follow Your Favorite Creators'}
                        </h1>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            {isArabic 
                                ? 'احصل على محتوى حصري وجلسات مباشرة وتوجيه شخصي من الخبراء'
                                : 'Get exclusive content, live sessions, and personal mentorship from experts'
                            }
                        </p>
                    </div>

                    {/* Search */}
                    <div className="max-w-2xl mx-auto mb-12">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={isArabic ? 'ابحث عن القنوات...' : 'Search channels...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Channels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredChannels.map((channel) => (
                            <ChannelCard
                                key={channel.id}
                                channel={channel}
                                isArabic={isArabic}
                                selectedTier={selectedTiers[channel.id] || channel.tiers[0]?.tier}
                                onTierSelect={(tier) => setSelectedTiers({ ...selectedTiers, [channel.id]: tier })}
                                onSubscribe={handleSubscribe}
                                loading={loading}
                            />
                        ))}
                    </div>

                    {filteredChannels.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-gray-400 text-xl mb-4">
                                {searchQuery 
                                    ? (isArabic ? 'لم يتم العثور على قنوات' : 'No channels found')
                                    : (isArabic ? 'لا توجد قنوات متاحة للاشتراك' : 'No available channels to subscribe to')
                                }
                            </p>
                            {!searchQuery && userSubscribedChannels.length > 0 && (
                                <div>
                                    <p className="text-gray-500 text-sm mb-4">
                                        {isArabic 
                                            ? `أنت مشترك بالفعل في ${userSubscribedChannels.length} قناة` 
                                            : `You are already subscribed to ${userSubscribedChannels.length} channel${userSubscribedChannels.length > 1 ? 's' : ''}`
                                        }
                                    </p>
                                    <Button
                                        onClick={() => router.push(`/${locale}/dashboard/my-learning`)}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    >
                                        {isArabic ? 'عرض اشتراكاتي' : 'View My Subscriptions'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Call to Action Cards */}
                {filteredChannels.length > 0 && (
                    <div className="mt-20 max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                            {/* Book a Mentor CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="group relative bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-purple-900/40 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-8 hover:border-blue-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="relative z-10">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-white mb-3">
                                        {isArabic ? 'هل تحتاج توجيه شخصي؟' : 'Need Personalized Guidance?'}
                                    </h3>
                                    
                                    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                                        {isArabic 
                                            ? 'احجز جلسة فردية مع خبير للحصول على استشارة مباشرة ومساعدة فورية'
                                            : 'Book a 1-on-1 session with an expert mentor for direct consultation and immediate help'
                                        }
                                    </p>
                                    
                                    <Button
                                        onClick={() => router.push(`/${locale}/mentors`)}
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span>{isArabic ? 'تصفح الموجهين' : 'Browse Mentors'}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </Button>
                                </div>
                            </motion.div>

                            {/* Become a Creator CTA */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="group relative bg-gradient-to-br from-purple-900/40 via-pink-900/40 to-purple-900/40 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 hover:border-purple-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="relative z-10">
                                    <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-500/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                                        <Star className="w-7 h-7 text-purple-400" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold text-white mb-3">
                                        {isArabic ? 'تريد إنشاء قناتك؟' : 'Want to Start Your Channel?'}
                                    </h3>
                                    
                                    <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                                        {isArabic
                                            ? 'انضم كمنشئ محتوى وابدأ في مشاركة معرفتك مع آلاف المتعلمين'
                                            : 'Join as a creator and start sharing your expertise with thousands of learners'
                                        }
                                    </p>
                                    
                                    <Button
                                        onClick={() => router.push(`/${locale}/creator/onboarding`)}
                                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all"
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <span>{isArabic ? 'ابدأ الآن' : 'Start Now'}</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

function ChannelCard({ 
    channel, 
    isArabic, 
    selectedTier,
    onTierSelect,
    onSubscribe,
    loading 
}: { 
    channel: CreatorChannel
    isArabic: boolean
    selectedTier: string
    onTierSelect: (tier: string) => void
    onSubscribe: (channelId: string, tier: string) => void
    loading: boolean
}) {
    const currentTier = channel.tiers.find(t => t.tier === selectedTier) || channel.tiers[0]

    return (
        <div className="bg-gray-900/60 backdrop-blur-xl border-2 border-gray-700/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-br from-purple-600 to-blue-600">
                {channel.coverImage && (
                    <Image
                        src={channel.coverImage}
                        alt={channel.name}
                        fill
                        className="object-cover"
                    />
                )}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white">{channel.totalSubscribers.toLocaleString()}</span>
                </div>
            </div>

            {/* Creator Info */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                    {channel.creator.user.profileImage && (
                        <Image
                            src={channel.creator.user.profileImage}
                            alt={channel.creator.user.name}
                            width={40}
                            height={40}
                            className="rounded-full"
                        />
                    )}
                    <div>
                        <h3 className="font-bold text-lg">
                            {isArabic ? (channel.nameAr || channel.name) : channel.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {isArabic ? (channel.creator.user.arabicName || channel.creator.user.name) : channel.creator.user.name}
                        </p>
                    </div>
                </div>

                <p className="text-gray-300 text-sm mb-6 line-clamp-2">
                    {isArabic ? (channel.descriptionAr || channel.description) : channel.description}
                </p>

                {/* Tier Selection */}
                <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-2 block">
                        {isArabic ? 'اختر المستوى:' : 'Select Tier:'}
                    </label>
                    <select
                        value={selectedTier}
                        onChange={(e) => onTierSelect(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    >
                        {channel.tiers.map((tier) => (
                            <option key={tier.tier} value={tier.tier}>
                                {tier.tier} - €{tier.price}{isArabic ? '/شهر' : '/mo'}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Benefits */}
                {currentTier && (
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">
                            {isArabic ? 'المزايا:' : 'Benefits:'}
                        </h4>
                        <ul className="space-y-2">
                            {currentTier.benefits.slice(0, 3).map((benefit, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span>{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Price & CTA */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-3xl font-bold text-purple-400">
                            €{currentTier?.price}
                        </div>
                        <div className="text-sm text-gray-400">
                            {isArabic ? 'شهرياً' : 'per month'}
                        </div>
                    </div>
                </div>

                <Button
                    onClick={() => onSubscribe(channel.id, selectedTier)}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-lg transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50"
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            {isArabic ? 'جاري...' : 'Processing...'}
                        </div>
                    ) : (
                        <>
                            {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
