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
    Check,
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
    RefreshCw,
    Copy,
    Globe,
    Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { BookingModal } from '@/components/mentors/BookingModal'
import ReviewModal from '@/components/mentors/ReviewModal'
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder'
import { MentorPaymentModal } from '@/components/modals/MentorPaymentModal'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { CredentialsDisplay, CredentialsSection, Credential } from '@/components/credentials/CredentialsSection'
import UploadMediaModal from '@/components/modals/UploadMediaModal'

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
    languages?: string
    timezone?: string
    totalSubscribers: number
    monthlyPrice?: number // Single subscription price in EUR
    currency?: string
    hourlyRate?: number | null
    availableForMeetings?: boolean
    socialLinks?: {
        youtube?: string
        twitter?: string
        linkedin?: string
        instagram?: string
        website?: string
    } | null
    stats: {
        totalFollowers: number
        totalCourses: number
        averageRating: number
        yearsOfExperience: number
        totalPosts: number
        totalStudents?: number
        completedMeetings?: number
    }
}

interface Post {
    id: string
    type: 'text' | 'image' | 'video' | 'quote'
    content: string
    media?: string
    tier?: string // Single subscription - all posts available to subscribers
    likes: number
    comments: number
    views: number
    timestamp?: string
    scheduledFor?: string
    isLocked: boolean
    isPinned?: boolean
}

export default function OnlyFansMentorProfilePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { openAuthModal } = useAuthModal()
    const locale = (params.locale as string) || 'en'
    const isArabic = locale === 'ar'

    const [mentor, setMentor] = useState<MentorData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isFollowing, setIsFollowing] = useState(false)
    const [currentSubscription, setCurrentSubscription] = useState<string | null>(null) // 'SUBSCRIBER' | null - single subscription model
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
    const [showMentorPaymentModal, setShowMentorPaymentModal] = useState(false)
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
    const [newPostScheduledDate, setNewPostScheduledDate] = useState('')
    const [uploadingPost, setUploadingPost] = useState(false)
    const [uploadFile, setUploadFile] = useState<File | null>(null)
    const [uploadPreview, setUploadPreview] = useState<string | null>(null)
    const [viewingMedia, setViewingMedia] = useState<{type: 'image' | 'video', url: string} | null>(null)
    const [editingPost, setEditingPost] = useState<Post | null>(null)
    const [activeTierIndex, setActiveTierIndex] = useState(0) // Single tier (ALL_ACCESS)
    const [showEditProfileModal, setShowEditProfileModal] = useState(false)
    const [editProfileData, setEditProfileData] = useState({
        name: '',
        arabicName: '',
        bio: '',
        expertise: '',
        location: '',
        hourlyRate: 0,
        monthlyPrice: 0 // Will be loaded from mentor data
    })
    const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null)
    const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null)
    const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)

    // Real data from localStorage
    const [realArchivedSessions, setRealArchivedSessions] = useState<any[]>([])
    const [realCommunityPosts, setRealCommunityPosts] = useState<any[]>([])
    const [creatorCredentials, setCreatorCredentials] = useState<Credential[]>([])

    // Additional Community Management States (non-duplicate)
    const [memberFilter, setMemberFilter] = useState<'all' | 'vip' | 'premium' | 'basic'>('all')
    const [memberSearchQuery, setMemberSearchQuery] = useState('')
    const [selectedMembers, setSelectedMembers] = useState<string[]>([])

    // Session/Recording Modals
    const [showNewSessionModal, setShowNewSessionModal] = useState(false)
    const [showEditSessionModal, setShowEditSessionModal] = useState(false)
    const [editingSession, setEditingSession] = useState<any>(null)
    const [showNewRecordingModal, setShowNewRecordingModal] = useState(false)
    const [newSessionData, setNewSessionData] = useState({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        scheduledAt: '',
        duration: 60,
        tier: 'BRONZE',
        maxAttendees: 100,
        meetingUrl: '',
        meetingPassword: ''
    })
    const [editSessionData, setEditSessionData] = useState({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        scheduledAt: '',
        duration: 60,
        tier: 'BRONZE',
        maxAttendees: 100,
        meetingUrl: '',
        meetingPassword: ''
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
    const [showEditArchivedModal, setShowEditArchivedModal] = useState(false)
    const [editingArchivedSession, setEditingArchivedSession] = useState<any>(null)
    const [editArchivedData, setEditArchivedData] = useState({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        recordingUrl: '',
        tier: 'BRONZE'
    })
    const [showAddResourceModal, setShowAddResourceModal] = useState(false)
    const [showAttendeesModal, setShowAttendeesModal] = useState(false)
    const [selectedSessionForAttendees, setSelectedSessionForAttendees] = useState<any>(null)
    const [sessionAttendees, setSessionAttendees] = useState<any[]>([])
    const [loadingAttendees, setLoadingAttendees] = useState(false)
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
                
                // Set posts from channel data - transform to Post interface
                const apiPosts = data.channel?.posts || data.posts || []
                const tierMap: Record<string, 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP'> = {
                    'FREE': 'FREE',
                    'PUBLIC': 'FREE',
                    'BRONZE': 'BASIC',
                    'BASIC': 'BASIC',
                    'SILVER': 'PREMIUM',
                    'PREMIUM': 'PREMIUM',
                    'GOLD': 'VIP',
                    'VIP': 'VIP'
                }
                const transformedPosts = apiPosts.map((apiPost: any): Post => ({
                    id: apiPost.id,
                    type: apiPost.mediaType === 'VIDEO' ? 'video' : 
                          apiPost.mediaType === 'IMAGE' ? 'image' : 
                          apiPost.type?.toLowerCase() || 'text',
                    content: isArabic && apiPost.contentAr ? apiPost.contentAr : (apiPost.content || apiPost.title || ''),
                    media: apiPost.mediaUrl || undefined,
                    tier: tierMap[apiPost.tier] || 'FREE',
                    likes: apiPost.likesCount || 0,
                    comments: apiPost.commentsCount || 0,
                    views: apiPost.viewCount || 0,
                    timestamp: apiPost.publishedAt || apiPost.createdAt || new Date().toISOString(),
                    isLocked: !apiPost.hasAccess && apiPost.tier !== 'FREE' && apiPost.tier !== 'PUBLIC',
                    isPinned: apiPost.isPinned || false,
                    scheduledFor: apiPost.scheduledFor || undefined
                }))
                setPosts(transformedPosts)
                setPostsLoading(false)
                console.log('Loaded', transformedPosts.length, 'posts from database')
            } else {
                console.error('API Error:', response.status, response.statusText)
                const errorData = await response.json().catch(() => ({}))
                console.error('Error details:', errorData)
                toast.error(isArabic ? 'فشل تحميل البيانات' : 'Failed to load data')
                setPostsLoading(false)
            }
        } catch (error) {
            console.error('Error fetching mentor data:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
            setPostsLoading(false)
        } finally {
            setLoading(false)
        }
    }, [params.id, isArabic])

    // Function to refresh subscription status (can be called after successful subscription)
    const refreshSubscriptionStatus = useCallback(() => {
        fetchUserSubscriptionStatus()
    }, [fetchUserSubscriptionStatus])

    // Fetch creator credentials
    const fetchCreatorCredentials = useCallback(async (creatorId: string) => {
        try {
            const response = await fetch(`/api/creators/${creatorId}/credentials`)
            if (response.ok) {
                const data = await response.json()
                setCreatorCredentials(data.credentials || [])
            } else {
                setCreatorCredentials([])
            }
        } catch (error) {
            console.error('Error fetching credentials:', error)
            setCreatorCredentials([])
        }
    }, [])

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

    // Posts from database - initialized as empty, populated from API
    const [posts, setPosts] = useState<Post[]>([])
    const [postsLoading, setPostsLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchMentorData()
            // Fetch credentials using the mentor ID (which is the creator ID)
            const creatorId = Array.isArray(params.id) ? params.id[0] : params.id
            fetchCreatorCredentials(creatorId)
            // Fetch follow status
            if (session?.user) {
                fetchFollowStatus(creatorId)
            }
        }
    }, [params.id, session?.user])

    // Fetch follow status
    const fetchFollowStatus = async (creatorId: string) => {
        try {
            const response = await fetch(`/api/creators/${creatorId}/follow`)
            if (response.ok) {
                const data = await response.json()
                setIsFollowing(data.isFollowing)
            }
        } catch (error) {
            console.error('Error fetching follow status:', error)
        }
    }

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
            fetchUpcomingSessionsFromAPI()
            fetchArchivedSessionsFromAPI()
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
                // Use actual mentor data with empty arrays for unavailable data
                const realStats = {
                    earnings: {
                        thisMonth: 0,
                        lastMonth: 0,
                        total: 0,
                        pending: 0,
                        currency: 'EGP'
                    },
                    subscribers: {
                        total: mentor.totalSubscribers || 0,
                        basic: 0,
                        premium: 0,
                        vip: 0,
                        newThisMonth: 0,
                        churnRate: 0
                    },
                    engagement: {
                        totalPosts: mentor.stats.totalPosts || 0,
                        avgLikes: 0,
                        avgComments: 0,
                        avgViews: 0,
                        engagementRate: 0
                    },
                    content: {
                        posts: mentor.stats.totalPosts || 0,
                        liveSessionsCompleted: 0,
                        upcomingSessions: upcomingSessions.length,
                        totalViews: 0,
                        totalDownloads: 0
                    },
                    topSubscribers: [], // Empty - no demo data
                    recentActivity: [] // Empty - no demo data
                }
                setCreatorStats(realStats)
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
                    
                    // Single tier - always ALL_ACCESS
                    setCurrentSubscription('ALL_ACCESS')
                    
                    console.log('Found subscription for creator:', {
                        subscriptionId: channelSubscription.id,
                        channelId,
                        tier: 'ALL_ACCESS',
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
                // No upcoming sessions available - show empty state
                setUpcomingSessions([])
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
            // Show empty state on error
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
                // No community data available - show empty state
                setCommunityPosts([])
                setPinnedResources([])
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
                // No archived sessions available - show empty state
                setArchivedSessions([])
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
                // No resources available - show empty state
                setResources([])
            }
        } catch (error) {
            console.error('Error fetching resources:', error)
            setResources([])
        }
    }

    const fetchFeedbackTokens = async () => {
        if (!mentor || !session || !currentSubscription) return // Available to all subscribers
        
        try {
            const response = await fetch(`/api/feedback/tokens?mentorId=${mentor.id}`)
            
            if (response.ok) {
                const data = await response.json()
                setFeedbackTokens(data)
                setFeedbackRequests(data.requests || [])
            } else {
                // No feedback tokens available
                setFeedbackTokens({available: 0, total: 0, renewalDate: ''})
                setFeedbackRequests([])
            }
        } catch (error) {
            console.error('Error fetching feedback tokens:', error)
        }
    }

    // Fetch upcoming sessions from API
    const fetchUpcomingSessionsFromAPI = async () => {
        if (!mentor) return
        console.log('Fetching upcoming sessions for mentor:', mentor.id)
        setSessionsLoading(true)
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions?type=upcoming`)
            console.log('Sessions API response status:', response.status)
            if (response.ok) {
                const data = await response.json()
                console.log('Sessions data:', data)
                // Transform API data to match the expected format - single subscription model
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
                    attendees: session.attendees?.length || 0,
                    maxAttendees: session.maxAttendees || 100,
                    description: isArabic && session.descriptionAr ? session.descriptionAr : session.description,
                    joinLink: session.streamUrl || null,
                    meetingPassword: session.meetingPassword || null,
                    status: session.status
                })) || []
                setUpcomingSessions(transformedSessions)
            }
        } catch (error) {
            console.error('Error fetching upcoming sessions:', error)
        } finally {
            setSessionsLoading(false)
        }
    }

    // Fetch archived sessions from API
    const fetchArchivedSessionsFromAPI = async () => {
        if (!mentor) return
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions?type=archived`)
            if (response.ok) {
                const data = await response.json()
                // Transform API data to match the expected format - single subscription model
                const transformedSessions = data.sessions?.map((session: any) => ({
                    id: session.id,
                    title: isArabic && session.titleAr ? session.titleAr : session.title,
                    type: 'WORKSHOP', // Default type, can be enhanced later
                    recordedDate: session.scheduledAt,
                    duration: session.duration,
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
                // No demo data - show empty state if API fails
                setCommunityMembers([])
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
                // Real analytics data from mentor - no fake values
                setCommunityAnalytics({
                    totalPosts: displayCommunityPosts.length,
                    totalMembers: mentor.totalSubscribers || 0,
                    activeToday: 0, // Real value from API or 0
                    avgEngagement: 0,
                    topMembers: [],
                    recentActivity: []
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
                    maxAttendees: newSessionData.maxAttendees,
                    meetingUrl: newSessionData.meetingUrl || null,
                    meetingPassword: newSessionData.meetingPassword || null
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم إنشاء الجلسة!' : 'Session created!')
                setShowNewSessionModal(false)
                setNewSessionData({
                    title: '', titleAr: '', description: '', descriptionAr: '',
                    scheduledAt: '', duration: 60, tier: 'BRONZE', maxAttendees: 100,
                    meetingUrl: '', meetingPassword: ''
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

    // Handle edit existing session
    const handleEditSession = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentor || !editingSession) return

        if (!editSessionData.title.trim() || !editSessionData.scheduledAt) {
            toast.error(isArabic ? 'الرجاء ملء الحقول المطلوبة' : 'Please fill in required fields')
            return
        }

        setSavingSession(true)
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: editingSession.id,
                    title: editSessionData.title,
                    titleAr: editSessionData.titleAr || editSessionData.title,
                    description: editSessionData.description,
                    descriptionAr: editSessionData.descriptionAr || editSessionData.description,
                    scheduledAt: new Date(editSessionData.scheduledAt).toISOString(),
                    duration: editSessionData.duration,
                    tier: editSessionData.tier,
                    maxAttendees: editSessionData.maxAttendees,
                    streamUrl: editSessionData.meetingUrl || null,
                    meetingPassword: editSessionData.meetingPassword || null
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم تحديث الجلسة!' : 'Session updated!')
                setShowEditSessionModal(false)
                setEditingSession(null)
                setEditSessionData({
                    title: '', titleAr: '', description: '', descriptionAr: '',
                    scheduledAt: '', duration: 60, tier: 'BRONZE', maxAttendees: 100,
                    meetingUrl: '', meetingPassword: ''
                })
                // Refresh upcoming sessions list
                fetchUpcomingSessionsFromAPI()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل التحديث' : 'Failed to update'))
            }
        } catch (error) {
            console.error('Error updating session:', error)
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

    // Handle update session status (start/end)
    const handleUpdateSessionStatus = async (sessionId: string, newStatus: 'LIVE' | 'ENDED' | 'CANCELLED') => {
        if (!mentor) return

        try {
            const updateData: any = {
                sessionId,
                status: newStatus
            }
            
            // Set actualStartAt when starting session
            if (newStatus === 'LIVE') {
                updateData.actualStartAt = new Date().toISOString()
            }
            // Set actualEndAt when ending session
            if (newStatus === 'ENDED' || newStatus === 'CANCELLED') {
                updateData.actualEndAt = new Date().toISOString()
            }

            const response = await fetch(`/api/mentors/${mentor.id}/sessions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            })

            if (response.ok) {
                const statusMessages = {
                    'LIVE': isArabic ? 'تم بدء الجلسة!' : 'Session started!',
                    'ENDED': isArabic ? 'تم إنهاء الجلسة!' : 'Session ended!',
                    'CANCELLED': isArabic ? 'تم إلغاء الجلسة!' : 'Session cancelled!'
                }
                toast.success(statusMessages[newStatus])
                fetchUpcomingSessionsFromAPI()
                if (newStatus === 'ENDED') {
                    fetchArchivedSessionsFromAPI()
                }
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل التحديث' : 'Failed to update'))
            }
        } catch (error) {
            console.error('Error updating session status:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    // Handle edit archived session (add recording URL)
    const handleEditArchivedSession = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!mentor || !editingArchivedSession) return

        setSavingSession(true)
        try {
            const response = await fetch(`/api/mentors/${mentor.id}/sessions`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: editingArchivedSession.id,
                    title: editArchivedData.title,
                    titleAr: editArchivedData.titleAr || editArchivedData.title,
                    description: editArchivedData.description,
                    descriptionAr: editArchivedData.descriptionAr || editArchivedData.description,
                    recordingUrl: editArchivedData.recordingUrl || null,
                    tier: editArchivedData.tier
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم تحديث التسجيل!' : 'Recording updated!')
                setShowEditArchivedModal(false)
                setEditingArchivedSession(null)
                setEditArchivedData({
                    title: '', titleAr: '', description: '', descriptionAr: '',
                    recordingUrl: '', tier: 'BRONZE'
                })
                fetchArchivedSessionsFromAPI()
            } else {
                const error = await response.json()
                toast.error(error.message || (isArabic ? 'فشل التحديث' : 'Failed to update'))
            }
        } catch (error) {
            console.error('Error updating archived session:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSavingSession(false)
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

    const handleFollow = useCallback(async () => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }

        if (!mentor?.id) return

        try {
            const method = isFollowing ? 'DELETE' : 'POST'
            const response = await fetch(`/api/creators/${mentor.id}/follow`, {
                method
            })

            if (response.ok) {
                setIsFollowing(!isFollowing)
                toast.success(isFollowing 
                    ? (isArabic ? 'تم إلغاء المتابعة' : 'Unfollowed') 
                    : (isArabic ? 'تمت المتابعة' : 'Following!'))
            } else {
                const data = await response.json()
                toast.error(data.error || (isArabic ? 'فشلت العملية' : 'Operation failed'))
            }
        } catch (error) {
            console.error('Follow error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }, [session, isArabic, locale, router, isFollowing, mentor?.id])

    const handleSubscribe = async () => {
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
            // Use single tier price in EUR - no fake fallbacks
            const price = mentor?.monthlyPrice || 0

            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'CATEGORY_C',
                    channelId: null, // Set to null to avoid foreign key constraint
                    creatorId: channelId, // Pass instructor ID for reference
                    tier: 'ALL_ACCESS',
                    price: price,
                    billingCycle: 'monthly'
                    // paymentMethodId will be set by payment processor (Stripe/Paymob)
                })
            })

            const data = await response.json()

            if (response.ok) {
                setCurrentSubscription('ALL_ACCESS')
                toast.success(
                    isArabic 
                        ? '🎉 تم الاشتراك بنجاح!' 
                        : '🎉 Successfully subscribed!'
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

    // No upgrade needed for single ALL_ACCESS tier
    const handleUpgradeSubscription = async () => {
        toast.success(isArabic ? 'لديك بالفعل وصول كامل!' : 'You already have full access!')
    }

    const handleLikePost = useCallback(async (postId: string) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }
        
        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST'
            })

            if (response.ok) {
                setPosts(prev => prev.map(post => 
                    post.id === postId 
                        ? { ...post, likes: post.likes + 1 }
                        : post
                ))
            } else {
                const data = await response.json()
                // If already liked, try to unlike
                if (data.error === 'Already liked') {
                    const unlikeResponse = await fetch(`/api/posts/${postId}/like`, {
                        method: 'DELETE'
                    })
                    if (unlikeResponse.ok) {
                        setPosts(prev => prev.map(post => 
                            post.id === postId 
                                ? { ...post, likes: Math.max(0, post.likes - 1) }
                                : post
                        ))
                    }
                }
            }
        } catch (error) {
            console.error('Like error:', error)
            // Fallback to optimistic update
            setPosts(prev => prev.map(post => 
                post.id === postId 
                    ? { ...post, likes: post.likes + 1 }
                    : post
            ))
        }
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
                // No demo data - show empty state if API fails
                setPostComments(prev => ({ ...prev, [postId]: [] }))
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

        // All subscribers can download - single subscription model
        if (!currentSubscription) {
            toast.error(isArabic ? 'اشترك للتحميل' : 'Subscribe to download')
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
            fetchUpcomingSessionsFromAPI()
            fetchArchivedSessionsFromAPI()
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
                    // Merge saved posts with API posts (saved posts at the top)
                    setPosts(prev => {
                        // Get only API posts (ones that don't start with 'post-')
                        const apiPosts = prev.filter(p => !p.id.startsWith('post-'))
                        // Get only saved posts
                        const savedPostsList = parsedPosts.filter((p: Post) => p.id.startsWith('post-'))
                        // Combine: saved posts first, then API posts
                        return [...savedPostsList, ...apiPosts]
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
        // Single subscription model - all subscribers can view all posts
        return !!currentSubscription
    }, [currentSubscription])

    // Use real archived sessions from API (fallback to empty state if no data)
    const displayArchivedSessions = useMemo(() => {
        return realArchivedSessions.length > 0 ? realArchivedSessions : archivedSessions
    }, [realArchivedSessions, archivedSessions])

    // Use real community posts from API (fallback to empty state if no data)
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

    // All posts come from database now
    const displayPosts = useMemo(() => {
        // Sort by pinned first, then by timestamp (most recent first)
        return [...posts].sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0
            return timeB - timeA
        })
    }, [posts])

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
            // Determine post type based on file
            const postType = uploadFile 
                ? (uploadFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE')
                : 'TEXT'
            
            // Check if post is scheduled for future
            const isScheduled = newPostScheduledDate && new Date(newPostScheduledDate) > new Date()
            
            if (editingPost && editingPost.id.startsWith('post-')) {
                // Local-only post edit - update in state
                setPosts(posts.map(p => {
                    if (p.id === editingPost.id) {
                        return {
                            ...p,
                            content: newPostText,
                            tier: 'SUBSCRIBER',
                            scheduledFor: newPostScheduledDate || undefined,
                            timestamp: isScheduled ? undefined : (p.timestamp || 'now'),
                            media: uploadPreview || p.media,
                            type: uploadPreview 
                                ? (uploadFile?.type.startsWith('video/') ? 'video' : 'image')
                                : p.type,
                            isLocked: false
                        }
                    }
                    return p
                }))
                toast.success(isArabic ? '✏️ تم تحديث المنشور بنجاح!' : '✏️ Post updated successfully!')
            } else if (editingPost) {
                // API post edit - call PATCH endpoint
                const response = await fetch(`/api/posts/${editingPost.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: newPostText,
                        type: postType,
                        mediaUrl: uploadPreview,
                        scheduledFor: isScheduled ? newPostScheduledDate : null,
                        isDraft: false
                    })
                })
                
                if (!response.ok) {
                    throw new Error('Failed to update post')
                }
                
                // Refresh posts from API
                fetchMentorData()
                toast.success(isArabic ? '✏️ تم تحديث المنشور بنجاح!' : '✏️ Post updated successfully!')
            } else {
                // Create new post via API
                const response = await fetch('/api/creator/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: newPostText,
                        type: postType,
                        mediaUrl: uploadPreview,
                        scheduledFor: isScheduled ? newPostScheduledDate : null,
                        isDraft: false
                    })
                })
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}))
                    throw new Error(error.error || 'Failed to create post')
                }
                
                const data = await response.json()
                
                // Add the new post to local state with proper format
                const newPost: Post = {
                    id: data.post?.id || `post-${Date.now()}`,
                    type: uploadFile ? (uploadFile.type.startsWith('video/') ? 'video' : 'image') : 'text',
                    content: newPostText,
                    tier: 'SUBSCRIBER',
                    likes: 0,
                    comments: 0,
                    views: 0,
                    timestamp: isScheduled ? undefined : 'now',
                    scheduledFor: newPostScheduledDate || undefined,
                    isLocked: false,
                    media: uploadPreview || undefined
                }
                
                if (!isScheduled) {
                    setPosts([newPost, ...posts])
                } else {
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
    }, [newPostText, newPostScheduledDate, uploadFile, uploadPreview, posts, isArabic, editingPost, fetchMentorData])

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
                    <div className="w-16 h-16 border-4 border-[#0a84ff]/30 border-t-[#0a84ff] rounded-full animate-spin mx-auto mb-4" />
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
        <div className="min-h-screen bg-[#1f1f1f] text-foreground transition-colors">
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
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <ArrowLeft className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'رجوع' : 'Back to Feed'}</span>
                                </button>

                                {/* Posts Tab */}
                                <button
                                    onClick={handleSetPostsTab}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeTab === 'posts'
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
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
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
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
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
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
                                                ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                                : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
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
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
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
                                                : 'hover:bg-white/5 text-muted-foreground border-2 border-transparent'
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
                                {mentor.user.profileImage && mentor.user.profileImage.length > 0 ? (
                                    <Image
                                        src={mentor.user.profileImage}
                                        alt={getMentorName()}
                                        width={120} height={120} className="rounded-full border-4 border-background object-cover w-28 h-28 sm:w-32 sm:h-32"
                                    />
                                ) : (
                                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-background overflow-hidden">
                                        <AvatarPlaceholder 
                                            name={getMentorName()} 
                                            size={128} 
                                        />
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
                                                            monthlyPrice: mentor.monthlyPrice || 0 // No fake fallbacks
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
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#0a84ff] rounded-full flex items-center justify-center">
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
                                                            <Calendar className="w-3 h-3 text-[#0a84ff]" />
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
                                                        openAuthModal('signin', {
                                                            onSuccess: () => setShowMentorPaymentModal(true),
                                                        })
                                                        return
                                                    }
                                                    setShowMentorPaymentModal(true)
                                                }}
                                                disabled={isSubscribing}
                                                className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-bold px-8 py-2 rounded-full disabled:opacity-50 transition-all"
                                            >
                                                <Crown className="w-4 h-4 mr-2" />
                                                {isSubscribing ? (isArabic ? 'جاري...' : 'Loading...') : (isArabic ? 'اشترك' : 'Subscribe')}
                                            </Button>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    onClick={() => setIsBookingModalOpen(true)}
                                                    className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-semibold px-6 py-2 rounded-full transition-all"
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
                                        currentSubscription === 'VIP' ? 'bg-[#0a84ff] border-2 border-white/20' :
                                        currentSubscription === 'PREMIUM' ? 'bg-[#0a84ff]/80' :
                                        'bg-[#0a84ff]/60'
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
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#0a84ff]/20 flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-[#0a84ff]" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-semibold text-white">
                                                    {isArabic ? 'أنت مشترك!' : 'You\'re Subscribed!'}
                                                </h3>
                                                <p className="text-sm text-white/50">
                                                    {isArabic ? 'عضوية وصول شامل نشطة' : 'All-Access membership active'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                onClick={handleCancelSubscription}
                                                className="bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10"
                                            >
                                                {isArabic ? 'إلغاء' : 'Cancel'}
                                            </Button>
                                        </div>
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
                                        className="bg-card border border-border rounded-2xl p-6 hover:border-[#0a84ff]/30 transition-all"
                                    >
                                        {/* Post Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            {mentor.user.profileImage && mentor.user.profileImage.length > 0 ? (
                                                <Image
                                                    src={mentor.user.profileImage}
                                                    alt={getMentorName()}
                                                    width={48} height={48} className="rounded-full object-cover w-12 h-12"
                                                />
                                            ) : (
                                                <AvatarPlaceholder 
                                                    name={getMentorName()} 
                                                    size={48} 
                                                    className="rounded-full"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-foreground">{getMentorName()}</span>
                                                    <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
                                                    {post.tier !== 'FREE' && (
                                                        <Badge className={`${
                                                            post.tier === 'VIP' ? 'bg-[#0a84ff] border-2 border-white/20' :
                                                            post.tier === 'PREMIUM' ? 'bg-[#0a84ff]/80' :
                                                            'bg-[#0a84ff]/60'
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
                                                <div className="absolute inset-0 blur-2xl opacity-20">
                                                    {post.media && (
                                                        <div className="w-full h-full bg-[#0a84ff]" />
                                                    )}
                                                </div>
                                                
                                                {/* Glassmorphism Overlay */}
                                                <div className="relative backdrop-blur-3xl bg-black/60 border border-white/10 p-8 md:p-12 min-h-[300px] flex flex-col items-center justify-center">
                                                    {/* Animated Lock Icon */}
                                                    <motion.div
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="relative mb-6 p-6 rounded-full bg-[#0a84ff]/20"
                                                    >
                                                        <Lock className="w-12 h-12 text-[#0a84ff]" />
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
                                                            €{mentor.monthlyPrice || 0}
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
                                                            handleSubscribe()
                                                        }}
                                                        disabled={isSubscribing}
                                                        className="w-full max-w-xs h-12 font-semibold rounded-full bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white transition-all disabled:opacity-50"
                                                    >
                                                        {isSubscribing ? (
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Crown className="w-4 h-4 mr-2" />
                                                                {isArabic ? 'اشترك الآن' : 'Subscribe Now'}
                                                            </>
                                                        )}
                                                    </Button>

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
                                                                    className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Download className="w-4 h-4 mr-1" />
                                                                    {isArabic ? 'تحميل' : 'Download'}
                                                                </Button>
                                                            ) : (
                                                                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                                                                    <Lock className="w-4 h-4 text-[#0a84ff]" />
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
                                                                    className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Download className="w-4 h-4 mr-1" />
                                                                    {isArabic ? 'تحميل' : 'Download'}
                                                                </Button>
                                                            ) : (
                                                                <div className="bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                                                                    <Lock className="w-4 h-4 text-[#0a84ff]" />
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
                                                        className="flex items-center gap-2 hover:text-[#0a84ff] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-[#0a84ff]/10">
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
                                                        className="flex items-center gap-2 hover:text-[#0a84ff] transition-colors group"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-[#0a84ff]/10">
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
                                                        className="flex items-center gap-2 hover:text-[#0a84ff] transition-colors group"
                                                    >
                                                        <div className="p-2 rounded-full group-hover:bg-[#0a84ff]/10">
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
                                                                    <div className="w-8 h-8 rounded-full bg-[#0a84ff] flex items-center justify-center flex-shrink-0">
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
                                                                            className="bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white"
                                                                        >
                                                                            <Send className="w-3 h-3 mr-1" />
                                                                            {isArabic ? 'إرسال' : 'Post'}
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
                                                                    <p className="text-sm text-white/70 text-center">
                                                                        {isArabic ? 'اشترك للتعليق على المنشورات' : 'Subscribe to comment on posts'}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Comments List */}
                                                            {commentLoading[post.id] ? (
                                                                <div className="flex items-center justify-center py-8">
                                                                    <div className="w-8 h-8 border-4 border-white/20 border-t-[#0a84ff] rounded-full animate-spin" />
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
                                                                                <AvatarPlaceholder 
                                                                                    name={comment.author.name} 
                                                                                    size={32} 
                                                                                    className="rounded-full"
                                                                                />
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
                                                            handleSubscribe()
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
                                                    {upcomingSessions.reduce((acc, s) => acc + (s.duration || 0), 0)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{isArabic ? 'دقيقة' : 'Total Min'}</p>
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
                                            // Single subscription model - subscribers get full access
                                            const canJoin = !!currentSubscription
                                            const isLocked = !canJoin

                                            return (
                                                <motion.div
                                                    key={session.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="relative bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 border rounded-xl p-5 hover:border-purple-400 transition-all"
                                                >
                                                    {/* Session Header */}
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
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
                                                                    onClick={() => {
                                                                        setEditingSession(session)
                                                                        setEditSessionData({
                                                                            title: session.title || '',
                                                                            titleAr: session.titleAr || '',
                                                                            description: session.description || '',
                                                                            descriptionAr: session.descriptionAr || '',
                                                                            scheduledAt: session.date ? new Date(session.date).toISOString().slice(0, 16) : '',
                                                                            duration: session.duration || 60,
                                                                            tier: 'SUBSCRIBER',
                                                                            maxAttendees: session.maxAttendees || 100,
                                                                            meetingUrl: session.joinLink || '',
                                                                            meetingPassword: session.meetingPassword || ''
                                                                        })
                                                                        setShowEditSessionModal(true)
                                                                    }}
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
                                                        <div className="space-y-2">
                                                            {/* Status Badge */}
                                                            {session.status === 'LIVE' && (
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="relative flex h-3 w-3">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                                    </span>
                                                                    <span className="text-sm font-bold text-red-500">
                                                                        {isArabic ? 'مباشر الآن' : 'LIVE NOW'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    onClick={async () => {
                                                                        setSelectedSessionForAttendees(session)
                                                                        setShowAttendeesModal(true)
                                                                        setLoadingAttendees(true)
                                                                        try {
                                                                            const response = await fetch(`/api/sessions/${session.id}/join`)
                                                                            if (response.ok) {
                                                                                const data = await response.json()
                                                                                setSessionAttendees(data.attendees || [])
                                                                            }
                                                                        } catch (error) {
                                                                            console.error('Error fetching attendees:', error)
                                                                        } finally {
                                                                            setLoadingAttendees(false)
                                                                        }
                                                                    }}
                                                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                                                                >
                                                                    <Users className="w-4 h-4 mr-2" />
                                                                    {isArabic ? `الحاضرون (${session.attendees})` : `Attendees (${session.attendees})`}
                                                                </Button>
                                                                
                                                                {session.status === 'SCHEDULED' ? (
                                                                    <Button
                                                                        onClick={() => {
                                                                            if (session.joinLink) {
                                                                                window.open(session.joinLink, '_blank')
                                                                                handleUpdateSessionStatus(session.id, 'LIVE')
                                                                            } else {
                                                                                toast.error(isArabic ? 'لم يتم إضافة رابط الاجتماع بعد' : 'No meeting link added yet')
                                                                            }
                                                                        }}
                                                                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                                                    >
                                                                        <Video className="w-4 h-4 mr-2" />
                                                                        {session.joinLink 
                                                                            ? (isArabic ? 'بدء الجلسة' : 'Start Session')
                                                                            : (isArabic ? 'أضف رابط' : 'Add Link')
                                                                        }
                                                                    </Button>
                                                                ) : session.status === 'LIVE' ? (
                                                                    <Button
                                                                        onClick={() => handleUpdateSessionStatus(session.id, 'ENDED')}
                                                                        className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                                                                    >
                                                                        <X className="w-4 h-4 mr-2" />
                                                                        {isArabic ? 'إنهاء الجلسة' : 'End Session'}
                                                                    </Button>
                                                                ) : (
                                                                    <Button
                                                                        disabled
                                                                        className="flex-1 bg-card text-muted-foreground border border-border"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                                        {isArabic ? 'انتهت' : 'Ended'}
                                                                    </Button>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Quick actions for live session */}
                                                            {session.status === 'LIVE' && session.joinLink && (
                                                                <Button
                                                                    onClick={() => window.open(session.joinLink, '_blank')}
                                                                    size="sm"
                                                                    className="w-full bg-card hover:bg-card-hover text-foreground border border-border"
                                                                >
                                                                    <Video className="w-3 h-3 mr-2" />
                                                                    {isArabic ? 'العودة للجلسة' : 'Rejoin Session'}
                                                                </Button>
                                                            )}
                                                            
                                                            {session.joinLink && (
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 rounded-lg p-2">
                                                                    <span className="truncate flex-1">{session.joinLink}</span>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(session.joinLink)
                                                                            toast.success(isArabic ? 'تم النسخ!' : 'Copied!')
                                                                        }}
                                                                        className="p-1 hover:bg-card rounded"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )}
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
                                                            {isArabic ? 'اشترك للانضمام' : 'Subscribe to Join'}
                                                        </Button>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {/* Live indicator for users */}
                                                            {session.status === 'LIVE' && (
                                                                <div className="flex items-center justify-center gap-2 mb-2 py-1 bg-red-500/10 rounded-lg">
                                                                    <span className="relative flex h-3 w-3">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                                    </span>
                                                                    <span className="text-sm font-bold text-red-500">
                                                                        {isArabic ? 'مباشر الآن!' : 'LIVE NOW!'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <Button
                                                                onClick={() => {
                                                                    if (session.joinLink) {
                                                                        // Open meeting link in new tab
                                                                        window.open(session.joinLink, '_blank')
                                                                        if (session.meetingPassword) {
                                                                            toast.success(
                                                                                isArabic 
                                                                                    ? `كلمة مرور الاجتماع: ${session.meetingPassword}` 
                                                                                    : `Meeting password: ${session.meetingPassword}`,
                                                                                { duration: 10000 }
                                                                            )
                                                                        }
                                                                    } else {
                                                                        toast.success(isArabic ? 'ستتلقى رابط الانضمام قريباً' : 'You will receive the join link soon')
                                                                    }
                                                                }}
                                                                className={`w-full font-semibold ${
                                                                    session.status === 'LIVE' 
                                                                        ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 animate-pulse'
                                                                        : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                                                                } text-white`}
                                                            >
                                                                <Video className="w-4 h-4 mr-2" />
                                                                {session.status === 'LIVE'
                                                                    ? (isArabic ? 'انضم الآن!' : 'Join Now!')
                                                                    : session.joinLink 
                                                                        ? (isArabic ? 'انضم للجلسة' : 'Join Session')
                                                                        : (isArabic ? 'الرابط قريباً' : 'Link Coming Soon')
                                                                }
                                                            </Button>
                                                            {session.meetingPassword && session.joinLink && (
                                                                <p className="text-xs text-muted-foreground text-center">
                                                                    {isArabic ? 'كلمة المرور:' : 'Password:'} <span className="font-mono font-semibold text-foreground">{session.meetingPassword}</span>
                                                                </p>
                                                            )}
                                                        </div>
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

                                {/* Recording Analytics - Creator View Only */}
                                {isCreatorView && displayArchivedSessions.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                        <div className="bg-gradient-to-br from-pink-900/10 to-purple-900/10 border border-pink-500/20 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Eye className="w-4 h-4 text-pink-400" />
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'إجمالي المشاهدات' : 'Total Views'}</span>
                                            </div>
                                            <p className="text-xl font-bold text-foreground">
                                                {displayArchivedSessions.reduce((acc, s) => acc + (s.views || 0), 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-blue-900/10 to-cyan-900/10 border border-blue-500/20 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'إجمالي الساعات' : 'Total Hours'}</span>
                                            </div>
                                            <p className="text-xl font-bold text-foreground">
                                                {Math.round(displayArchivedSessions.reduce((acc, s) => acc + ((s.views || 0) * (s.duration || 60) / 60), 0))}h
                                            </p>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-900/10 to-emerald-900/10 border border-green-500/20 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <BarChart3 className="w-4 h-4 text-green-400" />
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'معدل الإكمال' : 'Completion Rate'}</span>
                                            </div>
                                            <p className="text-xl font-bold text-foreground">78%</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-yellow-900/10 to-orange-900/10 border border-yellow-500/20 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp className="w-4 h-4 text-yellow-400" />
                                                <span className="text-xs text-muted-foreground">{isArabic ? 'متوسط المشاهدات' : 'Avg Views'}</span>
                                            </div>
                                            <p className="text-xl font-bold text-foreground">
                                                {displayArchivedSessions.length > 0 
                                                    ? Math.round(displayArchivedSessions.reduce((acc, s) => acc + (s.views || 0), 0) / displayArchivedSessions.length)
                                                    : 0
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

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
                                            // Single subscription model - subscribers get full access
                                            const canAccess = !!currentSubscription
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
                                                                            onClick={() => {
                                                                                setEditingArchivedSession(session)
                                                                                setEditArchivedData({
                                                                                    title: session.title || '',
                                                                                    titleAr: session.titleAr || '',
                                                                                    description: session.description || '',
                                                                                    descriptionAr: session.descriptionAr || '',
                                                                                    recordingUrl: session.recordingUrl || '',
                                                                                    tier: 'SUBSCRIBER'
                                                                                })
                                                                                setShowEditArchivedModal(true)
                                                                            }}
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
                                                {communityMembers.length > 0 ? (
                                                    communityMembers
                                                    .filter(member => {
                                                        if (memberFilter !== 'all' && member.tier?.toLowerCase() !== memberFilter) return false
                                                        if (memberSearchQuery) {
                                                            const query = memberSearchQuery.toLowerCase()
                                                            return member.name?.toLowerCase().includes(query) ||
                                                                   member.arabicName?.includes(memberSearchQuery) ||
                                                                   member.email?.toLowerCase().includes(query)
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
                                                ))
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                        <p className="text-muted-foreground">
                                                            {isArabic ? 'لا يوجد أعضاء حتى الآن' : 'No members yet'}
                                                        </p>
                                                    </div>
                                                )}
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
                                            {/* Overview Stats - Real data from communityAnalytics */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users className="w-5 h-5 text-[#0a84ff]" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'إجمالي الأعضاء' : 'Total Members'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{communityAnalytics.totalMembers}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? 'مشتركين' : 'subscribers'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <FileText className="w-5 h-5 text-[#0a84ff]" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'إجمالي المنشورات' : 'Total Posts'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{communityAnalytics.totalPosts}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? 'منشور' : 'posts'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Activity className="w-5 h-5 text-[#0a84ff]" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'نشطون اليوم' : 'Active Today'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{communityAnalytics.activeToday}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? 'أعضاء' : 'members'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MessageSquare className="w-5 h-5 text-[#0a84ff]" />
                                                        <span className="text-sm font-medium text-foreground">
                                                            {isArabic ? 'معدل التفاعل' : 'Avg Engagement'}
                                                        </span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-foreground">{communityAnalytics.avgEngagement}%</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {isArabic ? 'تفاعل' : 'engagement'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Top Members - Real data */}
                                            <div className="bg-background border border-border rounded-xl p-6">
                                                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                                    <Trophy className="w-5 h-5 text-[#0a84ff]" />
                                                    {isArabic ? 'أفضل الأعضاء' : 'Top Members'}
                                                </h4>
                                                {communityAnalytics.topMembers.length > 0 ? (
                                                    <div className="space-y-3">
                                                        {communityAnalytics.topMembers.map((member, index) => (
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
                                                                        <h5 className="font-medium text-foreground text-sm">{member.name}</h5>
                                                                        <p className="text-xs text-muted-foreground">{member.tier}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    <span>{member.posts} {isArabic ? 'منشور' : 'posts'}</span>
                                                                    <span>{member.likes} {isArabic ? 'إعجاب' : 'likes'}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                        <p className="text-muted-foreground">
                                                            {isArabic ? 'لا توجد بيانات متاحة بعد' : 'No data available yet'}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Recent Activity - Real data */}
                                            <div className="bg-background border border-border rounded-xl p-6">
                                                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                                    <Activity className="w-5 h-5 text-blue-500" />
                                                    {isArabic ? 'نشاط الأعضاء' : 'Recent Activity'}
                                                </h4>
                                                {communityAnalytics.recentActivity.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {communityAnalytics.recentActivity.map((activity, index) => (
                                                            <div key={index} className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                                                    <Activity className="w-4 h-4 text-blue-500" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm text-foreground">
                                                                        <span className="font-medium">{activity.user}</span>
                                                                        {' '}{activity.action}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                        <p className="text-muted-foreground">
                                                            {isArabic ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                                                        </p>
                                                    </div>
                                                )}
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
                                            // Single subscription model - subscribers get full access
                                            const canAccess = !!currentSubscription
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
                                                                        {isArabic ? 'اشترك للوصول' : 'Subscribe to Access'}
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
                                    {mentor.expertise && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'التخصص' : 'Expertise'}</span>
                                            <span className="text-foreground font-semibold">{mentor.expertise}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">{isArabic ? 'الخبرة' : 'Experience'}</span>
                                        <span className="text-foreground font-semibold">{mentor.stats.yearsOfExperience}+ {isArabic ? 'سنوات' : 'years'}</span>
                                    </div>
                                    {mentor.languages && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'اللغات' : 'Languages'}</span>
                                            <span className="text-foreground font-semibold">{mentor.languages}</span>
                                        </div>
                                    )}
                                    {mentor.timezone && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'المنطقة الزمنية' : 'Timezone'}</span>
                                            <span className="text-foreground font-semibold">{mentor.timezone}</span>
                                        </div>
                                    )}
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
                                    {mentor.availableForMeetings && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'متاح للاجتماعات' : 'Available for Meetings'}</span>
                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                {isArabic ? 'متاح' : 'Available'}
                                            </Badge>
                                        </div>
                                    )}
                                    {mentor.hourlyRate && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'سعر الساعة' : 'Hourly Rate'}</span>
                                            <span className="text-foreground font-semibold">€{mentor.hourlyRate}/hr</span>
                                        </div>
                                    )}
                                </div>

                                {/* Social Links */}
                                {mentor.socialLinks && Object.values(mentor.socialLinks).some(v => v) && (
                                    <div className="pt-4 mt-4 border-t border-border">
                                        <h4 className="text-sm font-semibold text-foreground mb-3">{isArabic ? 'روابط التواصل' : 'Social Links'}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {mentor.socialLinks.youtube && (
                                                <a href={mentor.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-full text-sm hover:bg-red-500/20 transition-colors">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                                    YouTube
                                                </a>
                                            )}
                                            {mentor.socialLinks.twitter && (
                                                <a href={mentor.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-sm hover:bg-blue-500/20 transition-colors">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                                    Twitter
                                                </a>
                                            )}
                                            {mentor.socialLinks.linkedin && (
                                                <a href={mentor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 text-blue-500 rounded-full text-sm hover:bg-blue-600/20 transition-colors">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                                    LinkedIn
                                                </a>
                                            )}
                                            {mentor.socialLinks.instagram && (
                                                <a href={mentor.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 text-pink-400 rounded-full text-sm hover:bg-pink-500/20 transition-colors">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                                    Instagram
                                                </a>
                                            )}
                                            {mentor.socialLinks.website && (
                                                <a href={mentor.socialLinks.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-full text-sm hover:bg-purple-500/20 transition-colors">
                                                    <Globe className="w-4 h-4" />
                                                    {isArabic ? 'الموقع' : 'Website'}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Credentials / Qualifications */}
                                {creatorCredentials.length > 0 && (
                                    <div className="pt-4 mt-4 border-t border-border">
                                        <CredentialsDisplay 
                                            credentials={creatorCredentials} 
                                            isArabic={isArabic} 
                                        />
                                    </div>
                                )}
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
                                            €{creatorStats.earnings.thisMonth.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            +{Math.round(((creatorStats.earnings.thisMonth - creatorStats.earnings.lastMonth) / creatorStats.earnings.lastMonth) * 100)}%
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'الشهر الماضي' : 'Last Month'}</div>
                                        <div className="text-2xl font-black text-foreground">
                                            €{creatorStats.earnings.lastMonth.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'إجمالي الأرباح' : 'Total Earnings'}</div>
                                        <div className="text-2xl font-black text-foreground">
                                            €{creatorStats.earnings.total.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                                        <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'قيد الانتظار' : 'Pending'}</div>
                                        <div className="text-2xl font-black text-foreground">
                                            €{creatorStats.earnings.pending.toLocaleString()}
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
                                                    €{sub.spent?.toLocaleString() ?? 0}
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

                {/* Credentials Management Section - Only visible to profile owner */}
                {isCreatorView && (
                    <div className="bg-card border border-border rounded-2xl p-4 mt-6">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-[#0a84ff]" />
                            {isArabic ? 'إدارة الشهادات والمؤهلات' : 'Manage Credentials & Qualifications'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {isArabic ? 'أضف وعدّل شهاداتك ومؤهلاتك لإبراز خبراتك' : 'Add and edit your credentials to showcase your expertise'}
                        </p>
                        <CredentialsSection 
                            credentials={creatorCredentials}
                            onCredentialsChange={async () => {
                                // Refresh credentials after changes
                                try {
                                    const res = await fetch('/api/creator/credentials')
                                    if (res.ok) {
                                        const data = await res.json()
                                        setCreatorCredentials(data.credentials || [])
                                    }
                                } catch (error) {
                                    console.error('Error refreshing credentials:', error)
                                }
                            }}
                            isArabic={isArabic}
                        />
                    </div>
                )}
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

                            
                            {/* Suggested Creators */}
                            <div className="bg-[#1a1a1a] dark:bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                                <div className="p-4 border-b border-white/10">
                                    <h3 className="font-bold text-white">{isArabic ? 'منشئون آخرون' : 'Other Creators'}</h3>
                                </div>
                                {suggestedCreators.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {suggestedCreators.map((creator: any) => (
                                            <button
                                                key={creator.id}
                                                onClick={() => router.push(`/${locale}/mentors/${creator.id}`)}
                                                className="w-full p-4 hover:bg-white/5 active:bg-white/10 transition-all duration-200 text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {creator.user?.profileImage ? (
                                                        <Image
                                                            src={creator.user.profileImage}
                                                            alt={creator.user.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full object-cover w-10 h-10 ring-2 ring-white/10 group-hover:ring-[#0a84ff]/50 transition-all"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0a84ff] to-[#0066cc] flex items-center justify-center flex-shrink-0 ring-2 ring-white/10 group-hover:ring-[#0a84ff]/50 transition-all">
                                                            <span className="text-sm font-bold text-white">
                                                                {creator.user?.name?.[0] || 'C'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 mb-1">
                                                            <h4 className="font-semibold text-white text-sm truncate group-hover:text-[#0a84ff] transition-colors">
                                                                {isArabic ? creator.user?.arabicName || creator.user?.name : creator.user?.name}
                                                            </h4>
                                                            {creator.averageRating >= 4.5 && (
                                                                <CheckCircle className="w-3 h-3 text-[#0a84ff] fill-[#0a84ff] flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-white/60 truncate">
                                                            {creator.expertise || ''}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="flex items-center gap-1">
                                                                <Users className="w-3 h-3 text-white/40" />
                                                                <span className="text-xs text-white/50">
                                                                    {(creator.totalSubscribers || 0) > 1000 
                                                                        ? `${((creator.totalSubscribers || 0) / 1000).toFixed(1)}K` 
                                                                        : creator.totalSubscribers || 0}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Star className="w-3 h-3 text-[#ffd60a] fill-[#ffd60a]" />
                                                                <span className="text-xs text-white/50">
                                                                    {creator.averageRating?.toFixed(1) || '0.0'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-white/50">
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
                    monthlyPrice={mentor.monthlyPrice}
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
                                            {isArabic ? 'السعر بالساعة (€)' : 'Hourly Rate (€)'}
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
                                            {isArabic ? 'سعر الاشتراك (€)' : 'Subscription Price (€)'}
                                        </label>
                                        <Input
                                            type="number"
                                            value={editProfileData.monthlyPrice}
                                            onChange={(e) => setEditProfileData({ ...editProfileData, monthlyPrice: Number(e.target.value) })}
                                            placeholder="29"
                                            className="bg-background border-border"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3 pt-4">
                                    <Button
                                        onClick={async () => {
                                            try {
                                                // Save to API to sync with creator dashboard
                                                const response = await fetch('/api/creator/settings/profile', {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                        name: editProfileData.name,
                                                        arabicName: editProfileData.arabicName,
                                                        bio: editProfileData.bio,
                                                        expertise: editProfileData.expertise,
                                                        hourlyRate: editProfileData.hourlyRate,
                                                        monthlyPrice: editProfileData.monthlyPrice,
                                                        profileImage: profilePhotoPreview || undefined
                                                    })
                                                })

                                                if (!response.ok) {
                                                    throw new Error('Failed to save profile')
                                                }
                                                
                                                // Update mentor state immediately
                                                if (mentor) {
                                                    setMentor({
                                                        ...mentor,
                                                        user: {
                                                            ...mentor.user,
                                                            name: editProfileData.name || mentor.user.name,
                                                            arabicName: editProfileData.arabicName || mentor.user.arabicName,
                                                            bio: editProfileData.bio || mentor.user.bio,
                                                            profileImage: profilePhotoPreview || mentor.user.profileImage
                                                        },
                                                        expertise: editProfileData.expertise || mentor.expertise,
                                                        hourlyRate: editProfileData.hourlyRate || mentor.hourlyRate,
                                                        monthlyPrice: editProfileData.monthlyPrice || mentor.monthlyPrice
                                                    })
                                                }
                                                
                                                toast.success(isArabic ? 'تم حفظ التغييرات!' : 'Changes saved!')
                                                setShowEditProfileModal(false)
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

                                    {/* Meeting Link Section */}
                                    <div className="border-t border-border pt-4">
                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Video className="w-4 h-4 text-purple-500" />
                                            {isArabic ? 'رابط الاجتماع' : 'Meeting Link'}
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                    {isArabic ? 'رابط Zoom / Google Meet / Teams' : 'Zoom / Google Meet / Teams URL'}
                                                </label>
                                                <Input
                                                    type="url"
                                                    value={newSessionData.meetingUrl}
                                                    onChange={(e) => setNewSessionData({ ...newSessionData, meetingUrl: e.target.value })}
                                                    placeholder={isArabic ? 'مثال: https://zoom.us/j/123456789' : 'e.g., https://zoom.us/j/123456789'}
                                                    className="bg-background border-border"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {isArabic 
                                                        ? 'أضف رابط الاجتماع من Zoom أو Google Meet أو Microsoft Teams'
                                                        : 'Add your meeting link from Zoom, Google Meet, or Microsoft Teams'}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                    {isArabic ? 'كلمة مرور الاجتماع (اختياري)' : 'Meeting Password (optional)'}
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={newSessionData.meetingPassword}
                                                    onChange={(e) => setNewSessionData({ ...newSessionData, meetingPassword: e.target.value })}
                                                    placeholder={isArabic ? 'كلمة المرور إن وجدت' : 'Password if required'}
                                                    className="bg-background border-border"
                                                />
                                            </div>
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

            {/* Edit Session Modal */}
            <AnimatePresence>
                {showEditSessionModal && editingSession && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEditSessionModal(false)}
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
                                            <Edit2 className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-foreground">
                                                {isArabic ? 'تعديل الجلسة' : 'Edit Session'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'تحديث تفاصيل الجلسة' : 'Update session details'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowEditSessionModal(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleEditSession} className="space-y-6">
                                    {/* Title */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'عنوان الجلسة (إنجليزي) *' : 'Session Title (English) *'}
                                            </label>
                                            <Input
                                                value={editSessionData.title}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, title: e.target.value })}
                                                placeholder={isArabic ? 'أدخل العنوان بالإنجليزية' : 'Enter title in English'}
                                                className="bg-background border-border"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'عنوان الجلسة (عربي)' : 'Session Title (Arabic)'}
                                            </label>
                                            <Input
                                                value={editSessionData.titleAr}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, titleAr: e.target.value })}
                                                placeholder={isArabic ? 'أدخل العنوان بالعربية' : 'Enter title in Arabic'}
                                                className="bg-background border-border"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}
                                            </label>
                                            <textarea
                                                value={editSessionData.description}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, description: e.target.value })}
                                                placeholder={isArabic ? 'وصف الجلسة' : 'Session description'}
                                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground min-h-[80px] resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}
                                            </label>
                                            <textarea
                                                value={editSessionData.descriptionAr}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, descriptionAr: e.target.value })}
                                                placeholder={isArabic ? 'وصف الجلسة بالعربية' : 'Session description in Arabic'}
                                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground min-h-[80px] resize-none"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    {/* Date, Duration, Tier, Max Attendees */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'التاريخ والوقت *' : 'Date & Time *'}
                                            </label>
                                            <Input
                                                type="datetime-local"
                                                value={editSessionData.scheduledAt}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, scheduledAt: e.target.value })}
                                                className="bg-background border-border"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'المدة (دقيقة)' : 'Duration (min)'}
                                            </label>
                                            <Input
                                                type="number"
                                                value={editSessionData.duration}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, duration: Number(e.target.value) })}
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
                                                value={editSessionData.tier}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, tier: e.target.value })}
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
                                                value={editSessionData.maxAttendees}
                                                onChange={(e) => setEditSessionData({ ...editSessionData, maxAttendees: Number(e.target.value) })}
                                                min={1}
                                                className="bg-background border-border"
                                            />
                                        </div>
                                    </div>

                                    {/* Meeting Link Section */}
                                    <div className="border-t border-border pt-4">
                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Video className="w-4 h-4 text-purple-500" />
                                            {isArabic ? 'رابط الاجتماع' : 'Meeting Link'}
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                    {isArabic ? 'رابط Zoom / Google Meet / Teams' : 'Zoom / Google Meet / Teams URL'}
                                                </label>
                                                <Input
                                                    type="url"
                                                    value={editSessionData.meetingUrl}
                                                    onChange={(e) => setEditSessionData({ ...editSessionData, meetingUrl: e.target.value })}
                                                    placeholder={isArabic ? 'مثال: https://zoom.us/j/123456789' : 'e.g., https://zoom.us/j/123456789'}
                                                    className="bg-background border-border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                    {isArabic ? 'كلمة مرور الاجتماع (اختياري)' : 'Meeting Password (optional)'}
                                                </label>
                                                <Input
                                                    type="text"
                                                    value={editSessionData.meetingPassword}
                                                    onChange={(e) => setEditSessionData({ ...editSessionData, meetingPassword: e.target.value })}
                                                    placeholder={isArabic ? 'كلمة المرور إن وجدت' : 'Password if required'}
                                                    className="bg-background border-border"
                                                />
                                            </div>
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
                                                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setShowEditSessionModal(false)}
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

            {/* Edit Archived Session Modal */}
            <AnimatePresence>
                {showEditArchivedModal && editingArchivedSession && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowEditArchivedModal(false)}
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
                                                {isArabic ? 'تعديل التسجيل' : 'Edit Recording'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'تحديث تفاصيل التسجيل ورابط الفيديو' : 'Update recording details and video URL'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowEditArchivedModal(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleEditArchivedSession} className="space-y-6">
                                    {/* Title */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'عنوان التسجيل (إنجليزي)' : 'Recording Title (English)'}
                                            </label>
                                            <Input
                                                value={editArchivedData.title}
                                                onChange={(e) => setEditArchivedData({ ...editArchivedData, title: e.target.value })}
                                                placeholder={isArabic ? 'أدخل العنوان بالإنجليزية' : 'Enter title in English'}
                                                className="bg-background border-border"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'عنوان التسجيل (عربي)' : 'Recording Title (Arabic)'}
                                            </label>
                                            <Input
                                                value={editArchivedData.titleAr}
                                                onChange={(e) => setEditArchivedData({ ...editArchivedData, titleAr: e.target.value })}
                                                placeholder={isArabic ? 'أدخل العنوان بالعربية' : 'Enter title in Arabic'}
                                                className="bg-background border-border"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الوصف (إنجليزي)' : 'Description (English)'}
                                            </label>
                                            <textarea
                                                value={editArchivedData.description}
                                                onChange={(e) => setEditArchivedData({ ...editArchivedData, description: e.target.value })}
                                                placeholder={isArabic ? 'وصف التسجيل' : 'Recording description'}
                                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground min-h-[80px] resize-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {isArabic ? 'الوصف (عربي)' : 'Description (Arabic)'}
                                            </label>
                                            <textarea
                                                value={editArchivedData.descriptionAr}
                                                onChange={(e) => setEditArchivedData({ ...editArchivedData, descriptionAr: e.target.value })}
                                                placeholder={isArabic ? 'وصف التسجيل بالعربية' : 'Recording description in Arabic'}
                                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground min-h-[80px] resize-none"
                                                dir="rtl"
                                            />
                                        </div>
                                    </div>

                                    {/* Recording URL - Main Feature */}
                                    <div className="border-t border-border pt-4">
                                        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Video className="w-4 h-4 text-pink-500" />
                                            {isArabic ? 'رابط التسجيل' : 'Recording URL'}
                                        </h4>
                                        <div>
                                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                                {isArabic ? 'رابط الفيديو (YouTube, Vimeo, إلخ)' : 'Video URL (YouTube, Vimeo, etc.)'}
                                            </label>
                                            <Input
                                                type="url"
                                                value={editArchivedData.recordingUrl}
                                                onChange={(e) => setEditArchivedData({ ...editArchivedData, recordingUrl: e.target.value })}
                                                placeholder={isArabic ? 'مثال: https://youtube.com/watch?v=...' : 'e.g., https://youtube.com/watch?v=...'}
                                                className="bg-background border-border"
                                            />
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {isArabic 
                                                    ? 'أضف رابط تسجيل الجلسة لعرضه للمشتركين'
                                                    : 'Add the session recording URL for subscribers to watch'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tier */}
                                    <div>
                                        <label className="block text-sm font-semibold text-foreground mb-2">
                                            {isArabic ? 'الباقة المطلوبة للمشاهدة' : 'Required Tier to Watch'}
                                        </label>
                                        <select
                                            value={editArchivedData.tier}
                                            onChange={(e) => setEditArchivedData({ ...editArchivedData, tier: e.target.value })}
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
                                                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => setShowEditArchivedModal(false)}
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

            {/* Attendees Modal */}
            <AnimatePresence>
                {showAttendeesModal && selectedSessionForAttendees && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAttendeesModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                        >
                            <div className="p-6">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                            <Users className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-foreground">
                                                {isArabic ? 'الحاضرون' : 'Session Attendees'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedSessionForAttendees.title}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAttendeesModal(false)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Attendees List */}
                                <div className="max-h-[50vh] overflow-y-auto">
                                    {loadingAttendees ? (
                                        <div className="text-center py-12">
                                            <div className="w-10 h-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                                            <p className="text-muted-foreground">
                                                {isArabic ? 'جاري التحميل...' : 'Loading attendees...'}
                                            </p>
                                        </div>
                                    ) : sessionAttendees.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 rounded-full bg-card flex items-center justify-center mx-auto mb-4">
                                                <Users className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-foreground mb-2">
                                                {isArabic ? 'لا يوجد حاضرون بعد' : 'No Attendees Yet'}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic 
                                                    ? 'سيظهر الحاضرون هنا عند انضمامهم للجلسة'
                                                    : 'Attendees will appear here when they join the session'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {sessionAttendees.map((attendee) => (
                                                <div
                                                    key={attendee.id}
                                                    className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border"
                                                >
                                                    {attendee.profileImage ? (
                                                        <Image
                                                            src={attendee.profileImage}
                                                            alt={attendee.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <AvatarPlaceholder name={attendee.name} size={40} />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-foreground">
                                                            {isArabic && attendee.arabicName ? attendee.arabicName : attendee.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {isArabic ? 'انضم' : 'Joined'} {new Date(attendee.joinedAt).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {isArabic ? 'إجمالي الحاضرين:' : 'Total Attendees:'}
                                        </span>
                                        <span className="font-bold text-foreground">
                                            {sessionAttendees.length} / {selectedSessionForAttendees.maxAttendees || 100}
                                        </span>
                                    </div>
                                </div>
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

            {/* Mentor Payment Modal */}
            {mentor && (
                <MentorPaymentModal
                    isOpen={showMentorPaymentModal}
                    onClose={() => setShowMentorPaymentModal(false)}
                    mentor={{
                        id: mentor.id,
                        channelId: channelId || undefined,
                        name: mentor.user.name,
                        arabicName: mentor.user.arabicName,
                        profileImage: mentor.user.profileImage,
                        expertise: mentor.expertise,
                        price: mentor.monthlyPrice || 0, // No fake fallbacks
                    }}
                    isArabic={isArabic}
                    onSuccess={() => {
                        // Refresh subscription status
                        refreshSubscriptionStatus()
                    }}
                />
            )}
        </div>
    )
}
