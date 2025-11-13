'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
    Star,
    Users,
    ArrowLeft,
    Calendar,
    Award,
    CheckCircle,
    Play,
    Video,
    MessageCircle,
    BookOpen,
    Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import ChannelTierSelector from '@/components/subscriptions/ChannelTierSelector'

interface CreatorData {
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
    stats: {
        totalFollowers: number
        totalCourses: number
        averageRating: number
        yearsOfExperience: number
    }
    channels?: {
        id: string
        name: string
    }[]
}

interface SubscriptionData {
    tier: string
    status: string
    meetingCredits?: number
    nextBillingDate?: string
}

export default function MentorProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const mentorId = params.id as string
    const locale = (params.locale as string) || 'en'
    const isArabic = locale === 'ar'

    const [creator, setCreator] = useState<CreatorData | null>(null)
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
    const [loading, setLoading] = useState(true)
    const [subscribing, setSubscribing] = useState(false)
    const [showBookingModal, setShowBookingModal] = useState(false)

    useEffect(() => {
        fetchCreatorData()
    }, [mentorId])

    const fetchCreatorData = async () => {
        try {
            const response = await fetch(`/api/mentors/${mentorId}`)
            if (response.ok) {
                const data = await response.json()
                setCreator(data)
                
                // Check if user has active subscription
                if (session) {
                    const subResponse = await fetch(`/api/subscriptions/mentor/${mentorId}`)
                    if (subResponse.ok) {
                        const subData = await subResponse.json()
                        setSubscription(subData)
                    }
                }
            } else {
                toast.error(isArabic ? 'فشل في تحميل الملف الشخصي' : 'Failed to load profile')
            }
        } catch (error) {
            console.error('Error fetching creator:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleSubscribe = async (tier: string, billingCycle: 'monthly' | 'yearly') => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول أولاً' : 'Please login first')
            router.push(`/${locale}/login`)
            return
        }

        setSubscribing(true)
        try {
            // Create channel subscription instead of mentor subscription
            const channelId = creator?.channels?.[0]?.id
            
            const response = await fetch('/api/subscriptions/channel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channelId: channelId || `creator-${mentorId}`, // Fallback to creator-based ID
                    tier,
                    billingCycle
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(isArabic ? 'تم الاشتراك بنجاح!' : 'Subscribed successfully!')
                setSubscription({ tier, status: 'ACTIVE', meetingCredits: tier === 'Coaching' ? 2 : 0 })
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل الاشتراك' : 'Subscription failed'))
            }
        } catch (error) {
            console.error('Subscription error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSubscribing(false)
        }
    }

    const handleBookSession = () => {
        if (!subscription || subscription.tier !== 'Coaching') {
            toast.error(isArabic ? 'يجب الاشتراك في خطة التدريب أولاً' : 'Please subscribe to Coaching plan first')
            return
        }

        if ((subscription.meetingCredits || 0) <= 0) {
            toast.error(isArabic ? 'ليس لديك جلسات متبقية هذا الشهر' : 'No sessions remaining this month')
            return
        }

        setShowBookingModal(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (!creator) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {isArabic ? 'الملف الشخصي غير موجود' : 'Profile Not Found'}
                    </h2>
                    <Button onClick={() => router.push(`/${locale}/mentors`)}>
                        {isArabic ? 'العودة' : 'Go Back'}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Back Button */}
            <div className="container mx-auto px-6 py-6">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/${locale}/mentors`)}
                    className="text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {isArabic ? 'رجوع' : 'Back'}
                </Button>
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-purple-900/20 via-black to-black">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(168,85,247,0.1),transparent)]" />
                </div>

                <div className="container mx-auto px-6 py-12 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left: Creator Info */}
                        <div className="lg:col-span-2">
                            <div className="flex items-start gap-6">
                                {/* Profile Image */}
                                <div className="relative">
                                    <div className="w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-purple-500/30">
                                        {creator.user.profileImage ? (
                                            <Image
                                                src={creator.user.profileImage}
                                                alt={creator.user.name}
                                                width={128}
                                                height={128}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-4xl font-black">
                                                {creator.user.name[0]}
                                            </div>
                                        )}
                                    </div>
                                    {subscription?.status === 'ACTIVE' && (
                                        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 ring-4 ring-black">
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h1 className="text-4xl font-black text-white mb-2">
                                                {isArabic ? creator.user.arabicName : creator.user.name}
                                            </h1>
                                            <p className="text-lg text-purple-400 font-semibold">
                                                {creator.expertise}
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-gray-300 leading-relaxed mb-6 max-w-2xl">
                                        {creator.user.bio || (isArabic ? 'لا يوجد وصف متاح' : 'No bio available')}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center gap-6 flex-wrap">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-purple-500/20 rounded-full p-2">
                                                <Users className="w-4 h-4 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white">{creator.totalSubscribers}</div>
                                                <div className="text-xs text-gray-400">{isArabic ? 'مشترك' : 'Subscribers'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="bg-yellow-500/20 rounded-full p-2">
                                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white">{creator.stats.averageRating.toFixed(1)}</div>
                                                <div className="text-xs text-gray-400">{isArabic ? 'تقييم' : 'Rating'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="bg-blue-500/20 rounded-full p-2">
                                                <BookOpen className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white">{creator.stats.totalCourses}</div>
                                                <div className="text-xs text-gray-400">{isArabic ? 'دورة' : 'Courses'}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="bg-green-500/20 rounded-full p-2">
                                                <Award className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white">{creator.stats.yearsOfExperience}+</div>
                                                <div className="text-xs text-gray-400">{isArabic ? 'سنوات خبرة' : 'Years Exp'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Subscription Status Card */}
                        {subscription?.status === 'ACTIVE' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-green-500/20 rounded-full p-3">
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white">{isArabic ? 'مشترك نشط' : 'Active Subscriber'}</h3>
                                        <p className="text-sm text-green-300">{subscription.tier} {isArabic ? 'خطة' : 'Plan'}</p>
                                    </div>
                                </div>

                                {subscription.tier === 'Coaching' && (
                                    <>
                                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-gray-300">{isArabic ? 'الجلسات المتبقية' : 'Sessions Remaining'}</span>
                                                <span className="text-2xl font-bold text-purple-400">{subscription.meetingCredits || 0}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">{isArabic ? 'هذا الشهر' : 'This month'}</p>
                                        </div>

                                        <Button
                                            onClick={handleBookSession}
                                            disabled={(subscription.meetingCredits || 0) <= 0}
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-purple-500/30"
                                        >
                                            <Calendar className="w-5 h-5 mr-2" />
                                            {isArabic ? 'حجز جلسة' : 'Book Session'}
                                        </Button>
                                    </>
                                )}

                                <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                                    {isArabic ? 'التجديد القادم' : 'Next Billing'}: {subscription.nextBillingDate || 'N/A'}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* Information Banner */}
            <div className="bg-purple-900/20 border-y border-purple-500/30 py-4">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-center gap-3 text-center">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <p className="text-purple-200 font-semibold">
                            {isArabic 
                                ? '💡 احصل على تدريب شخصي من خلال الاشتراك في خطة التدريب'
                                : '💡 Get personalized 1-on-1 coaching by subscribing to the Coaching plan'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Tier Selector */}
            <div className="container mx-auto px-6">
                <ChannelTierSelector
                    channelId={creator.channels?.[0]?.id || `creator-${mentorId}`}
                    channelName={isArabic ? creator.user.arabicName : creator.user.name}
                    isSubscribed={subscription?.status === 'ACTIVE'}
                    currentTier={subscription?.tier}
                    onSubscribe={handleSubscribe}
                    loading={subscribing}
                    locale={locale}
                />
            </div>

            {/* Booking Modal (placeholder) */}
            {showBookingModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 rounded-2xl p-8 max-w-2xl w-full border border-purple-500/30"
                    >
                        <h3 className="text-2xl font-bold text-white mb-4">
                            {isArabic ? 'حجز جلسة 1-على-1' : 'Book 1-on-1 Session'}
                        </h3>
                        <p className="text-gray-300 mb-6">
                            {isArabic 
                                ? 'اختر الوقت المناسب لجلستك مع ' + (creator.user.arabicName || creator.user.name)
                                : `Choose a time for your session with ${creator.user.name}`
                            }
                        </p>

                        {/* Placeholder for calendar integration */}
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-12 text-center mb-6">
                            <Calendar className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                            <p className="text-gray-400">{isArabic ? 'التقويم قيد التطوير' : 'Calendar integration coming soon'}</p>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                onClick={() => setShowBookingModal(false)}
                                variant="outline"
                                className="flex-1"
                            >
                                {isArabic ? 'إلغاء' : 'Cancel'}
                            </Button>
                            <Button
                                onClick={() => {
                                    toast.success(isArabic ? 'تم حجز الجلسة!' : 'Session booked!')
                                    setShowBookingModal(false)
                                }}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600"
                            >
                                {isArabic ? 'تأكيد الحجز' : 'Confirm Booking'}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
