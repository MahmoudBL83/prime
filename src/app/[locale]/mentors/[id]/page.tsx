'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
    X,
    Clock,
    Plus,
    Edit2,
    Trash2,
    Settings,
    BarChart3,
    Upload,
    FileText,
    AlertTriangle,
    VolumeX,
    UserX,
    UserPlus,
    Trophy,
    Activity,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { BookingModal } from '@/components/mentors/BookingModal'
import ReviewModal from '@/components/mentors/ReviewModal'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

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
    timestamp?: string
    scheduledFor?: string
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
    const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'about' | 'sessions' | 'community' | 'resources' | 'qa' | 'profile'>('posts')
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
    const [qaFilter, setQaFilter] = useState<'all' | 'answered' | 'pending' | 'unanswered'>('all')
    const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')
    const [isCreatorView, setIsCreatorView] = useState(false)
    const [creatorStats, setCreatorStats] = useState<any>(null)
    
    // Content Management States
    const [contentManagementTab, setContentManagementTab] = useState<'posts' | 'media' | 'calendar' | 'scheduled'>('posts')
    const [contentView, setContentView] = useState<'grid' | 'list'>('grid')
    const [mediaFilter, setMediaFilter] = useState<'all' | 'images' | 'videos'>('all')
    const [selectedCalendarDate, setSelectedCalendarDate] = useState('')
    const [showNewPostModal, setShowNewPostModal] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [newPostText, setNewPostText] = useState('')
    const [newPostTier, setNewPostTier] = useState<'FREE' | 'BASIC' | 'PREMIUM' | 'VIP'>('FREE')
    const [newPostScheduledDate, setNewPostScheduledDate] = useState('')
    const [uploadingPost, setUploadingPost] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadPreview, setUploadPreview] = useState<string | null>(null)
    const [viewingMedia, setViewingMedia] = useState<{type: 'image' | 'video', url: string} | null>(null)
    const [editingPost, setEditingPost] = useState<Post | null>(null)
    const [activeTierIndex, setActiveTierIndex] = useState(1) // 0=BASIC, 1=PREMIUM, 2=VIP
    const [showEditProfileModal, setShowEditProfileModal] = useState(false)
    const [editProfileData, setEditProfileData] = useState({
        name: '',
        arabicName: '',
        bio: '',
        expertise: '',
        location: '',
        hourlyRate: 0,
        basicPrice: 0,
        premiumPrice: 0,
        vipPrice: 0
    })
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
    const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null)
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)

    // Real data from localStorage
    const [realArchivedSessions, setRealArchivedSessions] = useState<any[]>([])
    const [realCommunityPosts, setRealCommunityPosts] = useState<any[]>([])

    // Additional Community Management States (non-duplicate)
    const [memberFilter, setMemberFilter] = useState<'all' | 'vip' | 'premium' | 'basic'>('all')
    const [memberSearchQuery, setMemberSearchQuery] = useState('')
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    // Session/Recording Modals
    const [showNewSessionModal, setShowNewSessionModal] = useState(false)
    const [showNewRecordingModal, setShowNewRecordingModal] = useState(false)
    const [newSessionData, setNewSessionData] = useState({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        scheduledAt: '',
        duration: 60,
        tier: 'BRONZE',
        maxAttendees: 100
    })
    const [newRecordingData, setNewRecordingData] = useState({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        recordedDate: '',
        duration: 60,
        tier: 'BRONZE',
        recordingUrl: ''
    })
    const [recordingVideoFile, setRecordingVideoFile] = useState<File | null>(null)
    const [recordingVideoPreview, setRecordingVideoPreview] = useState<string | null>(null)
    const [savingSession, setSavingSession] = useState(false)
    const [showAddResourceModal, setShowAddResourceModal] = useState(false)
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
    const [newResourceData, setNewResourceData] = useState({
        title: '',
        titleAr: '',
        type: 'PDF',
        size: '',
        url: '',
        description: '',
        descriptionAr: ''
    })
    const [resourceFile, setResourceFile] = useState<File | null>(null)
    const [savingResource, setSavingResource] = useState(false)
    const [showEditResourceModal, setShowEditResourceModal] = useState(false)
    const [editingResource, setEditingResource] = useState<any>(null)
    
    // Community Management States
    const [showCreatePostModal, setShowCreatePostModal] = useState(false)
    const [showMemberManagementModal, setShowMemberManagementModal] = useState(false)
    const [communityManagementTab, setCommunityManagementTab] = useState<'posts' | 'members' | 'analytics'>('posts')
    const [newCommunityPost, setNewCommunityPost] = useState({
        title: '',
        titleAr: '',
        content: '',
        contentAr: '',
        isPinned: false,
        isAnnouncement: false
    })
    const [creatingPost, setCreatingPost] = useState(false)
    const [communityMembers, setCommunityMembers] = useState<any[]>([])
    const [communityAnalytics, setCommunityAnalytics] = useState({
        totalPosts: 0,
        totalMembers: 0,
        activeToday: 0,
        avgEngagement: 0,
        topMembers: [] as Array<{name: string, posts: number, likes: number, tier: string}>,
        recentActivity: [] as Array<{type: string, user: string, action: string, time: string}>
    })

    // Fetch user subscription status
    const fetchUserSubscriptionStatus = useCallback(async () => {
        if (!session?.user?.id || !mentor?.id) return

        try {
            const response = await fetch('/api/subscriptions/status')
            if (response.ok) {
                const data = await response.json()
                const subscriptions = data.subscriptions || []
                
                // Check if user is subscribed to this specific creator
                const subscription = subscriptions.find((sub: any) => {
                    // Check if subscription is for this creator
                    // First check metadata for creatorId
                    if (sub.metadata?.creatorId === mentor.id) {
                        return true
                    }
                    // Then check if channelId matches
                    if (sub.channelId === channelId) {
                        return true
                    }
                    return false
                })
                
                if (subscription) {
                    const tier = subscription.metadata?.tier || subscription.tier
                    setCurrentSubscription(tier)
                } else {
                    setCurrentSubscription(null)
                }
            }
        } catch (error) {
            console.error('Failed to fetch subscription status:', error)
        }
    }, [session, mentor?.id, channelId])

    // Fetch mentor data
    const fetchMentorData = useCallback(async () => {
        if (!params.id) return
        
        setLoading(true)
        try {
            const response = await fetch(`/api/mentors/${params.id}`)
            if (response.ok) {
                const data = await response.json()
                console.log('Mentor API response:', data)
                
                // Handle different possible response structures
                const mentorData = data.mentor || data
                setMentor(mentorData)
                
                // Set channel ID - try different possible sources
                if (data.channel?.id) {
                    setChannelId(data.channel.id)
                } else if (mentorData.channelId) {
                    setChannelId(mentorData.channelId)
                } else {
                    // Fallback to using mentor ID as channel ID
                    const mentorId = Array.isArray(params.id) ? params.id[0] : params.id
                    setChannelId(mentorId)
                }
                
                // Set posts if available
                setPosts(data.posts || [])
            } else {
                console.error('API Error:', response.status, response.statusText)
                const errorData = await response.json().catch(() => ({}))
                console.error('Error details:', errorData)
                toast.error(isArabic ? 'فشل تحميل البيانات' : 'Failed to load data')
            }
        } catch (error) {
            console.error('Error fetching mentor data:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [params.id, isArabic])

    // Function to refresh subscription status (can be called after successful subscription)
    const refreshSubscriptionStatus = useCallback(() => {
        fetchUserSubscriptionStatus()
    }, [fetchUserSubscriptionStatus])

    // Make refreshSubscriptionStatus available globally for modals
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).refreshCreatorSubscriptionStatus = refreshSubscriptionStatus
        }
    }, [refreshSubscriptionStatus])

    // Initial data fetch useEffect
    useEffect(() => {
        if (params.id) {
            fetchMentorData()
            fetchUserSubscriptionStatus()
        }
    }, [params.id, fetchMentorData, fetchUserSubscriptionStatus])

    // Refetch subscription status when user session changes
    useEffect(() => {
        if (session?.user?.id && mentor?.id) {
            fetchUserSubscriptionStatus()
        }
    }, [session, mentor, fetchUserSubscriptionStatus])

    // Demo posts with realistic timestamps
    const [posts, setPosts] = useState<Post[]>([
        {
            id: '1',
            type: 'text',
            content: 'Just wrapped up an amazing trading session! 📈 My VIP members are seeing incredible results. If you want to learn the strategies that actually work, join my VIP tier today! 💎',
            tier: 'FREE',
            likes: 234,
            comments: 45,
            views: 1890,
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
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
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
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
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
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
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
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
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
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

    // Fetch upcoming sessions from API
    const fetchUpcomingSessionsFromAPI = async () => {
        if (!mentor) return
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions?type=upcoming`)
            if (response.ok) {
                const data = await response.json()
                // Transform API data to match the expected format
                const transformedSessions = data.sessions?.map((session: any) => ({
                    id: session.id,
                    title: isArabic && session.titleAr ? session.titleAr : session.title,
                    type: 'WORKSHOP', // Default type
                    date: session.scheduledAt,
                    time: new Date(session.scheduledAt).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    duration: session.duration,
                    requiredTier: session.tier,
                    attendees: session.attendees?.length || 0,
                    maxAttendees: session.maxAttendees || 100,
                    description: isArabic && session.descriptionAr ? session.descriptionAr : session.description,
                    joinLink: null
                })) || []
                setUpcomingSessions(transformedSessions)
            }
        } catch (error) {
            console.error('Error fetching upcoming sessions:', error)
        }
    }

    // Fetch archived sessions from API
    const fetchArchivedSessionsFromAPI = async () => {
        if (!mentor) return
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions?type=archived`)
            if (response.ok) {
                const data = await response.json()
                // Transform API data to match the expected format
                const transformedSessions = data.sessions?.map((session: any) => ({
                    id: session.id,
                    title: isArabic && session.titleAr ? session.titleAr : session.title,
                    type: 'WORKSHOP', // Default type, can be enhanced later
                    recordedDate: session.scheduledAt,
                    duration: session.duration,
                    requiredTier: session.tier,
                    views: session.viewCount || 0,
                    thumbnail: null,
                    recordingUrl: session.recordingUrl,
                    description: isArabic && session.descriptionAr ? session.descriptionAr : session.description
                })) || []
                setRealArchivedSessions(transformedSessions)
            }
        } catch (error) {
            console.error('Error fetching archived sessions:', error)
        }
    }

    // Fetch community posts from API (discussions)
    const fetchCommunityPostsFromAPI = async () => {
        if (!mentor) return
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/discussions`)
            if (response.ok) {
                const data = await response.json()
                // Transform comments to community posts format
                const transformedPosts = data.comments?.map((comment: any) => ({
                    id: comment.id,
                    author: {
                        name: comment.user.name,
                        arabicName: comment.user.arabicName,
                        profileImage: comment.user.profileImage,
                        tier: 'FREE' // Default tier
                    },
                    content: comment.content,
                    timestamp: new Date(comment.createdAt).toLocaleDateString(),
                    likes: 0,
                    replies: 0 // PostComment model doesn't support replies yet
                })) || []
                setRealCommunityPosts(transformedPosts)
            }
        } catch (error) {
            console.error('Error fetching community posts:', error)
        }
    }

    // Fetch resources from API
    const fetchResourcesFromAPI = async () => {
        if (!mentor) return
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/resources`)
            if (response.ok) {
                const data = await response.json()
                setPinnedResources(data.resources || [])
            }
        } catch (error) {
            console.error('Error fetching resources:', error)
        }
    }

    // Fetch community members for creator view
    const fetchCommunityMembers = async () => {
        if (!mentor) return
        
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/members`)
            if (response.ok) {
                const data = await response.json()
                setCommunityMembers(data.members || [])
            } else {
                // Demo data for now
                setCommunityMembers([
                    {
                        id: '1',
                        name: 'Ahmed Hassan',
                        arabicName: 'أحمد حسن',
                        profileImage: null,
                        tier: 'VIP',
                        joinDate: '2024-01-15',
                        lastActive: '2 hours ago',
                        totalPosts: 45,
                        totalLikes: 234,
                        status: 'active'
                    },
                    {
                        id: '2', 
                        name: 'Sara Ali',
                        arabicName: 'سارة علي',
                        profileImage: null,
                        tier: 'PREMIUM',
                        joinDate: '2024-01-10',
                        lastActive: '1 day ago',
                        totalPosts: 23,
                        totalLikes: 156,
                        status: 'active'
                    },
                    {
                        id: '3',
                        name: 'Omar Farouk',
                        arabicName: 'عمر فاروق',
                        profileImage: null,
                        tier: 'BASIC',
                        joinDate: '2024-01-08',
                        lastActive: '3 days ago',
                        totalPosts: 12,
                        totalLikes: 67,
                        status: 'inactive'
                    }
                ])
            }
        } catch (error) {
            console.error('Error fetching community members:', error)
        }
    }

    // Fetch community analytics for creator view
    const fetchCommunityAnalytics = async () => {
        if (!mentor) return
        
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/analytics/community`)
            if (response.ok) {
                const data = await response.json()
                setCommunityAnalytics(data)
            } else {
                // Demo analytics data
                setCommunityAnalytics({
                    totalPosts: displayCommunityPosts.length,
                    totalMembers: mentor.totalSubscribers || 1240,
                    activeToday: Math.floor((mentor.totalSubscribers || 1240) * 0.1),
                    avgEngagement: 12.8,
                    topMembers: [
                        { name: 'Ahmed Hassan', posts: 45, likes: 234, tier: 'VIP' },
                        { name: 'Sara Ali', posts: 23, likes: 156, tier: 'PREMIUM' },
                        { name: 'Omar Farouk', posts: 12, likes: 67, tier: 'BASIC' }
                    ],
                    recentActivity: [
                        { type: 'post', user: 'Ahmed Hassan', action: 'created a new post', time: '2h ago' },
                        { type: 'comment', user: 'Sara Ali', action: 'replied to a discussion', time: '3h ago' },
                        { type: 'like', user: 'Omar Farouk', action: 'liked a post', time: '4h ago' }
                    ]
                })
            }
        } catch (error) {
            console.error('Error fetching community analytics:', error)
        }
    }

    // Handle create new session
    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentor) return

        if (!newSessionData.title.trim() || !newSessionData.scheduledAt) {
            toast.error(isArabic ? 'الرجاء ملء الحقول المطلوبة' : 'Please fill in required fields')
            return
        }

        setSavingSession(true)
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newSessionData.title,
                    titleAr: newSessionData.titleAr || newSessionData.title,
                    description: newSessionData.description,
                    descriptionAr: newSessionData.descriptionAr || newSessionData.description,
                    scheduledAt: new Date(newSessionData.scheduledAt).toISOString(),
                    duration: newSessionData.duration,
                    tier: newSessionData.tier,
                    maxAttendees: newSessionData.maxAttendees
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إنشاء الجلسة!' : 'Session created!')
                setShowNewSessionModal(false)
                setNewSessionData({
                    title: '', titleAr: '', description: '', descriptionAr: '',
                    scheduledAt: '', duration: 60, tier: 'BRONZE', maxAttendees: 100
                })
                // Refresh upcoming sessions list
                fetchUpcomingSessionsFromAPI()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل الإنشاء' : 'Failed to create'))
            }
        } catch (error) {
            console.error('Error creating session:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSavingSession(false)
        }
    }

    // Handle delete session (both upcoming and archived)
    const handleDeleteSession = async (sessionId: string, isArchived: boolean = false) => {
        if (!mentor) return

        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الجلسة؟' : 'Are you sure you want to delete this session?')) {
            return
        }

        setDeletingSessionId(sessionId)
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions?sessionId=${sessionId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حذف الجلسة!' : 'Session deleted!')
                // Refresh the appropriate list
                if (isArchived) {
                    fetchArchivedSessionsFromAPI()
                } else {
                    fetchUpcomingSessionsFromAPI()
                }
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل الحذف' : 'Failed to delete'))
            }
        } catch (error) {
            console.error('Error deleting session:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setDeletingSessionId(null)
        }
    }

    // Handle update existing resource
    const handleUpdateResource = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentor || !editingResource) return

        if (!newResourceData.title.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال عنوان المورد' : 'Please enter resource title')
            return
        }

        setSavingResource(true)
        try {
            let fileUrl = editingResource.url

            // Upload new file if one was selected
            if (resourceFile) {
                const formData = new FormData()
                formData.append('file', resourceFile)
                formData.append('type', 'resource')

                toast.loading(isArabic ? 'جاري رفع الملف...' : 'Uploading file...')
                
                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                })

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload file')
                }

                const { url } = await uploadResponse.json()
                fileUrl = url
            }

            // Update resource
            const response = await fetch(`/api/mentors/${mentor.id}/resources?resourceId=${editingResource.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newResourceData.title,
                    titleAr: newResourceData.titleAr || newResourceData.title,
                    type: newResourceData.type,
                    size: resourceFile ? Math.round(resourceFile.size / 1024) + ' KB' : editingResource.size,
                    url: fileUrl,
                    description: newResourceData.description,
                    descriptionAr: newResourceData.descriptionAr || newResourceData.description,
                    isPinned: editingResource.isPinned
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم تحديث المورد!' : 'Resource updated!')
                setShowEditResourceModal(false)
                setEditingResource(null)
                setNewResourceData({
                    title: '', titleAr: '', type: 'PDF', size: '',
                    url: '', description: '', descriptionAr: ''
                })
                setResourceFile(null)
                fetchResourcesFromAPI()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل التحديث' : 'Failed to update'))
            }
        } catch (error) {
            console.error('Error updating resource:', error)
            toast.error(isArabic ? 'حدث خطأ في التحديث' : 'Error updating resource')
        } finally {
            setSavingResource(false)
        }
    }

    // Handle create new resource
    const handleCreateResource = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentor) return

        if (!newResourceData.title.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال عنوان المورد' : 'Please enter resource title')
            return
        }

        if (!resourceFile) {
            toast.error(isArabic ? 'الرجاء اختيار ملف' : 'Please select a file')
            return
        }

        setSavingResource(true)
        try {
            // Upload file first
            const formData = new FormData()
            formData.append('file', resourceFile)
            formData.append('type', 'resource')

            toast.loading(isArabic ? 'جاري رفع الملف...' : 'Uploading file...')
            
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file')
            }

            const { url: fileUrl } = await uploadResponse.json()

            // Create resource with uploaded file URL
            const response = await fetch(`/api/mentors/${mentor.id}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newResourceData.title,
                    titleAr: newResourceData.titleAr || newResourceData.title,
                    type: newResourceData.type,
                    size: Math.round(resourceFile.size / 1024) + ' KB',
                    url: fileUrl,
                    description: newResourceData.description,
                    descriptionAr: newResourceData.descriptionAr || newResourceData.description,
                    isPinned: true
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إضافة المورد!' : 'Resource added!')
                setShowAddResourceModal(false)
                setNewResourceData({
                    title: '', titleAr: '', type: 'PDF', size: '',
                    url: '', description: '', descriptionAr: ''
                })
                setResourceFile(null)
                fetchResourcesFromAPI()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل الإضافة' : 'Failed to add'))
            }
        } catch (error) {
            console.error('Error creating resource:', error)
            toast.error(isArabic ? 'حدث خطأ في رفع الملف' : 'Error uploading file')
        } finally {
            setSavingResource(false)
        }
    }

    // Handle create community post by creator
    const handleCreateCommunityPost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentor) return

        if (!newCommunityPost.content.trim()) {
            toast.error(isArabic ? 'الرجاء إدخال محتوى المنشور' : 'Please enter post content')
            return
        }

        setCreatingPost(true)
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/discussions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    postId: 'creator-announcement',
                    content: newCommunityPost.content,
                    contentAr: newCommunityPost.contentAr || newCommunityPost.content,
                    title: newCommunityPost.title,
                    titleAr: newCommunityPost.titleAr || newCommunityPost.title,
                    isPinned: newCommunityPost.isPinned,
                    isAnnouncement: newCommunityPost.isAnnouncement,
                    authorId: session?.user?.id
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم نشر المنشور!' : 'Post published!')
                setShowCreatePostModal(false)
                setNewCommunityPost({
                    title: '',
                    titleAr: '',
                    content: '',
                    contentAr: '',
                    isPinned: false,
                    isAnnouncement: false
                })
                fetchCommunityPostsFromAPI()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل النشر' : 'Failed to publish'))
            }
        } catch (error) {
            console.error('Error creating community post:', error)
            toast.error(isArabic ? 'حدث خطأ في النشر' : 'Error publishing post')
        } finally {
            setCreatingPost(false)
        }
    }

    // Handle pin/unpin post
    const handleTogglePin = async (postId: string, currentPinStatus: boolean) => {
        if (!mentor) return

        try {
            const response = await fetch(`/api/mentors/${mentor.id}/discussions?commentId=${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isPinned: !currentPinStatus
                })
            })

            if (response.ok) {
                toast.success(
                    !currentPinStatus 
                        ? (isArabic ? 'تم تثبيت المنشور' : 'Post pinned')
                        : (isArabic ? 'تم إلغاء التثبيت' : 'Post unpinned')
                )
                fetchCommunityPostsFromAPI()
            } else {
                toast.error(isArabic ? 'فشل في التحديث' : 'Failed to update')
            }
        } catch (error) {
            console.error('Error toggling pin:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    // Handle member management
    const handleMemberAction = async (memberId: string, action: 'warn' | 'mute' | 'remove') => {
        if (!mentor) return

        const confirmMessage = {
            warn: isArabic ? 'هل تريد إرسال تحذير لهذا العضو؟' : 'Do you want to warn this member?',
            mute: isArabic ? 'هل تريد كتم هذا العضو؟' : 'Do you want to mute this member?',
            remove: isArabic ? 'هل تريد إزالة هذا العضو من المجتمع؟' : 'Do you want to remove this member from the community?'
        }

        if (!window.confirm(confirmMessage[action])) return

        try {
            const response = await fetch(`/api/mentors/${mentor.id}/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })

            if (response.ok) {
                const successMessage = {
                    warn: isArabic ? 'تم إرسال التحذير' : 'Warning sent',
                    mute: isArabic ? 'تم كتم العضو' : 'Member muted',
                    remove: isArabic ? 'تم إزالة العضو' : 'Member removed'
                }
                toast.success(successMessage[action])
                fetchCommunityMembers()
            } else {
                toast.error(isArabic ? 'فشل في العملية' : 'Operation failed')
            }
        } catch (error) {
            console.error('Error managing member:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    // Handle create new recording
    const handleCreateRecording = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentor) return

        if (!newRecordingData.title.trim() || !newRecordingData.recordedDate) {
            toast.error(isArabic ? 'الرجاء ملء الحقول المطلوبة' : 'Please fill in required fields')
            return
        }

        if (!recordingVideoFile) {
            toast.error(isArabic ? 'الرجاء تحميل ملف الفيديو' : 'Please upload a video file')
            return
        }

        setSavingSession(true)
        try {
            // Upload video file first
            const formData = new FormData()
            formData.append('file', recordingVideoFile)
            formData.append('type', 'video')

            toast.loading(isArabic ? 'جاري رفع الفيديو...' : 'Uploading video...')
            
            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload video')
            }

            const { url: videoUrl } = await uploadResponse.json()

            // Create recording with uploaded video URL
            const response = await fetch(`/api/mentors/${mentor.id}/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newRecordingData.title,
                    titleAr: newRecordingData.titleAr || newRecordingData.title,
                    description: newRecordingData.description,
                    descriptionAr: newRecordingData.descriptionAr || newRecordingData.description,
                    scheduledAt: new Date(newRecordingData.recordedDate).toISOString(),
                    duration: newRecordingData.duration,
                    tier: newRecordingData.tier,
                    maxAttendees: 100,
                    recordingUrl: videoUrl,
                    status: 'ENDED'
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إضافة التسجيل!' : 'Recording added!')
                setShowNewRecordingModal(false)
                setNewRecordingData({
                    title: '', titleAr: '', description: '', descriptionAr: '',
                    recordedDate: '', duration: 60, tier: 'BRONZE', recordingUrl: ''
                })
                setRecordingVideoFile(null)
                setRecordingVideoPreview(null)
                fetchArchivedSessionsFromAPI()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل الإضافة' : 'Failed to add'))
            }
        } catch (error) {
            console.error('Error creating recording:', error)
            toast.error(isArabic ? 'حدث خطأ في رفع الفيديو' : 'Error uploading video')
        } finally {
            setSavingSession(false)
        }
    }

    const handleSubmitFeedbackRequest = useCallback(async () => {
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
    }, [newFeedbackRequest, feedbackTokens.available, mentor?.id, feedbackAttachment, isArabic])

    const handleFollow = useCallback(() => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }
        setIsFollowing(!isFollowing)
        toast.success(isFollowing ? (isArabic ? 'تم إلغاء المتابعة' : 'Unfollowed') : (isArabic ? 'تمت المتابعة' : 'Following!'))
    }, [session, isArabic, locale, router, isFollowing])

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

    const handleLikePost = useCallback((postId: string) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }
        setPosts(prev => prev.map(post => 
            post.id === postId 
                ? { ...post, likes: post.likes + 1 }
                : post
        ))
    }, [session, isArabic])

    const toggleComments = useCallback(async (postId: string) => {
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
    }, [expandedComments, postComments])

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
                        profileImage: (session.user as any)?.image || null
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

    const handleDownloadContent = useCallback(async (postId: string, mediaUrl: string, postType: string) => {
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
    }, [session, isArabic, currentSubscription, mentor?.user.name])

    const handleShare = useCallback(() => {
        const url = window.location.href
        if (navigator.share) {
            navigator.share({ url })
        } else {
            navigator.clipboard.writeText(url)
            toast.success(isArabic ? 'تم النسخ!' : 'Link copied!')
        }
    }, [isArabic])

    // Initialize data on component mount
    useEffect(() => {
        if (mentor) {
            fetchUpcomingSessions()
            fetchArchivedSessions()
            fetchCommunityData()
            fetchSuggestedCreators()
            fetchResources()
            fetchFeedbackTokens()
            
            // Load saved posts from localStorage (only custom posts created by user)
            const savedPostsKey = `creator_posts_${mentor.id}`
            const savedPosts = localStorage.getItem(savedPostsKey)
            if (savedPosts) {
                try {
                    const parsedPosts = JSON.parse(savedPosts)
                    // Merge saved posts with demo posts (saved posts at the top)
                    setPosts(prev => {
                        // Get only demo posts (ones that don't start with 'post-')
                        const demoPosts = prev.filter(p => !p.id.startsWith('post-'))
                        // Get only saved posts
                        const savedPostsList = parsedPosts.filter((p: Post) => p.id.startsWith('post-'))
                        // Combine: saved posts first, then demo posts
                        return [...savedPostsList, ...demoPosts]
                    })
                } catch (error) {
                    console.error('Error loading saved posts:', error)
                }
            }
        }
    }, [mentor])
    
    // Save posts to localStorage whenever they change (only user-created posts)
    useEffect(() => {
        if (mentor && isCreatorView) {
            // Save only user-created posts (IDs starting with 'post-')
            const userCreatedPosts = posts.filter(p => p.id.startsWith('post-'))
            if (userCreatedPosts.length > 0) {
                localStorage.setItem(`creator_posts_${mentor.id}`, JSON.stringify(userCreatedPosts))
            }
        }
    }, [posts, mentor, isCreatorView])
    
    // Load saved profile data (photos, etc.) from localStorage
    useEffect(() => {
        if (mentor && isCreatorView) {
            const profileKey = `mentor_profile_${mentor.id}`
            const savedProfile = localStorage.getItem(profileKey)
            if (savedProfile) {
                try {
                    const profileData = JSON.parse(savedProfile)
                    // Update mentor with saved data
                    if (profileData.profilePhoto || profileData.coverPhoto) {
                        setMentor({
                            ...mentor,
                            user: {
                                ...mentor.user,
                                profileImage: profileData.profilePhoto || mentor.user.profileImage
                            }
                        })
                        // Set cover photo preview if exists
                        if (profileData.coverPhoto) {
                            setCoverPhotoPreview(profileData.coverPhoto)
                        }
                    }
                } catch (error) {
                    console.error('Error loading saved profile:', error)
                }
            }
        }
    }, [mentor?.id, isCreatorView])

    // Load sessions from API when sessions tab is active
    useEffect(() => {
        if (mentor && activeTab === 'sessions') {
            fetchUpcomingSessionsFromAPI()
            fetchArchivedSessionsFromAPI()
        }
    }, [mentor?.id, activeTab])

    // Load community posts from API
    useEffect(() => {
        if (mentor && activeTab === 'community') {
            fetchCommunityPostsFromAPI()
        }
    }, [mentor?.id, activeTab])

    // Load pinned resources from API
    useEffect(() => {
        if (mentor && activeTab === 'community') {
            fetchResourcesFromAPI()
        }
    }, [mentor?.id, activeTab])

    // Fetch data when sessions tab is opened
    useEffect(() => {
        if (activeTab === 'sessions' && mentor && archivedSessions.length === 0) {
            fetchArchivedSessions()
        }
    }, [activeTab])

    // Define callbacks before early returns
    const getMentorName = useCallback(() => 
        isArabic && mentor?.user.arabicName ? mentor.user.arabicName : mentor?.user.name || ''
    , [isArabic, mentor?.user.arabicName, mentor?.user.name])

    const canViewPost = useCallback((post: Post) => {
        if (post.tier === 'FREE') return true
        if (!currentSubscription) return false
        
        const tierHierarchy: Record<string, number> = { 'BASIC': 1, 'PREMIUM': 2, 'VIP': 3 }
        return (tierHierarchy[currentSubscription] || 0) >= (tierHierarchy[post.tier] || 0)
    }, [currentSubscription])

    // Combine real and demo archived sessions
    const displayArchivedSessions = useMemo(() => {
        return realArchivedSessions.length > 0 ? realArchivedSessions : archivedSessions
    }, [realArchivedSessions, archivedSessions])

    // Combine real and demo community posts
    const displayCommunityPosts = useMemo(() => {
        return realCommunityPosts.length > 0 ? realCommunityPosts : communityPosts
    }, [realCommunityPosts, communityPosts])

    // Memoized filtered data
    const filteredArchivedSessions = useMemo(() => {
        return displayArchivedSessions.filter(session => {
            if (sessionFilter === 'all') return true
            if (sessionFilter === 'workshop') return session.type === 'WORKSHOP'
            if (sessionFilter === 'qa') return session.type === 'GROUP_QA'
            if (sessionFilter === 'oneOnOne') return session.type === 'ONE_ON_ONE'
            return true
        }).filter(session => 
            searchRecording === '' || 
            session.title.toLowerCase().includes(searchRecording.toLowerCase())
        )
    }, [displayArchivedSessions, sessionFilter, searchRecording])

    const filteredResources = useMemo(() => {
        return resources.filter(resource => {
            if (resourceCategory === 'all') return true
            return resource.category === resourceCategory
        }).filter(resource =>
            searchResource === '' ||
            resource.title.toLowerCase().includes(searchResource.toLowerCase())
        )
    }, [resources, resourceCategory, searchResource])

    const filteredQaQuestions = useMemo(() => {
        let filtered = qaQuestions
        
        if (qaFilter !== 'all') {
            filtered = filtered.filter(q => 
                qaFilter === 'answered' ? q.response : !q.response
            )
        }
        
        if (sortBy === 'popular') {
            filtered = [...filtered].sort((a, b) => b.votes - a.votes)
        } else {
            filtered = [...filtered].sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
        }
        
        return filtered
    }, [qaQuestions, qaFilter, sortBy])

    // Get only user-created posts (filter out demo posts when user has created content)
    const userCreatedPosts = useMemo(() => {
        return posts.filter(p => p.id.startsWith('post-'))
    }, [posts])
    
    // Use user-created posts if any exist, otherwise show demo posts for preview
    const displayPosts = useMemo(() => {
        return userCreatedPosts.length > 0 ? userCreatedPosts : posts
    }, [userCreatedPosts, posts])

    const mediaPosts = useMemo(() => 
        displayPosts.filter(post => post.type === 'image' || post.type === 'video')
    , [displayPosts])

    const visiblePosts = useMemo(() => 
        displayPosts.filter(post => canViewPost(post))
    , [displayPosts, canViewPost])

    // Memoized tab handlers
    const handleSetPostsTab = useCallback(() => setActiveTab('posts'), [])
    const handleSetMediaTab = useCallback(() => setActiveTab('media'), [])
    const handleSetSessionsTab = useCallback(() => setActiveTab('sessions'), [])
    const handleSetAboutTab = useCallback(() => setActiveTab('about'), [])
    const handleSetCommunityTab = useCallback(() => setActiveTab('community'), [])
    const handleSetResourcesTab = useCallback(() => setActiveTab('resources'), [])
    const handleSetQaTab = useCallback(() => setActiveTab('qa'), [])
    const handleBackToMentors = useCallback(() => router.push(`/${locale}/mentors`), [locale, router])

    // Memoized filter handlers
    const handleSessionFilterAll = useCallback(() => setSessionFilter('all'), [])
    const handleSessionFilterWorkshop = useCallback(() => setSessionFilter('workshop'), [])
    const handleSessionFilterQa = useCallback(() => setSessionFilter('qa'), [])
    const handleSessionFilterOneOnOne = useCallback(() => setSessionFilter('oneOnOne'), [])

    const handleResourceFilterAll = useCallback(() => setResourceCategory('all'), [])
    const handleResourceFilterPdf = useCallback(() => setResourceCategory('pdf'), [])
    const handleResourceFilterVideo = useCallback(() => setResourceCategory('video'), [])
    const handleResourceFilterTemplate = useCallback(() => setResourceCategory('template'), [])
    const handleResourceFilterCode = useCallback(() => setResourceCategory('code'), [])

    const handleQaFilterAll = useCallback(() => setQaFilter('all'), [])
    const handleQaFilterAnswered = useCallback(() => setQaFilter('answered'), [])
    const handleQaFilterUnanswered = useCallback(() => setQaFilter('unanswered'), [])

    const handleSortByRecent = useCallback(() => setSortBy('recent'), [])
    const handleSortByPopular = useCallback(() => setSortBy('popular'), [])

    // Content Management Handlers
    const handleCreatePost = useCallback(async () => {
        if (!newPostText.trim()) {
            toast.error(isArabic ? 'يرجى كتابة محتوى المنشور' : 'Please write post content')
            return
        }

        setUploadingPost(true)
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Check if post is scheduled for future
            const isScheduled = newPostScheduledDate && new Date(newPostScheduledDate) > new Date()
            
            if (editingPost) {
                // Update existing post
                setPosts(posts.map(p => {
                    if (p.id === editingPost.id) {
                        return {
                            ...p,
                            content: newPostText,
                            tier: newPostTier,
                            scheduledFor: newPostScheduledDate || undefined,
                            timestamp: isScheduled ? undefined : (p.timestamp || 'now'),
                            media: uploadPreview || p.media,
                            type: uploadPreview 
                                ? (uploadFile?.type.startsWith('video/') ? 'video' : 'image')
                                : p.type,
                            isLocked: newPostTier !== 'FREE'
                        }
                    }
                    return p
                }))
                toast.success(isArabic ? '✏️ تم تحديث المنشور بنجاح!' : '✏️ Post updated successfully!')
            } else {
                // Create new post
                const newPost: Post = {
                    id: `post-${Date.now()}`,
                    type: uploadFile ? (uploadFile.type.startsWith('video/') ? 'video' : 'image') : 'text',
                    content: newPostText,
                    tier: newPostTier,
                    likes: 0,
                    comments: 0,
                    views: 0,
                    timestamp: isScheduled ? undefined : 'now',
                    scheduledFor: newPostScheduledDate || undefined,
                    isLocked: newPostTier !== 'FREE',
                    media: uploadPreview || undefined
                }
                
                // Only add to posts if not scheduled or if scheduled for past/now
                if (!isScheduled) {
                    setPosts([newPost, ...posts])
                } else {
                    // Add scheduled post but it won't appear in main feed until scheduled time
                    setPosts([...posts, newPost])
                }
                
                if (isScheduled) {
                    toast.success(isArabic ? '⏰ تم جدولة المنشور بنجاح!' : '⏰ Post scheduled successfully!')
                } else {
                    toast.success(isArabic ? '✅ تم نشر المنشور بنجاح!' : '✅ Post published successfully!')
                }
            }
            
            // Reset form
            setNewPostText('')
            setNewPostTier('FREE')
            setNewPostScheduledDate('')
            setUploadFile(null)
            setUploadPreview(null)
            setEditingPost(null)
            setShowNewPostModal(false)
        } catch (error) {
            console.error('Error creating post:', error)
            toast.error(isArabic ? 'فشل نشر المنشور' : 'Failed to publish post')
        } finally {
            setUploadingPost(false)
        }
    }, [newPostText, newPostTier, newPostScheduledDate, uploadFile, uploadPreview, posts, isArabic, editingPost])

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            toast.error(isArabic ? 'حجم الملف كبير جداً (الحد الأقصى 50 ميجا)' : 'File too large (max 50MB)')
            return
        }

        setUploadFile(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setUploadPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }, [isArabic])

    const handleRemoveFile = useCallback(() => {
        setUploadFile(null)
        setUploadPreview(null)
    }, [])

    const handleDeletePost = useCallback((postId: string) => {
        if (confirm(isArabic ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?')) {
            setPosts(posts.filter(p => p.id !== postId))
            toast.success(isArabic ? '🗑️ تم حذف المنشور' : '🗑️ Post deleted')
        }
    }, [posts, isArabic])

    const handlePublishNow = useCallback((postId: string) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    timestamp: 'now',
                    scheduledFor: undefined
                }
            }
            return post
        }))
        toast.success(isArabic ? '✅ تم نشر المنشور الآن!' : '✅ Post published now!')
    }, [posts, isArabic])

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

    if (!mentor || !mentor.user) {
        console.error('Mentor data missing or malformed:', mentor)
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-center p-6">
                    <p className="text-lg font-semibold mb-4">
                        {isArabic
                            ? 'فشل تحميل صفحة المُنشئ. يرجى المحاولة مرة أخرى.'
                            : 'Failed to load creator profile. Please try again.'
                        }
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <Button onClick={() => fetchMentorData()} className="px-4 py-2">
                            {isArabic ? 'إعادة المحاولة' : 'Retry'}
                        </Button>
                        <Button onClick={() => router.push(`/${locale}/mentors`)} className="px-4 py-2 bg-card hover:bg-card-hover">
                            {isArabic ? 'العودة' : 'Back to creators'}
                        </Button>
                    </div>
                </div>
            </div>
        )
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
                                    onClick={handleBackToMentors}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-card-hover text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'رجوع' : 'Back to Feed'}</span>
                                </button>

                                {/* Posts Tab */}
                                <button
                                    onClick={handleSetPostsTab}
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
                                    onClick={handleSetMediaTab}
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
                                    onClick={handleSetSessionsTab}
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
                <div className="h-48 sm:h-64 relative overflow-hidden">
                    {coverPhotoPreview ? (
                        <img 
                            src={coverPhotoPreview} 
                            alt="Cover" 
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900" />
                    )}
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
                                {isCreatorView ? (
                                    /* Own Profile - Show Edit Profile & Stats */
                                    <>
                                        <Button
                                            onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                console.log('Edit Profile clicked', { showEditProfileModal, mentor })
                                                try {
                                                    if (mentor) {
                                                        setEditProfileData({
                                                            name: mentor.user.name || '',
                                                            arabicName: mentor.user.arabicName || '',
                                                            bio: mentor.user.bio || '',
                                                            expertise: mentor.expertise || '',
                                                            location: (mentor.user as any).location || '',
                                                            hourlyRate: (mentor as any).hourlyRate || 0,
                                                            basicPrice: mentor.basicMonthlyPrice || 0,
                                                            premiumPrice: mentor.premiumMonthlyPrice || 0,
                                                            vipPrice: mentor.vipMonthlyPrice || 0
                                                        })
                                                    }
                                                    console.log('Opening modal...')
                                                    setShowEditProfileModal(true)
                                                } catch (error) {
                                                    console.error('Error opening edit profile:', error)
                                                    toast.error('Error opening edit profile')
                                                }
                                            }}
                                            className="bg-card hover:bg-card-hover text-foreground border border-border font-semibold px-6 py-2 rounded-full"
                                        >
                                            <Settings className="w-4 h-4 mr-2" />
                                            {isArabic ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                                        </Button>
                                        <Button
                                            onClick={() => setActiveTab('profile')}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-6 py-2 rounded-full"
                                        >
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            {isArabic ? 'لوحة التحكم' : 'Dashboard'}
                                        </Button>
                                        <button
                                            onClick={handleShare}
                                            className="p-2 rounded-full bg-card/50 hover:bg-card-hover border border-border transition-all"
                                        >
                                            <Share2 className="w-5 h-5 text-foreground" />
                                        </button>
                                    </>
                                ) : (
                                    /* Other's Profile - Show Subscribe/Follow */
                                    <>
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
                                    </>
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
                            
                            {/* Leave Review Button - Only for subscribers (not for own profile) */}
                            {!isCreatorView && currentSubscription && (
                                <button
                                    onClick={() => setIsReviewModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-full text-sm font-semibold transition-all ml-auto"
                                >
                                    <Star className="w-4 h-4" />
                                    {isArabic ? 'اترك تقييماً' : 'Leave a Review'}
                                </button>
                            )}
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
                            {/* Current Subscription Status (not for own profile) */}
                            {!isCreatorView && currentSubscription && (
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

                            {/* Subscription Tiers - OnlyFans Style Full-Width Slider (Hide for own profile) */}
                            {!isCreatorView && (
                            <div id="subscription-tiers" className="relative mb-6 -mx-6 overflow-hidden bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-yellow-600/10">
                                {/* Navigation Arrows */}
                                <div className="absolute top-1/2 left-2 right-2 md:left-4 md:right-4 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                                    <button
                                        onClick={() => setActiveTierIndex(Math.max(0, activeTierIndex - 1))}
                                        disabled={activeTierIndex === 0}
                                        className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/80 transition-all shadow-xl"
                                    >
                                        <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                                    </button>
                                    <button
                                        onClick={() => setActiveTierIndex(Math.min(2, activeTierIndex + 1))}
                                        disabled={activeTierIndex === 2}
                                        className="pointer-events-auto w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-black/80 transition-all shadow-xl"
                                    >
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Pagination Dots */}
                                <div className="absolute top-6 left-0 right-0 flex justify-center gap-2 z-10">
                                    {[0, 1, 2].map((index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveTierIndex(index)}
                                            className={`h-1.5 rounded-full transition-all ${
                                                activeTierIndex === index 
                                                    ? 'w-8 bg-white shadow-lg' 
                                                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* Slider Container */}
                                <div className="overflow-hidden pt-16 pb-8 px-6">
                                    <motion.div
                                        className="flex"
                                        animate={{ x: `${-activeTierIndex * 100}%` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    >
                                        {/* Basic Tier Slide */}
                                        {mentor.basicMonthlyPrice && (
                                            <div className="w-full flex-shrink-0 px-4">
                                                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/40 rounded-xl p-5 max-w-xs mx-auto text-center">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-500/30 rounded-full mb-3">
                                                        <Sparkles className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                    <h4 className="text-xl font-black text-foreground mb-2">Basic</h4>
                                                    <div className="text-3xl font-black text-foreground mb-1">
                                                        ${mentor.basicMonthlyPrice}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mb-5">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                
                                                    {/* Perks List */}
                                                    <div className="mb-5 text-left">
                                                        <ul className="space-y-1.5 text-xs text-foreground">
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'الوصول لجميع المنشورات' : 'All posts & content'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'مساحة المجتمع' : 'Community access'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'تحديثات أسبوعية' : 'Weekly updates'}</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    
                                                    <Button 
                                                        onClick={() => handleSubscribe('BASIC')}
                                                        disabled={isSubscribing || currentSubscription === 'BASIC'}
                                                        className="w-full h-10 text-sm font-bold rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                                    >
                                                        {currentSubscription === 'BASIC' 
                                                            ? (isArabic ? '✓ خطتك الحالية' : '✓ Current Plan')
                                                            : isSubscribing ? (isArabic ? 'جاري...' : 'Processing...') 
                                                            : (isArabic ? 'اشترك الآن' : 'Subscribe Now')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Premium Tier Slide */}
                                        {mentor.premiumMonthlyPrice && (
                                            <div className="w-full flex-shrink-0 px-4">
                                                <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 border-2 border-purple-500/40 rounded-xl p-5 max-w-xs mx-auto text-center relative overflow-hidden">
                                                    <div className="absolute top-3 right-3 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                                        {isArabic ? '🔥 الأشهر' : '🔥 POPULAR'}
                                                    </div>
                                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/30 rounded-full mb-3">
                                                        <Star className="w-6 h-6 text-purple-400" />
                                                    </div>
                                                    <h4 className="text-xl font-black text-foreground mb-2">Premium</h4>
                                                    <div className="text-3xl font-black text-foreground mb-1">
                                                        ${mentor.premiumMonthlyPrice}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mb-5">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                
                                                    {/* Perks List */}
                                                    <div className="mb-5 text-left">
                                                        <ul className="space-y-1.5 text-xs text-foreground">
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                                                <span className="font-semibold">{isArabic ? 'كل مزايا Basic +' : 'Everything in Basic +'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'جلسات Q&A مباشرة' : 'Monthly live Q&A'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'دعم ذو أولوية' : 'Priority support'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'موارد حصرية' : 'Exclusive resources'}</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    
                                                    <Button 
                                                        onClick={() => handleSubscribe('PREMIUM')}
                                                        disabled={isSubscribing || currentSubscription === 'PREMIUM'}
                                                        className="w-full h-10 text-sm font-bold rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                                    >
                                                        {currentSubscription === 'PREMIUM' 
                                                            ? (isArabic ? '✓ خطتك الحالية' : '✓ Current Plan')
                                                            : isSubscribing ? (isArabic ? 'جاري...' : 'Processing...') 
                                                            : (isArabic ? 'اشترك الآن' : 'Subscribe Now')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* VIP Tier Slide */}
                                        {mentor.vipMonthlyPrice && (
                                            <div className="w-full flex-shrink-0 px-4">
                                                <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-yellow-500/20 border-2 border-yellow-500/40 rounded-xl p-5 max-w-xs mx-auto text-center relative overflow-hidden">
                                                    <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                                        {isArabic ? '👑 VIP' : '👑 ELITE'}
                                                    </div>
                                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-500/30 rounded-full mb-3">
                                                        <Crown className="w-6 h-6 text-yellow-400" />
                                                    </div>
                                                    <h4 className="text-xl font-black text-foreground mb-2">VIP</h4>
                                                    <div className="text-3xl font-black text-foreground mb-1">
                                                        ${mentor.vipMonthlyPrice}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mb-5">{isArabic ? 'شهرياً' : 'per month'}</div>
                                                
                                                    {/* Perks List */}
                                                    <div className="mb-5 text-left">
                                                        <ul className="space-y-1.5 text-xs text-foreground">
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                                                <span className="font-semibold">{isArabic ? 'كل مزايا Premium +' : 'Everything in Premium +'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'جلسات 1:1' : '1-on-1 coaching'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'مراسلة مباشرة' : 'Direct messaging'}</span>
                                                            </li>
                                                            <li className="flex items-center gap-2">
                                                                <CheckCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                                                                <span>{isArabic ? 'محتوى مخصص' : 'Custom content'}</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                    
                                                    <Button 
                                                        onClick={() => handleSubscribe('VIP')}
                                                        disabled={isSubscribing || currentSubscription === 'VIP'}
                                                        className="w-full h-10 text-sm font-bold rounded-full bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:from-yellow-600 hover:via-orange-600 hover:to-yellow-600 disabled:opacity-50 text-yellow-900 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                                                    >
                                                        {currentSubscription === 'VIP' 
                                                            ? (isArabic ? '✓ خطتك الحالية' : '✓ Current Plan')
                                                            : isSubscribing ? (isArabic ? 'جاري...' : 'Processing...') 
                                                            : (isArabic ? 'اشترك الآن' : 'Subscribe Now')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                            )}

                            {/* Posts Feed */}
                            {displayPosts
                                .filter(post => {
                                    // Filter out scheduled posts that haven't been published yet
                                    if (post.scheduledFor && !post.timestamp) {
                                        const scheduledDate = new Date(post.scheduledFor)
                                        const now = new Date()
                                        return scheduledDate <= now
                                    }
                                    return true
                                })
                                .map((post, i) => {
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
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {(() => {
                                                            let postDate: Date;
                                                            
                                                            // Parse timestamp - handle both ISO strings and relative strings
                                                            if (post.timestamp && post.timestamp.includes('T')) {
                                                                // ISO string format
                                                                postDate = new Date(post.timestamp);
                                                            } else if (post.scheduledFor && post.timestamp) {
                                                                // Scheduled post that was published
                                                                postDate = new Date(post.scheduledFor);
                                                            } else {
                                                                // Fallback for legacy formats
                                                                const now = new Date();
                                                                if (post.timestamp === '2h') postDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
                                                                else if (post.timestamp === '5h') postDate = new Date(now.getTime() - 5 * 60 * 60 * 1000);
                                                                else if (post.timestamp === '8h') postDate = new Date(now.getTime() - 8 * 60 * 60 * 1000);
                                                                else if (post.timestamp === '1d') postDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                                                                else if (post.timestamp === '2d') postDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
                                                                else postDate = new Date(); // Default to now
                                                            }
                                                            
                                                            // Calculate time difference
                                                            const now = new Date();
                                                            const diffMs = now.getTime() - postDate.getTime();
                                                            const diffMinutes = Math.floor(diffMs / (1000 * 60));
                                                            
                                                            if (diffMinutes < 1) {
                                                                return isArabic ? 'الآن' : 'now';
                                                            } else if (diffMinutes < 60) {
                                                                return isArabic ? `منذ ${diffMinutes} دقيقة` : `${diffMinutes}m ago`;
                                                            } else if (diffMinutes < 1440) { // Less than 24 hours
                                                                const hours = Math.floor(diffMinutes / 60);
                                                                return isArabic ? `منذ ${hours} ساعة` : `${hours}h ago`;
                                                            } else if (diffMinutes < 10080) { // Less than 7 days
                                                                const days = Math.floor(diffMinutes / 1440);
                                                                return isArabic ? `منذ ${days} يوم` : `${days}d ago`;
                                                            } else {
                                                                // Show actual date for older posts
                                                                return postDate.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric'
                                                                });
                                                            }
                                                        })()}
                                                    </span>
                                                    
                                                    {/* Show exact time on hover */}
                                                    <span 
                                                        className="text-xs text-muted-foreground/70 hover:text-muted-foreground cursor-help" 
                                                        title={
                                                            post.timestamp && post.timestamp.includes('T') 
                                                                ? new Date(post.timestamp).toLocaleString(isArabic ? 'ar-EG' : 'en-US')
                                                                : post.scheduledFor 
                                                                    ? new Date(post.scheduledFor).toLocaleString(isArabic ? 'ar-EG' : 'en-US')
                                                                    : ''
                                                        }
                                                    >
                                                        •
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Post Content */}
                                        {isLocked ? (
                                            <div className="relative overflow-hidden rounded-2xl">
                                                {/* Blurred Preview Background */}
                                                <div className="absolute inset-0 blur-2xl opacity-30">
                                                    {post.media && (
                                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500" />
                                                    )}
                                                </div>
                                                
                                                {/* Glassmorphism Overlay */}
                                                <div className="relative backdrop-blur-3xl bg-gradient-to-br from-black/60 via-black/40 to-black/60 border-2 border-white/10 p-8 md:p-12 min-h-[300px] flex flex-col items-center justify-center">
                                                    {/* Animated Lock Icon */}
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                        className={`relative mb-6 p-6 rounded-full ${
                                                            post.tier === 'VIP' ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20' :
                                                            post.tier === 'PREMIUM' ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' :
                                                            'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                                                        }`}
                                                    >
                                                        <Lock className={`w-12 h-12 ${
                                                            post.tier === 'VIP' ? 'text-yellow-400' :
                                                            post.tier === 'PREMIUM' ? 'text-purple-400' :
                                                            'text-blue-400'
                                                        }`} />
                                                    </motion.div>

                                                    {/* Title */}
                                                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2 text-center">
                                                        {post.tier} {isArabic ? 'حصري' : 'Exclusive'}
                                                    </h3>
                                                    
                                                    {/* Description */}
                                                    <p className="text-white/70 text-sm md:text-base mb-6 text-center max-w-md">
                                                        {isArabic 
                                                            ? 'اشترك للوصول إلى هذا المحتوى الحصري وأكثر' 
                                                            : 'Subscribe to unlock this exclusive content and more'
                                                        }
                                                    </p>

                                                    {/* Price Tag */}
                                                    <div className="flex items-center gap-2 mb-6">
                                                        <span className="text-4xl font-black text-white">
                                                            ${post.tier === 'VIP' ? mentor.vipMonthlyPrice : 
                                                              post.tier === 'PREMIUM' ? mentor.premiumMonthlyPrice : 
                                                              mentor.basicMonthlyPrice}
                                                        </span>
                                                        <span className="text-white/60">
                                                            /{isArabic ? 'شهر' : 'month'}
                                                        </span>
                                                    </div>

                                                    {/* CTA Button */}
                                                    <Button 
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (!session) {
                                                                router.push(`/${locale}/login`)
                                                                return
                                                            }
                                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                                        }}
                                                        className={`w-full max-w-xs h-14 text-lg font-bold rounded-full shadow-2xl ${
                                                            post.tier === 'VIP' 
                                                                ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500 hover:shadow-yellow-500/50' :
                                                            post.tier === 'PREMIUM' 
                                                                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:shadow-purple-500/50' :
                                                                'bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 hover:shadow-blue-500/50'
                                                        } text-white border-0 transition-all hover:scale-105`}
                                                    >
                                                        <Crown className="w-5 h-5 mr-2" />
                                                        {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                                                    </Button>

                                                    {/* Benefits Preview */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            document.getElementById('subscription-tiers')?.scrollIntoView({ behavior: 'smooth' })
                                                        }}
                                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-4"
                                                    >
                                                        {isArabic ? 'عرض جميع الخطط' : 'View all plans'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                                                
                                                {/* Media */}
                                                {post.media && post.type === 'image' && (
                                                    <div className="relative rounded-xl overflow-hidden border border-border mb-4 group">
                                                        <img 
                                                            src={post.media} 
                                                            alt="Post content"
                                                            className="w-full aspect-video object-cover"
                                                            onError={(e) => {
                                                                console.error('Image failed to load:', post.media?.substring(0, 100))
                                                                e.currentTarget.style.display = 'none'
                                                                const parent = e.currentTarget.parentElement
                                                                if (parent) {
                                                                    parent.innerHTML = '<div class="aspect-video bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center"><svg class="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p class="text-sm text-muted-foreground mt-2">Image preview unavailable</p></div>'
                                                                }
                                                            }}
                                                        />
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
                                                        <video 
                                                            src={post.media} 
                                                            className="w-full aspect-video object-cover"
                                                            controls
                                                            preload="metadata"
                                                        />
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
                                <button 
                                    onClick={() => setMediaFilter('all')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                        mediaFilter === 'all' 
                                            ? 'bg-purple-500 text-white' 
                                            : 'hover:bg-card-hover text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {isArabic ? 'الكل' : 'All'}
                                </button>
                                <button 
                                    onClick={() => setMediaFilter('images')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                        mediaFilter === 'images' 
                                            ? 'bg-purple-500 text-white' 
                                            : 'hover:bg-card-hover text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {isArabic ? 'صور' : 'Photos'}
                                </button>
                                <button 
                                    onClick={() => setMediaFilter('videos')}
                                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                                        mediaFilter === 'videos' 
                                            ? 'bg-purple-500 text-white' 
                                            : 'hover:bg-card-hover text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {isArabic ? 'فيديوهات' : 'Videos'}
                                </button>
                            </div>

                            {/* Media Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div 
                                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all ${
                                        mediaFilter === 'all' ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-border hover:border-purple-500/50'
                                    }`}
                                    onClick={() => setMediaFilter('all')}
                                >
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {displayPosts.filter(p => p.media).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'إجمالي الوسائط' : 'Total Media'}
                                    </div>
                                </div>
                                <div 
                                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all ${
                                        mediaFilter === 'images' ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-border hover:border-purple-500/50'
                                    }`}
                                    onClick={() => setMediaFilter('images')}
                                >
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {displayPosts.filter(p => p.type === 'image').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'الصور' : 'Photos'}
                                    </div>
                                </div>
                                <div 
                                    className={`bg-card border rounded-xl p-4 cursor-pointer transition-all ${
                                        mediaFilter === 'videos' ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-border hover:border-purple-500/50'
                                    }`}
                                    onClick={() => setMediaFilter('videos')}
                                >
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {displayPosts.filter(p => p.type === 'video').length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'الفيديوهات' : 'Videos'}
                                    </div>
                                </div>
                                <div className="bg-card border border-border rounded-xl p-4">
                                    <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                        {displayPosts.filter(p => p.media && !canViewPost(p)).length}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {isArabic ? 'حصري' : 'Exclusive'}
                                    </div>
                                </div>
                            </div>

                            {/* Media Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {displayPosts
                                    .filter(p => p.media)
                                    .filter(p => {
                                        if (mediaFilter === 'all') return true
                                        if (mediaFilter === 'images') return p.type === 'image'
                                        if (mediaFilter === 'videos') return p.type === 'video'
                                        return true
                                    })
                                    .map((post, i) => {
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
                                                    {/* Actual Media Display */}
                                                    {post.media && (
                                                        <>
                                                            {post.type === 'video' ? (
                                                                <video 
                                                                    src={post.media} 
                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                    onClick={() => setViewingMedia({ type: 'video', url: post.media! })}
                                                                />
                                                            ) : (
                                                                <img 
                                                                    src={post.media} 
                                                                    alt="Media" 
                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                    onClick={() => setViewingMedia({ type: 'image', url: post.media! })}
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                    
                                                    {/* Content Type Icon Overlay */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        {post.type === 'video' && (
                                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <Play className="w-6 h-6 text-white ml-0.5" />
                                                            </div>
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
                            {displayPosts.filter(p => p.media).length === 0 && (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                        <ImageIcon className="w-10 h-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">
                                        {isArabic ? 'لا توجد وسائط' : 'No Media Yet'}
                                    </h3>
                                    <p className="text-muted-foreground mb-4">
                                        {isArabic ? 'لم يتم نشر أي صور أو فيديوهات بعد' : 'No photos or videos have been posted yet'}
                                    </p>
                                    {isCreatorView && (
                                        <Button
                                            onClick={() => {
                                                setActiveTab('profile')
                                                setContentManagementTab('posts')
                                                setShowNewPostModal(true)
                                            }}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {isArabic ? 'إنشاء أول منشور' : 'Create First Post'}
                                        </Button>
                                    )}
                                </div>
                            )}

                            {/* Load More Button */}
                            {displayPosts.filter(p => p.media).length > 0 && (
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
                            {/* Session Stats - Creator View Only */}
                            {isCreatorView && (
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <Calendar className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{upcomingSessions.length}</p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'جلسة قادمة' : 'Upcoming'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {upcomingSessions.reduce((acc, s) => acc + (s.attendees || 0), 0)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'مشارك' : 'Attendees'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                                <Play className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{archivedSessions.length}</p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'مسجل' : 'Recorded'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                                                <Crown className="w-5 h-5 text-yellow-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {upcomingSessions.filter(s => s.requiredTier === 'VIP').length}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'VIP' : 'VIP Only'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-6 h-6 text-purple-400" />
                                        <h3 className="text-xl font-bold text-foreground">
                                            {isCreatorView 
                                                ? (isArabic ? 'إدارة الجلسات' : 'Manage Sessions')
                                                : (isArabic ? 'الجلسات القادمة' : 'Upcoming Live Sessions')
                                            }
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isCreatorView ? (
                                            <Button 
                                                onClick={() => setShowNewSessionModal(true)}
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {isArabic ? 'جلسة جديدة' : 'New Session'}
                                            </Button>
                                        ) : (
                                            currentSubscription && (
                                                <Badge className="bg-purple-500 text-white border-0">
                                                    {currentSubscription}
                                                </Badge>
                                            )
                                        )}
                                    </div>
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
                                            {isCreatorView 
                                                ? (isArabic ? 'ابدأ بإنشاء جلستك الأولى' : 'Start by creating your first session')
                                                : (isArabic ? 'ليس هناك جلسات مجدولة حالياً' : 'No sessions are currently scheduled')
                                            }
                                        </p>
                                        {isCreatorView && (
                                            <Button 
                                                onClick={() => setShowNewSessionModal(true)}
                                                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {isArabic ? 'إنشاء جلسة' : 'Create Session'}
                                            </Button>
                                        )}
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
                                                        {isCreatorView ? (
                                                            <div className="flex items-center gap-2">
                                                                <button 
                                                                    onClick={() => toast(isArabic ? 'التعديل قريباً' : 'Edit coming soon', { icon: '✏️' })}
                                                                    className="p-2 hover:bg-card-hover rounded-lg transition-colors"
                                                                    title={isArabic ? 'تعديل الجلسة' : 'Edit session'}
                                                                >
                                                                    <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteSession(session.id, false)}
                                                                    disabled={deletingSessionId === session.id}
                                                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                                                    title={isArabic ? 'حذف الجلسة' : 'Delete session'}
                                                                >
                                                                    {deletingSessionId === session.id ? (
                                                                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                                                    ) : (
                                                                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            isLocked && <Lock className="w-5 h-5 text-muted-foreground" />
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
                                                    {isCreatorView ? (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => toast.success(isArabic ? 'قريباً' : 'Coming soon')}
                                                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                                            >
                                                                <Users className="w-4 h-4 mr-2" />
                                                                {isArabic ? `الحاضرون (${session.attendees})` : `Attendees (${session.attendees})`}
                                                            </Button>
                                                            <Button
                                                                onClick={() => toast.success(isArabic ? 'قريباً' : 'Coming soon')}
                                                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                            >
                                                                <Video className="w-4 h-4 mr-2" />
                                                                {isArabic ? 'بدء الجلسة' : 'Start Session'}
                                                            </Button>
                                                        </div>
                                                    ) : isLocked ? (
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
                                            {isCreatorView 
                                                ? (isArabic ? 'إدارة التسجيلات' : 'Manage Recordings')
                                                : (isArabic ? 'التسجيلات المؤرشفة' : 'Archived Recordings')
                                            }
                                        </h3>
                                    </div>
                                    {isCreatorView && (
                                        <Button 
                                            onClick={() => setShowNewRecordingModal(true)}
                                            size="sm"
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {isArabic ? 'إضافة تسجيل' : 'Add Recording'}
                                        </Button>
                                    )}
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex items-center gap-2 mb-6 flex-wrap">
                                    <button
                                        onClick={handleSessionFilterAll}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                            sessionFilter === 'all'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-card hover:bg-card-hover text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {isArabic ? 'الكل' : 'All'}
                                    </button>
                                    <button
                                        onClick={handleSessionFilterWorkshop}
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
                                    {filteredArchivedSessions.map((session, index) => {
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
                                                                        {session.views || 0}
                                                                    </span>
                                                                </div>

                                                                {isCreatorView ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => toast(isArabic ? 'التعديل قريباً' : 'Edit coming soon', { icon: '✏️' })}
                                                                            variant="outline"
                                                                        >
                                                                            <Edit2 className="w-3 h-3 mr-1" />
                                                                            {isArabic ? 'تعديل' : 'Edit'}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleDeleteSession(session.id, true)}
                                                                            disabled={deletingSessionId === session.id}
                                                                            variant="outline"
                                                                            className="border-red-500/50 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                                                                        >
                                                                            {deletingSessionId === session.id ? (
                                                                                <div className="w-3 h-3 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mr-1" />
                                                                            ) : (
                                                                                <Trash2 className="w-3 h-3 mr-1" />
                                                                            )}
                                                                            {isArabic ? 'حذف' : 'Delete'}
                                                                        </Button>
                                                                    </div>
                                                                ) : canAccess ? (
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
                                {displayArchivedSessions.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                            <Play className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-bold text-foreground mb-2">
                                            {isArabic ? 'لا توجد تسجيلات' : 'No Recordings Yet'}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {isCreatorView 
                                                ? (isArabic ? 'ابدأ بإضافة تسجيلك الأول' : 'Start by adding your first recording')
                                                : (isArabic ? 'سيتم إضافة التسجيلات المؤرشفة هنا' : 'Archived session recordings will appear here')
                                            }
                                        </p>
                                        {isCreatorView && (
                                            <Button 
                                                onClick={() => {
                                                    const newRecording = {
                                                        id: `recording-${Date.now()}`,
                                                        title: isArabic ? 'تسجيل جديد' : 'New Recording',
                                                        type: 'WORKSHOP',
                                                        duration: 60,
                                                        recordedDate: new Date().toISOString(),
                                                        requiredTier: 'BASIC',
                                                        views: 0,
                                                        likes: 0,
                                                        description: isArabic ? 'وصف التسجيل' : 'Recording description'
                                                    }
                                                    setRealArchivedSessions([newRecording])
                                                    toast.success(isArabic ? 'تم إضافة التسجيل' : 'Recording added!')
                                                }}
                                                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {isArabic ? 'إضافة تسجيل' : 'Add Recording'}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Info Box */}
                                {!currentSubscription && !isCreatorView && displayArchivedSessions.length > 0 && (
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
                            {/* Community Stats - Creator View Only */}
                            {isCreatorView && (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                                <MessageSquare className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{displayCommunityPosts.length}</p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'منشور' : 'Posts'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {displayCommunityPosts.reduce((acc, p) => acc + p.replies, 0)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'ردود' : 'Replies'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-gradient-to-br from-pink-900/20 to-rose-900/20 border border-pink-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center">
                                                <Heart className="w-5 h-5 text-pink-400" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">
                                                    {displayCommunityPosts.reduce((acc, p) => acc + p.likes, 0)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'إعجاب' : 'Likes'}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}

                            {/* Pinned Resources Section */}
                            {pinnedResources.length > 0 && (
                                <div className="bg-card border border-border rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Paperclip className="w-5 h-5 text-purple-400" />
                                            <h3 className="text-lg font-bold text-foreground">
                                                {isArabic ? 'الموارد المثبتة' : 'Pinned Resources'}
                                            </h3>
                                        </div>
                                        {isCreatorView && (
                                            <Button 
                                                onClick={() => setShowAddResourceModal(true)}
                                                size="sm"
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {isArabic ? 'إضافة مورد' : 'Add Resource'}
                                            </Button>
                                        )}
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
                                                {isCreatorView ? (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingResource(resource)
                                                                setNewResourceData({
                                                                    title: resource.title,
                                                                    titleAr: resource.titleAr || resource.title,
                                                                    type: resource.type,
                                                                    size: resource.size,
                                                                    url: resource.url,
                                                                    description: resource.description || '',
                                                                    descriptionAr: resource.descriptionAr || resource.description || ''
                                                                })
                                                                setShowEditResourceModal(true)
                                                            }}
                                                            className="p-2 hover:bg-card-hover rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                        </button>
                                                        <button 
                                                            onClick={async () => {
                                                                if (!mentor) return
                                                                
                                                                const confirmed = window.confirm(
                                                                    isArabic 
                                                                        ? `هل أنت متأكد من حذف "${resource.title}"؟ لا يمكن التراجع عن هذا الإجراء.`
                                                                        : `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`
                                                                )
                                                                
                                                                if (!confirmed) return
                                                                
                                                                try {
                                                                    toast.loading(isArabic ? 'جاري الحذف...' : 'Deleting...')
                                                                    
                                                                    const response = await fetch(`/api/mentors/${mentor.id}/resources?resourceId=${resource.id}`, {
                                                                        method: 'DELETE'
                                                                    })
                                                                    
                                                                    if (response.ok) {
                                                                        toast.success(isArabic ? 'تم حذف المورد!' : 'Resource deleted!')
                                                                        fetchResourcesFromAPI()
                                                                    } else {
                                                                        const error = await response.json()
                                                                        toast.error(error.message || (isArabic ? 'فشل الحذف' : 'Failed to delete'))
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error deleting resource:', error)
                                                                    toast.error(isArabic ? 'حدث خطأ أثناء الحذف' : 'Error deleting resource')
                                                                }
                                                            }}
                                                            className="p-2 hover:bg-red-500/10 hover:bg-card-hover rounded-lg transition-colors group"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-500 transition-colors" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600 text-white">
                                                        {isArabic ? 'تحميل' : 'Download'}
                                                    </Button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Community Management - Creator View */}
                            {isCreatorView ? (
                                <div className="bg-card border border-border rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <MessageSquare className="w-6 h-6 text-purple-400" />
                                            <h3 className="text-xl font-bold text-foreground">
                                                {isArabic ? 'إدارة المجتمع' : 'Community Management'}
                                            </h3>
                                        </div>
                                        <Button
                                            onClick={() => setShowCreatePostModal(true)}
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            {isArabic ? 'منشور جديد' : 'New Post'}
                                        </Button>
                                    </div>

                                    {/* Management Tabs */}
                                    <div className="flex items-center gap-1 mb-6 bg-background rounded-lg p-1">
                                        <button
                                            onClick={() => setCommunityManagementTab('posts')}
                                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                                communityManagementTab === 'posts'
                                                    ? 'bg-purple-500 text-white'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2 inline" />
                                            {isArabic ? 'المنشورات' : 'Posts'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCommunityManagementTab('members')
                                                fetchCommunityMembers()
                                            }}
                                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                                communityManagementTab === 'members'
                                                    ? 'bg-purple-500 text-white'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Users className="w-4 h-4 mr-2 inline" />
                                            {isArabic ? 'الأعضاء' : 'Members'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setCommunityManagementTab('analytics')
                                                fetchCommunityAnalytics()
                                            }}
                                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                                communityManagementTab === 'analytics'
                                                    ? 'bg-purple-500 text-white'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <BarChart3 className="w-4 h-4 mr-2 inline" />
                                            {isArabic ? 'الإحصائيات' : 'Analytics'}
                                        </button>
                                    </div>

                                    {/* Posts Management */}
                                    {communityManagementTab === 'posts' && (
                                        <div className="space-y-4">
                                            {/* Quick Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <MessageSquare className="w-4 h-4 text-purple-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'المنشورات' : 'Posts'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{displayCommunityPosts.length}</p>
                                                </div>
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Heart className="w-4 h-4 text-pink-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'الإعجابات' : 'Likes'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {displayCommunityPosts.reduce((acc, p) => acc + p.likes, 0)}
                                                    </p>
                                                </div>
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <MessageCircle className="w-4 h-4 text-blue-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'الردود' : 'Replies'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {displayCommunityPosts.reduce((acc, p) => acc + p.replies, 0)}
                                                    </p>
                                                </div>
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Eye className="w-4 h-4 text-green-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'المشاهدات' : 'Views'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">
                                                        {displayCommunityPosts.reduce((acc, p) => acc + p.likes * 5, 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Posts List with Management Actions */}
                                            <div className="space-y-3">
                                                {displayCommunityPosts.length === 0 ? (
                                                    <div className="text-center py-8">
                                                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                        <p className="text-muted-foreground">
                                                            {isArabic ? 'لا توجد منشورات بعد' : 'No posts yet'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    displayCommunityPosts.map((post) => (
                                                        <div key={post.id} className="bg-background border border-border rounded-xl p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <span className="font-medium text-foreground">
                                                                            {post.author.name}
                                                                        </span>
                                                                        <Badge className={`${
                                                                            post.author.tier === 'VIP' ? 'bg-yellow-500' :
                                                                            post.author.tier === 'PREMIUM' ? 'bg-purple-500' :
                                                                            'bg-blue-500'
                                                                        } text-white border-0 text-xs`}>
                                                                            {post.author.tier}
                                                                        </Badge>
                                                                        <span className="text-xs text-muted-foreground">• {post.timestamp}</span>
                                                                        {post.isPinned && (
                                                                            <Badge className="bg-orange-500 text-white border-0 text-xs">
                                                                                <Paperclip className="w-3 h-3 mr-1" />
                                                                                {isArabic ? 'مثبت' : 'Pinned'}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-foreground mb-3">{post.content}</p>
                                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                                        <span className="flex items-center gap-1">
                                                                            <Heart className="w-4 h-4" />
                                                                            {post.likes}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <MessageCircle className="w-4 h-4" />
                                                                            {post.replies} {isArabic ? 'رد' : 'replies'}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Eye className="w-4 h-4" />
                                                                            {post.likes * 5} {isArabic ? 'مشاهدة' : 'views'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 ml-4">
                                                                    <button
                                                                        onClick={() => handleTogglePin(post.id, post.isPinned || false)}
                                                                        className={`p-2 rounded-lg transition-colors ${
                                                                            post.isPinned 
                                                                                ? 'bg-orange-500/10 text-orange-500' 
                                                                                : 'hover:bg-card-hover text-muted-foreground'
                                                                        }`}
                                                                        title={post.isPinned ? (isArabic ? 'إلغاء التثبيت' : 'Unpin') : (isArabic ? 'تثبيت' : 'Pin')}
                                                                    >
                                                                        <Paperclip className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (!mentor) return
                                                                            const confirmed = window.confirm(
                                                                                isArabic ? 'هل تريد حذف هذا المنشور؟' : 'Delete this post?'
                                                                            )
                                                                            if (confirmed) {
                                                                                try {
                                                                                    const response = await fetch(`/api/mentors/${mentor.id}/discussions?commentId=${post.id}`, {
                                                                                        method: 'DELETE'
                                                                                    })
                                                                                    if (response.ok) {
                                                                                        toast.success(isArabic ? 'تم الحذف' : 'Deleted')
                                                                                        fetchCommunityPostsFromAPI()
                                                                                    } else {
                                                                                        toast.error(isArabic ? 'فشل الحذف' : 'Failed to delete')
                                                                                    }
                                                                                } catch (error) {
                                                                                    toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-500 rounded-lg transition-colors"
                                                                        title={isArabic ? 'حذف' : 'Delete'}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Members Management */}
                                    {communityManagementTab === 'members' && (
                                        <div className="space-y-4">
                                            {/* Members Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Users className="w-4 h-4 text-blue-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'إجمالي الأعضاء' : 'Total Members'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">247</p>
                                                </div>
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Crown className="w-4 h-4 text-yellow-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'أعضاء VIP' : 'VIP Members'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">23</p>
                                                </div>
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <TrendingUp className="w-4 h-4 text-green-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'نشط هذا الشهر' : 'Active This Month'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">189</p>
                                                </div>
                                                <div className="bg-background rounded-lg p-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Clock className="w-4 h-4 text-orange-400" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {isArabic ? 'جدد هذا الأسبوع' : 'New This Week'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">12</p>
                                                </div>
                                            </div>

                                            {/* Members Filter */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant={memberFilter === 'all' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setMemberFilter('all')}
                                                    >
                                                        {isArabic ? 'الكل' : 'All'}
                                                    </Button>
                                                    <Button
                                                        variant={memberFilter === 'vip' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setMemberFilter('vip')}
                                                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                                    >
                                                        VIP
                                                    </Button>
                                                    <Button
                                                        variant={memberFilter === 'premium' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setMemberFilter('premium')}
                                                        className="bg-purple-500 hover:bg-purple-600 text-white"
                                                    >
                                                        Premium
                                                    </Button>
                                                    <Button
                                                        variant={memberFilter === 'basic' ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => setMemberFilter('basic')}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white"
                                                    >
                                                        Basic
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder={isArabic ? 'ابحث عن عضو...' : 'Search members...'}
                                                        className="w-48"
                                                        value={memberSearchQuery}
                                                        onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Members List */}
                                            <div className="space-y-3">
                                                {[
                                                    {
                                                        id: '1',
                                                        name: 'Ahmed Hassan',
                                                        arabicName: 'أحمد حسن',
                                                        email: 'ahmed@example.com',
                                                        tier: 'VIP',
                                                        joinDate: '2024-01-15',
                                                        lastActive: '2 hours ago',
                                                        totalPosts: 45,
                                                        totalLikes: 234,
                                                        avatar: null,
                                                        status: 'active'
                                                    },
                                                    {
                                                        id: '2',
                                                        name: 'Sara Ali',
                                                        arabicName: 'سارة علي',
                                                        email: 'sara@example.com',
                                                        tier: 'PREMIUM',
                                                        joinDate: '2024-02-20',
                                                        lastActive: '1 day ago',
                                                        totalPosts: 23,
                                                        totalLikes: 156,
                                                        avatar: null,
                                                        status: 'active'
                                                    },
                                                    {
                                                        id: '3',
                                                        name: 'Omar Farouk',
                                                        arabicName: 'عمر فاروق',
                                                        email: 'omar@example.com',
                                                        tier: 'BASIC',
                                                        joinDate: '2024-03-10',
                                                        lastActive: '3 days ago',
                                                        totalPosts: 12,
                                                        totalLikes: 67,
                                                        avatar: null,
                                                        status: 'active'
                                                    },
                                                    {
                                                        id: '4',
                                                        name: 'Layla Mohamed',
                                                        arabicName: 'ليلى محمد',
                                                        email: 'layla@example.com',
                                                        tier: 'VIP',
                                                        joinDate: '2024-01-08',
                                                        lastActive: '5 minutes ago',
                                                        totalPosts: 78,
                                                        totalLikes: 445,
                                                        avatar: null,
                                                        status: 'active'
                                                    },
                                                    {
                                                        id: '5',
                                                        name: 'Khaled Nasser',
                                                        arabicName: 'خالد ناصر',
                                                        email: 'khaled@example.com',
                                                        tier: 'PREMIUM',
                                                        joinDate: '2024-02-14',
                                                        lastActive: '1 week ago',
                                                        totalPosts: 8,
                                                        totalLikes: 34,
                                                        avatar: null,
                                                        status: 'warned'
                                                    }
                                                ]
                                                    .filter(member => {
                                                        if (memberFilter !== 'all' && member.tier.toLowerCase() !== memberFilter) return false
                                                        if (memberSearchQuery) {
                                                            const query = memberSearchQuery.toLowerCase()
                                                            return member.name.toLowerCase().includes(query) ||
                                                                   member.arabicName.includes(memberSearchQuery) ||
                                                                   member.email.toLowerCase().includes(query)
                                                        }
                                                        return true
                                                    })
                                                    .map((member) => (
                                                    <div key={member.id} className="bg-background border border-border rounded-xl p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-4">
                                                                {/* Avatar */}
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                                                    <span className="text-sm font-bold text-white">
                                                                        {(isArabic ? member.arabicName : member.name)[0]}
                                                                    </span>
                                                                </div>

                                                                {/* Member Info */}
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <h4 className="font-semibold text-foreground">
                                                                            {isArabic ? member.arabicName : member.name}
                                                                        </h4>
                                                                        <Badge className={`${
                                                                            member.tier === 'VIP' ? 'bg-yellow-500' :
                                                                            member.tier === 'PREMIUM' ? 'bg-purple-500' :
                                                                            'bg-blue-500'
                                                                        } text-white border-0 text-xs`}>
                                                                            {member.tier}
                                                                        </Badge>
                                                                        {member.status === 'warned' && (
                                                                            <Badge className="bg-orange-500 text-white border-0 text-xs">
                                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                                {isArabic ? 'محذر' : 'Warned'}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-muted-foreground mb-1">{member.email}</p>
                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                        <span>{isArabic ? 'انضم:' : 'Joined:'} {new Date(member.joinDate).toLocaleDateString()}</span>
                                                                        <span>{isArabic ? 'آخر نشاط:' : 'Last active:'} {member.lastActive}</span>
                                                                        <span>{member.totalPosts} {isArabic ? 'منشور' : 'posts'}</span>
                                                                        <span>{member.totalLikes} {isArabic ? 'إعجاب' : 'likes'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        toast.success(isArabic ? 'تم إرسال رسالة' : 'Message sent')
                                                                    }}
                                                                    className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-lg transition-colors"
                                                                    title={isArabic ? 'إرسال رسالة' : 'Send message'}
                                                                >
                                                                    <MessageSquare className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const action = member.status === 'warned' ? 'removed warning' : 'warned'
                                                                        toast.success(isArabic ? 
                                                                            (action === 'warned' ? 'تم تحذير العضو' : 'تم إزالة التحذير') : 
                                                                            `Member ${action}`)
                                                                    }}
                                                                    className={`p-2 rounded-lg transition-colors ${
                                                                        member.status === 'warned' 
                                                                            ? 'hover:bg-green-500/10 text-green-500' 
                                                                            : 'hover:bg-orange-500/10 text-orange-500'
                                                                    }`}
                                                                    title={member.status === 'warned' ? 
                                                                        (isArabic ? 'إزالة التحذير' : 'Remove warning') : 
                                                                        (isArabic ? 'تحذير العضو' : 'Warn member')}
                                                                >
                                                                    <AlertTriangle className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        toast.success(isArabic ? 'تم كتم العضو لمدة 24 ساعة' : 'Member muted for 24 hours')
                                                                    }}
                                                                    className="p-2 hover:bg-purple-500/10 text-purple-500 rounded-lg transition-colors"
                                                                    title={isArabic ? 'كتم العضو' : 'Mute member'}
                                                                >
                                                                    <VolumeX className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        const confirmed = window.confirm(
                                                                            isArabic ? 
                                                                                `هل أنت متأكد من إزالة "${isArabic ? member.arabicName : member.name}" من المجتمع؟` :
                                                                                `Are you sure you want to remove "${member.name}" from the community?`
                                                                        )
                                                                        if (confirmed) {
                                                                            toast.success(isArabic ? 'تم إزالة العضو' : 'Member removed')
                                                                        }
                                                                    }}
                                                                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                                    title={isArabic ? 'إزالة العضو' : 'Remove member'}
                                                                >
                                                                    <UserX className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Bulk Actions */}
                                            <div className="bg-background rounded-lg p-4 border border-border">
                                                <h4 className="font-semibold text-foreground mb-3">
                                                    {isArabic ? 'إجراءات جماعية' : 'Bulk Actions'}
                                                </h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toast.success(isArabic ? 'تم إرسال رسالة لجميع الأعضاء' : 'Message sent to all members')}
                                                    >
                                                        <MessageSquare className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'رسالة للجميع' : 'Message All'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toast.success(isArabic ? 'تم تصدير قائمة الأعضاء' : 'Members list exported')}
                                                    >
                                                        <Download className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'تصدير القائمة' : 'Export List'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => toast.success(isArabic ? 'تم تحديث الإحصائيات' : 'Statistics updated')}
                                                    >
                                                        <RefreshCw className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'تحديث' : 'Refresh'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Analytics Management */}
                                    {communityManagementTab === 'analytics' && (
                                        <div className="space-y-6">
                                            {/* Overview Stats */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp className="w-5 h-5 text-purple-500" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'نمو المجتمع' : 'Community Growth'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">+15.2%</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? 'هذا الشهر' : 'This month'}
                                                    </p>
                                                </div>
                                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Eye className="w-5 h-5 text-blue-500" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'المشاهدات' : 'Total Views'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">12.4K</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? '+8.1% من الأسبوع الماضي' : '+8.1% from last week'}
                                                    </p>
                                                </div>
                                                <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="w-5 h-5 text-green-500" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'معدل التفاعل' : 'Engagement Rate'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">78.3%</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? '+5.2% تحسن' : '+5.2% improvement'}
                                                    </p>
                                                </div>
                                                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock className="w-5 h-5 text-orange-500" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'متوسط وقت القراءة' : 'Avg. Read Time'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">3.2m</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? '+0.4 دقيقة' : '+0.4 min increase'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Top Performing Content */}
                                            <div className="bg-background border border-border rounded-xl p-6">
                                                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                                    {isArabic ? 'أفضل المحتوى أداءً' : 'Top Performing Content'}
                                                </h4>
                                                <div className="space-y-3">
                                                    {[
                                                        {
                                                            title: isArabic ? 'نصائح لتحسين الإنتاجية' : 'Tips for Better Productivity',
                                                            author: isArabic ? 'أحمد حسن' : 'Ahmed Hassan',
                                                            views: 1247,
                                                            likes: 89,
                                                            comments: 23,
                                                            type: 'post'
                                                        },
                                                        {
                                                            title: isArabic ? 'كيفية بناء عادات إيجابية' : 'Building Positive Habits',
                                                            author: isArabic ? 'سارة علي' : 'Sara Ali',
                                                            views: 956,
                                                            likes: 67,
                                                            comments: 18,
                                                            type: 'post'
                                                        },
                                                        {
                                                            title: isArabic ? 'التوازن بين العمل والحياة' : 'Work-Life Balance Guide',
                                                            author: isArabic ? 'ليلى محمد' : 'Layla Mohamed',
                                                            views: 823,
                                                            likes: 54,
                                                            comments: 12,
                                                            type: 'post'
                                                        }
                                                    ].map((content, index) => (
                                                        <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                    index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                                                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                                                                    'bg-orange-500/20 text-orange-500'
                                                                }`}>
                                                                    <span className="text-sm font-bold">#{index + 1}</span>
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-medium text-foreground text-sm">{content.title}</h5>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {isArabic ? 'بواسطة' : 'by'} {content.author}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                <span className="flex items-center gap-1">
                                                                    <Eye className="w-3 h-3" />
                                                                    {content.views}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Heart className="w-3 h-3" />
                                                                    {content.likes}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <MessageCircle className="w-3 h-3" />
                                                                    {content.comments}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Member Activity Timeline */}
                                            <div className="bg-background border border-border rounded-xl p-6">
                                                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-blue-500" />
                                                    {isArabic ? 'نشاط الأعضاء' : 'Member Activity'}
                                                </h4>
                                                <div className="space-y-4">
                                                    {[
                                                        {
                                                            time: '2 hours ago',
                                                            timeAr: 'منذ ساعتين',
                                                            action: 'New member joined',
                                                            actionAr: 'انضم عضو جديد',
                                                            user: 'Omar Farouk',
                                                            userAr: 'عمر فاروق',
                                                            type: 'join',
                                                            icon: UserPlus
                                                        },
                                                        {
                                                            time: '4 hours ago',
                                                            timeAr: 'منذ 4 ساعات',
                                                            action: 'Posted a new discussion',
                                                            actionAr: 'نشر نقاش جديد',
                                                            user: 'Ahmed Hassan',
                                                            userAr: 'أحمد حسن',
                                                            type: 'post',
                                                            icon: MessageSquare
                                                        },
                                                        {
                                                            time: '6 hours ago',
                                                            timeAr: 'منذ 6 ساعات',
                                                            action: 'Upgraded to VIP',
                                                            actionAr: 'ترقى إلى VIP',
                                                            user: 'Sara Ali',
                                                            userAr: 'سارة علي',
                                                            type: 'upgrade',
                                                            icon: Crown
                                                        },
                                                        {
                                                            time: '1 day ago',
                                                            timeAr: 'منذ يوم',
                                                            action: 'Downloaded a resource',
                                                            actionAr: 'حمل مورداً',
                                                            user: 'Layla Mohamed',
                                                            userAr: 'ليلى محمد',
                                                            type: 'download',
                                                            icon: Download
                                                        },
                                                        {
                                                            time: '2 days ago',
                                                            timeAr: 'منذ يومين',
                                                            action: 'Started a live session',
                                                            actionAr: 'بدأ جلسة مباشرة',
                                                            user: 'Khaled Nasser',
                                                            userAr: 'خالد ناصر',
                                                            type: 'session',
                                                            icon: Video
                                                        }
                                                    ].map((activity, index) => {
                                                        const IconComponent = activity.icon
                                                        return (
                                                            <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                                    activity.type === 'join' ? 'bg-green-500/20 text-green-500' :
                                                                    activity.type === 'post' ? 'bg-blue-500/20 text-blue-500' :
                                                                    activity.type === 'upgrade' ? 'bg-yellow-500/20 text-yellow-500' :
                                                                    activity.type === 'download' ? 'bg-purple-500/20 text-purple-500' :
                                                                    'bg-orange-500/20 text-orange-500'
                                                                }`}>
                                                                    <IconComponent className="w-4 h-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm text-foreground">
                                                                        <span className="font-medium">
                                                                            {isArabic ? activity.userAr : activity.user}
                                                                        </span>{' '}
                                                                        {isArabic ? activity.actionAr : activity.action}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {isArabic ? activity.timeAr : activity.time}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Export & Reports */}
                                            <div className="bg-background border border-border rounded-xl p-6">
                                                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-green-500" />
                                                    {isArabic ? 'التقارير والتصدير' : 'Reports & Export'}
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Button
                                                        variant="outline"
                                                        className="h-auto p-4 flex flex-col items-center gap-2"
                                                        onClick={() => toast.success(isArabic ? 'تم تصدير تقرير الأعضاء' : 'Members report exported')}
                                                    >
                                                        <Users className="w-6 h-6 text-blue-500" />
                                                        <div className="text-center">
                                                            <p className="font-medium text-sm">
                                                                {isArabic ? 'تقرير الأعضاء' : 'Members Report'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {isArabic ? 'إحصائيات وبيانات الأعضاء' : 'Member stats & data'}
                                                            </p>
                                                        </div>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="h-auto p-4 flex flex-col items-center gap-2"
                                                        onClick={() => toast.success(isArabic ? 'تم تصدير تقرير المشاركات' : 'Posts report exported')}
                                                    >
                                                        <MessageSquare className="w-6 h-6 text-purple-500" />
                                                        <div className="text-center">
                                                            <p className="font-medium text-sm">
                                                                {isArabic ? 'تقرير المشاركات' : 'Posts Report'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {isArabic ? 'تحليل أداء المنشورات' : 'Post performance analysis'}
                                                            </p>
                                                        </div>
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="h-auto p-4 flex flex-col items-center gap-2"
                                                        onClick={() => toast.success(isArabic ? 'تم تصدير تقرير التفاعل' : 'Engagement report exported')}
                                                    >
                                                        <TrendingUp className="w-6 h-6 text-green-500" />
                                                        <div className="text-center">
                                                            <p className="font-medium text-sm">
                                                                {isArabic ? 'تقرير التفاعل' : 'Engagement Report'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {isArabic ? 'معدلات التفاعل والنمو' : 'Interaction & growth rates'}
                                                            </p>
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-card border border-border rounded-2xl p-6">
                                {/* New Post Input - Only show for non-creator view */}
                                {!isCreatorView && (
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
                                                    onClick={async () => {
                                                        if (!newPostContent.trim() || !mentor || !session?.user) return
                                                        
                                                        try {
                                                            // Create a discussion comment
                                                            const response = await fetch(`/api/mentors/${mentor.id}/discussions`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    postId: 'community-discussion', // General community discussion
                                                                    content: newPostContent
                                                                })
                                                            })
                                                            
                                                            if (response.ok) {
                                                                toast.success(isArabic ? 'تم نشر التعليق' : 'Post shared!')
                                                                setNewPostContent('')
                                                                // Refresh community posts
                                                                fetchCommunityPostsFromAPI()
                                                            } else {
                                                                toast.error(isArabic ? 'فشل النشر' : 'Failed to post')
                                                            }
                                                        } catch (error) {
                                                            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
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
                                )}

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
                                                    {post.author?.profileImage ? (
                                                        <Image
                                                            src={post.author.profileImage}
                                                            alt={isArabic && post.author?.arabicName ? post.author.arabicName : (post.author?.name || 'User')}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full object-cover w-10 h-10"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                                                            <span className="text-sm font-bold text-white">
                                                                {(isArabic && post.author?.arabicName ? post.author.arabicName : post.author?.name || 'U')[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-foreground">
                                                                {isArabic && post.author?.arabicName ? post.author.arabicName : post.author?.name || 'Unknown'}
                                                            </span>
                                                            <Badge className={`${
                                                                post.author?.tier === 'VIP' ? 'bg-yellow-500' :
                                                                post.author?.tier === 'PREMIUM' ? 'bg-purple-500' :
                                                                'bg-blue-500'
                                                            } text-white border-0 text-xs`}>
                                                                {post.author?.tier || 'BASIC'}
                                                            </Badge>
                                                            <span className="text-xs text-muted-foreground">• {post.timestamp}</span>
                                                        </div>
                                                    </div>
                                                    {isCreatorView ? (
                                                        <div className="flex items-center gap-1">
                                                            <button 
                                                                onClick={() => toast.success(isArabic ? 'تم التثبيت' : 'Pinned')}
                                                                className="p-1 hover:bg-card-hover rounded-lg transition-colors"
                                                                title={isArabic ? 'تثبيت المنشور' : 'Pin post'}
                                                            >
                                                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    if (!mentor) return
                                                                    try {
                                                                        const response = await fetch(`/api/mentors/${mentor.id}/discussions?commentId=${post.id}`, {
                                                                            method: 'DELETE'
                                                                        })
                                                                        if (response.ok) {
                                                                            toast.success(isArabic ? 'تم الحذف' : 'Deleted')
                                                                            fetchCommunityPostsFromAPI()
                                                                        } else {
                                                                            toast.error(isArabic ? 'فشل الحذف' : 'Failed to delete')
                                                                        }
                                                                    } catch (error) {
                                                                        toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
                                                                    }
                                                                }}
                                                                className="p-1 hover:bg-card-hover rounded-lg transition-colors"
                                                                title={isArabic ? 'حذف المنشور' : 'Delete post'}
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-400" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button className="p-1 hover:bg-card-hover rounded-lg transition-colors">
                                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                                        </button>
                                                    )}
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
                                                    {!isCreatorView && (
                                                        <button className="flex items-center gap-1 text-muted-foreground hover:text-purple-400 transition-colors ml-auto">
                                                            <Share2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {isCreatorView && (
                                                        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />
                                                                {post.likes * 5}
                                                            </span>
                                                        </div>
                                                    )}
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
                            )}
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
                                        <div className="text-xl font-black text-foreground">{creatorStats.subscribers?.total?.toLocaleString() ?? 0}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'جدد هذا الشهر' : 'New This Month'}</div>
                                        <div className="text-xl font-black text-green-400">+{creatorStats.subscribers?.newThisMonth ?? 0}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'معدل التسرب' : 'Churn Rate'}</div>
                                        <div className="text-xl font-black text-red-400">{creatorStats.subscribers?.churnRate ?? 0}%</div>
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
                                        <div className="text-2xl font-black text-foreground">{creatorStats.content?.posts ?? 0}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Eye className="w-4 h-4 text-blue-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'المشاهدات' : 'Views'}</div>
                                        </div>
                                        <div className="text-2xl font-black text-foreground">{creatorStats.content?.totalViews?.toLocaleString() ?? 0}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Heart className="w-4 h-4 text-pink-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'متوسط الإعجابات' : 'Avg Likes'}</div>
                                        </div>
                                        <div className="text-2xl font-black text-foreground">{creatorStats.engagement?.avgLikes ?? 0}</div>
                                    </div>

                                    <div className="bg-card-hover rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="w-4 h-4 text-yellow-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'معدل التفاعل' : 'Engagement'}</div>
                                        </div>
                                        <div className="text-2xl font-black text-foreground">{creatorStats.engagement?.engagementRate ?? 0}%</div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Video className="w-4 h-4 text-purple-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'جلسات مكتملة' : 'Sessions Done'}</div>
                                        </div>
                                        <div className="text-xl font-black text-foreground">{creatorStats.content?.liveSessionsCompleted ?? 0}</div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Download className="w-4 h-4 text-green-400" />
                                            <div className="text-xs text-muted-foreground">{isArabic ? 'التحميلات' : 'Downloads'}</div>
                                        </div>
                                        <div className="text-xl font-black text-foreground">{creatorStats.content?.totalDownloads?.toLocaleString() ?? 0}</div>
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
                                    {(creatorStats.topSubscribers ?? []).map((sub: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl hover:border-yellow-400 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-600 to-orange-600 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white">{sub.name?.[0] ?? 'U'}</span>
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
                                                    {sub.spent?.toLocaleString() ?? 0} EGP
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
                                    {(creatorStats.recentActivity ?? []).map((activity: any, idx: number) => (
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
                                    <Button 
                                        onClick={() => setShowNewPostModal(true)}
                                        className="bg-purple-500 hover:bg-purple-600 text-white"
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        {isArabic ? 'منشور جديد' : 'New Post'}
                                    </Button>
                                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {isArabic ? 'جدولة جلسة' : 'Schedule Session'}
                                    </Button>
                                    <Button 
                                        onClick={() => setShowUploadModal(true)}
                                        className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {isArabic ? 'رفع محتوى' : 'Upload Content'}
                                    </Button>
                                    <Button 
                                        onClick={() => router.push(`/${locale}/messaging`)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white"
                                    >
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

                            {/* Content Management Tabs */}
                            <div className="bg-card border border-border rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {isArabic ? 'إدارة المحتوى' : 'Content Management'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => setContentView(contentView === 'grid' ? 'list' : 'grid')}
                                            size="sm"
                                            className="bg-card-hover hover:bg-card text-foreground"
                                        >
                                            {contentView === 'grid' ? (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></>
                                            ) : (
                                                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Content Type Tabs */}
                                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                    <button
                                        onClick={() => setContentManagementTab('posts')}
                                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                            contentManagementTab === 'posts'
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                : 'bg-card-hover text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <MessageCircle className="w-4 h-4 inline mr-2" />
                                        {isArabic ? 'المنشورات' : 'Posts'}
                                    </button>
                                    <button
                                        onClick={() => setContentManagementTab('media')}
                                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                            contentManagementTab === 'media'
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                : 'bg-card-hover text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <ImageIcon className="w-4 h-4 inline mr-2" />
                                        {isArabic ? 'الوسائط' : 'Media'}
                                    </button>
                                    <button
                                        onClick={() => setContentManagementTab('calendar')}
                                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                            contentManagementTab === 'calendar'
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                : 'bg-card-hover text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Calendar className="w-4 h-4 inline mr-2" />
                                        {isArabic ? 'الجدول' : 'Calendar'}
                                    </button>
                                    <button
                                        onClick={() => setContentManagementTab('scheduled')}
                                        className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                                            contentManagementTab === 'scheduled'
                                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                : 'bg-card-hover text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <Clock className="w-4 h-4 inline mr-2" />
                                        {isArabic ? 'المجدولة' : 'Scheduled'}
                                    </button>
                                </div>

                                {/* Posts Management */}
                                {contentManagementTab === 'posts' && (
                                    <div className="space-y-4">
                                        {contentView === 'grid' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {posts.slice(0, 8).map((post) => (
                                                    <div key={post.id} className="bg-card-hover rounded-xl p-4 border border-border hover:border-purple-500/30 transition-all">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Badge className={`${
                                                                        post.tier === 'VIP' ? 'bg-yellow-500' :
                                                                        post.tier === 'PREMIUM' ? 'bg-purple-500' :
                                                                        post.tier === 'BASIC' ? 'bg-blue-500' :
                                                                        'bg-gray-500'
                                                                    } text-white border-0 text-xs`}>
                                                                        {post.tier}
                                                                    </Badge>
                                                                    {post.type !== 'text' && (
                                                                        <Badge className="bg-card text-foreground border border-border text-xs">
                                                                            {post.type === 'image' ? '📷' : '🎥'} {post.type}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-foreground line-clamp-2 mb-2">
                                                                    {post.content}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                    <span className="flex items-center gap-1">
                                                                        <Heart className="w-3 h-3" /> {post.likes}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <MessageCircle className="w-3 h-3" /> {post.comments}
                                                                    </span>
                                                                    <span>{post.timestamp}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => {
                                                                    setEditingPost(post)
                                                                    setNewPostText(post.content)
                                                                    setNewPostTier(post.tier as any)
                                                                    setNewPostScheduledDate(post.scheduledFor || '')
                                                                    setUploadPreview(post.media || null)
                                                                    setShowNewPostModal(true)
                                                                }}
                                                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                                                            >
                                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                {isArabic ? 'تعديل' : 'Edit'}
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleDeletePost(post.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {posts.slice(0, 10).map((post) => (
                                                    <div key={post.id} className="flex items-center justify-between p-4 bg-card-hover rounded-xl border border-border hover:border-purple-500/30 transition-all">
                                                        <div className="flex items-center gap-4 flex-1">
                                                            {post.media && (
                                                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                                                    {post.type === 'image' ? (
                                                                        <img 
                                                                            src={post.media} 
                                                                            alt="Post thumbnail"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <video 
                                                                            src={post.media} 
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    )}
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm text-foreground line-clamp-1 mb-1">
                                                                    {post.content}
                                                                </p>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                    <Badge className={`${
                                                                        post.tier === 'VIP' ? 'bg-yellow-500' :
                                                                        post.tier === 'PREMIUM' ? 'bg-purple-500' :
                                                                        post.tier === 'BASIC' ? 'bg-blue-500' :
                                                                        'bg-gray-500'
                                                                    } text-white border-0 text-xs`}>
                                                                        {post.tier}
                                                                    </Badge>
                                                                    <span className="flex items-center gap-1">
                                                                        <Heart className="w-3 h-3" /> {post.likes}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <MessageCircle className="w-3 h-3" /> {post.comments}
                                                                    </span>
                                                                    <span>{post.timestamp}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => {
                                                                    setEditingPost(post)
                                                                    setNewPostText(post.content)
                                                                    setNewPostTier(post.tier as any)
                                                                    setNewPostScheduledDate(post.scheduledFor || '')
                                                                    setUploadPreview(post.media || null)
                                                                    setShowNewPostModal(true)
                                                                }}
                                                                className="bg-blue-500 hover:bg-blue-600 text-white"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleDeletePost(post.id)}
                                                                className="bg-red-500 hover:bg-red-600 text-white"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Media Library */}
                                {contentManagementTab === 'media' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => setMediaFilter('all')}
                                                    size="sm"
                                                    className={mediaFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-card-hover text-foreground'}
                                                >
                                                    {isArabic ? 'الكل' : 'All'}
                                                </Button>
                                                <Button
                                                    onClick={() => setMediaFilter('images')}
                                                    size="sm"
                                                    className={mediaFilter === 'images' ? 'bg-purple-500 text-white' : 'bg-card-hover text-foreground'}
                                                >
                                                    <ImageIcon className="w-3 h-3 mr-1" />
                                                    {isArabic ? 'الصور' : 'Images'}
                                                </Button>
                                                <Button
                                                    onClick={() => setMediaFilter('videos')}
                                                    size="sm"
                                                    className={mediaFilter === 'videos' ? 'bg-purple-500 text-white' : 'bg-card-hover text-foreground'}
                                                >
                                                    <Play className="w-3 h-3 mr-1" />
                                                    {isArabic ? 'الفيديوهات' : 'Videos'}
                                                </Button>
                                            </div>
                                            <Button
                                                onClick={() => setShowUploadModal(true)}
                                                size="sm"
                                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                            >
                                                <Download className="w-3 h-3 mr-1" />
                                                {isArabic ? 'رفع' : 'Upload'}
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                            {posts
                                                .filter(p => p.media && (
                                                    mediaFilter === 'all' ||
                                                    (mediaFilter === 'images' && p.type === 'image') ||
                                                    (mediaFilter === 'videos' && p.type === 'video')
                                                ))
                                                .slice(0, 12)
                                                .map((post) => (
                                                    <div key={post.id} className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-purple-500 transition-all cursor-pointer">
                                                        {post.type === 'video' ? (
                                                            <video 
                                                                src={post.media} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <img 
                                                                src={post.media} 
                                                                alt="Media content"
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => {
                                                                    if (post.type === 'image' || post.type === 'video') {
                                                                        setViewingMedia({type: post.type, url: post.media!})
                                                                    }
                                                                }}
                                                                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                onClick={() => handleDeletePost(post.id)}
                                                                className="bg-red-500/80 hover:bg-red-600 text-white border-0"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Content Calendar */}
                                {contentManagementTab === 'calendar' && (
                                    <div className="space-y-4">
                                        {/* Calendar Header */}
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-bold text-foreground">
                                                {isArabic ? 'جدول المحتوى' : 'Content Calendar'}
                                            </h3>
                                            <Button
                                                onClick={() => {
                                                    setNewPostScheduledDate('')
                                                    setShowNewPostModal(true)
                                                }}
                                                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                            >
                                                <Calendar className="w-4 h-4 mr-2" />
                                                {isArabic ? 'جدولة منشور' : 'Schedule Post'}
                                            </Button>
                                        </div>
                                        
                                        {/* Real Calendar with Actual Posts */}
                                        <div className="bg-card border border-border rounded-xl p-4">
                                            {/* Day Headers */}
                                            <div className="grid grid-cols-7 gap-2 mb-2">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                                    <div key={i} className="text-center text-xs font-semibold text-muted-foreground p-2">
                                                        {isArabic ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][i] : day}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Calendar Days */}
                                            <div className="grid grid-cols-7 gap-2">
                                                {(() => {
                                                    const today = new Date()
                                                    const currentMonth = today.getMonth()
                                                    const currentYear = today.getFullYear()
                                                    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
                                                    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
                                                    const days = []
                                                    
                                                    // Empty cells for days before month starts
                                                    for (let i = 0; i < firstDay; i++) {
                                                        days.push(
                                                            <div key={`empty-${i}`} className="aspect-square" />
                                                        )
                                                    }
                                                    
                                                    // Actual days with posts
                                                    for (let day = 1; day <= daysInMonth; day++) {
                                                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                                        const postsOnDay = posts.filter(post => {
                                                            if (!post.scheduledFor) return false
                                                            const postDate = new Date(post.scheduledFor)
                                                            return postDate.getDate() === day && 
                                                                   postDate.getMonth() === currentMonth && 
                                                                   postDate.getFullYear() === currentYear
                                                        })
                                                        
                                                        const isToday = today.getDate() === day
                                                        const isSelected = selectedCalendarDate === dateStr
                                                        
                                                        days.push(
                                                            <div
                                                                key={day}
                                                                onClick={() => setSelectedCalendarDate(dateStr)}
                                                                className={`aspect-square bg-card-hover rounded-lg border transition-all cursor-pointer p-2 hover:border-purple-500 hover:shadow-lg ${
                                                                    isToday ? 'border-purple-500 bg-purple-500/10' : 
                                                                    isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-border'
                                                                }`}
                                                            >
                                                                <div className={`text-xs font-semibold mb-1 ${
                                                                    isToday ? 'text-purple-400' : 
                                                                    isSelected ? 'text-blue-400' : 'text-muted-foreground'
                                                                }`}>
                                                                    {day}
                                                                </div>
                                                                {postsOnDay.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        {postsOnDay.slice(0, 2).map((post, i) => (
                                                                            <div 
                                                                                key={post.id}
                                                                                className="w-full h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                                                                title={post.content.substring(0, 50)}
                                                                            />
                                                                        ))}
                                                                        {postsOnDay.length > 2 && (
                                                                            <div className="text-[8px] text-purple-400 font-bold">
                                                                                +{postsOnDay.length - 2}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                    
                                                    return days
                                                })()}
                                            </div>
                                        </div>

                                        {/* Selected Day Posts Panel */}
                                        {selectedCalendarDate && (
                                            <div className="bg-card border border-border rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-bold text-foreground flex items-center gap-2">
                                                        <Calendar className="w-5 h-5 text-blue-400" />
                                                        {isArabic ? 'منشورات' : 'Posts for'} {new Date(selectedCalendarDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                            weekday: 'long',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            onClick={() => {
                                                                setNewPostScheduledDate(selectedCalendarDate + 'T12:00')
                                                                setShowNewPostModal(true)
                                                            }}
                                                            size="sm"
                                                            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                                        >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            {isArabic ? 'منشور جديد' : 'New Post'}
                                                        </Button>
                                                        <button
                                                            onClick={() => setSelectedCalendarDate('')}
                                                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {(() => {
                                                    const dayPosts = posts.filter(post => {
                                                        if (!post.scheduledFor) return false
                                                        const postDate = new Date(post.scheduledFor)
                                                        const selectedDate = new Date(selectedCalendarDate)
                                                        return postDate.getDate() === selectedDate.getDate() && 
                                                               postDate.getMonth() === selectedDate.getMonth() && 
                                                               postDate.getFullYear() === selectedDate.getFullYear()
                                                    }).sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())

                                                    if (dayPosts.length === 0) {
                                                        return (
                                                            <div className="text-center py-8 text-muted-foreground">
                                                                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                                <p className="text-sm">
                                                                    {isArabic ? 'لا توجد منشورات مجدولة لهذا اليوم' : 'No posts scheduled for this day'}
                                                                </p>
                                                                <Button
                                                                    onClick={() => {
                                                                        setNewPostScheduledDate(selectedCalendarDate + 'T12:00')
                                                                        setShowNewPostModal(true)
                                                                    }}
                                                                    className="mt-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
                                                                    size="sm"
                                                                >
                                                                    <Plus className="w-4 h-4 mr-1" />
                                                                    {isArabic ? 'إضافة منشور' : 'Add Post'}
                                                                </Button>
                                                            </div>
                                                        )
                                                    }

                                                    return (
                                                        <div className="space-y-3">
                                                            {dayPosts.map(post => (
                                                                <div key={post.id} className="bg-card-hover border border-border rounded-lg p-3 hover:border-blue-500/50 transition-all">
                                                                    <div className="flex items-start gap-3">
                                                                        {/* Time indicator */}
                                                                        <div className="flex-shrink-0 w-16 text-center">
                                                                            <div className="bg-blue-500/20 rounded-lg py-1 px-2">
                                                                                <div className="text-xs font-bold text-blue-400">
                                                                                    {new Date(post.scheduledFor!).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit',
                                                                                        hour12: false
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Media Preview */}
                                                                        {post.media && (
                                                                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                                                                {post.type === 'video' ? (
                                                                                    <video src={post.media} className="w-full h-full object-cover" />
                                                                                ) : (
                                                                                    <img src={post.media} alt="Post preview" className="w-full h-full object-cover" />
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Content */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm text-foreground mb-2 line-clamp-2">
                                                                                {post.content}
                                                                            </p>
                                                                            
                                                                            {/* Tier Badge */}
                                                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30">
                                                                                <Crown className="w-3 h-3" />
                                                                                {post.tier}
                                                                            </div>
                                                                        </div>

                                                                        {/* Actions */}
                                                                        <div className="flex-shrink-0 flex gap-2">
                                                                            <Button
                                                                                onClick={() => handlePublishNow(post.id)}
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition-colors"
                                                                                title={isArabic ? 'نشر الآن' : 'Publish Now'}
                                                                            >
                                                                                <Send className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => {
                                                                                    setEditingPost(post)
                                                                                    setNewPostText(post.content)
                                                                                    setNewPostTier(post.tier)
                                                                                    setNewPostScheduledDate(post.scheduledFor || '')
                                                                                    setUploadPreview(post.media || null)
                                                                                    setShowNewPostModal(true)
                                                                                }}
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                                                title={isArabic ? 'تعديل' : 'Edit'}
                                                                            >
                                                                                <Edit2 className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button
                                                                                onClick={() => handleDeletePost(post.id)}
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                                title={isArabic ? 'حذف' : 'Delete'}
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        )}
                                        
                                        {/* Upcoming Scheduled Posts */}
                                        {posts.filter(p => p.scheduledFor && new Date(p.scheduledFor) > new Date()).length > 0 && (
                                            <div className="bg-card border border-border rounded-xl p-4">
                                                <h4 className="font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-purple-400" />
                                                    {isArabic ? 'المنشورات القادمة' : 'Upcoming Posts'}
                                                </h4>
                                                <div className="space-y-2">
                                                    {posts
                                                        .filter(p => p.scheduledFor && new Date(p.scheduledFor) > new Date())
                                                        .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
                                                        .slice(0, 5)
                                                        .map(post => (
                                                            <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg bg-card-hover hover:bg-muted/50 transition-colors">
                                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                                    <Calendar className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-foreground font-medium truncate">
                                                                        {post.content.substring(0, 50)}...
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {new Date(post.scheduledFor!).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            hour: '2-digit',
                                                                            minute: '2-digit'
                                                                        })}
                                                                    </p>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleDeletePost(post.id)}
                                                                    className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 transition-colors"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Scheduled Posts */}
                                {contentManagementTab === 'scheduled' && (
                                    <div className="space-y-3">
                                        {(() => {
                                            const scheduledPosts = posts.filter(p => p.scheduledFor && new Date(p.scheduledFor) > new Date())
                                            
                                            if (scheduledPosts.length === 0) {
                                                return (
                                                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
                                                        <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                                                        <h4 className="font-bold text-foreground mb-2">
                                                            {isArabic ? 'لا توجد منشورات مجدولة' : 'No Scheduled Posts'}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground mb-4">
                                                            {isArabic ? 'جدول منشوراتك للنشر التلقائي' : 'Schedule posts to publish automatically'}
                                                        </p>
                                                        <Button
                                                            onClick={() => setShowNewPostModal(true)}
                                                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                                        >
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            {isArabic ? 'جدولة منشور' : 'Schedule Post'}
                                                        </Button>
                                                    </div>
                                                )
                                            }
                                            
                                            return (
                                                <>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                            <Clock className="w-5 h-5 text-yellow-400" />
                                                            {isArabic ? `المنشورات المجدولة (${scheduledPosts.length})` : `Scheduled Posts (${scheduledPosts.length})`}
                                                        </h3>
                                                        <Button
                                                            onClick={() => setShowNewPostModal(true)}
                                                            size="sm"
                                                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
                                                        >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            {isArabic ? 'جديد' : 'New'}
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        {scheduledPosts
                                                            .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
                                                            .map(post => (
                                                                <div key={post.id} className="bg-card border border-border rounded-xl p-4 hover:border-yellow-500/50 transition-all">
                                                                    <div className="flex items-start gap-3">
                                                                        {/* Media Preview */}
                                                                        {post.media && (
                                                                            <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                                                                                {post.type === 'video' ? (
                                                                                    <video src={post.media} className="w-full h-full object-cover" />
                                                                                ) : (
                                                                                    <img src={post.media} alt="Post preview" className="w-full h-full object-cover" />
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {/* Content */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-sm text-foreground mb-2 line-clamp-2">
                                                                                {post.content}
                                                                            </p>
                                                                            
                                                                            {/* Scheduled Time */}
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                                                                <Calendar className="w-3 h-3 text-yellow-400" />
                                                                                <span>
                                                                                    {new Date(post.scheduledFor!).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                                        weekday: 'short',
                                                                                        month: 'short',
                                                                                        day: 'numeric',
                                                                                        hour: '2-digit',
                                                                                        minute: '2-digit'
                                                                                    })}
                                                                                </span>
                                                                            </div>
                                                                            
                                                                            {/* Tier Badge */}
                                                                            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30">
                                                                                <Crown className="w-3 h-3" />
                                                                                {post.tier}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Actions */}
                                                                        <div className="flex-shrink-0 flex flex-col gap-2">
                                                                            <Button
                                                                                onClick={() => handlePublishNow(post.id)}
                                                                                size="sm"
                                                                                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                                                                            >
                                                                                <Send className="w-3 h-3 mr-1" />
                                                                                {isArabic ? 'نشر الآن' : 'Publish Now'}
                                                                            </Button>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setEditingPost(post)
                                                                                        setNewPostText(post.content)
                                                                                        setNewPostTier(post.tier)
                                                                                        setNewPostScheduledDate(post.scheduledFor || '')
                                                                                        setUploadPreview(post.media || null)
                                                                                        setShowNewPostModal(true)
                                                                                    }}
                                                                                    className="p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors"
                                                                                >
                                                                                    <Edit2 className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeletePost(post.id)}
                                                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>
                                )}
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

            {/* New/Edit Post Modal */}
            <AnimatePresence>
                {showNewPostModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowNewPostModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-foreground">
                                    {editingPost 
                                        ? (isArabic ? '✏️ تعديل المنشور' : '✏️ Edit Post')
                                        : (isArabic ? '📝 منشور جديد' : '📝 Create New Post')
                                    }
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowNewPostModal(false)
                                        setEditingPost(null)
                                        setNewPostText('')
                                        setNewPostTier('FREE')
                                        setNewPostScheduledDate('')
                                        setUploadPreview(null)
                                        setUploadFile(null)
                                    }}
                                    className="w-8 h-8 rounded-full bg-card-hover hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Post Content */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'محتوى المنشور' : 'Post Content'}
                                </label>
                                <textarea
                                    value={newPostText}
                                    onChange={(e) => setNewPostText(e.target.value)}
                                    placeholder={isArabic ? 'اكتب شيئاً مثيراً للاهتمام...' : 'Write something interesting...'}
                                    className="w-full min-h-[150px] bg-card-hover border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    maxLength={1000}
                                />
                                <div className="text-xs text-muted-foreground text-right mt-1">
                                    {newPostText.length}/1000
                                </div>
                            </div>

                            {/* Media Upload */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'إضافة وسائط (اختياري)' : 'Add Media (Optional)'}
                                </label>
                                {uploadPreview ? (
                                    <div className="relative rounded-xl overflow-hidden border-2 border-purple-500/30">
                                        {uploadFile?.type.startsWith('video/') ? (
                                            <video src={uploadPreview} className="w-full h-64 object-cover" controls />
                                        ) : (
                                            <img src={uploadPreview} alt="Preview" className="w-full h-64 object-cover" />
                                        )}
                                        <button
                                            onClick={handleRemoveFile}
                                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-purple-500 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Download className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-sm text-foreground font-semibold mb-1">
                                            {isArabic ? 'انقر لرفع صورة أو فيديو' : 'Click to upload image or video'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {isArabic ? 'الحد الأقصى 50 ميجا' : 'Max 50MB'}
                                        </p>
                                    </label>
                                )}
                            </div>

                            {/* Tier Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'من يمكنه رؤية هذا المنشور؟' : 'Who can see this post?'}
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <button
                                        onClick={() => setNewPostTier('FREE')}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            newPostTier === 'FREE'
                                                ? 'border-gray-500 bg-gray-500/20'
                                                : 'border-border hover:border-gray-500/50'
                                        }`}
                                    >
                                        <div className="text-xs font-semibold text-muted-foreground mb-1">Free</div>
                                        <div className="text-lg">🌍</div>
                                    </button>
                                    <button
                                        onClick={() => setNewPostTier('BASIC')}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            newPostTier === 'BASIC'
                                                ? 'border-blue-500 bg-blue-500/20'
                                                : 'border-border hover:border-blue-500/50'
                                        }`}
                                    >
                                        <div className="text-xs font-semibold text-blue-400 mb-1">Basic</div>
                                        <div className="text-lg">💙</div>
                                    </button>
                                    <button
                                        onClick={() => setNewPostTier('PREMIUM')}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            newPostTier === 'PREMIUM'
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-border hover:border-purple-500/50'
                                        }`}
                                    >
                                        <div className="text-xs font-semibold text-purple-400 mb-1">Premium</div>
                                        <div className="text-lg">💜</div>
                                    </button>
                                    <button
                                        onClick={() => setNewPostTier('VIP')}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            newPostTier === 'VIP'
                                                ? 'border-yellow-500 bg-yellow-500/20'
                                                : 'border-border hover:border-yellow-500/50'
                                        }`}
                                    >
                                        <div className="text-xs font-semibold text-yellow-400 mb-1">VIP</div>
                                        <div className="text-lg">👑</div>
                                    </button>
                                </div>
                            </div>

                            {/* Schedule (Optional) */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'جدولة للنشر لاحقاً (اختياري)' : 'Schedule for later (Optional)'}
                                </label>
                                <input
                                    type="datetime-local"
                                    value={newPostScheduledDate}
                                    onChange={(e) => setNewPostScheduledDate(e.target.value)}
                                    min={new Date().toISOString().slice(0, 16)}
                                    className="w-full bg-card-hover border border-border rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowNewPostModal(false)}
                                    className="flex-1 bg-card-hover hover:bg-card text-foreground border border-border"
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handleCreatePost}
                                    disabled={uploadingPost || !newPostText.trim()}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold disabled:opacity-50"
                                >
                                    {uploadingPost ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                            {editingPost 
                                                ? (isArabic ? 'جاري التحديث...' : 'Updating...')
                                                : (isArabic ? 'جاري النشر...' : 'Publishing...')
                                            }
                                        </>
                                    ) : (
                                        <>
                                            {editingPost ? (
                                                <>
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'تحديث' : 'Update'}
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    {newPostScheduledDate 
                                                        ? (isArabic ? 'جدولة' : 'Schedule')
                                                        : (isArabic ? 'نشر الآن' : 'Publish Now')
                                                    }
                                                </>
                                            )}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Upload Media Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowUploadModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-foreground">
                                    {isArabic ? '📤 رفع محتوى' : '📤 Upload Content'}
                                </h2>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="w-8 h-8 rounded-full bg-card-hover hover:bg-red-500/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-center">
                                {uploadPreview ? (
                                    <div className="mb-4">
                                        {uploadFile?.type.startsWith('video/') ? (
                                            <video src={uploadPreview} className="w-full h-64 object-cover rounded-xl" controls />
                                        ) : (
                                            <img src={uploadPreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                                        )}
                                        <div className="mt-4 flex gap-3">
                                            <Button
                                                onClick={handleRemoveFile}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                {isArabic ? 'حذف' : 'Remove'}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setShowUploadModal(false)
                                                    setShowNewPostModal(true)
                                                }}
                                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                {isArabic ? 'إنشاء منشور' : 'Create Post'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="block border-2 border-dashed border-border rounded-xl p-12 hover:border-purple-500 transition-all cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={(e) => {
                                                handleFileSelect(e)
                                            }}
                                            className="hidden"
                                        />
                                        <Download className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-lg font-bold text-foreground mb-2">
                                            {isArabic ? 'اسحب وأفلت أو انقر للرفع' : 'Drag & drop or click to upload'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {isArabic ? 'صور أو فيديوهات (حتى 50 ميجا)' : 'Images or videos (up to 50MB)'}
                                        </p>
                                    </label>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Media Viewer Modal */}
            <AnimatePresence>
                {viewingMedia && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewingMedia(null)}
                        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-6xl max-h-[90vh] w-full"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setViewingMedia(null)}
                                className="absolute -top-12 right-0 p-2 text-white hover:text-purple-400 transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {/* Media Content */}
                            <div className="w-full h-full flex items-center justify-center">
                                {viewingMedia.type === 'video' ? (
                                    <video
                                        src={viewingMedia.url}
                                        controls
                                        autoPlay
                                        className="max-w-full max-h-[85vh] rounded-xl shadow-2xl"
                                    />
                                ) : (
                                    <img
                                        src={viewingMedia.url}
                                        alt="Full size media"
                                        className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditProfileModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowEditProfileModal(false)}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black text-foreground">
                                    {isArabic ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                                </h2>
                                <button
                                    onClick={() => setShowEditProfileModal(false)}
                                    className="p-2 hover:bg-card-hover rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Form */}
                            <div className="space-y-4">
                                {/* Profile Photo Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {isArabic ? 'صورة الملف الشخصي' : 'Profile Photo'}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                            {profilePhotoPreview || mentor?.user.profileImage ? (
                                                <img 
                                                    src={profilePhotoPreview || mentor?.user.profileImage || ''} 
                                                    alt="Profile" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-white">
                                                        {editProfileData.name[0] || '?'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setProfilePhotoFile(file)
                                                        const reader = new FileReader()
                                                        reader.onloadend = () => {
                                                            setProfilePhotoPreview(reader.result as string)
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }
                                                }}
                                                className="hidden"
                                                id="profile-photo-upload"
                                            />
                                            <label
                                                htmlFor="profile-photo-upload"
                                                className="inline-block px-4 py-2 bg-card hover:bg-card-hover border border-border rounded-lg cursor-pointer transition-colors text-sm font-medium"
                                            >
                                                {isArabic ? 'تحميل صورة' : 'Upload Photo'}
                                            </label>
                                            {profilePhotoPreview && (
                                                <button
                                                    onClick={() => {
                                                        setProfilePhotoPreview(null)
                                                        setProfilePhotoFile(null)
                                                    }}
                                                    className="ml-2 text-sm text-red-400 hover:text-red-300"
                                                >
                                                    {isArabic ? 'إزالة' : 'Remove'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Cover Photo Upload */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {isArabic ? 'صورة الغلاف' : 'Cover Photo'}
                                    </label>
                                    <div className="space-y-2">
                                        <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                                            {coverPhotoPreview ? (
                                                <img 
                                                    src={coverPhotoPreview} 
                                                    alt="Cover" 
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
                                                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) {
                                                        setCoverPhotoFile(file)
                                                        const reader = new FileReader()
                                                        reader.onloadend = () => {
                                                            setCoverPhotoPreview(reader.result as string)
                                                        }
                                                        reader.readAsDataURL(file)
                                                    }
                                                }}
                                                className="hidden"
                                                id="cover-photo-upload"
                                            />
                                            <label
                                                htmlFor="cover-photo-upload"
                                                className="inline-block px-4 py-2 bg-card hover:bg-card-hover border border-border rounded-lg cursor-pointer transition-colors text-sm font-medium"
                                            >
                                                {isArabic ? 'تحميل غلاف' : 'Upload Cover'}
                                            </label>
                                            {coverPhotoPreview && (
                                                <button
                                                    onClick={() => {
                                                        setCoverPhotoPreview(null)
                                                        setCoverPhotoFile(null)
                                                    }}
                                                    className="ml-2 text-sm text-red-400 hover:text-red-300"
                                                >
                                                    {isArabic ? 'إزالة' : 'Remove'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {isArabic ? 'الاسم' : 'Name'}
                                    </label>
                                    <Input
                                        value={editProfileData.name}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                                        placeholder={isArabic ? 'أدخل اسمك' : 'Enter your name'}
                                        className="bg-background border-border"
                                    />
                                </div>

                                {/* Arabic Name */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {isArabic ? 'الاسم بالعربية' : 'Arabic Name'}
                                    </label>
                                    <Input
                                        value={editProfileData.arabicName}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, arabicName: e.target.value })}
                                        placeholder={isArabic ? 'أدخل اسمك بالعربية' : 'Enter your name in Arabic'}
                                        className="bg-background border-border"
                                    />
                                </div>

                                {/* Bio */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {isArabic ? 'النبذة' : 'Bio'}
                                    </label>
                                    <textarea
                                        value={editProfileData.bio}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, bio: e.target.value })}
                                        placeholder={isArabic ? 'اكتب نبذة عنك' : 'Write about yourself'}
                                        rows={4}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Expertise */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {isArabic ? 'المجالات (مفصولة بفواصل)' : 'Expertise (comma separated)'}
                                    </label>
                                    <Input
                                        value={editProfileData.expertise}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, expertise: e.target.value })}
                                        placeholder={isArabic ? 'مثال: تداول، استثمار، تحليل' : 'e.g., Trading, Investment, Analysis'}
                                        className="bg-background border-border"
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {isArabic ? 'الموقع' : 'Location'}
                                    </label>
                                    <Input
                                        value={editProfileData.location}
                                        onChange={(e) => setEditProfileData({ ...editProfileData, location: e.target.value })}
                                        placeholder={isArabic ? 'المدينة، البلد' : 'City, Country'}
                                        className="bg-background border-border"
                                    />
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'السعر بالساعة ($)' : 'Hourly Rate ($)'}
                                        </label>
                                        <Input
                                            type="number"
                                            value={editProfileData.hourlyRate}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, hourlyRate: Number(e.target.value) })}
                                            placeholder="50"
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'Basic ($)' : 'Basic ($)'}
                                        </label>
                                        <Input
                                            type="number"
                                            value={editProfileData.basicPrice}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, basicPrice: Number(e.target.value) })}
                                            placeholder="50"
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'Premium ($)' : 'Premium ($)'}
                                        </label>
                                        <Input
                                            type="number"
                                            value={editProfileData.premiumPrice}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, premiumPrice: Number(e.target.value) })}
                                            placeholder="100"
                                            className="bg-background border-border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'VIP ($)' : 'VIP ($)'}
                                        </label>
                                        <Input
                                            type="number"
                                            value={editProfileData.vipPrice}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, vipPrice: Number(e.target.value) })}
                                            placeholder="200"
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-4">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                // Save to localStorage for now (in production, this would be an API call)
                                                if (mentor) {
                                                    const profileKey = `mentor_profile_${mentor.id}`
                                                    const savedData = {
                                                        ...editProfileData,
                                                        profilePhoto: profilePhotoPreview || mentor.user.profileImage,
                                                        coverPhoto: coverPhotoPreview || null,
                                                        updatedAt: new Date().toISOString()
                                                    }
                                                    localStorage.setItem(profileKey, JSON.stringify(savedData))
                                                    
                                                    // Update mentor state immediately
                                                    setMentor({
                                                        ...mentor,
                                                        user: {
                                                            ...mentor.user,
                                                            name: editProfileData.name || mentor.user.name,
                                                            arabicName: editProfileData.arabicName || mentor.user.arabicName,
                                                            bio: editProfileData.bio || mentor.user.bio,
                                                            profileImage: profilePhotoPreview || mentor.user.profileImage
                                                        },
                                                        basicMonthlyPrice: editProfileData.basicPrice || mentor.basicMonthlyPrice,
                                                        premiumMonthlyPrice: editProfileData.premiumPrice || mentor.premiumMonthlyPrice,
                                                        vipMonthlyPrice: editProfileData.vipPrice || mentor.vipMonthlyPrice
                                                    })
                                                }
                                                
                                                toast.success(isArabic ? 'تم حفظ التغييرات!' : 'Changes saved!')
                                                setShowEditProfileModal(false)
                                                
                                                // Don't reset photo states - keep the uploaded images
                                                // setProfilePhotoPreview(null)
                                                // setCoverPhotoPreview(null)
                                                // setProfilePhotoFile(null)
                                                // setCoverPhotoFile(null)
                                            } catch (error) {
                                                console.error('Error saving profile:', error)
                                                toast.error(isArabic ? 'فشل حفظ التغييرات' : 'Failed to save changes')
                                            }
                                        }}
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                                    >
                                        {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowEditProfileModal(false)
                                            // Reset photo states
                                            setProfilePhotoPreview(null)
                                            setCoverPhotoPreview(null)
                                            setProfilePhotoFile(null)
                                            setCoverPhotoFile(null)
                                        }}
                                        className="flex-1 bg-card hover:bg-card-hover text-foreground border border-border"
                                    >
                                        {isArabic ? 'إلغاء' : 'Cancel'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Session Modal */}
            <AnimatePresence>
                {showNewSessionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowNewSessionModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                            <Calendar className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {isArabic ? 'جلسة جديدة' : 'New Session'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'أنشئ جلسة مباشرة جديدة' : 'Create a new live session'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowNewSessionModal(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleCreateSession} className="space-y-6">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'عنوان الجلسة *' : 'Session Title *'}
                                        </label>
                                        <Input
                                            value={newSessionData.title}
                                            onChange={(e) => setNewSessionData({ ...newSessionData, title: e.target.value })}
                                            placeholder={isArabic ? 'مثال: استراتيجيات التداول المتقدمة' : 'e.g., Advanced Trading Strategies'}
                                            required
                                            className="bg-background border-border"
                                        />
                                    </div>

                                    {/* Arabic Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'العنوان بالعربية' : 'Arabic Title'}
                                        </label>
                                        <Input
                                            value={newSessionData.titleAr}
                                            onChange={(e) => setNewSessionData({ ...newSessionData, titleAr: e.target.value })}
                                            placeholder={isArabic ? 'العنوان بالعربية' : 'Title in Arabic'}
                                            className="bg-background border-border"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف' : 'Description'}
                                        </label>
                                        <textarea
                                            value={newSessionData.description}
                                            onChange={(e) => setNewSessionData({ ...newSessionData, description: e.target.value })}
                                            placeholder={isArabic ? 'وصف محتوى الجلسة...' : 'Describe what you will cover...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground resize-none"
                                        />
                                    </div>

                                    {/* Arabic Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف بالعربية' : 'Arabic Description'}
                                        </label>
                                        <textarea
                                            value={newSessionData.descriptionAr}
                                            onChange={(e) => setNewSessionData({ ...newSessionData, descriptionAr: e.target.value })}
                                            placeholder={isArabic ? 'الوصف بالعربية...' : 'Description in Arabic...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground resize-none"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Scheduled Date & Time */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'التاريخ والوقت *' : 'Date & Time *'}
                                        </label>
                                        <Input
                                            type="datetime-local"
                                            value={newSessionData.scheduledAt}
                                            onChange={(e) => setNewSessionData({ ...newSessionData, scheduledAt: e.target.value })}
                                            required
                                            className="bg-background border-border"
                                        />
                                    </div>

                                    {/* Duration, Tier, Max Attendees */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'المدة (دقيقة)' : 'Duration (min)'}
                                            </label>
                                            <Input
                                                type="number"
                                                value={newSessionData.duration}
                                                onChange={(e) => setNewSessionData({ ...newSessionData, duration: Number(e.target.value) })}
                                                min={15}
                                                step={15}
                                                className="bg-background border-border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الباقة المطلوبة' : 'Required Tier'}
                                            </label>
                                            <select
                                                value={newSessionData.tier}
                                                onChange={(e) => setNewSessionData({ ...newSessionData, tier: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground"
                                            >
                                                <option value="BRONZE">Bronze</option>
                                                <option value="SILVER">Silver</option>
                                                <option value="GOLD">Gold</option>
                                                <option value="PLATINUM">Platinum</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الحد الأقصى' : 'Max Attendees'}
                                            </label>
                                            <Input
                                                type="number"
                                                value={newSessionData.maxAttendees}
                                                onChange={(e) => setNewSessionData({ ...newSessionData, maxAttendees: Number(e.target.value) })}
                                                min={1}
                                                className="bg-background border-border"
                                            />
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={savingSession}
                                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                                        >
                                            {savingSession ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    {isArabic ? 'جاري الإنشاء...' : 'Creating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Calendar className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'إنشاء الجلسة' : 'Create Session'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setShowNewSessionModal(false)}
                                            disabled={savingSession}
                                            className="flex-1 bg-card hover:bg-card-hover text-foreground border border-border"
                                        >
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Recording Modal */}
            <AnimatePresence>
                {showNewRecordingModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowNewRecordingModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                                            <Play className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {isArabic ? 'إضافة تسجيل' : 'Add Recording'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'أضف تسجيل جلسة سابقة' : 'Add a previously recorded session'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowNewRecordingModal(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleCreateRecording} className="space-y-6">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'عنوان التسجيل *' : 'Recording Title *'}
                                        </label>
                                        <Input
                                            value={newRecordingData.title}
                                            onChange={(e) => setNewRecordingData({ ...newRecordingData, title: e.target.value })}
                                            placeholder={isArabic ? 'مثال: جلسة تحليل السوق - يناير 2024' : 'e.g., Market Analysis Session - Jan 2024'}
                                            required
                                            className="bg-background border-border"
                                        />
                                    </div>

                                    {/* Arabic Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'العنوان بالعربية' : 'Arabic Title'}
                                        </label>
                                        <Input
                                            value={newRecordingData.titleAr}
                                            onChange={(e) => setNewRecordingData({ ...newRecordingData, titleAr: e.target.value })}
                                            placeholder={isArabic ? 'العنوان بالعربية' : 'Title in Arabic'}
                                            className="bg-background border-border"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف' : 'Description'}
                                        </label>
                                        <textarea
                                            value={newRecordingData.description}
                                            onChange={(e) => setNewRecordingData({ ...newRecordingData, description: e.target.value })}
                                            placeholder={isArabic ? 'وصف محتوى التسجيل...' : 'Describe what was covered...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground resize-none"
                                        />
                                    </div>

                                    {/* Arabic Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف بالعربية' : 'Arabic Description'}
                                        </label>
                                        <textarea
                                            value={newRecordingData.descriptionAr}
                                            onChange={(e) => setNewRecordingData({ ...newRecordingData, descriptionAr: e.target.value })}
                                            placeholder={isArabic ? 'الوصف بالعربية...' : 'Description in Arabic...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground resize-none"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Video Upload */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'تحميل ملف الفيديو *' : 'Upload Video File *'}
                                        </label>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            setRecordingVideoFile(file)
                                                            // Create preview URL
                                                            const previewUrl = URL.createObjectURL(file)
                                                            setRecordingVideoPreview(previewUrl)
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="recording-video-upload"
                                                />
                                                <label
                                                    htmlFor="recording-video-upload"
                                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-background border-2 border-dashed border-border rounded-xl hover:border-purple-500 hover:bg-purple-500/5 transition-all cursor-pointer"
                                                >
                                                    <Upload className="w-5 h-5 text-muted-foreground" />
                                                    <span className="text-sm text-muted-foreground">
                                                        {recordingVideoFile 
                                                            ? recordingVideoFile.name
                                                            : (isArabic ? 'انقر لتحميل الفيديو' : 'Click to upload video')
                                                        }
                                                    </span>
                                                </label>
                                            </div>
                                            
                                            {recordingVideoPreview && (
                                                <div className="relative rounded-xl overflow-hidden border border-border">
                                                    <video
                                                        src={recordingVideoPreview}
                                                        controls
                                                        className="w-full h-48 object-cover bg-black"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setRecordingVideoFile(null)
                                                            setRecordingVideoPreview(null)
                                                        }}
                                                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <p className="text-xs text-muted-foreground">
                                                {isArabic 
                                                    ? 'تنسيقات مدعومة: MP4, WebM, MOV (الحد الأقصى 500 ميجابايت)'
                                                    : 'Supported formats: MP4, WebM, MOV (Max 500MB)'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {/* Recorded Date & Duration */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'تاريخ التسجيل *' : 'Recorded Date *'}
                                            </label>
                                            <Input
                                                type="date"
                                                value={newRecordingData.recordedDate}
                                                onChange={(e) => setNewRecordingData({ ...newRecordingData, recordedDate: e.target.value })}
                                                required
                                                className="bg-background border-border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'المدة (دقيقة)' : 'Duration (min)'}
                                            </label>
                                            <Input
                                                type="number"
                                                value={newRecordingData.duration}
                                                onChange={(e) => setNewRecordingData({ ...newRecordingData, duration: Number(e.target.value) })}
                                                min={1}
                                                className="bg-background border-border"
                                            />
                                        </div>
                                    </div>

                                    {/* Required Tier */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الباقة المطلوبة للمشاهدة' : 'Required Tier to Watch'}
                                        </label>
                                        <select
                                            value={newRecordingData.tier}
                                            onChange={(e) => setNewRecordingData({ ...newRecordingData, tier: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground"
                                        >
                                            <option value="BRONZE">Bronze</option>
                                            <option value="SILVER">Silver</option>
                                            <option value="GOLD">Gold</option>
                                            <option value="PLATINUM">Platinum</option>
                                        </select>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={savingSession}
                                            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold"
                                        >
                                            {savingSession ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    {isArabic ? 'جاري الإضافة...' : 'Adding...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'إضافة التسجيل' : 'Add Recording'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setShowNewRecordingModal(false)}
                                            disabled={savingSession}
                                            className="flex-1 bg-card hover:bg-card-hover text-foreground border border-border"
                                        >
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Resource Modal */}
            <AnimatePresence>
                {showEditResourceModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEditResourceModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                            <Edit2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {isArabic ? 'تعديل المورد' : 'Edit Resource'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'تحديث معلومات المورد' : 'Update resource information'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowEditResourceModal(false)
                                            setEditingResource(null)
                                            setResourceFile(null)
                                        }}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleUpdateResource} className="space-y-6">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'اسم المورد *' : 'Resource Name *'}
                                        </label>
                                        <Input
                                            value={newResourceData.title}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, title: e.target.value })}
                                            placeholder={isArabic ? 'مثال: دليل استراتيجيات التداول' : 'e.g., Trading Strategies Guide'}
                                            required
                                            className="bg-background border-border"
                                        />
                                    </div>

                                    {/* Arabic Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الاسم بالعربية' : 'Arabic Name'}
                                        </label>
                                        <Input
                                            value={newResourceData.titleAr}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, titleAr: e.target.value })}
                                            placeholder={isArabic ? 'الاسم بالعربية' : 'Name in Arabic'}
                                            className="bg-background border-border"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف' : 'Description'}
                                        </label>
                                        <textarea
                                            value={newResourceData.description}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, description: e.target.value })}
                                            placeholder={isArabic ? 'وصف المورد وفائدته...' : 'Describe the resource and its benefits...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground resize-none"
                                        />
                                    </div>

                                    {/* Arabic Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف بالعربية' : 'Arabic Description'}
                                        </label>
                                        <textarea
                                            value={newResourceData.descriptionAr}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, descriptionAr: e.target.value })}
                                            placeholder={isArabic ? 'الوصف بالعربية...' : 'Description in Arabic...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground resize-none"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* File Upload - Optional for edit */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'استبدال الملف (اختياري)' : 'Replace File (Optional)'}
                                        </label>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            setResourceFile(file)
                                                            // Auto-detect file type
                                                            const extension = file.name.split('.').pop()?.toUpperCase()
                                                            if (extension && ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'TXT', 'IMG'].includes(extension)) {
                                                                setNewResourceData({ ...newResourceData, type: extension === 'IMG' || ['JPG', 'JPEG', 'PNG', 'GIF'].includes(extension) ? 'IMG' : extension })
                                                            }
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="edit-resource-file-upload"
                                                />
                                                <label
                                                    htmlFor="edit-resource-file-upload"
                                                    className="flex items-center justify-center gap-2 px-4 py-6 bg-background border-2 border-dashed border-border rounded-xl hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer"
                                                >
                                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {resourceFile 
                                                                ? resourceFile.name
                                                                : (isArabic ? 'انقر لاستبدال الملف' : 'Click to replace file')
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {isArabic 
                                                                ? 'اترك فارغاً للاحتفاظ بالملف الحالي'
                                                                : 'Leave empty to keep current file'
                                                            }
                                                        </p>
                                                        {resourceFile && (
                                                            <p className="text-xs text-blue-500 mt-1">
                                                                {isArabic ? 'ملف جديد محدد' : 'New file selected'} • {Math.round(resourceFile.size / 1024)} KB
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                            
                                            {/* Current File Info */}
                                            {editingResource && !resourceFile && (
                                                <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'الملف الحالي:' : 'Current File:'} {editingResource.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {editingResource.size} • {editingResource.type}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* New File Selected */}
                                            {resourceFile && (
                                                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-green-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {resourceFile.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {Math.round(resourceFile.size / 1024)} KB • {newResourceData.type}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setResourceFile(null)
                                                        }}
                                                        className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resource Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'نوع المورد' : 'Resource Type'}
                                        </label>
                                        <select
                                            value={newResourceData.type}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-foreground"
                                        >
                                            <option value="PDF">PDF Document</option>
                                            <option value="DOC">Word Document</option>
                                            <option value="XLS">Excel Spreadsheet</option>
                                            <option value="PPT">PowerPoint</option>
                                            <option value="IMG">Image</option>
                                            <option value="TXT">Text File</option>
                                        </select>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={savingResource}
                                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold disabled:opacity-50"
                                        >
                                            {savingResource ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    {isArabic ? 'جاري التحديث...' : 'Updating...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Edit2 className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'تحديث المورد' : 'Update Resource'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => {
                                                setShowEditResourceModal(false)
                                                setEditingResource(null)
                                                setResourceFile(null)
                                            }}
                                            disabled={savingResource}
                                            className="flex-1 bg-card hover:bg-card-hover text-foreground border border-border"
                                        >
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Resource Modal */}
            <AnimatePresence>
                {showAddResourceModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAddResourceModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                            <FileText className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {isArabic ? 'إضافة مورد' : 'Add Resource'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'أضف مورد جديد للمجتمع' : 'Add a new resource for the community'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAddResourceModal(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleCreateResource} className="space-y-6">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'اسم المورد *' : 'Resource Name *'}
                                        </label>
                                        <Input
                                            value={newResourceData.title}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, title: e.target.value })}
                                            placeholder={isArabic ? 'مثال: دليل استراتيجيات التداول' : 'e.g., Trading Strategies Guide'}
                                            required
                                            className="bg-background border-border"
                                        />
                                    </div>

                                    {/* Arabic Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الاسم بالعربية' : 'Arabic Name'}
                                        </label>
                                        <Input
                                            value={newResourceData.titleAr}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, titleAr: e.target.value })}
                                            placeholder={isArabic ? 'الاسم بالعربية' : 'Name in Arabic'}
                                            className="bg-background border-border"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف' : 'Description'}
                                        </label>
                                        <textarea
                                            value={newResourceData.description}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, description: e.target.value })}
                                            placeholder={isArabic ? 'وصف المورد وفائدته...' : 'Describe the resource and its benefits...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground resize-none"
                                        />
                                    </div>

                                    {/* Arabic Description */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الوصف بالعربية' : 'Arabic Description'}
                                        </label>
                                        <textarea
                                            value={newResourceData.descriptionAr}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, descriptionAr: e.target.value })}
                                            placeholder={isArabic ? 'الوصف بالعربية...' : 'Description in Arabic...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground resize-none"
                                            dir="rtl"
                                        />
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'رفع الملف *' : 'Upload File *'}
                                        </label>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) {
                                                            setResourceFile(file)
                                                            // Auto-detect file type
                                                            const extension = file.name.split('.').pop()?.toUpperCase()
                                                            if (extension && ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'TXT', 'IMG'].includes(extension)) {
                                                                setNewResourceData({ ...newResourceData, type: extension === 'IMG' || ['JPG', 'JPEG', 'PNG', 'GIF'].includes(extension) ? 'IMG' : extension })
                                                            }
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="resource-file-upload"
                                                />
                                                <label
                                                    htmlFor="resource-file-upload"
                                                    className="flex items-center justify-center gap-2 px-4 py-8 bg-background border-2 border-dashed border-border rounded-xl hover:border-green-500 hover:bg-green-500/5 transition-all cursor-pointer"
                                                >
                                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {resourceFile 
                                                                ? resourceFile.name
                                                                : (isArabic ? 'انقر لتحميل ملف' : 'Click to upload file')
                                                            }
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {isArabic 
                                                                ? 'PDF, Word, Excel, PowerPoint, صور (حتى 5 ميجا)'
                                                                : 'PDF, Word, Excel, PowerPoint, Images (Max 5MB)'
                                                            }
                                                        </p>
                                                        {resourceFile && (
                                                            <p className="text-xs text-green-500 mt-1">
                                                                {isArabic ? 'تم تحديد الملف' : 'File selected'} • {Math.round(resourceFile.size / 1024)} KB
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                            
                                            {resourceFile && (
                                                <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                                                        <FileText className="w-5 h-5 text-green-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {resourceFile.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {Math.round(resourceFile.size / 1024)} KB • {newResourceData.type}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setResourceFile(null)
                                                            setNewResourceData({ ...newResourceData, type: 'PDF' })
                                                        }}
                                                        className="flex-shrink-0 p-2 text-red-400 hover:text-red-300 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Resource Type */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'نوع المورد' : 'Resource Type'}
                                        </label>
                                        <select
                                            value={newResourceData.type}
                                            onChange={(e) => setNewResourceData({ ...newResourceData, type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-foreground"
                                        >
                                            <option value="PDF">PDF Document</option>
                                            <option value="DOC">Word Document</option>
                                            <option value="XLS">Excel Spreadsheet</option>
                                            <option value="PPT">PowerPoint</option>
                                            <option value="IMG">Image</option>
                                            <option value="TXT">Text File</option>
                                        </select>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-4">
                                        <Button
                                            type="submit"
                                            disabled={savingResource || !resourceFile}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold disabled:opacity-50"
                                        >
                                            {savingResource ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    {isArabic ? 'جاري الإضافة...' : 'Adding...'}
                                                </>
                                            ) : (
                                                <>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'إضافة المورد' : 'Add Resource'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setShowAddResourceModal(false)}
                                            disabled={savingResource}
                                            className="flex-1 bg-card hover:bg-card-hover text-foreground border border-border"
                                        >
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
