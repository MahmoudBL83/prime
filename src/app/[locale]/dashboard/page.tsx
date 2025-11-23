'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslations, useLocale } from 'next-intl'
import { 
    BookOpen, 
    Calendar, 
    Users, 
    TrendingUp, 
    Award, 
    Clock,
    ChevronRight,
    Star,
    Play,
    MessageSquare,
    Settings,
    BarChart3,
    Target,
    Zap,
    BookmarkPlus,
    Bookmark,
    ThumbsUp,
    Heart,
    CheckCircle,
    Crown,
    Trophy,
    AlertCircle,
    XCircle,
    Plus
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useNavigationLoading } from '@/hooks/useNavigationLoading'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface UserProfile {
    id: string
    name: string
    email: string
    arabicName?: string
    phone?: string
    interests?: string[]
    goals?: string[]
    skillLevel?: string
    learningMode?: string
    onboardingCompleted?: boolean
    role: string
    subscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
}

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    thumbnail?: string
    creatorId: string
    category: string
    skillLevel: string
    duration: number
    totalViews: number
    totalEnrollments: number
    rating: number
    creator: {
        user: {
            name: string
            arabicName?: string
        }
    }
}

interface LearningStats {
    totalCourses: number
    completedCourses: number
    inProgressCourses: number
    averageProgress: number
    totalLearningHours: number
    averageRating: number
    upcomingMeetingsCount: number
    totalMeetingsCount: number
    unreadMessagesCount: number
    studyBuddyMatches: number
    upcomingSessionsCount?: number
    learningStreak?: {
        current: number
        longest: number
        lastActivity: string | null
    }
    studyBuddies?: Array<{
        id: string
        userId: string
        name: string
        arabicName?: string
        profileImage?: string
        sharedSubjects: string[]
        sharedGoals: string[]
        createdAt: string
    }>
    upcomingSessions?: Array<{
        id: string
        title: string
        scheduledAt: string
        duration: number
        status: string
        studyTopics: string[]
        partner: {
            id: string
            name: string
            arabicName?: string
            profileImage?: string
        }
    }>
    achievements?: Array<{
        id: string
        name: string
        nameAr: string
        description: string
        descriptionAr: string
        icon: string
        color: string
        unlockedAt: string
    }>
    continueLearning: {
        id: string
        title: string
        titleAr: string
        progress: number
        lastAccessed: string
        thumbnail?: string
        instructor: {
            name: string
            arabicName?: string
        }
    }[]
    recentActivities?: {
        type: string
        title: string
        titleAr: string
        description: string
        descriptionAr: string
        timestamp: string
        icon: string
        thumbnail?: string
    }[]
}

type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type TicketCategory = 'BILLING' | 'TECHNICAL' | 'CONTENT' | 'SAFETY' | 'OTHER'

interface SupportTicket {
    id: string
    subject: string
    status: TicketStatus
    priority: TicketPriority
    category: TicketCategory
    createdAt: string
    updatedAt: string
    _count: {
        messages: number
    }
}

function DashboardContent() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    const locale = useLocale()
    const t = useTranslations('dashboard')
    const tCommon = useTranslations('common')
    const { navigateWithLoading, isLoading } = useNavigationLoading()
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [learningStats, setLearningStats] = useState<LearningStats | null>(null)
    const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isClient, setIsClient] = useState(false)
    const [activeTab, setActiveTab] = useState<string>('overview')
    const [myListCourses, setMyListCourses] = useState<Course[]>([])
    const [likedCourses, setLikedCourses] = useState<Course[]>([])
    const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
    const [tabLoading, setTabLoading] = useState(false)

    // Direction based on locale
    const dir = locale === 'ar' ? 'rtl' : 'ltr'
    const isArabic = locale === 'ar'

    // Handle client-side mounting
    useEffect(() => {
        setIsClient(true)
    }, [])

    // Handle tab from URL query
    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab && ['overview', 'my-list', 'liked'].includes(tab)) {
            setActiveTab(tab)
        }
    }, [searchParams])

    // Fetch tab-specific data
    useEffect(() => {
        if (!session || !isClient) return

        const fetchTabData = async () => {
            setTabLoading(true)
            try {
                if (activeTab === 'my-list' && myListCourses.length === 0) {
                    const response = await fetch('/api/user/my-list')
                    if (response.ok) {
                        const data = await response.json()
                        setMyListCourses(data.courses)
                    }
                } else if (activeTab === 'liked' && likedCourses.length === 0) {
                    const response = await fetch('/api/user/liked-courses')
                    if (response.ok) {
                        const data = await response.json()
                        setLikedCourses(data.courses)
                    }
                } else if (activeTab === 'support' && supportTickets.length === 0) {
                    const response = await fetch('/api/support/tickets')
                    if (response.ok) {
                        const data = await response.json()
                        setSupportTickets(data.tickets || [])
                    }
                }
            } catch (error) {
                console.error('Error fetching tab data:', error)
            } finally {
                setTabLoading(false)
            }
        }

        fetchTabData()
    }, [activeTab, session, isClient])

    useEffect(() => {
        if (!isClient || status === 'loading') return
        if (!session) {
            router.push(`/${locale}/auth/login`)
            return
        }

        const checkOnboarding = async () => {
            try {
                const [profileResponse, statsResponse] = await Promise.all([
                    fetch('/api/user/profile'),
                    fetch('/api/dashboard/stats')
                ])
                
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json()
                    setUserProfile(profileData.user)

                    // Admin users don't need onboarding - redirect to admin panel
                    if (profileData.user.role === 'ADMIN') {
                        window.location.href = '/admin'
                        return
                    }

                    // Check if user has completed onboarding
                    if (!profileData.user.onboardingCompleted) {
                        navigateWithLoading(`/${locale}/onboarding`, 'onboarding-redirect')
                        return
                    }

                    // Fetch recommended courses based on user interests
                    if (profileData.user.interests) {
                        await fetchRecommendedCourses(profileData.user.interests)
                    }
                } else {
                    navigateWithLoading(`/${locale}/onboarding`, 'onboarding-redirect')
                    return
                }

                if (statsResponse.ok) {
                    const statsData = await statsResponse.json()
                    setLearningStats(statsData.stats)
                }
            } catch (error) {
                console.error('Error checking profile:', error)
                navigateWithLoading(`/${locale}/onboarding`, 'onboarding-redirect')
            } finally {
                setLoading(false)
            }
        }

        checkOnboarding()
    }, [session, status, router, isClient, locale])

    const fetchRecommendedCourses = async (interests: string[]) => {
        try {
            const response = await fetch('/api/courses')
            if (response.ok) {
                const data = await response.json()
                const interestsArray = Array.isArray(interests) ? interests : []
                const recommended = data.courses.filter((course: Course) => {
                    return interestsArray.some(interest =>
                        course.title.toLowerCase().includes(interest.toLowerCase()) ||
                        course.description.toLowerCase().includes(interest.toLowerCase())
                    )
                }).slice(0, 6)
                setRecommendedCourses(recommended)
            }
        } catch (error) {
            console.error('Error fetching courses:', error)
        }
    }

    const handleStudyBuddyClick = () => {
        navigateWithLoading(`/${locale}/study-buddy`, 'study-buddy')
    }

    const handleCourseClick = (courseId: string) => {
        navigateWithLoading(`/${locale}/courses/${courseId}`, `course-${courseId}`)
    }

    // Show loading during hydration or data fetching
    if (!isClient || status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        {/* Decorative loading elements */}
                        <div className="absolute inset-0 w-16 h-16 border-4 border-white/10 rounded-full animate-ping"></div>
                        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
                    </div>
                    <p className="text-white text-lg font-medium">Loading your dashboard...</p>
                    <p className="text-white/60 text-sm mt-2">Preparing your personalized experience</p>
                </div>
            </div>
        )
    }

    // Handle unauthenticated state
    if (!session) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-lg">Redirecting to login...</div>
            </div>
        )
    }

    // Handle missing profile
    if (!userProfile) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-lg">Setting up your profile...</div>
            </div>
        )
    }

    const displayName = isArabic ? (userProfile.arabicName || userProfile.name) : userProfile.name
    const welcomeText = isArabic ? `مرحباً، ${displayName}` : `Welcome back, ${displayName}`

    return (
        <div className="min-h-screen bg-black" dir={dir}>
            {/* Header */}
            <div className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative bg-black/40 backdrop-blur-sm py-16 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <div className="flex flex-wrap items-center gap-3 mb-6">
                                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-3">
                                    <Award className="w-5 h-5 text-white" />
                                    <span className="text-white font-medium">
                                        {isArabic ? 'تجربة تعليمية متميزة' : 'Premium Learning Experience'}
                                    </span>
                                </div>
                                
                                {/* Subscription Status Badge */}
                                {userProfile.subscriptionStatus && (
                                    <div className={`inline-flex items-center gap-2 backdrop-blur-sm border rounded-full px-6 py-3 ${
                                        userProfile.subscriptionStatus === 'ACTIVE' 
                                            ? 'bg-green-500/20 border-green-500/30' 
                                            : userProfile.subscriptionStatus === 'EXPIRED'
                                            ? 'bg-orange-500/20 border-orange-500/30'
                                            : userProfile.subscriptionStatus === 'CANCELLED'
                                            ? 'bg-red-500/20 border-red-500/30'
                                            : 'bg-white/10 border-white/20'
                                    }`}>
                                        <Crown className={`w-5 h-5 ${
                                            userProfile.subscriptionStatus === 'ACTIVE' 
                                                ? 'text-green-400' 
                                                : userProfile.subscriptionStatus === 'EXPIRED'
                                                ? 'text-orange-400'
                                                : userProfile.subscriptionStatus === 'CANCELLED'
                                                ? 'text-red-400'
                                                : 'text-white/60'
                                        }`} />
                                        <span className={`font-medium ${
                                            userProfile.subscriptionStatus === 'ACTIVE' 
                                                ? 'text-green-300' 
                                                : userProfile.subscriptionStatus === 'EXPIRED'
                                                ? 'text-orange-300'
                                                : userProfile.subscriptionStatus === 'CANCELLED'
                                                ? 'text-red-300'
                                                : 'text-white/70'
                                        }`}>
                                            {userProfile.subscriptionStatus === 'ACTIVE' 
                                                ? (isArabic ? 'اشتراك نشط' : 'Active Subscription')
                                                : userProfile.subscriptionStatus === 'EXPIRED'
                                                ? (isArabic ? 'اشتراك منتهي' : 'Subscription Expired')
                                                : userProfile.subscriptionStatus === 'CANCELLED'
                                                ? (isArabic ? 'اشتراك ملغي' : 'Subscription Cancelled')
                                                : (isArabic ? 'بدون اشتراك' : 'No Subscription')
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <h1 className="text-5xl lg:text-6xl font-semibold text-white mb-4 leading-tight">
                                {welcomeText}
                            </h1>
                            <p className="text-xl text-white/70 mb-8 leading-relaxed max-w-3xl">
                                {isArabic 
                                    ? 'جاهز لمواصلة رحلة التعلم؟ استكشف دوراتك وتابع تقدمك وتواصل مع مدربيك المفضلين' 
                                    : 'Ready to continue your learning journey? Explore your courses, track progress, and connect with your favorite instructors'
                                }
                            </p>
                            
                            {/* Enhanced Quick stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300">
                                    <div className="text-3xl lg:text-4xl font-semibold text-white mb-2">
                                        {learningStats?.totalCourses || 0}
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'الدورات' : 'Courses'}
                                    </div>
                                </div>
                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300">
                                    <div className="text-3xl lg:text-4xl font-semibold text-white mb-2">
                                        {learningStats?.averageRating || 4.8}
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'التقييم' : 'Rating'}
                                    </div>
                                </div>
                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300">
                                    <div className="text-3xl lg:text-4xl font-semibold text-white mb-2">
                                        {learningStats?.totalLearningHours || 0}h
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'ساعات التعلم' : 'Hours Learned'}
                                    </div>
                                </div>
                                <div className="text-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300">
                                    <div className="text-3xl lg:text-4xl font-semibold text-white mb-2">
                                        {learningStats?.averageProgress || 0}%
                                    </div>
                                    <div className="text-white/60 text-sm uppercase tracking-wider">
                                        {isArabic ? 'الإنجاز' : 'Completion'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-6 py-8">
                
                {/* Tab Content */}
                {activeTab === 'overview' && (
                <>
                {/* Quick Actions Grid - Simplified to 4 core actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* My Learning (Category A + B) */}
                    <div 
                        className="group relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-white/5 cursor-pointer" 
                        onClick={() => navigateWithLoading(`/${locale}/dashboard/my-learning`, 'my-learning')}
                    >
                        {/* Loading Overlay */}
                        {isLoading('my-learning') && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                                <div className="flex flex-col items-center gap-4 text-white">
                                    <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Loading courses...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                        
                        <div className="relative p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
                            </div>
                            <h3 className="font-semibold text-xl mb-3 text-white group-hover:text-white transition-colors">
                                {isArabic ? 'دوراتي' : 'My Learning'}
                            </h3>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed group-hover:text-white/80 transition-colors">
                                {isArabic 
                                    ? 'الوصول إلى جميع دوراتك المسجلة'
                                    : 'Access all your enrolled courses'
                                }
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors">
                                    {learningStats?.totalCourses || 0} {isArabic ? 'دورات' : 'courses'}
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"></div>
                    </div>

                    {/* My Meetings */}
                    <div 
                        className="group relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-white/5 cursor-pointer" 
                        onClick={() => navigateWithLoading(`/${locale}/dashboard/meetings`, 'meetings')}
                    >
                        {/* Loading Overlay */}
                        {isLoading('meetings') && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                                <div className="flex flex-col items-center gap-4 text-white">
                                    <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Loading meetings...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                        
                        <div className="relative p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Calendar className="w-7 h-7 text-white" />
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
                            </div>
                            <h3 className="font-semibold text-xl mb-3 text-white group-hover:text-white transition-colors">
                                {isArabic ? 'اجتماعاتي' : 'My Meetings'}
                            </h3>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed group-hover:text-white/80 transition-colors">
                                {isArabic 
                                    ? 'عرض وإدارة جلساتك المحجوزة مع المدربين'
                                    : 'View and manage your scheduled sessions'
                                }
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors">
                                    {learningStats?.upcomingMeetingsCount || 0} {isArabic ? 'قادمة' : 'upcoming'}
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"></div>
                    </div>

                    {/* Study Buddy */}
                    <div 
                        className="group relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-white/5 cursor-pointer" 
                        onClick={handleStudyBuddyClick}
                    >
                        {/* Loading Overlay */}
                        {isLoading('study-buddy') && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                                <div className="flex flex-col items-center gap-4 text-white">
                                    <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Finding study buddies...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Decorative Elements */}
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                        
                        <div className="relative p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-7 h-7 text-white" />
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
                            </div>
                            <h3 className="font-semibold text-xl mb-3 text-white group-hover:text-white transition-colors">
                                {isArabic ? 'رفيق الدراسة' : 'Study Buddy'}
                            </h3>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed group-hover:text-white/80 transition-colors">
                                {isArabic 
                                    ? 'ابحث عن شريك التعلم المثالي'
                                    : 'Find the perfect learning partner'
                                }
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-white/10 text-white border-white/20 hover:bg-white/20 transition-colors">
                                    {learningStats?.studyBuddyMatches || 0} {isArabic ? 'مطابقة' : 'matches'}
                                </Badge>
                            </div>
                        </div>
                        
                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"></div>
                    </div>

                    {/* My Progress */}
                    <div 
                        className="group relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-white/5 cursor-pointer" 
                        onClick={() => navigateWithLoading(`/${locale}/dashboard/progress`, 'progress')}
                    >
                        {/* Loading Overlay */}
                        {isLoading('progress') && (
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex items-center justify-center z-20">
                                <div className="flex flex-col items-center gap-4 text-white">
                                    <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium">Loading progress...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-2xl"></div>
                        
                        <div className="relative p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <TrendingUp className="w-7 h-7 text-white" />
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/40 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
                            </div>
                            <h3 className="font-semibold text-xl mb-3 text-white group-hover:text-white transition-colors">
                                {isArabic ? 'تقدمي' : 'My Progress'}
                            </h3>
                            <p className="text-white/60 text-sm mb-6 leading-relaxed group-hover:text-white/80 transition-colors">
                                {isArabic 
                                    ? 'تتبع تقدمك التعليمي وإنجازاتك'
                                    : 'Track your learning progress'
                                }
                            </p>
                            <div className="mb-2">
                                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                                    <div 
                                        className="bg-white/80 h-2 rounded-full transition-all duration-500" 
                                        style={{ width: `${learningStats?.averageProgress || 0}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-white/70 font-medium">
                                    {learningStats?.averageProgress || 0}% {isArabic ? 'مكتمل' : 'complete'}
                                </p>
                            </div>
                        </div>
                        
                        {/* Hover Effect Overlay */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl"></div>
                    </div>

                    
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Continue Learning & Recommended */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Continue Learning */}
                        <div className="relative bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-white/5">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex flex-row items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                            <Play className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-semibold text-white">
                                            {isArabic ? 'تابع التعلم' : 'Continue Learning'}
                                        </h2>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/20">
                                        {isArabic ? 'عرض الكل' : 'View all'}
                                    </Button>
                                </div>
                                
                                <div className="space-y-6">
                                    {learningStats?.continueLearning && learningStats.continueLearning.length > 0 ? (
                                        learningStats.continueLearning.map((course, index) => (
                                            <div 
                                                key={course.id} 
                                                className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 hover:border-purple-400/60 transition-all duration-300 cursor-pointer group"
                                                onClick={() => handleCourseClick(course.id)}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                                                        <BookOpen className="w-10 h-10 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg text-white mb-2 group-hover:text-purple-200 transition-colors">
                                                            {isArabic && course.titleAr ? course.titleAr : course.title}
                                                        </h4>
                                                        <p className="text-gray-400 text-sm mb-4 group-hover:text-gray-300 transition-colors">
                                                            {isArabic ? 'بواسطة' : 'by'} {(isArabic && course.instructor.arabicName) ? course.instructor.arabicName : course.instructor.name}
                                                        </p>
                                                        <div className="mb-3">
                                                            <div className="w-full bg-gray-700/50 rounded-full h-3 mb-2">
                                                                <div 
                                                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                                                                    style={{ width: `${course.progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <p className="text-xs text-blue-300 font-medium">{course.progress}% {isArabic ? 'مكتمل' : 'complete'}</p>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleCourseClick(course.id)
                                                        }}
                                                        disabled={isLoading(`course-${course.id}`)}
                                                    >
                                                        {isLoading(`course-${course.id}`) ? (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                                        ) : null}
                                                        {isArabic ? 'متابعة' : 'Continue'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-400 mb-4">
                                                {isArabic ? 'لا توجد دورات قيد التقدم حالياً' : 'No courses in progress'}
                                            </p>
                                            <Button 
                                                variant="outline" 
                                                className="border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400"
                                                onClick={() => navigateWithLoading(`/${locale}/courses`, 'browse-courses')}
                                                disabled={isLoading('browse-courses')}
                                            >
                                                {isLoading('browse-courses') && (
                                                    <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-400 rounded-full animate-spin mr-2"></div>
                                                )}
                                                {isArabic ? 'تصفح الدورات' : 'Browse Courses'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recommended Courses */}
                        {recommendedCourses.length > 0 && (
                            <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-yellow-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/20">
                                {/* Decorative Elements */}
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
                                
                                <div className="relative p-8">
                                    <div className="flex flex-row items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Zap className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white">
                                                {isArabic ? 'موصى به لك' : 'Recommended for You'}
                                            </h2>
                                        </div>
                                        <Button variant="ghost" size="sm" className="text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20" onClick={() => router.push(`/${locale}/courses`)}>
                                            {isArabic ? 'عرض الكل' : 'View all'}
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {recommendedCourses.slice(0, 4).map((course) => (
                                            <div 
                                                key={course.id}
                                                className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 hover:border-yellow-400/60 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer group"
                                                onClick={() => handleCourseClick(course.id)}
                                            >
                                                <div className="aspect-video bg-gray-700/50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-gray-600/50 transition-colors">
                                                    <Play className="w-10 h-10 text-gray-400 group-hover:text-yellow-400 transition-colors" />
                                                </div>
                                                <h4 className="font-bold text-white mb-2 group-hover:text-yellow-200 transition-colors">{course.title}</h4>
                                                <p className="text-gray-400 text-sm mb-3 group-hover:text-gray-300 transition-colors">
                                                    {isArabic ? 'بواسطة' : 'by'} {course.creator.user.arabicName || course.creator.user.name}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                        <span className="text-white font-medium">{course.rating.toFixed(1)}</span>
                                                    </div>
                                                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30 transition-colors">
                                                        {course.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Activity */}
                    <div className="space-y-8">

                        {/* Recent Activity */}
                        <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-green-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20">
                            {/* Decorative Elements */}
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-green-500/20 to-emerald-500/20 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Clock className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
                                    </h2>
                                </div>
                                
                                <div className="space-y-6">
                                    {learningStats?.recentActivities && learningStats.recentActivities.length > 0 ? (
                                        learningStats.recentActivities.map((activity, index) => {
                                            const IconComponent = activity.icon === 'book' ? BookOpen : 
                                                                activity.icon === 'users' ? Users : Award
                                            const gradientColors = activity.icon === 'book' ? 'from-blue-500 to-purple-600' :
                                                                   activity.icon === 'users' ? 'from-green-500 to-emerald-600' :
                                                                   'from-yellow-500 to-orange-600'
                                            const textColors = activity.icon === 'book' ? 'group-hover:text-blue-200' :
                                                              activity.icon === 'users' ? 'group-hover:text-green-200' :
                                                              'group-hover:text-yellow-200'
                                            
                                            const timeAgo = new Date(activity.timestamp).toLocaleDateString(
                                                isArabic ? 'ar' : 'en',
                                                { 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }
                                            )
                                            
                                            return (
                                                <div key={index} className="flex items-center gap-4 group">
                                                    <div className={`w-12 h-12 bg-gradient-to-br ${gradientColors} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                                        <IconComponent className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-white font-semibold ${textColors} transition-colors`}>
                                                            {isArabic ? activity.descriptionAr : activity.description}
                                                        </p>
                                                        <p className="text-gray-400 text-sm">
                                                            {timeAgo}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Clock className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p className="text-gray-400 text-sm">
                                                {isArabic ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Learning Streak Widget */}
                        {learningStats?.learningStreak && (
                            <div className="relative bg-gradient-to-br from-orange-800/60 to-red-900/60 backdrop-blur-sm rounded-3xl border border-orange-700/50 overflow-hidden hover:border-orange-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20">
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/30 to-red-500/30 rounded-full blur-3xl"></div>
                                
                                <div className="relative p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Zap className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white">
                                                {isArabic ? 'سلسلة التعلم' : 'Learning Streak'}
                                            </h2>
                                        </div>
                                        <div className="text-3xl">🔥</div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {/* Current Streak */}
                                        <div className="bg-gray-900/60 backdrop-blur-sm border border-orange-700/30 rounded-xl p-4">
                                            <p className="text-gray-400 text-sm mb-1">
                                                {isArabic ? 'السلسلة الحالية' : 'Current Streak'}
                                            </p>
                                            <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                                                {learningStats.learningStreak.current} {isArabic ? 'يوم' : 'days'}
                                            </p>
                                        </div>
                                        
                                        {/* Longest Streak */}
                                        <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-lg">
                                            <span className="text-gray-400 text-sm">
                                                {isArabic ? 'أطول سلسلة' : 'Longest Streak'}
                                            </span>
                                            <span className="text-orange-300 font-bold">
                                                {learningStats.learningStreak.longest} {isArabic ? 'يوم' : 'days'}
                                            </span>
                                        </div>
                                        
                                        {/* Last Activity */}
                                        {learningStats.learningStreak.lastActivity && (
                                            <div className="flex items-center justify-between p-3 bg-gray-900/40 rounded-lg">
                                                <span className="text-gray-400 text-sm">
                                                    {isArabic ? 'آخر نشاط' : 'Last Activity'}
                                                </span>
                                                <span className="text-gray-300 text-sm">
                                                    {new Date(learningStats.learningStreak.lastActivity).toLocaleDateString(
                                                        isArabic ? 'ar' : 'en',
                                                        { month: 'short', day: 'numeric' }
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Keep it going message */}
                                        {learningStats.learningStreak.current > 0 && (
                                            <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                                <p className="text-orange-300 text-sm text-center font-medium">
                                                    {isArabic 
                                                        ? '🎯 استمر! تعلم اليوم للحفاظ على سلسلتك' 
                                                        : '🎯 Keep it up! Learn today to maintain your streak'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Study Buddies Widget */}
                        {learningStats?.studyBuddies && learningStats.studyBuddies.length > 0 && (
                            <div className="relative bg-gradient-to-br from-blue-800/60 to-purple-900/60 backdrop-blur-sm rounded-3xl border border-blue-700/50 overflow-hidden hover:border-blue-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
                                {/* Decorative Elements */}
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                                
                                <div className="relative p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white">
                                                {isArabic ? 'رفاق الدراسة' : 'Study Buddies'}
                                            </h2>
                                        </div>
                                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                            {learningStats.studyBuddies.length}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {learningStats.studyBuddies.slice(0, 3).map((buddy) => (
                                            <div 
                                                key={buddy.id} 
                                                className="flex items-center gap-3 p-3 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:bg-gray-800/60 hover:border-blue-400/60 transition-all cursor-pointer group"
                                                onClick={() => navigateWithLoading(`/${locale}/study-buddy`, 'study-buddy-profile')}
                                            >
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                                                    {buddy.profileImage ? (
                                                        <img src={buddy.profileImage} alt={buddy.name} className="w-full h-full rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-white font-bold text-sm">
                                                            {(isArabic && buddy.arabicName ? buddy.arabicName : buddy.name).charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-semibold text-sm truncate group-hover:text-blue-200 transition-colors">
                                                        {isArabic && buddy.arabicName ? buddy.arabicName : buddy.name}
                                                    </p>
                                                    <p className="text-gray-400 text-xs truncate">
                                                        {Array.isArray(buddy.sharedSubjects) && buddy.sharedSubjects.length > 0 
                                                            ? buddy.sharedSubjects.slice(0, 2).join(', ')
                                                            : (isArabic ? 'مواضيع مشتركة' : 'Shared interests')}
                                                    </p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {learningStats.studyBuddies.length > 3 && (
                                        <Button 
                                            variant="ghost"
                                            className="w-full mt-4 text-blue-300 hover:text-blue-200 hover:bg-blue-500/20"
                                            onClick={() => navigateWithLoading(`/${locale}/study-buddy`, 'study-buddy-all')}
                                            disabled={isLoading('study-buddy-all')}
                                        >
                                            {isArabic ? `عرض الكل (${learningStats.studyBuddies.length})` : `View all (${learningStats.studyBuddies.length})`}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Study Sessions Widget */}
                        {learningStats?.upcomingSessions && learningStats.upcomingSessions.length > 0 && (
                            <div className="relative bg-gradient-to-br from-purple-800/60 to-pink-900/60 backdrop-blur-sm rounded-3xl border border-purple-700/50 overflow-hidden hover:border-purple-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20">
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
                                
                                <div className="relative p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Calendar className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white">
                                                {isArabic ? 'الجلسات القادمة' : 'Upcoming Sessions'}
                                            </h2>
                                        </div>
                                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                            {learningStats.upcomingSessions.length}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {learningStats.upcomingSessions.slice(0, 3).map((session) => {
                                            const sessionDate = new Date(session.scheduledAt)
                                            const isToday = sessionDate.toDateString() === new Date().toDateString()
                                            const timeUntil = Math.floor((sessionDate.getTime() - Date.now()) / (1000 * 60 * 60))
                                            
                                            return (
                                                <div 
                                                    key={session.id} 
                                                    className="p-4 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:bg-gray-800/60 hover:border-purple-400/60 transition-all group"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="text-white font-semibold text-sm group-hover:text-purple-200 transition-colors">
                                                            {session.title}
                                                        </h4>
                                                        {isToday && (
                                                            <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 text-xs">
                                                                {isArabic ? 'اليوم' : 'Today'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                            {session.partner.profileImage ? (
                                                                <img src={session.partner.profileImage} alt={session.partner.name} className="w-full h-full rounded-full object-cover" />
                                                            ) : (
                                                                <span className="text-white font-bold text-xs">
                                                                    {(isArabic && session.partner.arabicName ? session.partner.arabicName : session.partner.name).charAt(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-gray-400 text-xs">
                                                            {isArabic ? 'مع' : 'with'} {isArabic && session.partner.arabicName ? session.partner.arabicName : session.partner.name}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-gray-400 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {sessionDate.toLocaleTimeString(isArabic ? 'ar' : 'en', { 
                                                                    hour: '2-digit', 
                                                                    minute: '2-digit' 
                                                                })}
                                                            </span>
                                                            <span className="text-gray-400">
                                                                {session.duration} {isArabic ? 'د' : 'min'}
                                                            </span>
                                                        </div>
                                                        {timeUntil > 0 && timeUntil <= 24 && (
                                                            <span className="text-purple-300 font-medium">
                                                                {timeUntil}h {isArabic ? 'متبقي' : 'left'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {Array.isArray(session.studyTopics) && session.studyTopics.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {session.studyTopics.slice(0, 2).map((topic, idx) => (
                                                                <Badge key={idx} className="bg-purple-500/10 text-purple-300 border-purple-500/20 text-xs">
                                                                    {topic}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    
                                    <Button 
                                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                        onClick={() => navigateWithLoading(`/${locale}/study-buddy`, 'schedule-session')}
                                        disabled={isLoading('schedule-session')}
                                    >
                                        {isLoading('schedule-session') ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                        ) : (
                                            <Calendar className="w-5 h-5 mr-2" />
                                        )}
                                        {isArabic ? 'جدولة جلسة جديدة' : 'Schedule New Session'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Achievements Widget */}
                        {learningStats?.achievements && learningStats.achievements.length > 0 && (
                            <div className="relative bg-gradient-to-br from-yellow-800/60 to-orange-900/60 backdrop-blur-sm rounded-3xl border border-yellow-700/50 overflow-hidden hover:border-yellow-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/20">
                                {/* Decorative Elements */}
                                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
                                
                                <div className="relative p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                                <Award className="w-6 h-6 text-white" />
                                            </div>
                                            <h2 className="text-xl font-bold text-white">
                                                {isArabic ? 'الإنجازات' : 'Achievements'}
                                            </h2>
                                        </div>
                                        <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                                            {learningStats.achievements.length}
                                        </Badge>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        {learningStats.achievements.slice(0, 4).map((achievement) => (
                                            <div 
                                                key={achievement.id}
                                                className="p-3 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:bg-gray-800/60 hover:border-yellow-400/60 transition-all group cursor-pointer"
                                            >
                                                <div className="flex flex-col items-center text-center">
                                                    <div className="text-3xl mb-2 transform group-hover:scale-110 transition-transform">
                                                        {achievement.icon}
                                                    </div>
                                                    <h4 className="text-white font-semibold text-xs mb-1 group-hover:text-yellow-200 transition-colors">
                                                        {isArabic && achievement.nameAr ? achievement.nameAr : achievement.name}
                                                    </h4>
                                                    <p className="text-gray-400 text-[10px] line-clamp-2">
                                                        {isArabic && achievement.descriptionAr ? achievement.descriptionAr : achievement.description}
                                                    </p>
                                                    <p className="text-yellow-400 text-[10px] mt-1">
                                                        {new Date(achievement.unlockedAt).toLocaleDateString(
                                                            isArabic ? 'ar' : 'en',
                                                            { month: 'short', day: 'numeric' }
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {learningStats.achievements.length > 4 && (
                                        <Button 
                                            variant="ghost"
                                            className="w-full mt-4 text-yellow-300 hover:text-yellow-200 hover:bg-yellow-500/20"
                                            onClick={() => toast.success(isArabic ? 'قريباً!' : 'Coming soon!')}
                                        >
                                            {isArabic ? `عرض الكل (${learningStats.achievements.length})` : `View all (${learningStats.achievements.length})`}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Upcoming Live Events */}
                        <div className="relative bg-gradient-to-br from-indigo-800/60 to-purple-900/60 backdrop-blur-sm rounded-3xl border border-indigo-700/50 overflow-hidden hover:border-indigo-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <Play className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">
                                            {isArabic ? 'الفعاليات المباشرة' : 'Upcoming Live Events'}
                                        </h2>
                                    </div>
                                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                                        {isArabic ? 'قريباً' : 'Live'}
                                    </Badge>
                                </div>
                                
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Play className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <p className="text-gray-300 mb-2 font-medium">
                                        {isArabic ? 'لا توجد فعاليات مباشرة قادمة' : 'No upcoming live events'}
                                    </p>
                                    <p className="text-gray-400 text-sm mb-4">
                                        {isArabic 
                                            ? 'اشترك في قنوات المبدعين للوصول إلى جلساتهم المباشرة'
                                            : 'Subscribe to creator channels to access their live sessions'}
                                    </p>
                                    <Button 
                                        variant="outline"
                                        className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-400"
                                        onClick={() => navigateWithLoading(`/${locale}/mentors`, 'browse-creators')}
                                        disabled={isLoading('browse-creators')}
                                    >
                                        {isLoading('browse-creators') && (
                                            <div className="w-4 h-4 border-2 border-indigo-300/30 border-t-indigo-400 rounded-full animate-spin mr-2"></div>
                                        )}
                                        {isArabic ? 'تصفح المبدعين' : 'Browse Creators'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Rewards & Scholarships */}
                        <div className="relative bg-gradient-to-br from-amber-800/60 to-yellow-900/60 backdrop-blur-sm rounded-3xl border border-amber-700/50 overflow-hidden hover:border-amber-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20">
                            {/* Decorative Elements */}
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-500/20 to-yellow-500/20 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <Trophy className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-xl font-bold text-white">
                                            {isArabic ? 'المكافآت والمنح' : 'Rewards & Scholarships'}
                                        </h2>
                                    </div>
                                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                                        {isArabic ? 'جديد' : 'New'}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Active Contests Placeholder */}
                                    <div className="p-4 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg flex items-center justify-center">
                                                    <Trophy className="w-5 h-5 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-semibold text-sm mb-1">
                                                        {isArabic ? 'مسابقة الدورة الشهرية' : 'Monthly Course Challenge'}
                                                    </h4>
                                                    <p className="text-gray-400 text-xs">
                                                        {isArabic ? 'أكمل 3 دورات للفوز' : 'Complete 3 courses to win'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                                                {isArabic ? 'نشط' : 'Active'}
                                            </Badge>
                                        </div>
                                        <div className="mb-2">
                                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                <span>{isArabic ? 'التقدم' : 'Progress'}</span>
                                                <span>1/3</span>
                                            </div>
                                            <div className="w-full bg-gray-700/50 rounded-full h-2">
                                                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full" style={{ width: '33%' }}></div>
                                            </div>
                                        </div>
                                        <p className="text-amber-300 text-xs font-medium">
                                            💰 {isArabic ? 'الجائزة: 1,000 ج.م' : 'Prize: 1,000 EGP'}
                                        </p>
                                    </div>

                                    {/* Leaderboard Preview */}
                                    <div className="p-4 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                                        <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-amber-400" />
                                            {isArabic ? 'المتصدرون' : 'Top Learners'}
                                        </h4>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map((rank) => (
                                                <div key={rank} className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                                                            rank === 1 ? 'bg-yellow-500/20 text-yellow-400' :
                                                            rank === 2 ? 'bg-gray-400/20 text-gray-300' :
                                                            'bg-amber-700/20 text-amber-400'
                                                        }`}>
                                                            {rank}
                                                        </span>
                                                        <span className="text-gray-300">
                                                            {isArabic ? 'متعلم' : 'Learner'} {rank}
                                                        </span>
                                                    </div>
                                                    <span className="text-amber-400 font-medium">
                                                        {95 - (rank - 1) * 5}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button 
                                        className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                        onClick={() => toast.success(isArabic ? 'صفحة المكافآت قريباً!' : 'Rewards page coming soon!')}
                                    >
                                        <Trophy className="w-5 h-5 mr-2" />
                                        {isArabic ? 'عرض جميع المكافآت' : 'View All Rewards'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Learning Goals */}
                        <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-yellow-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/20">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Target className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">
                                        {isArabic ? 'أهدافك' : 'Your Goals'}
                                    </h2>
                                </div>
                                
                                <div className="space-y-3">
                                    {userProfile.goals && userProfile.goals.length > 0 ? (
                                        userProfile.goals.map((goal, index) => (
                                            <div key={index} className="flex items-center gap-3 p-3 bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-xl">
                                                <CheckCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                                <span className="text-gray-300 text-sm">{goal}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <Target className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                            <p className="text-gray-400 text-sm">
                                                {isArabic ? 'لم تحدد أهداف بعد' : 'No goals set yet'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                
                                <Button 
                                    className="w-full mt-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                                    onClick={() => navigateWithLoading(`/${locale}/profile?tab=overview`, 'profile-goals')}
                                    disabled={isLoading('profile-goals')}
                                >
                                    {isLoading('profile-goals') ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    ) : (
                                        <Settings className="w-5 h-5 mr-2" />
                                    )}
                                    {isArabic ? 'تحديث الأهداف' : 'Update Goals'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                </>
                )}

                {/* My List Tab */}
                {activeTab === 'my-list' && (
                    <div className="space-y-8">
                        <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-blue-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Bookmark className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {isArabic ? 'قائمتي' : 'My List'}
                                        </h2>
                                        <p className="text-gray-400 text-sm">
                                            {isArabic ? `${myListCourses.length} دورات محفوظة` : `${myListCourses.length} saved courses`}
                                        </p>
                                    </div>
                                </div>

                                {tabLoading ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-400">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
                                    </div>
                                ) : myListCourses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myListCourses.map((course) => (
                                            <div
                                                key={course.id}
                                                className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group"
                                                onClick={() => handleCourseClick(course.id)}
                                            >
                                                <div className="aspect-video bg-gray-700/50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-gray-600/50 transition-colors overflow-hidden">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Play className="w-10 h-10 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-white mb-2 group-hover:text-blue-200 transition-colors line-clamp-2">
                                                    {isArabic && course.titleAr ? course.titleAr : course.title}
                                                </h4>
                                                <p className="text-gray-400 text-sm mb-3 group-hover:text-gray-300 transition-colors">
                                                    {isArabic ? 'بواسطة' : 'by'} {course.creator?.user?.arabicName || course.creator?.user?.name}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                        <span className="text-white font-medium">{course.rating?.toFixed(1) || '4.5'}</span>
                                                    </div>
                                                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                                                        {isArabic ? 'في القائمة' : 'In List'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Bookmark className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 mb-4">
                                            {isArabic ? 'قائمتك فارغة' : 'Your list is empty'}
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="border-blue-500/50 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400"
                                            onClick={() => router.push(`/${locale}/courses`)}
                                        >
                                            {isArabic ? 'تصفح الدورات' : 'Browse Courses'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Liked Courses Tab */}
                {activeTab === 'liked' && (
                    <div className="space-y-8">
                        <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-red-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                        <Heart className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {isArabic ? 'الدورات المفضلة' : 'Liked Courses'}
                                        </h2>
                                        <p className="text-gray-400 text-sm">
                                            {isArabic ? `${likedCourses.length} دورات مفضلة` : `${likedCourses.length} liked courses`}
                                        </p>
                                    </div>
                                </div>

                                {tabLoading ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-400 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-400">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
                                    </div>
                                ) : likedCourses.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {likedCourses.map((course) => (
                                            <div
                                                key={course.id}
                                                className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 hover:border-red-400/60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 cursor-pointer group"
                                                onClick={() => handleCourseClick(course.id)}
                                            >
                                                <div className="aspect-video bg-gray-700/50 rounded-xl mb-4 flex items-center justify-center group-hover:bg-gray-600/50 transition-colors overflow-hidden">
                                                    {course.thumbnail ? (
                                                        <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Play className="w-10 h-10 text-gray-400 group-hover:text-red-400 transition-colors" />
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-white mb-2 group-hover:text-red-200 transition-colors line-clamp-2">
                                                    {isArabic && course.titleAr ? course.titleAr : course.title}
                                                </h4>
                                                <p className="text-gray-400 text-sm mb-3 group-hover:text-gray-300 transition-colors">
                                                    {isArabic ? 'بواسطة' : 'by'} {course.creator?.user?.arabicName || course.creator?.user?.name}
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                        <span className="text-white font-medium">{course.rating?.toFixed(1) || '4.5'}</span>
                                                    </div>
                                                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                                                        {isArabic ? 'مفضل' : 'Liked'} ❤️
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Heart className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-400 mb-4">
                                            {isArabic ? 'لم تعجب بأي دورات بعد' : "You haven't liked any courses yet"}
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="border-red-500/50 text-red-300 hover:bg-red-500/20 hover:border-red-400"
                                            onClick={() => router.push(`/${locale}/courses`)}
                                        >
                                            {isArabic ? 'تصفح الدورات' : 'Browse Courses'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Support Tickets Tab */}
                {activeTab === 'support' && (
                    <div className="space-y-8">
                        <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-white/10">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/10 rounded-full blur-3xl"></div>
                            
                            <div className="relative p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                                            <MessageSquare className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-semibold text-white">
                                                {isArabic ? 'تذاكر الدعم' : 'Support Tickets'}
                                            </h2>
                                            <p className="text-white/60 text-sm">
                                                {isArabic ? `${supportTickets.length} تذكرة` : `${supportTickets.length} tickets`}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => navigateWithLoading(`/${locale}/support/new`, 'new-ticket')}
                                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl backdrop-blur-sm"
                                        disabled={isLoading('new-ticket')}
                                    >
                                        {isLoading('new-ticket') && (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                        )}
                                        <Plus className="w-5 h-5 mr-2" />
                                        {isArabic ? 'تذكرة جديدة' : 'New Ticket'}
                                    </Button>
                                </div>

                                {tabLoading ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-white/60">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
                                    </div>
                                ) : supportTickets.length > 0 ? (
                                    <div className="space-y-4">
                                        {supportTickets.map((ticket) => {
                                            const statusConfig = {
                                                OPEN: { label: isArabic ? 'مفتوحة' : 'Open', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: AlertCircle },
                                                IN_PROGRESS: { label: isArabic ? 'قيد المعالجة' : 'In Progress', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
                                                RESOLVED: { label: isArabic ? 'محلولة' : 'Resolved', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
                                                CLOSED: { label: isArabic ? 'مغلقة' : 'Closed', color: 'bg-white/10 text-white/60 border-white/20', icon: XCircle },
                                            }
                                            
                                            const priorityConfig = {
                                                LOW: { label: isArabic ? 'منخفضة' : 'Low', color: 'text-white/50' },
                                                MEDIUM: { label: isArabic ? 'متوسطة' : 'Medium', color: 'text-yellow-400' },
                                                HIGH: { label: isArabic ? 'عالية' : 'High', color: 'text-orange-400' },
                                                URGENT: { label: isArabic ? 'عاجلة' : 'Urgent', color: 'text-red-400' },
                                            }

                                            const categoryConfig = {
                                                BILLING: { label: isArabic ? 'الفواتير' : 'Billing', emoji: '💳' },
                                                TECHNICAL: { label: isArabic ? 'تقني' : 'Technical', emoji: '🔧' },
                                                CONTENT: { label: isArabic ? 'المحتوى' : 'Content', emoji: '📝' },
                                                SAFETY: { label: isArabic ? 'الأمان' : 'Safety', emoji: '🛡️' },
                                                OTHER: { label: isArabic ? 'أخرى' : 'Other', emoji: '❓' },
                                            }

                                            const StatusIcon = statusConfig[ticket.status].icon
                                            
                                            return (
                                                <div
                                                    key={ticket.id}
                                                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 cursor-pointer group"
                                                    onClick={() => navigateWithLoading(`/${locale}/support/${ticket.id}`, `ticket-${ticket.id}`)}
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <span className="text-xl">{categoryConfig[ticket.category].emoji}</span>
                                                                <h3 className="text-lg font-semibold text-white group-hover:text-white/90 transition-colors">
                                                                    {ticket.subject}
                                                                </h3>
                                                            </div>
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <Badge className={`${statusConfig[ticket.status].color} border rounded-md`}>
                                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                                    {statusConfig[ticket.status].label}
                                                                </Badge>
                                                                <Badge className="bg-white/10 text-white/70 border border-white/20 rounded-md">
                                                                    {categoryConfig[ticket.category].label}
                                                                </Badge>
                                                                <span className={`text-sm font-medium ${priorityConfig[ticket.priority].color}`}>
                                                                    {priorityConfig[ticket.priority].label}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-white/40 group-hover:translate-x-1 group-hover:text-white/60 transition-all" />
                                                    </div>
                                                    
                                                    <div className="flex items-center justify-between text-sm text-white/50">
                                                        <div className="flex items-center gap-4">
                                                            <span className="flex items-center gap-1">
                                                                <MessageSquare className="w-4 h-4" />
                                                                {ticket._count.messages} {isArabic ? 'رسالة' : 'messages'}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {new Date(ticket.createdAt).toLocaleDateString(isArabic ? 'ar' : 'en')}
                                                            </span>
                                                        </div>
                                                        {isLoading(`ticket-${ticket.id}`) && (
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                            <MessageSquare className="w-8 h-8 text-white/40" />
                                        </div>
                                        <p className="text-white/60 mb-4">
                                            {isArabic ? 'لا توجد تذاكر دعم' : 'No support tickets'}
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 rounded-xl backdrop-blur-sm"
                                            onClick={() => navigateWithLoading(`/${locale}/support/new`, 'create-ticket')}
                                            disabled={isLoading('create-ticket')}
                                        >
                                            {isLoading('create-ticket') && (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                            )}
                                            {isArabic ? 'إنشاء تذكرة' : 'Create Ticket'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Use dynamic import to disable SSR for the dashboard content
export default function DashboardPage() {
    return <DashboardContent />
}