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
    MoreVertical,
    Download,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { BookingModal } from '@/components/mentors/BookingModal'
import ReviewModal from '@/components/mentors/ReviewModal'

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
    const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'about' | 'sessions' | 'community' | 'resources' | 'qa'>('posts')
    const [commentText, setCommentText] = useState('')
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [channelId, setChannelId] = useState<string | null>(null)
    const [subscriptionLoading, setSubscriptionLoading] = useState(true)
    const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(null)
    const [activeView, setActiveView] = useState<'feed' | 'subscriptions' | 'bookmarks' | 'creators'>('feed')
    const [searchQuery, setSearchQuery] = useState('')
    const [suggestedCreators, setSuggestedCreators] = useState<any[]>([])
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [upcomingSessions, setUpcomingSessions] = useState<any[]>([])
    const [sessionsLoading, setSessionsLoading] = useState(false)
    const [communityPosts, setCommunityPosts] = useState<any[]>([])
    const [pinnedResources, setPinnedResources] = useState<any[]>([])
    const [communityLoading, setCommunityLoading] = useState(false)
    const [newPostContent, setNewPostContent] = useState('')
    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
    const [postComments, setPostComments] = useState<{[key: string]: any[]}>({})
    const [newComment, setNewComment] = useState<{[key: string]: string}>({})
    const [commentLoading, setCommentLoading] = useState<{[key: string]: boolean}>({})
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
    const [archivedSessions, setArchivedSessions] = useState<any[]>([])
    const [sessionFilter, setSessionFilter] = useState<'all' | 'workshop' | 'qa' | 'oneOnOne'>('all')
    const [searchRecording, setSearchRecording] = useState('')
    const [resources, setResources] = useState<any[]>([])
    const [resourceCategory, setResourceCategory] = useState<'all' | 'pdf' | 'video' | 'template' | 'code'>('all')
    const [searchResource, setSearchResource] = useState('')
    const [feedbackTokens, setFeedbackTokens] = useState<{available: number, total: number, renewalDate: string}>({available: 0, total: 0, renewalDate: ''})
    const [feedbackRequests, setFeedbackRequests] = useState<any[]>([])
    const [newFeedbackRequest, setNewFeedbackRequest] = useState('')
    const [feedbackAttachment, setFeedbackAttachment] = useState<File | null>(null)
    const [showFeedbackModal, setShowFeedbackModal] = useState(false)
    const [qaQuestions, setQaQuestions] = useState<any[]>([])
    const [newQuestion, setNewQuestion] = useState('')
    const [qaFilter, setQaFilter] = useState<'all' | 'answered' | 'pending'>('all')
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
    const [isCreatorView, setIsCreatorView] = useState(false)
    const [creatorStats, setCreatorStats] = useState<any>(null)

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

    useEffect(() => {
        // Check if current user is the creator/mentor
        if (session?.user && mentor?.user) {
            setIsCreatorView(session.user.id === mentor.user.id)
            
            // Fetch creator stats if this is the creator's own page
            if (session.user.id === mentor.user.id) {
                fetchCreatorStats()
            }
        }
    }, [session, mentor])

    useEffect(() => {
        if (session?.user && channelId) {
            checkSubscriptionStatus()
        } else {
            setSubscriptionLoading(false)
        }
    }, [session, channelId])

    useEffect(() => {
        fetchSuggestedCreators()
    }, [params.id])

    useEffect(() => {
        if (activeTab === 'sessions' && mentor) {
            fetchUpcomingSessions()
        }
    }, [activeTab, mentor, currentSubscription])

    useEffect(() => {
        if (activeTab === 'community' && mentor) {
            fetchCommunityData()
        }
    }, [activeTab, mentor, currentSubscription])

    const fetchCreatorStats = async () => {
        if (!mentor) return
        
        try {
            const response = await fetch(`/api/creators/${mentor.id}/stats`)
            
            if (response.ok) {
                const data = await response.json()
                setCreatorStats(data)
            } else {
                // Demo creator stats
                const demoStats = {
                    earnings: {
                        thisMonth: 12450,
                        lastMonth: 9800,
                        total: 156000,
                        pending: 2340
                    },
                    subscribers: {
                        total: mentor.totalSubscribers || 1240,
                        basic: 680,
                        premium: 420,
                        vip: 140,
                        newThisMonth: 87,
                        churnRate: 3.2
                    },
                    engagement: {
                        totalPosts: mentor.stats.totalPosts || 156,
                        avgLikes: 342,
                        avgComments: 67,
                        avgViews: 2840,
                        engagementRate: 12.8
                    },
                    content: {
                        posts: mentor.stats.totalPosts || 156,
                        liveSessionsCompleted: 24,
                        upcomingSessions: upcomingSessions.length,
                        totalViews: 45600,
                        totalDownloads: 2340
                    },
                    topSubscribers: [
                        { name: 'Ahmed Hassan', tier: 'VIP', since: '3 months', spent: 1800 },
                        { name: 'Sara Mohamed', tier: 'VIP', since: '6 months', spent: 3200 },
                        { name: 'Omar Ali', tier: 'PREMIUM', since: '4 months', spent: 1200 }
                    ],
                    recentActivity: [
                        { type: 'subscription', user: 'Fatima Ahmed', tier: 'PREMIUM', timestamp: '2h ago' },
                        { type: 'post_like', user: 'Mohamed Ali', post: 'Trading Strategy Tips', timestamp: '4h ago' },
                        { type: 'session_booked', user: 'Layla Hassan', session: '1-on-1 Coaching', timestamp: '6h ago' },
                        { type: 'subscription_upgraded', user: 'Karim Youssef', from: 'BASIC', to: 'VIP', timestamp: '8h ago' }
                    ]
                }
                setCreatorStats(demoStats)
            }
        } catch (error) {
            console.error('Error fetching creator stats:', error)
        }
    }

    const fetchMentorData = async () => {
        try {
            console.log('Fetching mentor data for ID:', params.id)
            const response = await fetch(`/api/mentors/${params.id}`)
            console.log('Response status:', response.status)
            
            if (response.ok) {
                const data = await response.json()
                console.log('Mentor data received:', data)
                setMentor(data)
                
                // Set channel ID from the data
                if (data.channel?.id) {
                    setChannelId(data.channel.id)
                }
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error('API error:', response.status, errorData)
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

    const fetchCreatorChannel = async (creatorId: string) => {
        try {
            // For now, use the instructor ID as the channel ID
            // since the channels API may not be fully implemented yet
            // This allows the subscription system to work
            setChannelId(creatorId)
            console.log('Using instructor ID as channel ID:', creatorId)
            
            /* Future implementation when /api/channels is available:
            const response = await fetch(`/api/channels?creatorId=${creatorId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.channels && data.channels.length > 0) {
                    setChannelId(data.channels[0].id)
                }
            }
            */
        } catch (error) {
            console.error('Error setting channel:', error)
            // Fallback to using instructor ID
            setChannelId(creatorId)
        }
    }

    const checkSubscriptionStatus = async () => {
        if (!session?.user || !channelId) {
            setSubscriptionLoading(false)
            return
        }

        try {
            const response = await fetch('/api/subscriptions/status')
            if (response.ok) {
                const data = await response.json()
                
                // Check if user has subscription to this creator
                // First try to match by channelInfo.id (if channel exists)
                // Then try to match by metadata.creatorId (for subscriptions created with instructor ID)
                const channelSubscription = data.subscriptions.find(
                    (sub: any) => {
                        if (sub.type !== 'CATEGORY_C') return false
                        
                        // Try to match by channel
                        if (sub.channelInfo?.id === channelId) return true
                        
                        // Try to match by creatorId in metadata
                        if (sub.metadata?.creatorId === channelId) return true
                        
                        return false
                    }
                )
                
                if (channelSubscription) {
                    // Store the subscription ID for cancel operations
                    setActiveSubscriptionId(channelSubscription.id)
                    
                    // Extract tier from metadata first, then fall back to price comparison
                    if (channelSubscription.metadata?.tier) {
                        setCurrentSubscription(channelSubscription.metadata.tier)
                    } else {
                        // Fallback: determine tier based on price
                        const price = channelSubscription.pricePerMonth
                        if (price >= (mentor?.vipMonthlyPrice || 200)) {
                            setCurrentSubscription('VIP')
                        } else if (price >= (mentor?.premiumMonthlyPrice || 100)) {
                            setCurrentSubscription('PREMIUM')
                        } else {
                            setCurrentSubscription('BASIC')
                        }
                    }
                    
                    console.log('Found subscription for creator:', {
                        subscriptionId: channelSubscription.id,
                        channelId,
                        tier: channelSubscription.metadata?.tier,
                        price: channelSubscription.pricePerMonth
                    })
                } else {
                    // Clear subscription state if not found
                    setActiveSubscriptionId(null)
                    setCurrentSubscription(null)
                }
            }
        } catch (error) {
            console.error('Error checking subscription:', error)
        } finally {
            setSubscriptionLoading(false)
        }
    }

    const fetchSuggestedCreators = async () => {
        try {
            const response = await fetch('/api/instructors?limit=5')
            if (response.ok) {
                const data = await response.json()
                // Filter out the current mentor
                const filtered = data.instructors.filter((creator: any) => creator.id !== params.id)
                setSuggestedCreators(filtered.slice(0, 3)) // Show only 3 suggestions
            }
        } catch (error) {
            console.error('Error fetching suggested creators:', error)
        }
    }

    const fetchUpcomingSessions = async () => {
        if (!mentor) return
        
        setSessionsLoading(true)
        try {
            // Fetch upcoming scheduled meetings for this mentor
            const response = await fetch(`/api/instructors/${mentor.id}/meetings/upcoming`)
            
            if (response.ok) {
                const data = await response.json()
                setUpcomingSessions(data.sessions || [])
            } else {
                // If API doesn't exist yet, use demo data
                const demoSessions = [
                    {
                        id: '1',
                        title: isArabic ? 'جلسة أسئلة وأجوبة جماعية' : 'Group Q&A Session',
                        type: 'GROUP_QA',
                        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
                        duration: 45,
                        requiredTier: 'PREMIUM',
                        attendees: 12,
                        maxAttendees: 50,
                        joinLink: currentSubscription ? '/meeting/join/demo1' : null
                    },
                    {
                        id: '2',
                        title: isArabic ? 'ساعات المكتب - استشارات فردية' : 'Office Hours - 1-on-1 Consultation',
                        type: 'ONE_ON_ONE',
                        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
                        duration: 60,
                        requiredTier: 'VIP',
                        attendees: 1,
                        maxAttendees: 1,
                        joinLink: currentSubscription === 'VIP' ? '/meeting/join/demo2' : null
                    },
                    {
                        id: '3',
                        title: isArabic ? 'ورشة عمل مباشرة: استراتيجيات متقدمة' : 'Live Workshop: Advanced Strategies',
                        type: 'WORKSHOP',
                        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                        duration: 90,
                        requiredTier: 'BASIC',
                        attendees: 28,
                        maxAttendees: 100,
                        joinLink: currentSubscription ? '/meeting/join/demo3' : null
                    }
                ]
                setUpcomingSessions(demoSessions)
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
            // Fallback to demo data on error
            setUpcomingSessions([])
        } finally {
            setSessionsLoading(false)
        }
    }

    const fetchCommunityData = async () => {
        if (!mentor) return
        
        setCommunityLoading(true)
        try {
            // Fetch community posts and resources
            const response = await fetch(`/api/instructors/${mentor.id}/community`)
            
            if (response.ok) {
                const data = await response.json()
                setCommunityPosts(data.posts || [])
                setPinnedResources(data.resources || [])
            } else {
                // If API doesn't exist yet, use demo data
                const demoPosts = [
                    {
                        id: '1',
                        author: {
                            name: 'Sarah Ahmed',
                            arabicName: 'سارة أحمد',
                            profileImage: null,
                            tier: 'PREMIUM'
                        },
                        content: isArabic 
                            ? 'شكراً على الجلسة الرائعة اليوم! تعلمت الكثير عن استراتيجيات التداول المتقدمة 🚀'
                            : 'Thanks for the amazing session today! Learned so much about advanced trading strategies 🚀',
                        timestamp: '2h',
                        likes: 24,
                        replies: 5
                    },
                    {
                        id: '2',
                        author: {
                            name: 'Mohamed Ali',
                            arabicName: 'محمد علي',
                            profileImage: null,
                            tier: 'VIP'
                        },
                        content: isArabic
                            ? 'هل يمكن لأحد أن يشاركني ملاحظات من ورشة العمل الأخيرة؟ فاتتني للأسف'
                            : 'Can someone share notes from the last workshop? Unfortunately missed it',
                        timestamp: '5h',
                        likes: 12,
                        replies: 8
                    },
                    {
                        id: '3',
                        author: {
                            name: 'Fatima Hassan',
                            arabicName: 'فاطمة حسن',
                            profileImage: null,
                            tier: 'BASIC'
                        },
                        content: isArabic
                            ? 'متحمسة جداً للانضمام إلى هذا المجتمع! 🎉'
                            : 'So excited to join this community! 🎉',
                        timestamp: '1d',
                        likes: 45,
                        replies: 12
                    }
                ]
                
                const demoResources = [
                    {
                        id: '1',
                        title: isArabic ? 'دليل المبتدئين الكامل' : 'Complete Beginners Guide',
                        type: 'PDF',
                        size: '2.5 MB',
                        downloads: 234
                    },
                    {
                        id: '2',
                        title: isArabic ? 'قالب استراتيجية التداول' : 'Trading Strategy Template',
                        type: 'Excel',
                        size: '1.2 MB',
                        downloads: 189
                    },
                    {
                        id: '3',
                        title: isArabic ? 'تسجيل ورشة العمل الأخيرة' : 'Last Workshop Recording',
                        type: 'Video',
                        size: '450 MB',
                        downloads: 156
                    }
                ]
                
                setCommunityPosts(demoPosts)
                setPinnedResources(demoResources)
            }
        } catch (error) {
            console.error('Error fetching community data:', error)
            setCommunityPosts([])
            setPinnedResources([])
        } finally {
            setCommunityLoading(false)
        }
    }

    const fetchArchivedSessions = async () => {
        if (!mentor) return
        
        try {
            const response = await fetch(`/api/instructors/${mentor.id}/sessions/archived`)
            
            if (response.ok) {
                const data = await response.json()
                setArchivedSessions(data.sessions || [])
            } else {
                // Demo archived sessions data
                const demoArchived = [
                    {
                        id: 'arch1',
                        title: isArabic ? 'ورشة عمل: استراتيجيات التداول المتقدمة' : 'Workshop: Advanced Trading Strategies',
                        type: 'WORKSHOP',
                        recordedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        duration: 90,
                        requiredTier: 'PREMIUM',
                        views: 342,
                        thumbnail: null,
                        recordingUrl: '/recordings/demo1.mp4',
                        description: isArabic 
                            ? 'تعلم استراتيجيات التداول المتقدمة مع أمثلة عملية'
                            : 'Learn advanced trading strategies with practical examples'
                    },
                    {
                        id: 'arch2',
                        title: isArabic ? 'جلسة أسئلة وأجوبة: إدارة المخاطر' : 'Q&A Session: Risk Management',
                        type: 'GROUP_QA',
                        recordedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        duration: 45,
                        requiredTier: 'BASIC',
                        views: 567,
                        thumbnail: null,
                        recordingUrl: '/recordings/demo2.mp4',
                        description: isArabic
                            ? 'جلسة أسئلة وأجوبة حول إدارة المخاطر في التداول'
                            : 'Q&A session about risk management in trading'
                    },
                    {
                        id: 'arch3',
                        title: isArabic ? 'استشارة فردية مسجلة (نموذج)' : 'Recorded 1-on-1 Consultation (Sample)',
                        type: 'ONE_ON_ONE',
                        recordedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                        duration: 60,
                        requiredTier: 'VIP',
                        views: 89,
                        thumbnail: null,
                        recordingUrl: '/recordings/demo3.mp4',
                        description: isArabic
                            ? 'عينة من جلسة استشارية فردية مع تحليل محفظة'
                            : 'Sample 1-on-1 consultation with portfolio review'
                    },
                    {
                        id: 'arch4',
                        title: isArabic ? 'ورشة عمل: تحليل السوق الأسبوعي' : 'Workshop: Weekly Market Analysis',
                        type: 'WORKSHOP',
                        recordedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                        duration: 75,
                        requiredTier: 'PREMIUM',
                        views: 421,
                        thumbnail: null,
                        recordingUrl: '/recordings/demo4.mp4',
                        description: isArabic
                            ? 'تحليل شامل للسوق مع توقعات الأسبوع القادم'
                            : 'Comprehensive market analysis with next week predictions'
                    }
                ]
                setArchivedSessions(demoArchived)
            }
        } catch (error) {
            console.error('Error fetching archived sessions:', error)
            setArchivedSessions([])
        }
    }

    const fetchResources = async () => {
        if (!mentor) return
        
        try {
            const response = await fetch(`/api/instructors/${mentor.id}/resources`)
            
            if (response.ok) {
                const data = await response.json()
                setResources(data.resources || [])
            } else {
                // Demo resources data
                const demoResources = [
                    {
                        id: 'res1',
                        title: isArabic ? 'دليل استراتيجيات التداول المتقدمة' : 'Advanced Trading Strategies Guide',
                        type: 'PDF',
                        category: 'pdf',
                        size: '2.4 MB',
                        downloads: 1243,
                        uploadedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        requiredTier: 'PREMIUM',
                        url: '/resources/demo1.pdf',
                        description: isArabic
                            ? 'دليل شامل لاستراتيجيات التداول المتقدمة مع أمثلة عملية'
                            : 'Comprehensive guide to advanced trading strategies with practical examples'
                    },
                    {
                        id: 'res2',
                        title: isArabic ? 'قالب تحليل المخاطر Excel' : 'Risk Analysis Excel Template',
                        type: 'Excel',
                        category: 'template',
                        size: '856 KB',
                        downloads: 892,
                        uploadedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                        requiredTier: 'VIP',
                        url: '/resources/demo2.xlsx',
                        description: isArabic
                            ? 'قالب Excel لتحليل المخاطر وإدارة المحفظة'
                            : 'Excel template for risk analysis and portfolio management'
                    },
                    {
                        id: 'res3',
                        title: isArabic ? 'فيديو تعليمي: إعداد منصة التداول' : 'Tutorial Video: Trading Platform Setup',
                        type: 'Video',
                        category: 'video',
                        size: '45 MB',
                        downloads: 2156,
                        uploadedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                        requiredTier: 'BASIC',
                        url: '/resources/demo3.mp4',
                        description: isArabic
                            ? 'فيديو تعليمي خطوة بخطوة لإعداد منصة التداول'
                            : 'Step-by-step tutorial for setting up your trading platform'
                    },
                    {
                        id: 'res4',
                        title: isArabic ? 'مكتبة أكواد Python للتحليل' : 'Python Code Library for Analysis',
                        type: 'Code',
                        category: 'code',
                        size: '124 KB',
                        downloads: 456,
                        uploadedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                        requiredTier: 'VIP',
                        url: '/resources/demo4.zip',
                        description: isArabic
                            ? 'مجموعة من أكواد Python لتحليل السوق والبيانات'
                            : 'Collection of Python scripts for market and data analysis'
                    },
                    {
                        id: 'res5',
                        title: isArabic ? 'كتاب العمل: أساسيات إدارة الأموال' : 'Workbook: Money Management Fundamentals',
                        type: 'PDF',
                        category: 'pdf',
                        size: '1.8 MB',
                        downloads: 1678,
                        uploadedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
                        requiredTier: 'BASIC',
                        url: '/resources/demo5.pdf',
                        description: isArabic
                            ? 'كتاب عمل تفاعلي لتعلم أساسيات إدارة الأموال'
                            : 'Interactive workbook for learning money management basics'
                    },
                    {
                        id: 'res6',
                        title: isArabic ? 'قوالب تحليل التقني Tradingview' : 'Tradingview Technical Analysis Templates',
                        type: 'Template',
                        category: 'template',
                        size: '340 KB',
                        downloads: 734,
                        uploadedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                        requiredTier: 'PREMIUM',
                        url: '/resources/demo6.zip',
                        description: isArabic
                            ? 'قوالب جاهزة للتحليل الفني على منصة Tradingview'
                            : 'Ready-to-use technical analysis templates for Tradingview'
                    }
                ]
                setResources(demoResources)
            }
        } catch (error) {
            console.error('Error fetching resources:', error)
            setResources([])
        }
    }

    const fetchFeedbackTokens = async () => {
        if (!mentor || !session || currentSubscription !== 'VIP') return
        
        try {
            const response = await fetch(`/api/feedback/tokens?mentorId=${mentor.id}`)
            
            if (response.ok) {
                const data = await response.json()
                setFeedbackTokens(data)
                setFeedbackRequests(data.requests || [])
            } else {
                // Demo data for VIP members
                const demoTokens = {
                    available: 3,
                    total: 5,
                    renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
                }
                
                const demoRequests = [
                    {
                        id: 'fb1',
                        content: isArabic 
                            ? 'هل يمكنك مراجعة استراتيجية التداول الخاصة بي؟ أريد معرفة ما إذا كنت أدير المخاطر بشكل صحيح.'
                            : 'Could you review my trading strategy? I want to know if I\'m managing risk properly.',
                        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'ANSWERED',
                        response: isArabic
                            ? 'استراتيجيتك جيدة ولكن أقترح تقليل حجم المركز بنسبة 20٪ لتحسين إدارة المخاطر.'
                            : 'Your strategy is good but I suggest reducing position size by 20% for better risk management.',
                        respondedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    {
                        id: 'fb2',
                        content: isArabic
                            ? 'قمت بتحليل هذه الصفقة، هل يمكنك إعطائي رأيك؟'
                            : 'I analyzed this trade, could you give me your opinion?',
                        submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                        status: 'IN_PROGRESS',
                        response: null,
                        respondedDate: null
                    }
                ]
                
                setFeedbackTokens(demoTokens)
                setFeedbackRequests(demoRequests)
            }
        } catch (error) {
            console.error('Error fetching feedback tokens:', error)
        }
    }

    const handleSubmitFeedbackRequest = async () => {
        if (!newFeedbackRequest.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال سؤالك' : 'Please enter your question')
            return
        }

        if (feedbackTokens.available <= 0) {
            toast.error(isArabic ? 'لا توجد رموز متاحة' : 'No tokens available')
            return
        }

        try {
            const response = await fetch('/api/feedback/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mentorId: mentor?.id,
                    content: newFeedbackRequest,
                    hasAttachment: !!feedbackAttachment
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إرسال الطلب!' : 'Request submitted!')
                setNewFeedbackRequest('')
                setFeedbackAttachment(null)
                setShowFeedbackModal(false)
                setFeedbackTokens(prev => ({ ...prev, available: prev.available - 1 }))
                fetchFeedbackTokens()
            } else {
                toast.error(isArabic ? 'فشل الإرسال' : 'Failed to submit')
            }
        } catch (error) {
            console.error('Error submitting feedback request:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
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

    const handleSubscribe = async (tier: 'BASIC' | 'PREMIUM' | 'VIP') => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }

        if (!channelId) {
            toast.error(
                isArabic 
                    ? 'القناة غير متوفرة. جاري إعادة المحاولة...' 
                    : 'Channel not available. Retrying...'
            )
            // Try to fetch channel again
            await fetchCreatorChannel(params.id as string)
            
            // Check if we have channelId now after retry
            if (!channelId) {
                toast.error(
                    isArabic 
                        ? 'عذراً، هذا المنشئ ليس لديه قناة متاحة حالياً' 
                        : 'Sorry, this creator does not have an available channel yet'
                )
                return
            }
        }

        setIsSubscribing(true)
        
        try {
            // Get the price based on tier
            let price = 50 // default
            if (tier === 'BASIC') price = mentor?.basicMonthlyPrice || 50
            else if (tier === 'PREMIUM') price = mentor?.premiumMonthlyPrice || 100
            else if (tier === 'VIP') price = mentor?.vipMonthlyPrice || 200

            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'CATEGORY_C',
                    channelId: null, // Set to null to avoid foreign key constraint
                    creatorId: channelId, // Pass instructor ID for reference
                    tier: tier,
                    price: price,
                    billingCycle: 'monthly',
                    paymentMethodId: 'demo_payment_method' // In production, use Stripe
                })
            })

            const data = await response.json()

            if (response.ok) {
                setCurrentSubscription(tier)
                toast.success(
                    isArabic 
                        ? `🎉 تم الاشتراك في ${tier} بنجاح!` 
                        : `🎉 Successfully subscribed to ${tier}!`
                )
                
                // Refresh subscription status
                await checkSubscriptionStatus()
            } else {
                toast.error(data.error || (isArabic ? 'فشل الاشتراك' : 'Subscription failed'))
            }
        } catch (error) {
            console.error('Subscription error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsSubscribing(false)
        }
    }

    const handleCancelSubscription = async () => {
        if (!session || !activeSubscriptionId) {
            toast.error(isArabic ? 'لم يتم العثور على الاشتراك' : 'No subscription found')
            return
        }

        const confirmMessage = isArabic 
            ? 'هل أنت متأكد من إلغاء الاشتراك؟' 
            : 'Are you sure you want to cancel your subscription?'
        
        if (!confirm(confirmMessage)) return

        try {
            const response = await fetch('/api/subscriptions/cancel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionId: activeSubscriptionId
                })
            })

            if (response.ok) {
                setCurrentSubscription(null)
                setActiveSubscriptionId(null)
                toast.success(isArabic ? 'تم إلغاء الاشتراك' : 'Subscription cancelled')
            } else {
                const data = await response.json()
                toast.error(data.error || (isArabic ? 'فشل الإلغاء' : 'Cancellation failed'))
            }
        } catch (error) {
            console.error('Cancellation error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const handleUpgradeSubscription = async (newTier: 'BASIC' | 'PREMIUM' | 'VIP') => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        const confirmMessage = isArabic 
            ? `هل تريد الترقية إلى ${newTier}؟` 
            : `Upgrade to ${newTier} tier?`
        
        if (!confirm(confirmMessage)) return

        // First cancel current subscription, then subscribe to new tier
        setIsSubscribing(true)
        try {
            await handleCancelSubscription()
            await handleSubscribe(newTier)
            toast.success(isArabic ? `تمت الترقية إلى ${newTier}!` : `Upgraded to ${newTier}!`)
        } catch (error) {
            console.error('Upgrade error:', error)
            toast.error(isArabic ? 'فشلت الترقية' : 'Upgrade failed')
        } finally {
            setIsSubscribing(false)
        }
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

    const toggleComments = async (postId: string) => {
        const isExpanded = expandedComments.has(postId)
        
        if (isExpanded) {
            // Collapse comments
            setExpandedComments(prev => {
                const newSet = new Set(prev)
                newSet.delete(postId)
                return newSet
            })
        } else {
            // Expand comments
            setExpandedComments(prev => new Set(prev).add(postId))
            
            // Fetch comments if not already loaded
            if (!postComments[postId]) {
                await fetchComments(postId)
            }
        }
    }

    const fetchComments = async (postId: string) => {
        setCommentLoading(prev => ({ ...prev, [postId]: true }))
        
        try {
            const response = await fetch(`/api/posts/${postId}/comments`)
            
            if (response.ok) {
                const data = await response.json()
                setPostComments(prev => ({ ...prev, [postId]: data.comments || [] }))
            } else {
                // Demo comments if API doesn't exist
                const demoComments = [
                    {
                        id: '1',
                        author: {
                            name: 'Ahmed Hassan',
                            arabicName: 'أحمد حسن',
                            profileImage: null
                        },
                        content: isArabic ? 'شكراً على المحتوى الرائع!' : 'Thanks for the amazing content!',
                        timestamp: '5m',
                        likes: 12
                    },
                    {
                        id: '2',
                        author: {
                            name: 'Layla Mohamed',
                            arabicName: 'ليلى محمد',
                            profileImage: null
                        },
                        content: isArabic ? 'هل يمكنك شرح المزيد عن هذا الموضوع؟' : 'Can you explain more about this topic?',
                        timestamp: '15m',
                        likes: 8
                    },
                    {
                        id: '3',
                        author: {
                            name: 'Omar Ali',
                            arabicName: 'عمر علي',
                            profileImage: null
                        },
                        content: isArabic ? 'محتوى مفيد جداً! 🔥' : 'Very helpful content! 🔥',
                        timestamp: '1h',
                        likes: 15
                    }
                ]
                setPostComments(prev => ({ ...prev, [postId]: demoComments }))
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
            setPostComments(prev => ({ ...prev, [postId]: [] }))
        } finally {
            setCommentLoading(prev => ({ ...prev, [postId]: false }))
        }
    }

    const handleAddComment = async (postId: string) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        if (!currentSubscription) {
            toast.error(isArabic ? 'يجب الاشتراك للتعليق' : 'Subscribe to comment')
            return
        }

        const commentContent = newComment[postId]?.trim()
        if (!commentContent) return

        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: commentContent
                })
            })

            if (response.ok) {
                const data = await response.json()
                
                // Add new comment to the list
                const newCommentObj = {
                    id: data.id || Date.now().toString(),
                    author: {
                        name: session.user?.name || 'User',
                        arabicName: null,
                        profileImage: session.user?.image || null
                    },
                    content: commentContent,
                    timestamp: 'now',
                    likes: 0
                }
                
                setPostComments(prev => ({
                    ...prev,
                    [postId]: [newCommentObj, ...(prev[postId] || [])]
                }))
                
                // Update comment count
                setPosts(posts.map(post => 
                    post.id === postId 
                        ? { ...post, comments: post.comments + 1 }
                        : post
                ))
                
                // Clear input
                setNewComment(prev => ({ ...prev, [postId]: '' }))
                
                toast.success(isArabic ? 'تم إضافة التعليق' : 'Comment added!')
            } else {
                toast.error(isArabic ? 'فشل إضافة التعليق' : 'Failed to add comment')
            }
        } catch (error) {
            console.error('Error adding comment:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const handleDownloadContent = async (postId: string, mediaUrl: string, postType: string) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        // Only VIP subscribers can download
        if (currentSubscription !== 'VIP') {
            toast.error(isArabic ? 'ترقية إلى VIP للتحميل' : 'Upgrade to VIP to download')
            return
        }

        try {
            toast.success(isArabic ? 'جاري التحميل...' : 'Starting download...')
            
            // In a real implementation, this would download from the server
            // For now, we'll simulate the download
            const fileName = `${mentor?.user.name || 'content'}_${postId}_${Date.now()}.${postType === 'video' ? 'mp4' : 'jpg'}`
            
            // Simulate download
            setTimeout(() => {
                toast.success(isArabic ? 'تم التحميل بنجاح!' : 'Downloaded successfully!')
            }, 1000)
            
            // In production, you would:
            // const response = await fetch(`/api/content/download/${postId}`)
            // const blob = await response.blob()
            // const url = window.URL.createObjectURL(blob)
            // const a = document.createElement('a')
            // a.href = url
            // a.download = fileName
            // a.click()
            // window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download error:', error)
            toast.error(isArabic ? 'فشل التحميل' : 'Download failed')
        }
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

    // Initialize data on component mount
    useEffect(() => {
        if (mentor) {
            fetchUpcomingSessions()
            fetchArchivedSessions()
            fetchCommunityData()
            fetchSuggestedCreators()
            fetchResources()
            fetchFeedbackTokens()
        }
    }, [mentor])

    // Fetch data when sessions tab is opened
    useEffect(() => {
        if (activeTab === 'sessions' && mentor && archivedSessions.length === 0) {
            fetchArchivedSessions()
        }
    }, [activeTab])

    if (loading || subscriptionLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">
                        {subscriptionLoading 
                            ? (isArabic ? 'جاري التحقق من الاشتراك...' : 'Checking subscription...') 
                            : (isArabic ? 'جاري التحميل...' : 'Loading...')
                        }
                    </p>
                </div>
            </div>
        )
    }

    if (!mentor) return null

    const getMentorName = () => isArabic && mentor.user.arabicName ? mentor.user.arabicName : mentor.user.name

    const canViewPost = (post: Post) => {
        if (post.tier === 'FREE') return true
        if (!currentSubscription) return false
        
        const tierHierarchy: Record<string, number> = { 'BASIC': 1, 'PREMIUM': 2, 'VIP': 3 }
        return (tierHierarchy[currentSubscription] || 0) >= (tierHierarchy[post.tier] || 0)
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors">
            {/* Twitter-Style Three-Column Layout */}
            <div className="container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Left Sidebar - Navigation */}
                    <div className="hidden lg:block lg:col-span-3 p-4">
                        <div className="sticky top-20">
                            <nav className="space-y-2">
                                {/* Back Button */}
                                <button
                                    onClick={() => router.push(`/${locale}/mentors`)}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'رجوع' : 'Back to Feed'}</span>
                                </button>

                                {/* Posts Tab */}
                                <button
                                    onClick={() => setActiveTab('posts')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeTab === 'posts'
                                            ? 'bg-purple-500/20 text-foreground'
                                            : 'hover:bg-card-hover text-muted-foreground'
                                    }`}
                                >
                                    <MessageCircle className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'المنشورات' : 'Posts'}</span>
                                </button>

                                {/* Media Tab */}
                                <button
                                    onClick={() => setActiveTab('media')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeTab === 'media'
                                            ? 'bg-purple-500/20 text-foreground'
                                            : 'hover:bg-card-hover text-muted-foreground'
                                    }`}
                                >
                                    <ImageIcon className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'الوسائط' : 'Media'}</span>
                                </button>

                                {/* Live Sessions Tab */}
                                <button
                                    onClick={() => setActiveTab('sessions')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeTab === 'sessions'
                                            ? 'bg-purple-500/20 text-foreground'
                                            : 'hover:bg-card-hover text-muted-foreground'
                                    }`}
                                >
                                    <Calendar className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'الجلسات المباشرة' : 'Live Sessions'}</span>
                                    {upcomingSessions.length > 0 && (
                                        <Badge className="ml-auto bg-purple-500 text-white border-0">
                                            {upcomingSessions.length}
                                        </Badge>
                                    )}
                                </button>

                                {/* Community Tab - Only visible for subscribers */}
                                {currentSubscription && (
                                    <button
                                        onClick={() => setActiveTab('community')}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                            activeTab === 'community'
                                                ? 'bg-purple-500/20 text-foreground'
                                                : 'hover:bg-card-hover text-muted-foreground'
                                        }`}
                                    >
                                        <Users className="w-6 h-6" />
                                        <span className="text-lg font-bold">{isArabic ? 'المجتمع' : 'Community'}</span>
                                        {communityPosts.length > 0 && (
                                            <Badge className="ml-auto bg-green-500 text-white border-0">
                                                {communityPosts.length}
                                            </Badge>
                                        )}
                                    </button>
                                )}

                                {/* About Tab */}
                                <button
                                    onClick={() => setActiveTab('about')}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeTab === 'about'
                                            ? 'bg-purple-500/20 text-foreground'
                                            : 'hover:bg-card-hover text-muted-foreground'
                                    }`}
                                >
                                    <Users className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'حول' : 'About'}</span>
                                </button>

                                {/* Profile Tab - Creator Dashboard (Only for creator) */}
                                {isCreatorView && (
                                    <button
                                        onClick={() => setActiveTab('profile')}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                            activeTab === 'profile'
                                                ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-foreground border-2 border-yellow-500/50'
                                                : 'hover:bg-card-hover text-muted-foreground border-2 border-transparent'
                                        }`}
                                    >
                                        <Crown className="w-6 h-6 text-yellow-500" />
                                        <span className="text-lg font-bold">{isArabic ? 'لوحة التحكم' : 'Creator Dashboard'}</span>
                                    </button>
                                )}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content Area - Center Column */}
                    <div className="lg:col-span-6 border-x border-border min-h-screen">
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
                                        width={120} height={120} className="rounded-full border-4 border-background object-cover w-28 h-28 sm:w-32 sm:h-32"
                                    />
                                ) : (
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-foreground">
                                            {getMentorName()[0]}
                                        </span>
                                    </div>
                                )}
                                {mentor.stats.averageRating >= 4.5 && (
                                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1.5 border-4 border-background">
                                        <CheckCircle className="w-5 h-5 text-foreground" />
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                                {/* Notification Bell - Show upcoming session notifications for subscribers */}
                                {currentSubscription && upcomingSessions.length > 0 && (
                                    <div className="relative group">
                                        <button
                                            onClick={() => setActiveTab('sessions')}
                                            className="relative p-2 rounded-full bg-card/50 hover:bg-card-hover border border-border transition-all"
                                        >
                                            <Bell className="w-5 h-5 text-foreground" />
                                            {/* Badge with count */}
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                <span className="text-xs font-bold text-white">{upcomingSessions.length}</span>
                                            </div>
                                        </button>
                                        
                                        {/* Tooltip showing next session */}
                                        {upcomingSessions[0] && (
                                            <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-xl p-4 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                                                <div className="text-sm font-semibold text-foreground mb-1">
                                                    {isArabic ? 'الجلسة القادمة' : 'Next Session'}
                                                </div>
                                                <div className="text-xs text-muted-foreground mb-2">
                                                    {upcomingSessions[0].title}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <Calendar className="w-3 h-3 text-purple-500" />
                                                    <span className="text-muted-foreground">
                                                        {(() => {
                                                            const sessionDate = new Date(upcomingSessions[0].date)
                                                            const now = new Date()
                                                            const diffMs = sessionDate.getTime() - now.getTime()
                                                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
                                                            const diffDays = Math.floor(diffHours / 24)
                                                            
                                                            if (diffHours < 1) {
                                                                const diffMins = Math.floor(diffMs / (1000 * 60))
                                                                return isArabic ? `خلال ${diffMins} دقيقة` : `in ${diffMins} minutes`
                                                            } else if (diffHours < 24) {
                                                                return isArabic ? `خلال ${diffHours} ساعة` : `in ${diffHours} hours`
                                                            } else {
                                                                return isArabic ? `خلال ${diffDays} يوم` : `in ${diffDays} days`
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <button
                                    onClick={handleFollow}
                                    disabled={!session}
                                    className={`px-6 py-2 rounded-full font-semibold transition-all ${
                                        isFollowing
                                            ? 'bg-card/50 text-foreground hover:bg-card-hover border border-border'
                                            : 'bg-card hover:bg-card-hover text-foreground border border-border'
                                    } ${!session ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isFollowing ? (isArabic ? 'متابع' : 'Following') : (isArabic ? 'متابعة' : 'Follow')}
                                </button>
                                {!currentSubscription ? (
                                    <Button
                                        onClick={() => {
                                            if (!session) {
                                                router.push(`/${locale}/login`)
                                                return
                                            }
                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                        }}
                                        disabled={isSubscribing}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-8 py-2 rounded-full disabled:opacity-50"
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        {isSubscribing ? (isArabic ? 'جاري...' : 'Loading...') : (isArabic ? 'اشترك' : 'Subscribe')}
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={() => setIsBookingModalOpen(true)}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-full"
                                        >
                                            <Calendar className="w-4 h-4 mr-2" />
                                            {isArabic ? 'حجز جلسة' : 'Book Session'}
                                        </Button>
                                        <Button
                                            onClick={() => router.push(`/${locale}/messaging?userId=${mentor.user.id}`)}
                                            className="bg-card/50 hover:bg-card-hover text-foreground border border-border font-semibold px-6 py-2 rounded-full"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            {isArabic ? 'مراسلة' : 'Message'}
                                        </Button>
                                        <button
                                            onClick={handleCancelSubscription}
                                            className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
                                        >
                                            {isArabic ? 'إدارة' : 'Manage'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name & Bio */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-2xl sm:text-3xl font-black text-foreground">
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
                            <p className="text-muted-foreground text-lg mb-3">{mentor.expertise}</p>
                            <p className="text-muted-foreground max-w-2xl">{mentor.user.bio}</p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 pb-6 border-b border-border">
                            <div>
                                <span className="font-bold text-foreground text-lg">{mentor.stats.totalPosts}</span>
                                <span className="text-muted-foreground text-sm ml-1">{isArabic ? 'منشورات' : 'posts'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-foreground text-lg">{(mentor.totalSubscribers / 1000).toFixed(1)}K</span>
                                <span className="text-muted-foreground text-sm ml-1">{isArabic ? 'مشتركين' : 'subscribers'}</span>
                            </div>
                            <div>
                                <span className="font-bold text-foreground text-lg">{(mentor.stats.totalFollowers / 1000).toFixed(1)}K</span>
                                <span className="text-muted-foreground text-sm ml-1">{isArabic ? 'متابعين' : 'followers'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-bold text-foreground text-lg">{mentor.stats.averageRating.toFixed(1)}</span>
                                <span className="text-muted-foreground text-sm">{isArabic ? 'تقييم' : 'rating'}</span>
                            </div>
                            
                            {/* Leave Review Button - Only for subscribers */}
                            {currentSubscription && (
                                <button
                                    onClick={() => setIsReviewModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full text-sm font-semibold transition-all ml-auto"
                                >
                                    <Star className="w-4 h-4" />
                                    {isArabic ? 'اترك تقييماً' : 'Leave a Review'}
                                </button>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-8 pt-4">
                            <button
                                onClick={() => setActiveTab('posts')}
                                className={`pb-4 font-semibold transition-colors relative ${
                                    activeTab === 'posts' ? 'text-white' : 'text-muted-foreground hover:text-white'
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
                                    activeTab === 'media' ? 'text-white' : 'text-muted-foreground hover:text-white'
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
                                    activeTab === 'about' ? 'text-white' : 'text-muted-foreground hover:text-white'
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
                            {/* Current Subscription Status */}
                            {currentSubscription && (
                                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground">
                                                    {isArabic ? 'أنت مشترك!' : 'You\'re Subscribed!'}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {isArabic ? `عضوية ${currentSubscription} نشطة` : `${currentSubscription} membership active`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {currentSubscription !== 'VIP' && (
                                                <Button
                                                    onClick={() => {
                                                        const nextTier = currentSubscription === 'BASIC' ? 'PREMIUM' : 'VIP'
                                                        handleUpgradeSubscription(nextTier as any)
                                                    }}
                                                    disabled={isSubscribing}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                                                >
                                                    <Crown className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'ترقية' : 'Upgrade'}
                                                </Button>
                                            )}
                                            <Button
                                                onClick={handleCancelSubscription}
                                                className="bg-white/5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 border border-border"
                                            >
                                                {isArabic ? 'إلغاء' : 'Cancel'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Subscription Tiers */}
                            <div id="subscription-tiers" className={`bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 mb-6 ${currentSubscription ? 'opacity-60' : ''}`}>
                                <h3 className="text-2xl font-black text-foreground mb-2">
                                    {currentSubscription 
                                        ? (isArabic ? '📊 خطط الاشتراك' : '� Subscription Plans')
                                        : (isArabic ? '🔥 اشترك للوصول الحصري' : '🔥 Subscribe for Exclusive Content')
                                    }
                                </h3>
                                {currentSubscription && (
                                    <p className="text-muted-foreground text-sm mb-4">
                                        {isArabic ? 'يمكنك الترقية أو التبديل بين الخطط في أي وقت' : 'You can upgrade or switch plans anytime'}
                                    </p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* Basic Tier */}
                                        {mentor.basicMonthlyPrice && (
                                            <div className="bg-card border border-blue-500/30 rounded-xl p-5 hover:border-blue-400 transition-all">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                                    <h4 className="font-bold text-foreground text-lg">Basic</h4>
                                                </div>
                                                <div className="text-3xl font-black text-foreground mb-1">
                                                    {mentor.basicMonthlyPrice} EGP
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-4">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                
                                                {/* Perks List */}
                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold text-blue-400 mb-2 uppercase">
                                                        {isArabic ? 'ما تحصل عليه:' : 'What you get:'}
                                                    </p>
                                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'الوصول لجميع المنشورات والمحتوى' : 'Access to all posts & content'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'مشاهدة جلسات ورش العمل الجماعية' : 'Join group workshop sessions'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'الوصول إلى مساحة المجتمع' : 'Community space access'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'تحديثات أسبوعية' : 'Weekly content updates'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'التعليق والتفاعل مع المنشورات' : 'Comment on posts'}</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                
                                                <Button 
                                                    onClick={() => handleSubscribe('BASIC')}
                                                    disabled={isSubscribing || currentSubscription === 'BASIC'}
                                                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                                                >
                                                    {currentSubscription === 'BASIC' 
                                                        ? (isArabic ? 'مشترك حالياً' : 'Current Plan')
                                                        : isSubscribing ? (isArabic ? 'جاري...' : 'Processing...') 
                                                        : (isArabic ? 'اشترك' : 'Subscribe')}
                                                </Button>
                                            </div>
                                        )}

                                        {/* Premium Tier */}
                                        {mentor.premiumMonthlyPrice && (
                                            <div className="bg-card border-2 border-purple-500/50 rounded-xl p-5 hover:border-purple-400 transition-all relative overflow-hidden">
                                                <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                                                    {isArabic ? 'الأكثر شعبية' : 'POPULAR'}
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Star className="w-5 h-5 text-purple-400" />
                                                    <h4 className="font-bold text-foreground text-lg">Premium</h4>
                                                </div>
                                                <div className="text-3xl font-black text-foreground mb-1">
                                                    {mentor.premiumMonthlyPrice} EGP
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-4">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                
                                                {/* Perks List */}
                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold text-purple-400 mb-2 uppercase">
                                                        {isArabic ? 'ما تحصل عليه:' : 'What you get:'}
                                                    </p>
                                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                            <span className="font-semibold text-purple-400">{isArabic ? 'كل مزايا Basic +' : 'Everything in Basic +'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'جلسات أسئلة وأجوبة شهرية مباشرة' : 'Monthly live Q&A sessions'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'دعم ذو أولوية (رد خلال 24 ساعة)' : 'Priority support (24h response)'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'موارد وملفات حصرية للتحميل' : 'Exclusive downloadable resources'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'شارة Premium في المجتمع' : 'Premium badge in community'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'الوصول المبكر للمحتوى الجديد' : 'Early access to new content'}</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                
                                                <Button 
                                                    onClick={() => handleSubscribe('PREMIUM')}
                                                    disabled={isSubscribing || currentSubscription === 'PREMIUM'}
                                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                                                >
                                                    {currentSubscription === 'PREMIUM' 
                                                        ? (isArabic ? 'مشترك حالياً' : 'Current Plan')
                                                        : isSubscribing ? (isArabic ? 'جاري...' : 'Processing...') 
                                                        : (isArabic ? 'اشترك' : 'Subscribe')}
                                                </Button>
                                            </div>
                                        )}

                                        {/* VIP Tier */}
                                        {mentor.vipMonthlyPrice && (
                                            <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-xl p-5 hover:border-yellow-400 transition-all relative">
                                                <div className="absolute -top-3 -right-3">
                                                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full p-2 shadow-lg">
                                                        <Crown className="w-5 h-5 text-yellow-900" />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Crown className="w-5 h-5 text-yellow-400" />
                                                    <h4 className="font-bold text-foreground text-lg">VIP</h4>
                                                    <Badge className="ml-auto bg-yellow-500 text-yellow-900 border-0">
                                                        {isArabic ? 'المميز' : 'Elite'}
                                                    </Badge>
                                                </div>
                                                <div className="text-3xl font-black text-foreground mb-1">
                                                    {mentor.vipMonthlyPrice} EGP
                                                </div>
                                                <div className="text-sm text-muted-foreground mb-4">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                
                                                {/* Perks List */}
                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold text-yellow-400 mb-2 uppercase">
                                                        {isArabic ? 'التجربة الكاملة:' : 'The Ultimate Experience:'}
                                                    </p>
                                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <span className="font-semibold text-yellow-400">{isArabic ? 'كل مزايا Premium +' : 'Everything in Premium +'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'جلسات تدريب فردية 1:1 شهرياً' : 'Monthly 1-on-1 coaching sessions'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'مراسلة مباشرة مع المدرب' : 'Direct messaging with mentor'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'محتوى مخصص حسب احتياجاتك' : 'Custom content requests'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'مراجعة وتقييم أعمالك' : 'Work review & feedback'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'شارة VIP الذهبية' : 'Exclusive VIP gold badge'}</span>
                                                        </li>
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                                                            <span>{isArabic ? 'أولوية في الحجوزات والفعاليات' : 'Priority booking & event access'}</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                
                                                <Button 
                                                    onClick={() => handleSubscribe('VIP')}
                                                    disabled={isSubscribing || currentSubscription === 'VIP'}
                                                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 text-yellow-900 font-bold"
                                                >
                                                    {currentSubscription === 'VIP' 
                                                        ? (isArabic ? 'مشترك حالياً' : 'Current Plan')
                                                        : isSubscribing ? (isArabic ? 'جاري...' : 'Processing...') 
                                                        : (isArabic ? 'اشترك' : 'Subscribe')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            {/* Posts Feed */}
                            {posts.map((post, i) => {
                                const isLocked = post.isLocked && !canViewPost(post)
                                
                                return (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-card border border-border rounded-2xl p-6 hover:border-purple-500/30 transition-all"
                                    >
                                        {/* Post Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            {mentor.user.profileImage ? (
                                                <Image
                                                    src={mentor.user.profileImage}
                                                    alt={getMentorName()}
                                                    width={48} height={48} className="rounded-full object-cover w-12 h-12"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-foreground">{getMentorName()[0]}</span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground">{getMentorName()}</span>
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
                                                <span className="text-sm text-muted-foreground">{post.timestamp}</span>
                                            </div>
                                        </div>

                                        {/* Post Content */}
                                        {isLocked ? (
                                            <div className="relative min-h-[200px]">
                                                <div className="blur-sm pointer-events-none">
                                                    <p className="text-white mb-4">{post.content.slice(0, 50)}...</p>
                                                    {post.media && (
                                                        <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl" />
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 rounded-xl backdrop-blur-sm">
                                                    <div className="text-center px-6 py-8">
                                                        <Lock className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
                                                        <h4 className="text-xl font-bold text-foreground mb-2">
                                                            {isArabic ? 'محتوى حصري' : 'Exclusive Content'}
                                                        </h4>
                                                        <p className="text-muted-foreground mb-1">
                                                            {isArabic ? 'هذا المنشور متاح لمشتركي' : 'This post is available for'}
                                                        </p>
                                                        <Badge className={`${
                                                            post.tier === 'VIP' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                                            post.tier === 'PREMIUM' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                                            'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                        } text-white border-0 text-lg mb-6`}>
                                                            <Crown className="w-4 h-4 mr-1" />
                                                            {post.tier} {isArabic ? 'الأعضاء' : 'Members'}
                                                        </Badge>
                                                        <div className="flex flex-col gap-2 max-w-xs mx-auto">
                                                            <Button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    if (!session) {
                                                                        router.push(`/${locale}/login`)
                                                                        return
                                                                    }
                                                                    handleSubscribe(post.tier as any)
                                                                }}
                                                                disabled={isSubscribing}
                                                                className={`w-full ${
                                                                    post.tier === 'VIP' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' :
                                                                    post.tier === 'PREMIUM' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' :
                                                                    'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                                                                } disabled:opacity-50`}
                                                            >
                                                                <Crown className="w-4 h-4 mr-2" />
                                                                {isSubscribing 
                                                                    ? (isArabic ? 'جاري...' : 'Processing...') 
                                                                    : (isArabic ? `اشترك في ${post.tier}` : `Subscribe to ${post.tier}`)
                                                                }
                                                            </Button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                                                }}
                                                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                {isArabic ? 'عرض جميع الخطط' : 'View all plans'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                                                
                                                {/* Media */}
                                                {post.media && post.type === 'image' && (
                                                    <div className="relative rounded-xl overflow-hidden border border-border mb-4 group">
                                                        <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                                                            <ImageIcon className="w-16 h-16 text-purple-500" />
                                                        </div>
                                                        {/* Download Button - VIP Only */}
                                                        <div className="absolute top-4 right-4 flex gap-2">
                                                            {currentSubscription === 'VIP' ? (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDownloadContent(post.id, post.media!, 'image')
                                                                    }}
                                                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Download className="w-4 h-4 mr-1" />
                                                                    {isArabic ? 'تحميل' : 'Download'}
                                                                </Button>
                                                            ) : (
                                                                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                                                                    <Lock className="w-4 h-4 text-yellow-400" />
                                                                    <span className="text-xs text-white">
                                                                        {isArabic ? 'VIP فقط' : 'VIP Only'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                                {post.media && post.type === 'video' && (
                                                    <div className="relative rounded-xl overflow-hidden border border-border mb-4 group">
                                                        <div className="aspect-video bg-gradient-to-br from-purple-900/30 to-pink-900/30 flex items-center justify-center">
                                                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center">
                                                                <Play className="w-8 h-8 text-foreground ml-1" />
                                                            </div>
                                                        </div>
                                                        {/* Download Button - VIP Only */}
                                                        <div className="absolute top-4 right-4 flex gap-2">
                                                            {currentSubscription === 'VIP' ? (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDownloadContent(post.id, post.media!, 'video')
                                                                    }}
                                                                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Download className="w-4 h-4 mr-1" />
                                                                    {isArabic ? 'تحميل' : 'Download'}
                                                                </Button>
                                                            ) : (
                                                                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                                                                    <Lock className="w-4 h-4 text-yellow-400" />
                                                                    <span className="text-xs text-white">
                                                                        {isArabic ? 'VIP فقط' : 'VIP Only'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Engagement Stats */}
                                                <div className="flex items-center justify-between text-muted-foreground text-sm border-t border-border pt-4">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleLikePost(post.id)
                                                        }}
                                                        disabled={!session}
                                                        className="flex items-center gap-2 hover:text-pink-400 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                                                            <Heart className="w-5 h-5" />
                                                        </div>
                                                        <span>{post.likes.toLocaleString()}</span>
                                                    </button>

                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (!session) {
                                                                toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
                                                                return
                                                            }
                                                            toggleComments(post.id)
                                                        }}
                                                        className="flex items-center gap-2 hover:text-purple-400 transition-colors group"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-purple-500/10">
                                                            <MessageSquare className="w-5 h-5" />
                                                        </div>
                                                        <span>{post.comments}</span>
                                                    </button>

                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Eye className="w-5 h-5" />
                                                        <span>{post.views.toLocaleString()}</span>
                                                    </div>

                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleShare()
                                                        }}
                                                        className="flex items-center gap-2 hover:text-blue-400 transition-colors group"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                                                            <Share2 className="w-5 h-5" />
                                                        </div>
                                                    </button>
                                                </div>

                                                {/* Comments Section */}
                                                <AnimatePresence>
                                                    {expandedComments.has(post.id) && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="border-t border-border mt-4 pt-4"
                                                        >
                                                            {/* Add Comment Input - Only for subscribers */}
                                                            {currentSubscription ? (
                                                                <div className="flex gap-3 mb-4">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                                                        <span className="text-xs font-bold text-white">
                                                                            {session?.user?.name?.[0] || 'U'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <Input
                                                                            value={newComment[post.id] || ''}
                                                                            onChange={(e) => setNewComment(prev => ({ 
                                                                                ...prev, 
                                                                                [post.id]: e.target.value 
                                                                            }))}
                                                                            placeholder={isArabic ? 'اكتب تعليقاً...' : 'Write a comment...'}
                                                                            className="bg-background border-border mb-2"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                                    e.preventDefault()
                                                                                    handleAddComment(post.id)
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleAddComment(post.id)}
                                                                            disabled={!newComment[post.id]?.trim()}
                                                                            className="bg-purple-500 hover:bg-purple-600 text-white"
                                                                        >
                                                                            <Send className="w-3 h-3 mr-1" />
                                                                            {isArabic ? 'إرسال' : 'Post'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-4">
                                                                    <p className="text-sm text-foreground text-center">
                                                                        {isArabic ? 'اشترك للتعليق على المنشورات' : 'Subscribe to comment on posts'}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Comments List */}
                                                            {commentLoading[post.id] ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                                                </div>
                                                            ) : postComments[post.id]?.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {postComments[post.id].map((comment) => (
                                                                        <div key={comment.id} className="flex gap-3">
                                                                            {comment.author.profileImage ? (
                                                                                <Image
                                                                                    src={comment.author.profileImage}
                                                                                    alt={isArabic && comment.author.arabicName ? comment.author.arabicName : comment.author.name}
                                                                                    width={32}
                                                                                    height={32}
                                                                                    className="rounded-full object-cover w-8 h-8"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                                                                    <span className="text-xs font-bold text-white">
                                                                                        {(isArabic && comment.author.arabicName ? comment.author.arabicName : comment.author.name)[0]}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1">
                                                                                <div className="bg-card-hover rounded-lg px-3 py-2">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <span className="text-sm font-semibold text-foreground">
                                                                                            {isArabic && comment.author.arabicName ? comment.author.arabicName : comment.author.name}
                                                                                        </span>
                                                                                        <span className="text-xs text-muted-foreground">
                                                                                            {comment.timestamp}
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-sm text-foreground">
                                                                                        {comment.content}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex items-center gap-3 mt-1 ml-3">
                                                                                    <button className="text-xs text-muted-foreground hover:text-pink-400 transition-colors">
                                                                                        {isArabic ? 'إعجاب' : 'Like'} {comment.likes > 0 && `(${comment.likes})`}
                                                                                    </button>
                                                                                    <button className="text-xs text-muted-foreground hover:text-purple-400 transition-colors">
                                                                                        {isArabic ? 'رد' : 'Reply'}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-center text-muted-foreground text-sm py-4">
                                                                    {isArabic ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                                                                </p>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
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
                            className="space-y-6"
                        >
                            {/* Media Filter Tabs */}
                            <div className="flex items-center gap-2 p-1 bg-card border border-border rounded-xl w-fit">
                                <button className="px-4 py-2 rounded-lg bg-purple-500 text-foreground font-semibold text-sm transition-all">
                                    {isArabic ? 'الكل' : 'All'}
                                </button>
                                <button className="px-4 py-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground font-semibold text-sm transition-all">
                                    {isArabic ? 'صور' : 'Photos'}
                                </button>
                                <button className="px-4 py-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground font-semibold text-sm transition-all">
                                    {isArabic ? 'فيديوهات' : 'Videos'}
                                </button>
                            </div>

                            {/* Media Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-card border border-border rounded-xl p-4">
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {posts.filter(p => p.media).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'إجمالي الوسائط' : 'Total Media'}
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-4">
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {posts.filter(p => p.type === 'image').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'الصور' : 'Photos'}
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-4">
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {posts.filter(p => p.type === 'video').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'الفيديوهات' : 'Videos'}
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-4">
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {posts.filter(p => p.media && !canViewPost(p)).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'حصري' : 'Exclusive'}
                                    </div>
                                </div>
                            </div>

                            {/* Media Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {posts.filter(p => p.media).map((post, i) => {
                                    const isLocked = post.isLocked && !canViewPost(post)
                                    
                                    return (
                                        <motion.div
                                            key={post.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="relative aspect-square rounded-xl overflow-hidden border border-border group cursor-pointer"
                                        >
                                            {/* Background */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${
                                                post.type === 'video' 
                                                    ? 'from-purple-900/30 to-pink-900/30' 
                                                    : 'from-purple-600/20 to-pink-600/20'
                                            }`} />

                                            {isLocked ? (
                                                <>
                                                    {/* Blurred Preview */}
                                                    <div className="absolute inset-0 backdrop-blur-xl bg-background/90" />
                                                    
                                                    {/* Lock Overlay */}
                                                    <div 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (!session) {
                                                                toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
                                                                router.push(`/${locale}/login`)
                                                                return
                                                            }
                                                            handleSubscribe(post.tier as any)
                                                        }}
                                                        className="absolute inset-0 flex flex-col items-center justify-center p-4 hover:bg-background/95 transition-colors cursor-pointer"
                                                    >
                                                        <Lock className="w-8 h-8 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                                                        <Badge className={`${
                                                            post.tier === 'VIP' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                                            post.tier === 'PREMIUM' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                                            'bg-gradient-to-r from-blue-500 to-cyan-500'
                                                        } text-white border-0 text-xs mb-2`}>
                                                            <Crown className="w-3 h-3 mr-1" />
                                                            {post.tier}
                                                        </Badge>
                                                        <p className="text-xs text-foreground font-semibold text-center">
                                                            {isSubscribing 
                                                                ? (isArabic ? 'جاري...' : 'Processing...') 
                                                                : (isArabic ? 'انقر للاشتراك' : 'Click to Subscribe')
                                                            }
                                                        </p>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Content Type Icon */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        {post.type === 'video' ? (
                                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Play className="w-6 h-6 text-white ml-0.5" />
                                                            </div>
                                                        ) : (
                                                            <ImageIcon className="w-12 h-12 text-white/60 group-hover:text-white/80 transition-colors" />
                                                        )}
                                                    </div>

                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />

                                                    {/* Stats Overlay */}
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="flex items-center justify-between text-white text-xs">
                                                            <div className="flex items-center gap-3">
                                                                <span className="flex items-center gap-1">
                                                                    <Heart className="w-3 h-3" />
                                                                    {post.likes}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" />
                                                                    {post.views}
                                                                </span>
                                                            </div>
                                                            <span className="text-muted-foreground">{post.timestamp}</span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Tier Badge (Top Right) */}
                                            {post.tier !== 'FREE' && (
                                                <div className="absolute top-2 right-2">
                                                    <Badge className={`${
                                                        post.tier === 'VIP' ? 'bg-yellow-500/90' :
                                                        post.tier === 'PREMIUM' ? 'bg-purple-500/90' :
                                                        'bg-blue-500/90'
                                                    } text-white border-0 text-xs backdrop-blur-sm`}>
                                                        {post.tier}
                                                    </Badge>
                                                </div>
                                            )}
                                        </motion.div>
                                    )
                                })}
                            </div>

                            {/* Empty State */}
                            {posts.filter(p => p.media).length === 0 && (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">
                                        {isArabic ? 'لا توجد وسائط' : 'No Media Yet'}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {isArabic ? 'لم يتم نشر أي صور أو فيديوهات بعد' : 'No photos or videos have been posted yet'}
                                    </p>
                                </div>
                            )}

                            {/* Load More Button */}
                            {posts.filter(p => p.media).length > 0 && (
                                <div className="text-center pt-4">
                                    <Button className="bg-card hover:bg-card-hover text-foreground border border-border">
                                        {isArabic ? 'تحميل المزيد' : 'Load More'}
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Live Sessions Tab */}
                    {activeTab === 'sessions' && (
                        <motion.div
                            key="sessions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-6 h-6 text-purple-400" />
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isArabic ? 'الجلسات القادمة' : 'Upcoming Live Sessions'}
                                        </h3>
                                    </div>
                                    {currentSubscription && (
                                        <Badge className="bg-purple-500 text-white border-0">
                                            {currentSubscription}
                                        </Badge>
                                    )}
                                </div>

                                {sessionsLoading ? (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-muted-foreground">
                                            {isArabic ? 'جاري التحميل...' : 'Loading sessions...'}
                                        </p>
                                    </div>
                                ) : upcomingSessions.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">
                                            {isArabic ? 'لا توجد جلسات قادمة' : 'No Upcoming Sessions'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {isArabic ? 'ليس هناك جلسات مجدولة حالياً' : 'No sessions are currently scheduled'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {upcomingSessions.map((session) => {
                                            const sessionDate = new Date(session.date)
                                            const canJoin = currentSubscription && (
                                                session.requiredTier === 'BASIC' ||
                                                (session.requiredTier === 'PREMIUM' && ['PREMIUM', 'VIP'].includes(currentSubscription)) ||
                                                (session.requiredTier === 'VIP' && currentSubscription === 'VIP')
                                            )
                                            const isLocked = !canJoin

                                            return (
                                                <motion.div
                                                    key={session.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={`relative bg-gradient-to-br ${
                                                        session.requiredTier === 'VIP' 
                                                            ? 'from-yellow-900/20 to-orange-900/20 border-yellow-500/30' 
                                                            : session.requiredTier === 'PREMIUM'
                                                            ? 'from-purple-900/20 to-pink-900/20 border-purple-500/30'
                                                            : 'from-blue-900/20 to-cyan-900/20 border-blue-500/30'
                                                    } border rounded-xl p-5 hover:border-purple-400 transition-all`}
                                                >
                                                    {/* Session Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge className={`${
                                                                    session.requiredTier === 'VIP' 
                                                                        ? 'bg-yellow-500' 
                                                                        : session.requiredTier === 'PREMIUM'
                                                                        ? 'bg-purple-500'
                                                                        : 'bg-blue-500'
                                                                } text-white border-0 text-xs`}>
                                                                    <Crown className="w-3 h-3 mr-1" />
                                                                    {session.requiredTier}
                                                                </Badge>
                                                                <Badge className="bg-card text-foreground border border-border text-xs">
                                                                    {session.type === 'ONE_ON_ONE' 
                                                                        ? (isArabic ? '1:1' : '1-on-1')
                                                                        : session.type === 'GROUP_QA'
                                                                        ? (isArabic ? 'أسئلة وأجوبة' : 'Group Q&A')
                                                                        : (isArabic ? 'ورشة عمل' : 'Workshop')
                                                                    }
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-bold text-foreground text-lg mb-1">
                                                                {session.title}
                                                            </h4>
                                                        </div>
                                                        {isLocked && (
                                                            <Lock className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>

                                                    {/* Session Details */}
                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="w-4 h-4" />
                                                            <span>
                                                                {sessionDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                    weekday: 'long',
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Video className="w-4 h-4" />
                                                            <span>
                                                                {sessionDate.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })} • {session.duration} {isArabic ? 'دقيقة' : 'min'}
                                                            </span>
                                                        </div>
                                                        {session.type !== 'ONE_ON_ONE' && (
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                <Users className="w-4 h-4" />
                                                                <span>
                                                                    {session.attendees} / {session.maxAttendees} {isArabic ? 'مشارك' : 'attendees'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Button */}
                                                    {isLocked ? (
                                                        <Button
                                                            onClick={() => {
                                                                if (!session) {
                                                                    toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
                                                                    router.push(`/${locale}/login`)
                                                                    return
                                                                }
                                                                document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                                            }}
                                                            className="w-full bg-card hover:bg-card-hover text-foreground border border-border"
                                                        >
                                                            <Lock className="w-4 h-4 mr-2" />
                                                            {isArabic ? `اشترك في ${session.requiredTier} للانضمام` : `Subscribe to ${session.requiredTier} to Join`}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            onClick={() => {
                                                                if (session.joinLink) {
                                                                    router.push(session.joinLink)
                                                                } else {
                                                                    toast.success(isArabic ? 'ستتلقى رابط الانضمام قريباً' : 'You will receive the join link soon')
                                                                }
                                                            }}
                                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                                                        >
                                                            <Video className="w-4 h-4 mr-2" />
                                                            {isArabic ? 'انضم للجلسة' : 'Join Session'}
                                                        </Button>
                                                    )}
                                                </motion.div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Info Box */}
                                {!currentSubscription && upcomingSessions.length > 0 && (
                                    <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Crown className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">
                                                    {isArabic ? 'اشترك للوصول' : 'Subscribe for Access'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic 
                                                        ? 'اشترك في أحد الباقات للانضمام إلى الجلسات المباشرة'
                                                        : 'Subscribe to a tier to join live sessions and interact with the mentor'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Archived Session Recordings */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Play className="w-6 h-6 text-pink-400" />
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isArabic ? 'التسجيلات المؤرشفة' : 'Archived Recordings'}
                                        </h3>
                                    </div>
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex items-center gap-2 mb-6 flex-wrap">
                                    <button
                                        onClick={() => setSessionFilter('all')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            sessionFilter === 'all'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {isArabic ? 'الكل' : 'All'}
                                    </button>
                                    <button
                                        onClick={() => setSessionFilter('workshop')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            sessionFilter === 'workshop'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {isArabic ? 'ورش العمل' : 'Workshops'}
                                    </button>
                                    <button
                                        onClick={() => setSessionFilter('qa')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            sessionFilter === 'qa'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {isArabic ? 'أسئلة وأجوبة' : 'Q&A Sessions'}
                                    </button>
                                    <button
                                        onClick={() => setSessionFilter('oneOnOne')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            sessionFilter === 'oneOnOne'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {isArabic ? '1:1' : '1-on-1'}
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="mb-6">
                                    <Input
                                        value={searchRecording}
                                        onChange={(e) => setSearchRecording(e.target.value)}
                                        placeholder={isArabic ? 'ابحث في التسجيلات...' : 'Search recordings...'}
                                        className="bg-background border-border"
                                    />
                                </div>

                                {/* Archived Sessions Grid */}
                                <div className="grid gap-4">
                                    {archivedSessions
                                        .filter(session => {
                                            // Filter by type
                                            if (sessionFilter === 'workshop' && session.type !== 'WORKSHOP') return false
                                            if (sessionFilter === 'qa' && session.type !== 'GROUP_QA') return false
                                            if (sessionFilter === 'oneOnOne' && session.type !== 'ONE_ON_ONE') return false
                                            
                                            // Filter by search
                                            if (searchRecording && !session.title.toLowerCase().includes(searchRecording.toLowerCase())) return false
                                            
                                            return true
                                        })
                                        .map((session, index) => {
                                            const canAccess = currentSubscription && (
                                                session.requiredTier === 'BASIC' ||
                                                (session.requiredTier === 'PREMIUM' && ['PREMIUM', 'VIP'].includes(currentSubscription)) ||
                                                (session.requiredTier === 'VIP' && currentSubscription === 'VIP')
                                            )
                                            const recordedDate = new Date(session.recordedDate)

                                            return (
                                                <motion.div
                                                    key={session.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="relative bg-gradient-to-br from-purple-900/10 to-pink-900/10 border border-purple-500/20 rounded-xl overflow-hidden hover:border-purple-400 transition-all group"
                                                >
                                                    <div className="flex gap-4 p-4">
                                                        {/* Thumbnail */}
                                                        <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-purple-600/30 to-pink-600/30">
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                    <Play className="w-6 h-6 text-white ml-0.5" />
                                                                </div>
                                                            </div>
                                                            {!canAccess && (
                                                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                                                    <Lock className="w-6 h-6 text-white" />
                                                                </div>
                                                            )}
                                                            <div className="absolute top-2 right-2">
                                                                <Badge className="bg-black/60 text-white border-0 text-xs backdrop-blur-sm">
                                                                    {session.duration} {isArabic ? 'د' : 'min'}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {/* Session Info */}
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge className={`${
                                                                            session.requiredTier === 'VIP' 
                                                                                ? 'bg-yellow-500' 
                                                                                : session.requiredTier === 'PREMIUM'
                                                                                ? 'bg-purple-500'
                                                                                : 'bg-blue-500'
                                                                        } text-white border-0 text-xs`}>
                                                                            {session.requiredTier}
                                                                        </Badge>
                                                                        <Badge className="bg-card text-foreground border border-border text-xs">
                                                                            {session.type === 'ONE_ON_ONE' 
                                                                                ? '1:1'
                                                                                : session.type === 'GROUP_QA'
                                                                                ? (isArabic ? 'Q&A' : 'Q&A')
                                                                                : (isArabic ? 'ورشة' : 'Workshop')
                                                                            }
                                                                        </Badge>
                                                                    </div>
                                                                    <h4 className="font-bold text-foreground text-sm mb-1">
                                                                        {session.title}
                                                                    </h4>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                                        {session.description}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center justify-between mt-3">
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        {recordedDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Eye className="w-3 h-3" />
                                                                        {session.views}
                                                                    </span>
                                                                </div>

                                                                {canAccess ? (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            toast.success(isArabic ? 'جاري تشغيل التسجيل...' : 'Playing recording...')
                                                                            // In production: router.push(`/session/${session.id}/recording`)
                                                                        }}
                                                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                                    >
                                                                        <Play className="w-3 h-3 mr-1" />
                                                                        {isArabic ? 'مشاهدة' : 'Watch'}
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            if (!session) {
                                                                                toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
                                                                                router.push(`/${locale}/login`)
                                                                                return
                                                                            }
                                                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                                                        }}
                                                                        className="bg-card hover:bg-card-hover text-foreground border border-border"
                                                                    >
                                                                        <Lock className="w-3 h-3 mr-1" />
                                                                        {isArabic ? 'اشترك' : 'Subscribe'}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                </div>

                                {/* Empty State */}
                                {archivedSessions.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                            <Play className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">
                                            {isArabic ? 'لا توجد تسجيلات' : 'No Recordings Yet'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {isArabic ? 'سيتم إضافة التسجيلات المؤرشفة هنا' : 'Archived session recordings will appear here'}
                                        </p>
                                    </div>
                                )}

                                {/* Info Box */}
                                {!currentSubscription && archivedSessions.length > 0 && (
                                    <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Play className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">
                                                    {isArabic ? 'اشترك للمشاهدة' : 'Subscribe to Watch'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic 
                                                        ? 'اشترك للوصول إلى مكتبة التسجيلات المؤرشفة الكاملة'
                                                        : 'Subscribe to access the full library of archived session recordings'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Community Tab */}
                    {activeTab === 'community' && (
                        <motion.div
                            key="community"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Pinned Resources Section */}
                            {pinnedResources.length > 0 && (
                                <div className="bg-card border border-border rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Paperclip className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-lg font-bold text-foreground">
                                            {isArabic ? 'الموارد المثبتة' : 'Pinned Resources'}
                                        </h3>
                                    </div>
                                    <div className="grid gap-3">
                                        {pinnedResources.map((resource) => (
                                            <motion.div
                                                key={resource.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg hover:border-purple-400 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                        {resource.type === 'PDF' && <Paperclip className="w-5 h-5 text-purple-400" />}
                                                        {resource.type === 'Video' && <Video className="w-5 h-5 text-purple-400" />}
                                                        {resource.type === 'Excel' && <Paperclip className="w-5 h-5 text-green-400" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-foreground text-sm">
                                                            {resource.title}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            {resource.size} • {resource.downloads} {isArabic ? 'تحميل' : 'downloads'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                                                    {isArabic ? 'تحميل' : 'Download'}
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Community Discussion Board */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare className="w-6 h-6 text-purple-400" />
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isArabic ? 'لوحة النقاش' : 'Discussion Board'}
                                        </h3>
                                    </div>
                                    {currentSubscription && (
                                        <Badge className="bg-purple-500 text-white border-0">
                                            {currentSubscription}
                                        </Badge>
                                    )}
                                </div>

                                {/* New Post Input */}
                                <div className="mb-6">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-white">
                                                {session?.user?.name?.[0] || 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={newPostContent}
                                                onChange={(e) => setNewPostContent(e.target.value)}
                                                placeholder={isArabic ? 'شارك أفكارك مع المجتمع...' : 'Share your thoughts with the community...'}
                                                className="w-full bg-background border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                                rows={3}
                                            />
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center gap-2">
                                                    <button className="p-2 hover:bg-card-hover rounded-lg transition-colors">
                                                        <Smile className="w-5 h-5 text-muted-foreground" />
                                                    </button>
                                                    <button className="p-2 hover:bg-card-hover rounded-lg transition-colors">
                                                        <Paperclip className="w-5 h-5 text-muted-foreground" />
                                                    </button>
                                                </div>
                                                <Button 
                                                    onClick={() => {
                                                        if (newPostContent.trim()) {
                                                            toast.success(isArabic ? 'تم نشر التعليق' : 'Post shared!')
                                                            setNewPostContent('')
                                                        }
                                                    }}
                                                    disabled={!newPostContent.trim()}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                >
                                                    <Send className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'نشر' : 'Post'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Community Posts */}
                                {communityLoading ? (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                                        <p className="text-muted-foreground">
                                            {isArabic ? 'جاري التحميل...' : 'Loading discussions...'}
                                        </p>
                                    </div>
                                ) : communityPosts.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">
                                            {isArabic ? 'كن أول من يبدأ النقاش' : 'Be the First to Start a Discussion'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {isArabic ? 'شارك أفكارك وتواصل مع الأعضاء' : 'Share your thoughts and connect with members'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {communityPosts.map((post) => (
                                            <motion.div
                                                key={post.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="border border-border rounded-xl p-4 hover:border-purple-500/30 transition-all"
                                            >
                                                {/* Post Header */}
                                                <div className="flex items-start gap-3 mb-3">
                                                    {post.author.profileImage ? (
                                                        <Image
                                                            src={post.author.profileImage}
                                                            alt={isArabic && post.author.arabicName ? post.author.arabicName : post.author.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full object-cover w-10 h-10"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                                            <span className="text-sm font-bold text-white">
                                                                {(isArabic && post.author.arabicName ? post.author.arabicName : post.author.name)[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-foreground">
                                                                {isArabic && post.author.arabicName ? post.author.arabicName : post.author.name}
                                                            </span>
                                                            <Badge className={`${
                                                                post.author.tier === 'VIP' ? 'bg-yellow-500' :
                                                                post.author.tier === 'PREMIUM' ? 'bg-purple-500' :
                                                                'bg-blue-500'
                                                            } text-white border-0 text-xs`}>
                                                                {post.author.tier}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">• {post.timestamp}</span>
                                                        </div>
                                                    </div>
                                                    <button className="p-1 hover:bg-card-hover rounded-lg transition-colors">
                                                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                </div>

                                                {/* Post Content */}
                                                <p className="text-foreground mb-3 leading-relaxed">
                                                    {post.content}
                                                </p>

                                                {/* Post Actions */}
                                                <div className="flex items-center gap-4 text-sm">
                                                    <button className="flex items-center gap-1 text-muted-foreground hover:text-purple-400 transition-colors">
                                                        <Heart className="w-4 h-4" />
                                                        <span>{post.likes}</span>
                                                    </button>
                                                    <button className="flex items-center gap-1 text-muted-foreground hover:text-purple-400 transition-colors">
                                                        <MessageCircle className="w-4 h-4" />
                                                        <span>{post.replies} {isArabic ? 'رد' : 'replies'}</span>
                                                    </button>
                                                    <button className="flex items-center gap-1 text-muted-foreground hover:text-purple-400 transition-colors ml-auto">
                                                        <Share2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Community Guidelines Info */}
                                <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground mb-1">
                                                {isArabic ? 'إرشادات المجتمع' : 'Community Guidelines'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isArabic 
                                                    ? 'كن محترماً ومفيداً. شارك المعرفة وساعد الآخرين على التعلم.'
                                                    : 'Be respectful and helpful. Share knowledge and help others learn.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Resources Tab */}
                    {activeTab === 'resources' && (
                        <motion.div
                            key="resources"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Paperclip className="w-6 h-6 text-green-400" />
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isArabic ? 'مكتبة الموارد' : 'Resource Library'}
                                        </h3>
                                    </div>
                                    <Badge className="bg-green-500 text-white border-0">
                                        {resources.length} {isArabic ? 'موارد' : 'Resources'}
                                    </Badge>
                                </div>

                                {/* Category Filter */}
                                <div className="flex items-center gap-2 mb-6 flex-wrap">
                                    <button
                                        onClick={() => setResourceCategory('all')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            resourceCategory === 'all'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {isArabic ? 'الكل' : 'All'}
                                    </button>
                                    <button
                                        onClick={() => setResourceCategory('pdf')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            resourceCategory === 'pdf'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        📄 PDF
                                    </button>
                                    <button
                                        onClick={() => setResourceCategory('video')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            resourceCategory === 'video'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        🎥 {isArabic ? 'فيديو' : 'Video'}
                                    </button>
                                    <button
                                        onClick={() => setResourceCategory('template')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            resourceCategory === 'template'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        📋 {isArabic ? 'قوالب' : 'Templates'}
                                    </button>
                                    <button
                                        onClick={() => setResourceCategory('code')}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            resourceCategory === 'code'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        💻 {isArabic ? 'أكواد' : 'Code'}
                                    </button>
                                </div>

                                {/* Search Bar */}
                                <div className="mb-6">
                                    <Input
                                        value={searchResource}
                                        onChange={(e) => setSearchResource(e.target.value)}
                                        placeholder={isArabic ? 'ابحث في الموارد...' : 'Search resources...'}
                                        className="bg-background border-border"
                                    />
                                </div>

                                {/* Resources List */}
                                <div className="space-y-3">
                                    {resources
                                        .filter(resource => {
                                            if (resourceCategory !== 'all' && resource.category !== resourceCategory) return false
                                            if (searchResource && !resource.title.toLowerCase().includes(searchResource.toLowerCase())) return false
                                            return true
                                        })
                                        .map((resource, index) => {
                                            const canAccess = currentSubscription && (
                                                resource.requiredTier === 'BASIC' ||
                                                (resource.requiredTier === 'PREMIUM' && ['PREMIUM', 'VIP'].includes(currentSubscription)) ||
                                                (resource.requiredTier === 'VIP' && currentSubscription === 'VIP')
                                            )
                                            const uploadedDate = new Date(resource.uploadedDate)

                                            return (
                                                <motion.div
                                                    key={resource.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="bg-gradient-to-r from-green-900/10 to-emerald-900/10 border border-green-500/20 rounded-xl p-4 hover:border-green-400 transition-all"
                                                >
                                                    <div className="flex items-start gap-4">
                                                        {/* Icon */}
                                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                            resource.type === 'PDF' ? 'bg-red-500/20' :
                                                            resource.type === 'Video' ? 'bg-purple-500/20' :
                                                            resource.type === 'Excel' || resource.type === 'Template' ? 'bg-green-500/20' :
                                                            'bg-blue-500/20'
                                                        }`}>
                                                            {resource.type === 'PDF' && <span className="text-2xl">📄</span>}
                                                            {resource.type === 'Video' && <Play className="w-6 h-6 text-purple-400" />}
                                                            {(resource.type === 'Excel' || resource.type === 'Template') && <span className="text-2xl">📋</span>}
                                                            {resource.type === 'Code' && <span className="text-2xl">💻</span>}
                                                        </div>

                                                        {/* Resource Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-bold text-foreground text-sm">
                                                                            {resource.title}
                                                                        </h4>
                                                                        <Badge className={`${
                                                                            resource.requiredTier === 'VIP' ? 'bg-yellow-500' :
                                                                            resource.requiredTier === 'PREMIUM' ? 'bg-purple-500' :
                                                                            'bg-blue-500'
                                                                        } text-white border-0 text-xs flex-shrink-0`}>
                                                                            {resource.requiredTier}
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                                        {resource.description}
                                                                    </p>
                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                        <span>{resource.size}</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Download className="w-3 h-3" />
                                                                            {resource.downloads} {isArabic ? 'تحميل' : 'downloads'}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3" />
                                                                            {uploadedDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Action Button */}
                                                            <div className="flex items-center gap-2 mt-3">
                                                                {canAccess ? (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            toast.success(isArabic ? 'جاري التحميل...' : 'Downloading...')
                                                                            // In production: trigger actual file download
                                                                        }}
                                                                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                                                    >
                                                                        <Download className="w-3 h-3 mr-1" />
                                                                        {isArabic ? 'تحميل' : 'Download'}
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            if (!session) {
                                                                                toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
                                                                                router.push(`/${locale}/login`)
                                                                                return
                                                                            }
                                                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                                                        }}
                                                                        className="bg-card hover:bg-card-hover text-foreground border border-border"
                                                                    >
                                                                        <Lock className="w-3 h-3 mr-1" />
                                                                        {isArabic ? `اشترك في ${resource.requiredTier}` : `Subscribe to ${resource.requiredTier}`}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                </div>

                                {/* Empty State */}
                                {resources.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                            <Paperclip className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">
                                            {isArabic ? 'لا توجد موارد بعد' : 'No Resources Yet'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {isArabic ? 'سيتم إضافة الموارد القابلة للتحميل هنا' : 'Downloadable resources will appear here'}
                                        </p>
                                    </div>
                                )}

                                {/* Info Box */}
                                {!currentSubscription && resources.length > 0 && (
                                    <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <Paperclip className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-semibold text-foreground mb-1">
                                                    {isArabic ? 'اشترك للتحميل' : 'Subscribe to Download'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic 
                                                        ? 'احصل على وصول كامل إلى جميع الموارد القابلة للتحميل'
                                                        : 'Get full access to all downloadable resources and materials'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
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
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <h3 className="text-xl font-bold text-foreground mb-4">{isArabic ? 'حول' : 'About'}</h3>
                                <p className="text-muted-foreground leading-relaxed mb-6">{mentor.user.bio}</p>
                                
                                <div className="space-y-4 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">{isArabic ? 'الخبرة' : 'Experience'}</span>
                                        <span className="text-foreground font-semibold">{mentor.stats.yearsOfExperience}+ {isArabic ? 'سنوات' : 'years'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">{isArabic ? 'التقييم' : 'Rating'}</span>
                                        <span className="text-foreground font-semibold flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            {mentor.stats.averageRating.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">{isArabic ? 'المنشورات' : 'Total Posts'}</span>
                                        <span className="text-foreground font-semibold">{mentor.stats.totalPosts}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Profile/Creator Dashboard Tab - OnlyFans Style (Creator Only) */}
                    {isCreatorView && activeTab === 'profile' && creatorStats && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Welcome Header */}
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Crown className="w-8 h-8 text-yellow-400" />
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground">
                                            {isArabic ? 'مرحباً بك، ' + getMentorName() : 'Welcome, ' + getMentorName()}
                                        </h2>
                                        <p className="text-muted-foreground">
                                            {isArabic ? 'لوحة تحكم المنشئ' : 'Creator Dashboard'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Earnings Overview */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isArabic ? 'الأرباح' : 'Earnings'}
                                        </h3>
                                    </div>
                                    <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                                        {isArabic ? 'سحب' : 'Withdraw'}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'هذا الشهر' : 'This Month'}</div>
                                        <div className="text-2xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                            {creatorStats.earnings.thisMonth.toLocaleString()} EGP
                                        </div>
                                        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            +{Math.round(((creatorStats.earnings.thisMonth - creatorStats.earnings.lastMonth) / creatorStats.earnings.lastMonth) * 100)}%
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'الشهر الماضي' : 'Last Month'}</div>
                                        <div className="text-2xl font-black text-foreground">
                                            {creatorStats.earnings.lastMonth.toLocaleString()} EGP
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'إجمالي الأرباح' : 'Total Earnings'}</div>
                                        <div className="text-2xl font-black text-foreground">
                                            {creatorStats.earnings.total.toLocaleString()} EGP
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'قيد الانتظار' : 'Pending'}</div>
                                        <div className="text-2xl font-black text-foreground">
                                            {creatorStats.earnings.pending.toLocaleString()} EGP
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subscribers Analytics */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Users className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        {isArabic ? 'المشتركون' : 'Subscribers'}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                                        <div className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
                                            {creatorStats.subscribers.basic}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Basic</div>
                                    </div>

                                    <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                                        <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                            {creatorStats.subscribers.premium}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Premium</div>
                                    </div>

                                    <div className="text-center p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                                        <div className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-1">
                                            {creatorStats.subscribers.vip}
                                        </div>
                                        <div className="text-xs text-muted-foreground">VIP</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'إجمالي المشتركين' : 'Total Subs'}</div>
                                        <div className="text-xl font-black text-foreground">{creatorStats.subscribers.total.toLocaleString()}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'جدد هذا الشهر' : 'New This Month'}</div>
                                        <div className="text-xl font-black text-green-400">+{creatorStats.subscribers.newThisMonth}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'معدل التسرب' : 'Churn Rate'}</div>
                                        <div className="text-xl font-black text-red-400">{creatorStats.subscribers.churnRate}%</div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Performance */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-pink-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground">
                                        {isArabic ? 'أداء المحتوى' : 'Content Performance'}
                                    </h3>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <MessageCircle className="w-4 h-4 text-purple-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'المنشورات' : 'Posts'}</div>
                                        </div>
                                        <div className="text-2xl font-black text-foreground">{creatorStats.content.posts}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye className="w-4 h-4 text-blue-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'المشاهدات' : 'Views'}</div>
                                        </div>
                                        <div className="text-2xl font-black text-foreground">{creatorStats.content.totalViews.toLocaleString()}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Heart className="w-4 h-4 text-pink-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'متوسط الإعجابات' : 'Avg Likes'}</div>
                                        </div>
                                        <div className="text-2xl font-black text-foreground">{creatorStats.engagement.avgLikes}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-yellow-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'معدل التفاعل' : 'Engagement'}</div>
                                        </div>
                                        <div className="text-2xl font-black text-foreground">{creatorStats.engagement.engagementRate}%</div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Video className="w-4 h-4 text-purple-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'جلسات مكتملة' : 'Sessions Done'}</div>
                                        </div>
                                        <div className="text-xl font-black text-foreground">{creatorStats.content.liveSessionsCompleted}</div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Download className="w-4 h-4 text-green-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'التحميلات' : 'Downloads'}</div>
                                        </div>
                                        <div className="text-xl font-black text-foreground">{creatorStats.content.totalDownloads.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Top Subscribers */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Crown className="w-6 h-6 text-yellow-400" />
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isArabic ? 'أفضل المشتركين' : 'Top Subscribers'}
                                        </h3>
                                    </div>
                                    <Badge className="bg-yellow-500 text-white border-0">
                                        VIP
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    {creatorStats.topSubscribers.map((sub: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl hover:border-yellow-400 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">{sub.name[0]}</span>
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-foreground">{sub.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {sub.tier} • {isArabic ? 'عضو منذ' : 'Member for'} {sub.since}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                                    {sub.spent.toLocaleString()} EGP
                                                </div>
                                                <div className="text-xs text-muted-foreground">{isArabic ? 'إجمالي' : 'Total'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="w-6 h-6 text-blue-400" />
                                    <h3 className="text-xl font-bold text-foreground">
                                        {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {creatorStats.recentActivity.map((activity: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-card-hover rounded-lg hover:bg-card transition-colors">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                activity.type === 'subscription' ? 'bg-green-500/20' :
                                                activity.type === 'post_like' ? 'bg-pink-500/20' :
                                                activity.type === 'session_booked' ? 'bg-purple-500/20' :
                                                'bg-yellow-500/20'
                                            }`}>
                                                {activity.type === 'subscription' && <Crown className="w-4 h-4 text-green-400" />}
                                                {activity.type === 'post_like' && <Heart className="w-4 h-4 text-pink-400" />}
                                                {activity.type === 'session_booked' && <Calendar className="w-4 h-4 text-purple-400" />}
                                                {activity.type === 'subscription_upgraded' && <TrendingUp className="w-4 h-4 text-yellow-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm text-foreground">
                                                    <span className="font-semibold">{activity.user}</span>
                                                    {activity.type === 'subscription' && (
                                                        <span> {isArabic ? 'اشترك في' : 'subscribed to'} <Badge className="bg-purple-500 text-white border-0 text-xs">{activity.tier}</Badge></span>
                                                    )}
                                                    {activity.type === 'post_like' && (
                                                        <span> {isArabic ? 'أعجب بمنشور' : 'liked post'} "{activity.post}"</span>
                                                    )}
                                                    {activity.type === 'session_booked' && (
                                                        <span> {isArabic ? 'حجز جلسة' : 'booked session'} "{activity.session}"</span>
                                                    )}
                                                    {activity.type === 'subscription_upgraded' && (
                                                        <span> {isArabic ? 'ترقية من' : 'upgraded from'} {activity.from} {isArabic ? 'إلى' : 'to'} <Badge className="bg-yellow-500 text-white border-0 text-xs">{activity.to}</Badge></span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{activity.timestamp}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">
                                    {isArabic ? 'إجراءات سريعة' : 'Quick Actions'}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <Button className="bg-purple-500 hover:bg-purple-600 text-white">
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        {isArabic ? 'منشور جديد' : 'New Post'}
                                    </Button>
                                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {isArabic ? 'جدولة جلسة' : 'Schedule Session'}
                                    </Button>
                                    <Button className="bg-green-500 hover:bg-green-600 text-white">
                                        <Download className="w-4 h-4 mr-2" />
                                        {isArabic ? 'رفع مورد' : 'Upload Resource'}
                                    </Button>
                                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        {isArabic ? 'الرسائل' : 'Messages'}
                                    </Button>
                                    <Button className="bg-pink-500 hover:bg-pink-600 text-white">
                                        <Users className="w-4 h-4 mr-2" />
                                        {isArabic ? 'المشتركون' : 'Subscribers'}
                                    </Button>
                                    <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        {isArabic ? 'التحليلات' : 'Analytics'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
                    </div>
                    {/* End Main Content Column */}

                    {/* Right Sidebar - Subscription & Suggestions */}
                    <div className="hidden lg:block lg:col-span-3 p-4">
                        <div className="sticky top-20 space-y-4">
                            {/* Quick Subscribe Card */}
                            {!currentSubscription && (
                                <div className="bg-card border border-border rounded-2xl p-4">
                                    <h3 className="font-bold text-foreground mb-3">{isArabic ? 'اشترك الآن' : 'Subscribe Now'}</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {isArabic ? 'احصل على محتوى حصري ودروس خاصة' : 'Get exclusive content and private lessons'}
                                    </p>
                                    <Button
                                        onClick={() => {
                                            if (!session) {
                                                router.push(`/${locale}/login`)
                                                return
                                            }
                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                        }}
                                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full"
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        {isArabic ? 'اشترك' : 'Subscribe'}
                                    </Button>
                                </div>
                            )}

                            {/* Current Subscription Status */}
                            {currentSubscription && (
                                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Crown className="w-5 h-5 text-purple-400" />
                                        <h3 className="font-bold text-foreground">{currentSubscription} {isArabic ? 'عضو' : 'Member'}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {isArabic ? 'لديك وصول كامل لجميع المحتويات' : 'You have full access to all content'}
                                    </p>
                                    <Button
                                        onClick={() => router.push(`/${locale}/messaging?userId=${mentor.user.id}`)}
                                        className="w-full bg-card hover:bg-card-hover text-foreground font-semibold rounded-full border border-border"
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        {isArabic ? 'مراسلة' : 'Send Message'}
                                    </Button>
                                </div>
                            )}

                            {/* Feedback Tokens Card - VIP Only */}
                            {currentSubscription === 'VIP' && (
                                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Sparkles className="w-5 h-5 text-yellow-400" />
                                        <h3 className="font-bold text-foreground">
                                            {isArabic ? 'رموز التغذية الراجعة' : 'Feedback Tokens'}
                                        </h3>
                                    </div>
                                    
                                    {/* Token Counter */}
                                    <div className="bg-card/50 rounded-xl p-3 mb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-muted-foreground">
                                                {isArabic ? 'الرموز المتاحة' : 'Available'}
                                            </span>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                                {feedbackTokens.available}/{feedbackTokens.total}
                                            </span>
                                        </div>
                                        <div className="w-full bg-card rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-300"
                                                style={{ width: `${(feedbackTokens.available / feedbackTokens.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Renewal Date */}
                                    {feedbackTokens.renewalDate && (
                                        <p className="text-xs text-muted-foreground mb-3">
                                            {isArabic ? 'التجديد في: ' : 'Renews: '}
                                            {new Date(feedbackTokens.renewalDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    )}

                                    {/* Request Feedback Button */}
                                    <Button
                                        onClick={() => setShowFeedbackModal(true)}
                                        disabled={feedbackTokens.available === 0}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-full disabled:opacity-50"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        {isArabic ? 'طلب تعليقات' : 'Request Feedback'}
                                    </Button>

                                    {/* Pending Requests Count */}
                                    {feedbackRequests.filter(r => r.status === 'IN_PROGRESS').length > 0 && (
                                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                            <TrendingUp className="w-3 h-3" />
                                            <span>
                                                {feedbackRequests.filter(r => r.status === 'IN_PROGRESS').length} {isArabic ? 'طلبات معلقة' : 'pending requests'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Subscription Tiers Preview */}
                            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-border">
                                    <h3 className="font-bold text-foreground">{isArabic ? 'الفئات المتاحة' : 'Available Tiers'}</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    {/* Basic Tier */}
                                    <div className="p-3 rounded-xl bg-muted border border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-foreground">Basic</span>
                                            <span className="text-sm font-bold text-purple-400">{mentor.basicMonthlyPrice || 49} EGP/mo</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{isArabic ? 'محتوى أساسي' : 'Basic content'}</p>
                                    </div>

                                    {/* Premium Tier */}
                                    <div className="p-3 rounded-xl bg-muted border border-border">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-foreground">Premium</span>
                                            <span className="text-sm font-bold text-purple-400">{mentor.premiumMonthlyPrice || 99} EGP/mo</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{isArabic ? 'محتوى متميز' : 'Premium content'}</p>
                                    </div>

                                    {/* VIP Tier */}
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-foreground flex items-center gap-1">
                                                <Crown className="w-4 h-4 text-purple-400" />
                                                VIP
                                            </span>
                                            <span className="text-sm font-bold text-purple-400">{mentor.vipMonthlyPrice || 199} EGP/mo</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{isArabic ? 'كل شيء + تدريب' : 'Everything + coaching'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Suggested Creators */}
                            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                <div className="p-4 border-b border-border">
                                    <h3 className="font-bold text-foreground">{isArabic ? 'منشئون آخرون' : 'Other Creators'}</h3>
                                </div>
                                {suggestedCreators.length > 0 ? (
                                    <div className="divide-y divide-border">
                                        {suggestedCreators.map((creator: any) => (
                                            <button
                                                key={creator.id}
                                                onClick={() => router.push(`/${locale}/mentors/${creator.id}`)}
                                                className="w-full p-4 hover:bg-card-hover transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {creator.user?.profileImage ? (
                                                        <Image
                                                            src={creator.user.profileImage}
                                                            alt={creator.user.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full object-cover w-10 h-10"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center flex-shrink-0">
                                                            <span className="text-sm font-bold text-white">
                                                                {creator.user?.name?.[0] || 'C'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <h4 className="font-semibold text-foreground text-sm truncate">
                                                                {isArabic ? creator.user?.arabicName || creator.user?.name : creator.user?.name}
                                                            </h4>
                                                            {creator.averageRating >= 4.5 && (
                                                                <CheckCircle className="w-3 h-3 text-blue-500 fill-blue-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {creator.expertise || (isArabic ? 'خبير تعليمي' : 'Education Expert')}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {(creator.totalSubscribers || 0) > 1000 
                                                                        ? `${((creator.totalSubscribers || 0) / 1000).toFixed(1)}K` 
                                                                        : creator.totalSubscribers || 0}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                                <span className="text-xs text-muted-foreground">
                                                                    {creator.averageRating?.toFixed(1) || '5.0'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        {isArabic ? 'جاري التحميل...' : 'Loading...'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* End Right Sidebar */}

                </div>
                {/* End Grid */}
            </div>
            {/* End Container */}

            {/* Booking Modal */}
            {mentor && (
                <BookingModal
                    isOpen={isBookingModalOpen}
                    onClose={() => setIsBookingModalOpen(false)}
                    mentorId={mentor.id}
                    mentorName={getMentorName()}
                    isArabic={isArabic}
                    currentSubscription={currentSubscription}
                    basicPrice={mentor.basicMonthlyPrice}
                    premiumPrice={mentor.premiumMonthlyPrice}
                    vipPrice={mentor.vipMonthlyPrice}
                />
            )}

            {/* Feedback Request Modal - VIP Only */}
            {mentor && showFeedbackModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white relative">
                            <button
                                onClick={() => setShowFeedbackModal(false)}
                                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <Sparkles className="w-6 h-6" />
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {isArabic ? 'طلب تعليقات شخصية' : 'Request Personal Feedback'}
                                    </h2>
                                    <p className="text-white/80 text-sm mt-1">
                                        {isArabic ? `${feedbackTokens.available} رموز متاحة` : `${feedbackTokens.available} tokens available`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Request Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'سؤالك أو طلبك' : 'Your Question or Request'}
                                </label>
                                <textarea
                                    value={newFeedbackRequest}
                                    onChange={(e) => setNewFeedbackRequest(e.target.value)}
                                    placeholder={isArabic 
                                        ? 'اشرح ما تحتاج تعليقات عليه بالتفصيل...'
                                        : 'Explain in detail what you need feedback on...'
                                    }
                                    rows={6}
                                    className="w-full bg-background border border-border rounded-xl p-3 text-foreground resize-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all"
                                    maxLength={1000}
                                />
                                <p className="text-xs text-muted-foreground mt-2 text-right">
                                    {newFeedbackRequest.length}/1000
                                </p>
                            </div>

                            {/* Attachment (Placeholder) */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'مرفق (اختياري)' : 'Attachment (Optional)'}
                                </label>
                                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-yellow-500 transition-all cursor-pointer">
                                    <Paperclip className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        {isArabic ? 'انقر لإرفاق ملف' : 'Click to attach file'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {isArabic ? 'PDF, صور، أو ملفات أخرى' : 'PDF, images, or other files'}
                                    </p>
                                </div>
                            </div>

                            {/* Previous Requests */}
                            {feedbackRequests.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-semibold text-foreground mb-3">
                                        {isArabic ? 'طلباتك السابقة' : 'Your Previous Requests'}
                                    </h3>
                                    <div className="space-y-3 max-h-60 overflow-y-auto">
                                        {feedbackRequests.slice(0, 3).map((request) => (
                                            <div
                                                key={request.id}
                                                className={`p-3 rounded-lg border ${
                                                    request.status === 'ANSWERED' 
                                                        ? 'bg-green-500/10 border-green-500/30' 
                                                        : 'bg-yellow-500/10 border-yellow-500/30'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-xs text-foreground line-clamp-2 flex-1">
                                                        {request.content}
                                                    </p>
                                                    <Badge className={`${
                                                        request.status === 'ANSWERED' ? 'bg-green-500' : 'bg-yellow-500'
                                                    } text-white border-0 text-xs flex-shrink-0`}>
                                                        {request.status === 'ANSWERED' 
                                                            ? (isArabic ? 'تم الرد' : 'Answered')
                                                            : (isArabic ? 'قيد المعالجة' : 'Pending')
                                                        }
                                                    </Badge>
                                                </div>
                                                {request.response && (
                                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 pl-3 border-l-2 border-green-500">
                                                        {request.response}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowFeedbackModal(false)}
                                    className="flex-1 bg-card hover:bg-card-hover text-foreground border border-border"
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleSubmitFeedbackRequest}
                                    disabled={!newFeedbackRequest.trim() || feedbackTokens.available === 0}
                                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    {isArabic ? 'إرسال الطلب' : 'Submit Request'}
                                </Button>
                            </div>

                            {/* Info */}
                            <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                <p className="text-xs text-muted-foreground">
                                    {isArabic 
                                        ? '💡 ستتلقى رداً شخصياً من المعلم خلال 24-48 ساعة. استخدم الرموز بحكمة!'
                                        : '💡 You\'ll receive a personalized response from the mentor within 24-48 hours. Use tokens wisely!'
                                    }
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Review Modal */}
            {mentor && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    mentorId={mentor.id}
                    mentorName={getMentorName()}
                    isArabic={isArabic}
                    onReviewSubmitted={() => {
                        // Refresh mentor data to update rating
                        window.location.reload()
                    }}
                />
            )}
        </div>
    )
}
