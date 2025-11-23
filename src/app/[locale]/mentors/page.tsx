'use client'

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import toast from 'react-hot-toast'

// Dynamic imports for heavy components
const SubscribeModal = lazy(() => import('@/components/modals/SubscribeModal'))
const WithdrawalModal = lazy(() => import('@/components/modals/WithdrawalModal'))
const EditProfileModal = lazy(() => import('@/components/modals/EditProfileModal'))
const UploadMediaModal = lazy(() => import('@/components/modals/UploadMediaModal'))
const SubscriptionModal = lazy(() => import('@/components/creator/SubscriptionModal'))
const TipModal = lazy(() => import('@/components/creator/TipModal'))
const DirectMessageModal = lazy(() => import('@/components/creator/DirectMessageModal'))
const ContentCalendar = lazy(() => import('@/components/creator/ContentCalendar'))

// Cached icon imports - only load what we need when we need it
const iconCache = new Map()
const loadIcon = async (iconName: string) => {
    if (iconCache.has(iconName)) {
        return iconCache.get(iconName)
    }
    
    try {
        const iconModule = await import('lucide-react')
        const IconComponent = iconModule[iconName as keyof typeof iconModule]
        if (IconComponent) {
            iconCache.set(iconName, IconComponent)
            return IconComponent
        }
    } catch (error) {
        console.warn(`Failed to load icon: ${iconName}`)
    }
    return null
}

// Dynamic Icon component
const DynamicIcon = memo(({ 
    name, 
    className = "w-4 h-4", 
    ...props 
}: { 
    name: string
    className?: string 
    [key: string]: any 
}) => {
    const [IconComponent, setIconComponent] = useState<any>(null)
    
    useEffect(() => {
        loadIcon(name).then(setIconComponent)
    }, [name])
    
    if (!IconComponent) {
        return <div className={`${className} animate-pulse bg-muted rounded`} />
    }
    
    return <IconComponent className={className} {...props} />
})

DynamicIcon.displayName = 'DynamicIcon'

// Skeleton components for loading states
const PostSkeleton = memo(() => (
    <div className="p-4 hover:bg-white/[0.02] transition-colors animate-pulse">
        <div className="flex gap-3">
            {/* Profile Image Skeleton */}
            <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-muted" />
            </div>
            
            {/* Post Content Skeleton */}
            <div className="flex-1 min-w-0 space-y-3">
                {/* Header Skeleton */}
                <div className="flex items-center gap-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="h-4 bg-muted rounded w-16" />
                    <div className="h-4 bg-muted rounded w-12" />
                </div>
                
                {/* Content Skeleton */}
                <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-4/5" />
                    <div className="h-4 bg-muted rounded w-3/5" />
                </div>
                
                {/* Media Skeleton */}
                <div className="h-48 bg-muted rounded-2xl" />
                
                {/* Engagement Skeleton */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="h-4 bg-muted rounded w-8" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="h-4 bg-muted rounded w-8" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="h-4 bg-muted rounded w-8" />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-muted rounded-full" />
                        <div className="h-4 bg-muted rounded w-8" />
                    </div>
                </div>
            </div>
        </div>
    </div>
))

PostSkeleton.displayName = 'PostSkeleton'

const CreatorCardSkeleton = memo(() => (
    <div className="p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
            {/* Profile Image Skeleton */}
            <div className="w-12 h-12 rounded-full bg-muted flex-shrink-0" />
            
            {/* Creator Info Skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="w-3.5 h-3.5 bg-muted rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 bg-muted rounded w-16" />
                    <div className="h-3 bg-muted rounded w-12" />
                </div>
                <div className="h-3 bg-muted rounded w-20" />
            </div>
        </div>
        
        {/* Action Buttons Skeleton */}
        <div className="flex items-center gap-2">
            <div className="flex-1 h-8 bg-muted rounded-full" />
            <div className="w-10 h-8 bg-muted rounded-full" />
            <div className="w-10 h-8 bg-muted rounded-full" />
        </div>
    </div>
))

CreatorCardSkeleton.displayName = 'CreatorCardSkeleton'

const CreatorGridSkeleton = memo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 animate-pulse">
                <div className="space-y-4">
                    {/* Cover Image Skeleton */}
                    <div className="h-32 bg-muted rounded-xl" />
                    
                    {/* Profile Section Skeleton */}
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                    
                    {/* Stats Skeleton */}
                    <div className="flex justify-between">
                        <div className="text-center space-y-1">
                            <div className="h-4 bg-muted rounded w-8 mx-auto" />
                            <div className="h-3 bg-muted rounded w-12 mx-auto" />
                        </div>
                        <div className="text-center space-y-1">
                            <div className="h-4 bg-muted rounded w-8 mx-auto" />
                            <div className="h-3 bg-muted rounded w-12 mx-auto" />
                        </div>
                        <div className="text-center space-y-1">
                            <div className="h-4 bg-muted rounded w-8 mx-auto" />
                            <div className="h-3 bg-muted rounded w-12 mx-auto" />
                        </div>
                    </div>
                    
                    {/* Button Skeleton */}
                    <div className="h-10 bg-muted rounded-full" />
                </div>
            </div>
        ))}
    </div>
))

CreatorGridSkeleton.displayName = 'CreatorGridSkeleton'

// Add CSS animations as an alternative to framer-motion
const addAnimationStyles = () => {
    if (typeof document !== 'undefined') {
        const style = document.createElement('style')
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(-20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            .animate-fade-in {
                animation: fadeIn 0.3s ease-out forwards;
            }
            .animate-slide-in {
                animation: slideIn 0.3s ease-out forwards;
            }
        `
        if (!document.head.querySelector('style[data-mentors-animations]')) {
            style.setAttribute('data-mentors-animations', 'true')
            document.head.appendChild(style)
        }
    }
}

// Add animations on component mount
if (typeof window !== 'undefined') {
    addAnimationStyles()
}

// Create a lightweight motion replacement using CSS animations
const motion = {
    div: ({ children, className, initial, animate, transition, onClick, ...props }: any) => {
        const animationClass = initial ? 'animate-fade-in' : ''
        const delay = transition?.delay ? `${transition.delay * 1000}ms` : '0ms'
        
        return (
            <div
                className={`${className} ${animationClass}`}
                style={{ animationDelay: delay }}
                onClick={onClick}
                {...props}
            >
                {children}
            </div>
        )
    }
}

// Caching system for API responses
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const CACHE_KEYS = {
    CREATORS: 'mentors_creators',
    POSTS: 'mentors_posts',
    CREATOR_STATS: 'mentors_creator_stats',
}

const getCachedData = (key: string) => {
    try {
        const cached = localStorage.getItem(key)
        if (cached) {
            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data
            } else {
                localStorage.removeItem(key)
            }
        }
    } catch (error) {
        console.warn('Cache read error:', error)
    }
    return null
}

const setCachedData = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify({
            data,
            timestamp: Date.now()
        }))
    } catch (error) {
        console.warn('Cache write error:', error)
    }
}

interface Creator {
    id: string
    userId: string // Add userId to match with session user
    channelId?: string // Add channel ID
    user: {
        id: string
        name: string
        arabicName?: string
        profileImage: string | null
        bio: string
    }
    expertise: string
    basicMonthlyPrice: number
    premiumMonthlyPrice: number
    vipMonthlyPrice: number
    totalSubscribers: number
    totalEarnings: number
    stats: {
        averageRating: number
        totalPosts: number
        yearsOfExperience: number
    }
    isOnline?: boolean
    hasNewContent?: boolean
    isSubscribed?: boolean // Add subscription status
    subscribedTier?: 'Basic' | 'Premium' | 'VIP' | null // Add subscribed tier info
}

export default function OnlyFansStyleMentorsPage() {
    const router = useRouter()
    const params = useParams()
    const { data: session } = useSession()
    const locale = (params.locale as string) || 'en'
    const isArabic = locale === 'ar'

    const [creators, setCreators] = useState<Creator[]>([])
    const [filteredCreators, setFilteredCreators] = useState<Creator[]>([])
    const [loading, setLoading] = useState(true) // Start with loading true
    const [loadingPosts, setLoadingPosts] = useState(true) // Separate loading state for posts
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'trending' | 'new' | 'top'>('all')
    const [activeView, setActiveView] = useState<'feed' | 'subscriptions' | 'bookmarks' | 'creators' | 'profile'>('feed')
    const [posts, setPosts] = useState<any[]>([])
    const [profileTab, setProfileTab] = useState<'posts' | 'media' | 'videos' | 'likes' | 'stats' | 'calendar'>('posts')
    const [mediaView, setMediaView] = useState<'grid' | 'list'>('grid')
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    // Creator/profile dashboard states
    const [isCreatorAccount, setIsCreatorAccount] = useState(false)
    const [creatorStats, setCreatorStats] = useState<any>(null)
    const [creatorPosts, setCreatorPosts] = useState<any[]>([])
    const [loadingCreatorPosts, setLoadingCreatorPosts] = useState(false)
    const [selectedPost, setSelectedPost] = useState<any>(null)
    const [editPostModalOpen, setEditPostModalOpen] = useState(false)
    const [tierSubscribers, setTierSubscribers] = useState<{basic: number, premium: number, vip: number}>({
        basic: 0,
        premium: 0,
        vip: 0
    })
    
    // Modal states
    const [subscribeModalOpen, setSubscribeModalOpen] = useState(false)
    const [tipModalOpen, setTipModalOpen] = useState(false)
    const [messageModalOpen, setMessageModalOpen] = useState(false)
    const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)
    const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
    const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)
    const [isNavigating, setIsNavigating] = useState(false)
    const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]) // Track user's subscriptions
    const [bookmarks, setBookmarks] = useState<any[]>([]) // Array of bookmarked posts
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false) // Mobile menu state
    const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>([]) // Array of post IDs that are bookmarked

    useEffect(() => {
        fetchCreators()
        fetchPosts()
        if (session?.user) {
            fetchUserSubscriptions()
            fetchUserBookmarks()
        }
    }, [filterType, session])

    // Fetch user's bookmarks from API
    const fetchUserBookmarks = useCallback(async () => {
        if (!session?.user?.id) return
        
        try {
            const response = await fetch('/api/bookmarks')
            if (response.ok) {
                const data = await response.json()
                setBookmarks(data.bookmarks || [])
                // Extract post IDs for easier checking
                setBookmarkedPostIds(data.bookmarks?.map((b: any) => b.id) || [])
            }
        } catch (error) {
            console.error('Error fetching bookmarks:', error)
        }
    }, [session])

    // Handle bookmark toggle
    const handleBookmark = useCallback(async (postId: string): Promise<boolean> => {
        if (!session?.user?.id) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return false
        }

        try {
            const response = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId })
            })

            if (response.ok) {
                const data = await response.json()
                
                if (data.bookmarked) {
                    setBookmarkedPostIds(prev => [...prev, postId])
                    toast.success(isArabic ? 'تم حفظ الإشارة المرجعية' : 'Bookmark saved')
                    // Refresh bookmarks to get full post data
                    fetchUserBookmarks()
                } else {
                    setBookmarkedPostIds(prev => prev.filter(id => id !== postId))
                    setBookmarks(prev => prev.filter(b => b.id !== postId))
                    toast.success(isArabic ? 'تم إزالة الإشارة المرجعية' : 'Bookmark removed')
                }
                return data.bookmarked
            } else {
                throw new Error('Failed to update bookmark')
            }
        } catch (error) {
            console.error('Bookmark error:', error)
            toast.error(isArabic ? 'فشل في حفظ الإشارة المرجعية' : 'Failed to save bookmark')
            return false
        }
    }, [session, isArabic, fetchUserBookmarks])

    useEffect(() => {
        filterCreators()
    }, [searchQuery, creators])

    // Update creators with subscription status when subscriptions change
    useEffect(() => {
        if (userSubscriptions.length > 0 && creators.length > 0) {
            const updatedCreators = creators.map(creator => {
                const subscription = userSubscriptions.find(sub => {
                    // Check if subscription is for this creator
                    // First check metadata for creatorId
                    if (sub.metadata?.creatorId === creator.id) {
                        return true
                    }
                    // Then check if channelId matches
                    if (sub.channelId === creator.channelId) {
                        return true
                    }
                    return false
                })
                return {
                    ...creator,
                    isSubscribed: !!subscription,
                    subscribedTier: subscription?.metadata?.tier || subscription?.tier || null
                }
            })
            setCreators(updatedCreators)
        }
    }, [userSubscriptions])

    // Fetch creator posts when selectedCreator changes
    useEffect(() => {
        if (selectedCreator?.id) {
            // Fetch posts using creator ID (will work even if no channel exists yet)
            fetchCreatorPostsByCreatorId(selectedCreator.id)
            fetchTierSubscribers(selectedCreator.id)
            fetchCreatorStats(selectedCreator.id)
        }
    }, [selectedCreator])

    // Auto-set selectedCreator when viewing own profile ONLY if no creator is selected
    // AND the user navigated to profile tab without selecting a specific creator
    useEffect(() => {
        if (activeView === 'profile' && session && isCreatorAccount && !selectedCreator && creators.length > 0) {
            // This should only run when user clicks "Profile" from main navigation
            // NOT when they click on a creator card (which sets selectedCreator first)
            console.log('Auto-setting own creator profile. Session userId:', session.user?.id)
            const userCreator = creators.find(c => {
                console.log('Comparing:', c.userId, '===', session.user?.id, '?', c.userId === session.user?.id)
                return c.userId === session.user?.id
            })
            if (userCreator) {
                console.log('Setting own creator profile:', userCreator)
                setSelectedCreator(userCreator)
            } else {
                console.log('User creator not found. UserId:', session.user?.id, 'Creators:', creators.length)
            }
        }
        
        // If viewing profile but selectedCreator doesn't exist in creators list, clear it
        if (activeView === 'profile' && selectedCreator && creators.length > 0) {
            const creatorExists = creators.find(c => c.id === selectedCreator.id)
            if (!creatorExists) {
                console.log('Selected creator no longer exists, clearing selection:', selectedCreator.id)
                setSelectedCreator(null)
            }
        }
    }, [activeView, session, isCreatorAccount, creators, selectedCreator])

    // mark whether signed-in user is a creator (based on session role or creator match)
    useEffect(() => {
        if (session) {
            // Check if user has CREATOR role
            const hasCreatorRole = (session.user as any)?.role === 'CREATOR'
            
            // Or check if user exists in creators list
            if (creators.length > 0) {
                const exists = creators.some(c => c.userId === session.user?.id)
                setIsCreatorAccount(hasCreatorRole || exists)
                
                // Fetch creator stats if user is a creator
                if (hasCreatorRole || exists) {
                    const userCreator = creators.find(c => c.userId === session.user?.id)
                    if (userCreator) {
                        fetchCreatorStats(userCreator.id)
                    }
                }
            } else {
                setIsCreatorAccount(hasCreatorRole)
            }
        }
    }, [creators, session])
    
    const fetchCreatorStats = useCallback(async (creatorId: string) => {
        // Check cache first
        const cacheKey = `${CACHE_KEYS.CREATOR_STATS}_${creatorId}`
        const cachedData = getCachedData(cacheKey)
        if (cachedData) {
            setCreatorStats(cachedData)
            return
        }

        try {
            const response = await fetch(`/api/creators/${creatorId}/stats`)
            if (response.ok) {
                const data = await response.json()
                setCreatorStats(data)
                // Cache the response
                setCachedData(cacheKey, data)
            }
        } catch (error) {
            console.error('Failed to fetch creator stats:', error)
        }
    }, [])
    
    // Memoize subscribe click handler
    const handleSubscribeClick = useCallback((creator: Creator) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }
        setSelectedCreator(creator)
        setSubscribeModalOpen(true)
    }, [session, isArabic, locale, router])

    const fetchCreators = useCallback(async () => {
        // Check cache first
        const cacheKey = `${CACHE_KEYS.CREATORS}_${filterType}`
        const cachedData = getCachedData(cacheKey)
        if (cachedData) {
            setCreators(cachedData)
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            const response = await fetch(`/api/creators?limit=50&filter=${filterType}`)
            if (response.ok) {
                const data = await response.json()
                const creatorsData = data.creators || []
                setCreators(creatorsData)
                // Cache the response
                setCachedData(cacheKey, creatorsData)
            } else {
                console.error('Failed to fetch creators:', response.statusText)
                toast.error(isArabic ? 'فشل التحميل' : 'Failed to load creators')
            }
        } catch (error) {
            console.error('Failed to fetch creators:', error)
            toast.error(isArabic ? 'فشل التحميل' : 'Failed to load')
        } finally {
            setLoading(false)
        }
    }, [filterType, isArabic])

    const fetchPosts = useCallback(async () => {
        // Check cache first
        const cachedData = getCachedData(CACHE_KEYS.POSTS)
        if (cachedData) {
            setPosts(cachedData)
            setLoadingPosts(false)
            return
        }

        try {
            setLoadingPosts(true)
            const response = await fetch('/api/channel-posts/feed')
            if (response.ok) {
                const data = await response.json()
                console.log('Feed posts loaded:', data.posts?.length || 0)
                console.log('Post types:', data.posts?.map((p: any) => ({ id: p.id, type: p.type, hasMedia: !!(p.thumbnailUrl || p.mediaUrl) })))
                const postsData = data.posts || []
                setPosts(postsData)
                // Cache the response
                setCachedData(CACHE_KEYS.POSTS, postsData)
            }
        } catch (error) {
            console.error('Failed to fetch posts:', error)
        } finally {
            setLoadingPosts(false)
        }
    }, [])

    const fetchUserSubscriptions = useCallback(async () => {
        if (!session?.user?.id) return

        try {
            const response = await fetch('/api/subscriptions/status')
            if (response.ok) {
                const data = await response.json()
                setUserSubscriptions(data.subscriptions || [])
            }
        } catch (error) {
            console.error('Failed to fetch user subscriptions:', error)
        }
    }, [session])

    const fetchCreatorPosts = async (channelId: string) => {
        setLoadingCreatorPosts(true)
        try {
            const response = await fetch(`/api/channel-posts?channelId=${channelId}`)
            if (response.ok) {
                const data = await response.json()
                setCreatorPosts(data.posts || [])
            } else {
                toast.error(isArabic ? 'فشل تحميل المنشورات' : 'Failed to load posts')
            }
        } catch (error) {
            console.error('Failed to fetch creator posts:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoadingCreatorPosts(false)
        }
    }

    const fetchCreatorPostsByCreatorId = async (creatorId: string) => {
        setLoadingCreatorPosts(true)
        try {
            // Use scheduled-posts API which filters by creator
            const response = await fetch(`/api/scheduled-posts?creatorId=${creatorId}`)
            if (response.ok) {
                const data = await response.json()
                console.log('Loaded creator posts:', data.posts?.length || 0)
                setCreatorPosts(data.posts || [])
            } else {
                const error = await response.json()
                console.error('Failed to load posts:', error)
                toast.error(isArabic ? 'فشل تحميل المنشورات' : 'Failed to load posts')
            }
        } catch (error) {
            console.error('Failed to fetch creator posts:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoadingCreatorPosts(false)
        }
    }

    const fetchTierSubscribers = async (creatorId: string) => {
        try {
            const response = await fetch(`/api/mentor-subscriptions?creatorId=${creatorId}&groupByTier=true`)
            if (response.ok) {
                const data = await response.json()
                // Assuming API returns {basic: count, premium: count, vip: count}
                setTierSubscribers(data.tierCounts || {basic: 0, premium: 0, vip: 0})
            }
        } catch (error) {
            console.error('Failed to fetch tier subscribers:', error)
        }
    }

    // Memoize filter creators to avoid recalculation on every render
    const filterCreators = useCallback(() => {
        let filtered = [...creators]

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.expertise.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        // Type filter
        switch (filterType) {
            case 'trending':
                filtered.sort((a, b) => b.totalSubscribers - a.totalSubscribers)
                break
            case 'top':
                filtered.sort((a, b) => b.stats.averageRating - a.stats.averageRating)
                break
            case 'new':
                filtered.reverse()
                break
        }

        setFilteredCreators(filtered)
    }, [creators, searchQuery, filterType])

    // Memoize creator click handler
    const handleCreatorClick = useCallback((creatorId: string) => {
        // Navigate to individual creator page
        console.log('handleCreatorClick called with creatorId:', creatorId)
        setIsNavigating(true)
        router.push(`/${locale}/mentors/${creatorId}`)
    }, [locale, router])

    // Memoize tip click handler
    const handleTipClick = useCallback((creator: Creator) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }
        setSelectedCreator(creator)
        setTipModalOpen(true)
    }, [session, isArabic, locale, router])

    // Memoize message click handler
    const handleMessageClick = useCallback((creator: Creator) => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            router.push(`/${locale}/login`)
            return
        }
        // Redirect to messaging page with the creator's ID
        setIsNavigating(true)
        router.push(`/${locale}/messaging?userId=${creator.userId}`)
    }, [session, isArabic, locale, router])

    // Memoize subscribe handler
    const handleSubscribe = useCallback(async (tier: 'BASIC' | 'PREMIUM' | 'VIP', duration: 'monthly' | 'yearly') => {
        if (!selectedCreator) return
        
        try {
            const response = await fetch('/api/mentor-subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: selectedCreator.id,
                    tier,
                    duration
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to subscribe')
            }

            // Close modal
            setSubscribeModalOpen(false)
            
            // Show success toast
            toast.success(
                isArabic 
                    ? `تم الاشتراك بنجاح في ${selectedCreator.user.name}!` 
                    : `Successfully subscribed to ${selectedCreator.user.name}!`
            )

            // Refresh creator data
            fetchCreators()
        } catch (error: any) {
            console.error('Subscription error:', error)
            toast.error(
                isArabic 
                    ? error.message || 'فشل الاشتراك. حاول مرة أخرى.' 
                    : error.message || 'Failed to subscribe. Please try again.'
            )
        }
    }, [selectedCreator, isArabic])

    // Memoize send tip handler
    const handleSendTip = useCallback(async (amount: number, message?: string) => {
        if (!selectedCreator) return
        
        try {
            const response = await fetch('/api/tips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: selectedCreator.id,
                    amount,
                    message: message || '',
                    isAnonymous: false
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send tip')
            }

            // Close modal
            setTipModalOpen(false)
            
            // Show success toast
            toast.success(
                isArabic 
                    ? `تم إرسال ${amount} EGP بنجاح!` 
                    : `Successfully sent ${amount} EGP!`
            )

            // Refresh creator stats
            fetchCreatorStats(selectedCreator.id)
        } catch (error: any) {
            console.error('Tip error:', error)
            toast.error(
                isArabic 
                    ? error.message || 'فشل إرسال الإكرامية. حاول مرة أخرى.' 
                    : error.message || 'Failed to send tip. Please try again.'
            )
        }
    }, [selectedCreator, isArabic])

    // Memoize edit post handler
    const handleEditPost = useCallback((post: any) => {
        setSelectedPost(post)
        setEditPostModalOpen(true)
    }, [])

    // Memoize delete post handler
    const handleDeletePost = useCallback(async (postId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذا المنشور؟' : 'Are you sure you want to delete this post?')) {
            return
        }

        try {
            const response = await fetch(`/api/scheduled-posts/${postId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete post')
            }

            toast.success(isArabic ? 'تم حذف المنشور' : 'Post deleted')
            
            // Refresh posts
            if (selectedCreator?.id) {
                fetchCreatorPostsByCreatorId(selectedCreator.id)
            }
        } catch (error) {
            console.error('Delete post error:', error)
            toast.error(isArabic ? 'فشل حذف المنشور' : 'Failed to delete post')
        }
    }, [isArabic, selectedCreator])

    // Memoize send message handler
    const handleSendMessage = useCallback(async (message: string, type: string) => {
        if (!selectedCreator) return
        
        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: selectedCreator.user.id,
                    content: message,
                    type
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send message')
            }

            // Show success feedback
            toast.success(
                isArabic 
                    ? 'تم إرسال الرسالة بنجاح!' 
                    : 'Message sent successfully!'
            )
        } catch (error: any) {
            console.error('Message error:', error)
            toast.error(
                isArabic 
                    ? error.message || 'فشل إرسال الرسالة. حاول مرة أخرى.' 
                    : error.message || 'Failed to send message. Please try again.'
            )
        }
    }, [selectedCreator, isArabic])

    // Memoize view change handlers
    const handleSetFeedView = useCallback(() => setActiveView('feed'), [])
    const handleSetCreatorsView = useCallback(() => setActiveView('creators'), [])
    const handleSetProfileView = useCallback(() => setActiveView('profile'), [])
    
    const handleSetSubscriptionsView = useCallback(() => {
        if (session) {
            setActiveView('subscriptions')
        } else {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
        }
    }, [session, isArabic])
    
    const handleSetBookmarksView = useCallback(() => {
        if (session) {
            setActiveView('bookmarks')
        } else {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
        }
    }, [session, isArabic])

    const handleNavigateToCourses = useCallback(() => {
        router.push(`/${locale}/courses`)
    }, [locale, router])

    // Memoize tab handlers
    const handleSetPostsTab = useCallback(() => setProfileTab('posts'), [])
    const handleSetMediaTab = useCallback(() => setProfileTab('media'), [])
    const handleSetVideosTab = useCallback(() => setProfileTab('videos'), [])
    const handleSetLikesTab = useCallback(() => setProfileTab('likes'), [])
    const handleSetStatsTab = useCallback(() => setProfileTab('stats'), [])
    const handleSetCalendarTab = useCallback(() => setProfileTab('calendar'), [])

    // Memoize post interaction handlers
    const handlePostComment = useCallback((postId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/${locale}/posts/${postId}`)
    }, [locale, router])

    const handlePostRepost = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        toast.success(isArabic ? 'تم إعادة النشر!' : 'Reposted!')
    }, [isArabic])

    const handlePostLike = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        const target = e.currentTarget as HTMLElement
        target.classList.toggle('text-pink-500')
        const icon = target.querySelector('.heart-icon')
        icon?.classList.toggle('fill-pink-500')
    }, [])

    const handlePostBookmarkToggle = useCallback(async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const target = e.currentTarget as HTMLElement
        const icon = target.querySelector('.bookmark-icon')
        
        // Call API to save bookmark
        const bookmarked = await handleBookmark(postId)
        
        // Update UI based on result
        if (bookmarked) {
            target.classList.add('text-blue-500')
            icon?.classList.add('fill-blue-500')
        } else {
            target.classList.remove('text-blue-500')
            icon?.classList.remove('fill-blue-500')
        }
    }, [handleBookmark])

    const handlePostShare = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        toast.success(isArabic ? 'تم النسخ!' : 'Link copied!')
    }, [isArabic])

    // Memoize creators display list
    const displayCreators = useMemo(() => {
        return filteredCreators.length > 0 ? filteredCreators : creators
    }, [filteredCreators, creators])

    // Memoize posts display list  
    const displayPosts = useMemo(() => {
        return posts.filter(post => post.type && post.content)
    }, [posts])

    // Memoized Creator Card component for better performance
    const CreatorCard = memo(({ creator }: { creator: Creator }) => (
        <div 
            className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
            onClick={() => handleCreatorClick(creator.id)}
        >
            <div className="aspect-video relative">
                {creator.user.profileImage ? (
                    <Image
                        src={creator.user.profileImage}
                        alt={creator.user.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <DynamicIcon name="User" className="w-16 h-16 text-white" />
                    </div>
                )}
                {creator.isOnline && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
                {creator.hasNewContent && (
                    <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-red-500 text-white text-xs">NEW</Badge>
                    </div>
                )}
            </div>
            
            <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{creator.user.name}</h3>
                    {creator.stats.averageRating >= 4.5 && (
                        <DynamicIcon name="Crown" className="w-4 h-4 text-yellow-500" />
                    )}
                </div>
                
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {creator.expertise}
                </p>
                
                <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <DynamicIcon name="Star" className="w-4 h-4 text-yellow-500" />
                        {creator.stats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1">
                        <DynamicIcon name="Users" className="w-4 h-4" />
                        {creator.totalSubscribers}
                    </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-purple-400">
                        ${creator.basicMonthlyPrice}/mo
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleTipClick(creator)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <DynamicIcon name="Heart" className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleSubscribeClick(creator)
                            }}
                        >
                            <DynamicIcon name="Crown" className="w-4 h-4 mr-1" />
                            Subscribe
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    ))

    CreatorCard.displayName = 'CreatorCard'

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#0a84ff]/30 border-t-[#0a84ff] rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Twitter-Style Feed */}
            <div className="container mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    {/* Left Sidebar - Navigation */}
                    <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-auto lg:col-span-3 p-4 bg-background transform transition-transform duration-300 lg:transform-none ${
                        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    }`}>
                        <div className="sticky top-20">
                            <nav className="space-y-2">
                                {/* Feed/Home Button */}
                                <button
                                    onClick={handleSetFeedView}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeView === 'feed'
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <DynamicIcon name="Home" className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'الرئيسية' : 'Feed'}</span>
                                </button>


                                {/* Creators List */}
                                <button
                                    onClick={handleSetCreatorsView}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeView === 'creators'
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <DynamicIcon name="Users" className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'المبدعون' : 'Creators'}</span>
                                </button>

                                {/* Subscriptions */}
                                <button
                                    onClick={handleSetSubscriptionsView}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeView === 'subscriptions'
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <DynamicIcon name="Crown" className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'اشتراكاتي' : 'Subscriptions'}</span>
                                </button>

                                {/* Bookmarks */}
                                <button
                                    onClick={handleSetBookmarksView}
                                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                                        activeView === 'bookmarks'
                                            ? 'bg-[#0a84ff]/10 text-[#0a84ff]'
                                            : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <DynamicIcon name="Bookmark" className="w-6 h-6" />
                                    <span className="text-lg font-bold">{isArabic ? 'المحفوظات' : 'Bookmarks'}</span>
                                </button>

                                {/* Reposts */}
                                <button
                                    onClick={() => toast.success(isArabic ? 'قريباً' : 'Coming soon!')}
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="text-lg font-bold">{isArabic ? 'إعادة النشر' : 'Reposts'}</span>
                                </button>

                                {/* Profile - Creator Only */}
                                {isCreatorAccount && (
                                    <button
                                        onClick={() => {
                                            if (session) {
                                                // If user is a creator, find their creator profile and redirect to mentor page
                                                if (isCreatorAccount) {
                                                    const userCreator = creators.find(c => c.userId === session.user?.id)
                                                    if (userCreator) {
                                                        router.push(`/${locale}/mentors/${userCreator.id}`)
                                                    }
                                                }
                                            } else {
                                                router.push(`/${locale}/auth/login`)
                                            }
                                        }}
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-full hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                        <span className="text-lg font-bold">{isArabic ? 'الملف الشخصي' : 'Profile'}</span>
                                        <DynamicIcon name="Crown" className="w-4 h-4 text-yellow-500" />
                                    </button>
                                )}

                                {/* Divider */}
                                <div className="h-[0.5px] bg-white/10 my-4" />

                                {/* Become Creator Button - Only show for non-creators */}
                                {session && !isCreatorAccount && (
                                    <Button
                                        onClick={() => router.push(`/${locale}/creator/apply`)}
                                        className="w-full bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-bold py-3 rounded-full text-lg shadow-lg transition-all"
                                    >
                                        {isArabic ? 'كن منشئاً' : 'Become Creator'}
                                    </Button>
                                )}
                            </nav>

                            {/* User Profile Card (if logged in) */}
                            {session && (
                                <div className="mt-6 p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#0a84ff] flex items-center justify-center">
                                            <span className="text-lg font-bold text-white">
                                                {session.user?.name?.[0] || 'U'}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-foreground text-sm truncate">
                                                {session.user?.name || 'User'}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                @{session.user?.name?.toLowerCase().replace(/\s+/g, '') || 'user'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Feed - Twitter Style */}
                    <div className="lg:col-span-6 min-h-screen" style={{ borderLeft: '0.5px solid hsla(0,0%,100%,.1)', borderRight: '0.5px solid hsla(0,0%,100%,.1)' }}>
                        {/* Header */}
                        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl p-4 transition-colors" style={{ borderBottom: '0.5px solid hsla(0,0%,100%,.1)' }}>
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="lg:hidden mr-4 p-2 hover:bg-white/5 rounded-full transition-colors inline-flex items-center justify-center"
                            >
                                <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <h2 className="text-2xl font-black text-foreground inline-block">
                                {activeView === 'feed' && (isArabic ? 'الأخبار' : 'Feed')}
                                {activeView === 'subscriptions' && (isArabic ? 'اشتراكاتي' : 'My Subscriptions')}
                                {activeView === 'bookmarks' && (isArabic ? 'المحفوظات' : 'Bookmarks')}
                                {activeView === 'creators' && (isArabic ? 'جميع المبدعين' : 'All Creators')}
                            </h2>


                        </div>

                        {/* Feed Posts */}
                        <div>
                            {/* Show skeleton loading while posts are being fetched */}
                            {activeView === 'feed' && loadingPosts && (
                                <>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <PostSkeleton key={i} />
                                    ))}
                                </>
                            )}
                            
                            {/* Show empty state only when not loading and no posts */}
                            {activeView === 'feed' && !loadingPosts && posts.length === 0 && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📱</div>
                                    <h3 className="text-xl font-bold mb-2">{isArabic ? 'لا توجد منشورات بعد' : 'No posts yet'}</h3>
                                    <p className="text-muted-foreground">
                                        {isArabic ? 'سيظهر المحتوى هنا عندما ينشر المبدعون' : 'Content will appear here when creators publish'}
                                    </p>
                                </div>
                            )}
                            
                            {/* Real Posts from Database */}
                            {activeView === 'feed' && !loadingPosts && posts.length > 0 && posts.map((post: any, i: number) => (
                                        <div
                                            key={post.id}
                                            className="p-4 hover:bg-white/[0.02] transition-colors animate-fade-in"
                                            style={{ animationDelay: `${i * 50}ms`, borderBottom: i < posts.length - 1 ? '0.5px solid hsla(0,0%,100%,.1)' : 'none' }}
                                        >
                                            <div className="flex gap-3">
                                                {/* Profile Image */}
                                                <div className="flex-shrink-0 cursor-pointer" onClick={() => handleCreatorClick(post.channel.creator.id)}>
                                                    {post.channel.creator.user.profileImage ? (
                                                        <Image
                                                            src={post.channel.creator.user.profileImage}
                                                            alt={post.channel.creator.user.name}
                                                            width={48} height={48} className="rounded-full object-cover w-12 h-12"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                            <span className="text-xl font-bold text-foreground">
                                                                {post.channel.creator.user.name[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Post Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Header */}
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span 
                                                            className="font-bold text-foreground hover:underline cursor-pointer"
                                                            onClick={() => handleCreatorClick(post.channel.creator.id)}
                                                        >
                                                    {isArabic && post.channel.creator.user.arabicName
                                                        ? post.channel.creator.user.arabicName
                                                        : post.channel.creator.user.name}
                                                </span>
                                                <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-500 fill-purple-500" />
                                                <span className="text-muted-foreground text-sm">
                                                    @{post.channel.creator.user.name.toLowerCase().replace(/\s+/g, '')}
                                                </span>
                                                <span className="text-muted-foreground text-sm">·</span>
                                                <span className="text-muted-foreground text-sm">
                                                    {new Date(post.publishedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>

                                            {/* Post Text */}
                                            <div 
                                                className="text-foreground mb-3 cursor-pointer hover:bg-card-hover -mx-2 px-2 py-1 rounded transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(`/${locale}/posts/${post.id}`)
                                                }}
                                            >
                                                {post.title && (
                                                    <h3 className="font-bold mb-2">
                                                        {isArabic && post.titleAr ? post.titleAr : post.title}
                                                    </h3>
                                                )}
                                                <p className="whitespace-pre-wrap">
                                                    {isArabic && post.contentAr ? post.contentAr : post.content}
                                                </p>

                                                {/* Media Preview */}
                                                {post.type === 'IMAGE' && (post.thumbnailUrl || post.mediaUrl) && (
                                                    <div className="relative rounded-2xl overflow-hidden border border-border mt-3">
                                                        <img
                                                            src={post.thumbnailUrl || post.mediaUrl}
                                                            alt="Post media"
                                                            className="w-full object-cover max-h-[500px]"
                                                            onError={(e) => {
                                                                console.log('Image failed to load:', post.thumbnailUrl || post.mediaUrl)
                                                                e.currentTarget.style.display = 'none'
                                                            }}
                                                        />
                                                    </div>
                                                )}

                                                {/* VIDEO Post - Debug */}
                                                {console.log('Checking VIDEO for post:', post.id, 'Type:', post.type, 'Is VIDEO?:', post.type === 'VIDEO')}
                                                {post.type === 'VIDEO' && (
                                                    <div className="relative rounded-2xl overflow-hidden border border-border mt-3 bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                                                        
                                                        <div className="aspect-video relative">
                                                            {/* Only show thumbnail if it's an actual image file, not a video file */}
                                                            {post.thumbnailUrl && post.thumbnailUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ? (
                                                                <img
                                                                    src={post.thumbnailUrl}
                                                                    alt="Video thumbnail"
                                                                    className="absolute inset-0 w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none'
                                                                    }}
                                                                />
                                                            ) : null}
                                                            {/* Placeholder for when no valid image thumbnail (show for videos without thumbnails) */}
                                                            <div className={`video-placeholder absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center ${post.thumbnailUrl && post.thumbnailUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ? 'hidden' : 'flex'}`}>
                                                                <DynamicIcon name="Video" className="w-20 h-20 text-purple-400" />
                                                            </div>
                                                            {/* Play button overlay */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-black/80 transition-all">
                                                                    <DynamicIcon name="Play" className="w-10 h-10 text-white ml-1" fill="white" />
                                                                </div>
                                                            </div>
                                                            {post.duration && (
                                                                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded">
                                                                    {Math.floor(post.duration / 60)}:{String(post.duration % 60).padStart(2, '0')}
                                                                </div>
                                                            )}
                                                            {/* Video type badge */}
                                                            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                                                <DynamicIcon name="Video" className="w-3 h-3" />
                                                                VIDEO
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Engagement Stats */}
                                            <div className="flex items-center justify-between text-muted-foreground text-sm">
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(`/${locale}/posts/${post.id}`)
                                                    }}
                                                    className="flex items-center gap-2 hover:text-purple-400 transition-colors group"
                                                >
                                                    <div className="p-2 rounded-full group-hover:bg-purple-500/10">
                                                        <DynamicIcon name="MessageCircle" className="w-4 h-4" />
                                                    </div>
                                                    <span>{post._count?.comments || 0}</span>
                                                </button>

                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toast.success(isArabic ? 'تم إعادة النشر!' : 'Reposted!')
                                                    }}
                                                    className="flex items-center gap-2 hover:text-green-400 transition-colors group"
                                                >
                                                    <div className="p-2 rounded-full group-hover:bg-green-500/10">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    </div>
                                                    <span>{post._count?.reposts || 0}</span>
                                                </button>

                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        const target = e.currentTarget
                                                        target.classList.toggle('text-pink-500')
                                                        const icon = target.querySelector('.heart-icon')
                                                        icon?.classList.toggle('fill-pink-500')
                                                    }}
                                                    className="flex items-center gap-2 hover:text-pink-400 transition-colors group"
                                                >
                                                    <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                                                        <DynamicIcon name="Heart" className="w-4 h-4 heart-icon transition-all" />
                                                    </div>
                                                    <span>{post._count?.likes || 0}</span>
                                                </button>

                                                <button 
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        await handleBookmark(post.id)
                                                    }}
                                                    className={`flex items-center gap-2 transition-colors group ${
                                                        bookmarkedPostIds.includes(post.id) 
                                                            ? 'text-blue-500' 
                                                            : 'hover:text-blue-400'
                                                    }`}
                                                >
                                                    <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                                                        <DynamicIcon 
                                                            name="Bookmark" 
                                                            className={`w-4 h-4 transition-all ${
                                                                bookmarkedPostIds.includes(post.id) 
                                                                    ? 'fill-blue-500' 
                                                                    : ''
                                                            }`} 
                                                        />
                                                    </div>
                                                </button>

                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toast.success(isArabic ? 'تم النسخ!' : 'Link copied!')
                                                    }}
                                                    className="flex items-center gap-2 hover:text-purple-400 transition-colors group"
                                                >
                                                    <div className="p-2 rounded-full group-hover:bg-purple-500/10">
                                                        <DynamicIcon name="Share2" className="w-4 h-4" />
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Subscriptions Management View */}
                            {activeView === 'subscriptions' && (
                                session ? (
                                    <div className="p-6">
                                        {/* Active Subscriptions Header */}
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-black text-foreground mb-2">
                                                {isArabic ? 'اشتراكاتي النشطة' : 'Active Subscriptions'}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {isArabic ? 'إدارة اشتراكاتك في المنشئين' : 'Manage your creator memberships'}
                                            </p>
                                        </div>

                                        {/* Active Subscriptions List */}
                                        <div className="space-y-4 mb-8">
                                            {creators.slice(0, 3).map((creator, i) => {
                                                const tiers = ['Basic', 'Premium', 'VIP']
                                                const tier = tiers[i % 3]
                                                const prices = {
                                                    Basic: creator.basicMonthlyPrice,
                                                    Premium: creator.premiumMonthlyPrice,
                                                    VIP: creator.vipMonthlyPrice
                                                }
                                                const benefits = {
                                                    Basic: ['Access to all posts', 'Weekly updates', 'Community access'],
                                                    Premium: ['Everything in Basic', 'Monthly Q&A sessions', 'Priority support', 'Exclusive resources'],
                                                    VIP: ['Everything in Premium', '1-on-1 coaching sessions', 'Direct messaging', 'Custom content requests']
                                                }
                                                
                                                return (
                                                    <motion.div
                                                        key={`sub-${creator.id}`}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="bg-white/[0.02] border border-border rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all"
                                                    >
                                                        {/* Header */}
                                                        <div className="p-6 border-b border-border">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    {creator.user.profileImage ? (
                                                                        <Image
                                                                            src={creator.user.profileImage}
                                                                            alt={creator.user.name}
                                                                            width={64}
                                                                            height={64}
                                                                            className="rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                                            <span className="text-2xl font-bold text-foreground">{creator.user.name[0]}</span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <h4 className="text-xl font-bold text-foreground">{creator.user.name}</h4>
                                                                            <DynamicIcon name="CheckCircle" className="w-5 h-5 text-purple-500 fill-purple-500" />
                                                                            <DynamicIcon name="Crown" className="w-5 h-5 text-yellow-500" />
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground">{creator.expertise}</p>
                                                                        <div className="flex items-center gap-2 mt-2">
                                                                            <Badge className={`${
                                                                                tier === 'VIP' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                                                                tier === 'Premium' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                                                                'bg-gradient-to-r from-gray-500 to-gray-600'
                                                                            } text-foreground border-0`}>
                                                                                {tier} Member
                                                                            </Badge>
                                                                            <span className="text-xs text-green-400 flex items-center gap-1">
                                                                                <div className="w-2 h-2 bg-green-400 rounded-full" />
                                                                                Active
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleCreatorClick(creator.id)
                                                                    }}
                                                                    className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
                                                                >
                                                                    {isArabic ? 'عرض القناة' : 'View Channel'} →
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Subscription Details */}
                                                        <div className="p-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                                {/* Billing Info */}
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                                                                        {isArabic ? 'الفوترة' : 'Billing'}
                                                                    </h5>
                                                                    <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                                        {prices[tier as keyof typeof prices]} EGP
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {isArabic ? 'شهرياً' : 'per month'}
                                                                    </p>
                                                                </div>

                                                                {/* Next Billing */}
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                                                                        {isArabic ? 'الفاتورة القادمة' : 'Next Billing'}
                                                                    </h5>
                                                                    <p className="text-lg font-bold text-foreground">
                                                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {isArabic ? 'تجديد تلقائي' : 'Auto-renews'}
                                                                    </p>
                                                                </div>

                                                                {/* Member Since */}
                                                                <div>
                                                                    <h5 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                                                                        {isArabic ? 'عضو منذ' : 'Member Since'}
                                                                    </h5>
                                                                    <p className="text-lg font-bold text-foreground">
                                                                        {new Date(Date.now() - (i + 1) * 90 * 24 * 60 * 60 * 1000).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                            month: 'short',
                                                                            year: 'numeric'
                                                                        })}
                                                                    </p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {Math.floor((i + 1) * 3)} {isArabic ? 'أشهر' : 'months'}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Benefits */}
                                                            <div className="mb-6">
                                                                <h5 className="text-sm font-bold text-foreground mb-3">
                                                                    {isArabic ? 'المزايا المتضمنة' : 'Your Benefits'}
                                                                </h5>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {benefits[tier as keyof typeof benefits].map((benefit, idx) => (
                                                                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                            <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                                                            <span>{benefit}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                {tier !== 'VIP' && (
                                                                    <Button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            toast.success(isArabic ? 'جاري الترقية...' : 'Upgrading...')
                                                                        }}
                                                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-foreground font-bold px-6 py-2 rounded-full"
                                                                    >
                                                                        <DynamicIcon name="Crown" className="w-4 h-4 mr-2" />
                                                                        {isArabic ? 'الترقية' : 'Upgrade Tier'}
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleCreatorClick(creator.id)
                                                                    }}
                                                                    className="bg-white/10 hover:bg-white/20 text-foreground font-semibold px-6 py-2 rounded-full"
                                                                >
                                                                    {isArabic ? 'عرض القناة' : 'View Channel'}
                                                                </Button>
                                                                <Button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        toast.error(isArabic ? 'هل أنت متأكد؟' : 'Are you sure?')
                                                                    }}
                                                                    className="bg-transparent hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-red-500/30 font-semibold px-6 py-2 rounded-full"
                                                                >
                                                                    {isArabic ? 'إلغاء الاشتراك' : 'Cancel'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )
                                            })}
                                        </div>

                                        {/* Subscription Stats */}
                                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 mb-8">
                                            <h4 className="text-lg font-bold text-foreground mb-4">
                                                {isArabic ? 'إحصائيات الاشتراك' : 'Subscription Overview'}
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="text-center">
                                                    <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                                        3
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {isArabic ? 'اشتراكات نشطة' : 'Active Subs'}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                                        347 EGP
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {isArabic ? 'شهرياً' : 'Monthly Cost'}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                                        6
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {isArabic ? 'متوسط الأشهر' : 'Avg Months'}
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                                        156
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {isArabic ? 'منشورات جديدة' : 'New Posts'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Discover More Creators */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-foreground">
                                                    {isArabic ? 'اكتشف المزيد' : 'Discover More Creators'}
                                                </h4>
                                                <button
                                                    onClick={() => setActiveView('creators')}
                                                    className="text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                                                >
                                                    {isArabic ? 'عرض الكل' : 'View All'} →
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {creators.slice(3, 7).map((creator, idx) => (
                                                    <motion.div
                                                        key={creator.id}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        onClick={() => handleCreatorClick(creator.id)}
                                                        className="bg-white/[0.02] border border-border rounded-2xl p-4 hover:border-purple-500/50 transition-all cursor-pointer group"
                                                    >
                                                        <div className="flex items-center gap-3 mb-3">
                                                            {creator.user.profileImage ? (
                                                                <Image
                                                                    src={creator.user.profileImage}
                                                                    alt={creator.user.name}
                                                                    width={48} height={48} className="rounded-full object-cover w-12 h-12"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                                    <span className="text-lg font-bold text-foreground">{creator.user.name[0]}</span>
                                                                </div>
                                                            )}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-1">
                                                                    <h5 className="font-bold text-foreground group-hover:text-purple-400 transition-colors">{creator.user.name}</h5>
                                                                    {creator.stats.averageRating >= 4.5 && (
                                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-500 fill-purple-500" />
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">{creator.expertise}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-muted-foreground">
                                                                {(creator.totalSubscribers / 1000).toFixed(1)}K subscribers
                                                            </span>
                                                            <span className="text-sm font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                                {creator.basicMonthlyPrice} EGP/mo
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <DynamicIcon name="Crown" className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-foreground mb-2">
                                            {isArabic ? 'لا توجد اشتراكات' : 'No Subscriptions'}
                                        </h3>
                                        <p className="text-muted-foreground mb-6">
                                            {isArabic ? 'سجل الدخول لرؤية اشتراكاتك' : 'Sign in to see your subscriptions'}
                                        </p>
                                        <Button
                                            onClick={() => router.push(`/${locale}/auth/login`)}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-foreground font-bold px-6 py-3 rounded-full"
                                        >
                                            {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                                        </Button>
                                    </div>
                                )
                            )}

                            {/* Bookmarks View */}
                            {activeView === 'bookmarks' && (
                                session ? (
                                    <div className="p-6">
                                        {/* Header */}
                                        <div className="mb-6">
                                            <h3 className="text-2xl font-black text-foreground mb-2">
                                                {isArabic ? 'المحفوظات' : 'Bookmarks'}
                                            </h3>
                                            <p className="text-muted-foreground">
                                                {isArabic ? 'المنشورات المحفوظة' : 'Your saved posts'}
                                            </p>
                                        </div>

                                        {/* Bookmarks List */}
                                        {bookmarks.length === 0 ? (
                                            <div className="text-center py-12">
                                                <DynamicIcon name="Bookmark" className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-xl font-bold text-foreground mb-2">
                                                    {isArabic ? 'لا توجد محفوظات' : 'No Bookmarks'}
                                                </h3>
                                                <p className="text-muted-foreground mb-6">
                                                    {isArabic ? 'احفظ المنشورات المفضلة لديك لرؤيتها هنا' : 'Save your favorite posts to see them here'}
                                                </p>
                                                <Button
                                                    onClick={() => setActiveView('feed')}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-foreground font-bold px-6 py-3 rounded-full"
                                                >
                                                    {isArabic ? 'تصفح المنشورات' : 'Browse Posts'}
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Show bookmarked posts */}
                                                {bookmarks.map((post: any, i: number) => (
                                                    <motion.div
                                                        key={`bookmark-${post.id}`}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="p-4 bg-white/[0.02] border border-border rounded-xl hover:border-purple-500/50 transition-all"
                                                    >
                                                        <div className="flex gap-3">
                                                            {/* Profile Image */}
                                                            <div className="flex-shrink-0 cursor-pointer" onClick={() => handleCreatorClick(post.channel.creator.id)}>
                                                                {post.channel.creator.user.profileImage ? (
                                                                    <Image
                                                                        src={post.channel.creator.user.profileImage}
                                                                        alt={post.channel.creator.user.name}
                                                                        width={48} height={48} className="rounded-full object-cover w-12 h-12"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                                        <span className="text-xl font-bold text-foreground">
                                                                            {post.channel.creator.user.name[0]}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Post Content */}
                                                            <div className="flex-1 min-w-0">
                                                                {/* Header */}
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span 
                                                                        className="font-bold text-foreground hover:text-purple-400 transition-colors cursor-pointer"
                                                                        onClick={() => handleCreatorClick(post.channel.creator.id)}
                                                                    >
                                                                        {post.channel.creator.user.name}
                                                                    </span>
                                                                    <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-500 fill-purple-500" />
                                                                    <span className="text-muted-foreground text-sm">•</span>
                                                                    <span className="text-muted-foreground text-sm">
                                                                        {new Date(post.publishedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                            month: 'short',
                                                                            day: 'numeric'
                                                                        })}
                                                                    </span>
                                                                    {post.bookmarkedAt && (
                                                                        <>
                                                                            <span className="text-muted-foreground text-sm">•</span>
                                                                            <span className="text-blue-400 text-xs">
                                                                                {isArabic ? 'محفوظ' : 'Bookmarked'} {new Date(post.bookmarkedAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                })}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* Content */}
                                                                <div className="mb-3">
                                                                    {post.title && (
                                                                        <h3 className="font-bold text-foreground mb-2">{post.title}</h3>
                                                                    )}
                                                                    <p className="text-foreground break-words">{post.content}</p>
                                                                </div>

                                                                {/* Media */}
                                                                {post.mediaUrl && (
                                                                    <div className="mb-3 rounded-xl overflow-hidden border border-border">
                                                                        {post.mediaType?.startsWith('image/') ? (
                                                                            <Image
                                                                                src={post.mediaUrl}
                                                                                alt="Post media"
                                                                                width={500}
                                                                                height={300}
                                                                                className="w-full max-h-96 object-cover"
                                                                            />
                                                                        ) : post.mediaType?.startsWith('video/') ? (
                                                                            <video 
                                                                                className="w-full max-h-96 object-cover" 
                                                                                controls 
                                                                                src={post.mediaUrl}
                                                                            />
                                                                        ) : null}
                                                                    </div>
                                                                )}

                                                                {/* Actions */}
                                                                <div className="flex items-center justify-between text-muted-foreground text-sm">
                                                                    <div className="flex items-center gap-6">
                                                                        <button className="flex items-center gap-2 hover:text-pink-400 transition-colors group">
                                                                            <div className="p-2 rounded-full group-hover:bg-pink-500/10">
                                                                                <DynamicIcon name="Heart" className="w-4 h-4" />
                                                                            </div>
                                                                            <span>{post._count?.likes || 0}</span>
                                                                        </button>

                                                                        <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group">
                                                                            <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                                                                                <DynamicIcon name="MessageCircle" className="w-4 h-4" />
                                                                            </div>
                                                                            <span>{post._count?.comments || 0}</span>
                                                                        </button>

                                                                        <button 
                                                                            onClick={async (e) => {
                                                                                e.stopPropagation()
                                                                                // Remove bookmark
                                                                                await handleBookmark(post.id)
                                                                            }}
                                                                            className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors group"
                                                                        >
                                                                            <div className="p-2 rounded-full group-hover:bg-blue-500/10">
                                                                                <DynamicIcon name="Bookmark" className="w-4 h-4 fill-blue-500" />
                                                                            </div>
                                                                            <span className="text-xs">{isArabic ? 'محفوظ' : 'Saved'}</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-12 text-center">
                                        <DynamicIcon name="Bookmark" className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-foreground mb-2">
                                            {isArabic ? 'لا توجد محفوظات' : 'No Bookmarks'}
                                        </h3>
                                        <p className="text-muted-foreground mb-6">
                                            {isArabic ? 'سجل الدخول لرؤية المحفوظات' : 'Sign in to see your bookmarks'}
                                        </p>
                                        <Button
                                            onClick={() => router.push(`/${locale}/auth/login`)}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-foreground font-bold px-6 py-3 rounded-full"
                                        >
                                            {isArabic ? 'تسجيل الدخول' : 'Sign In'}
                                        </Button>
                                    </div>
                                )
                            )}

                            {/* Creators Grid View */}
                            {activeView === 'creators' && (
                                <div className="p-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {creators.map((creator, idx) => (
                                            <div
                                                key={creator.id}
                                                onClick={() => handleCreatorClick(creator.id)}
                                                className="bg-card border border-border rounded-2xl p-4 hover:border-purple-500/50 transition-all cursor-pointer group animate-fade-in"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="relative">
                                                        {creator.user.profileImage ? (
                                                            <Image
                                                                src={creator.user.profileImage}
                                                                alt={creator.user.name}
                                                                width={56} height={56} className="rounded-full object-cover w-14 h-14"
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                                <span className="text-xl font-bold text-foreground">{creator.user.name[0]}</span>
                                                            </div>
                                                        )}
                                                        {creator.isOnline && (
                                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-1">
                                                            <h3 className="font-bold text-foreground group-hover:text-purple-400 transition-colors">{creator.user.name}</h3>
                                                            {creator.stats.averageRating >= 4.5 && (
                                                                <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-500 fill-purple-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">{creator.expertise}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-sm mb-3">
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <DynamicIcon name="Users" className="w-4 h-4" />
                                                        {(creator.totalSubscribers / 1000).toFixed(1)}K
                                                    </span>
                                                    <span className="text-muted-foreground flex items-center gap-1">
                                                        <DynamicIcon name="Star" className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        {creator.stats.averageRating.toFixed(1)}
                                                    </span>
                                                    <span className="font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                        {creator.basicMonthlyPrice} EGP/mo
                                                    </span>
                                                </div>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleSubscribeClick(creator)
                                                    }}
                                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 rounded-full"
                                                >
                                                    <DynamicIcon name="Crown" className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'اشترك' : 'Subscribe'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Profile View - OnlyFans Style Creator Profile */}
                            {activeView === 'profile' && session && (
                                <div className="p-6">
                                    {/* Cover Image */}
                                    <div className="relative h-64 rounded-2xl overflow-visible mb-20 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-purple-600/20">
                                        <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                                        </div>
                                        
                                        {/* Profile Picture - Positioned at bottom of cover */}
                                        <div className="absolute -bottom-16 left-6 z-10">
                                            <div className="relative">
                                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                                                {selectedCreator?.user?.profileImage || (session.user as any)?.image ? (
                                                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-background">
                                                        <Image
                                                            src={selectedCreator?.user?.profileImage || (session.user as any)?.image || ''}
                                                            alt="Profile"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-background">
                                                        <span className="text-5xl font-bold text-foreground">
                                                            {selectedCreator?.user?.name?.[0] || session.user?.name?.[0] || 'U'}
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Online Status */}
                                                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-background" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Info - Below Cover */}
                                    <div className="mb-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h1 className="text-3xl font-black text-foreground">
                                                        {selectedCreator?.user?.name || session.user?.name || 'Your Name'}
                                                    </h1>
                                                    <DynamicIcon name="CheckCircle" className="w-6 h-6 text-purple-500 fill-purple-500" />
                                                    <DynamicIcon name="Crown" className="w-6 h-6 text-yellow-500" />
                                                </div>
                                                <p className="text-muted-foreground mb-3">
                                                    @{(selectedCreator?.user?.name || session.user?.name)?.toLowerCase().replace(/\s+/g, '') || 'username'}
                                                </p>
                                                <div className="flex items-center gap-6 text-sm mb-4">
                                                    <div>
                                                        <span className="font-bold text-foreground">{creatorPosts.length || 0}</span>
                                                        <span className="text-muted-foreground ml-1">{isArabic ? 'منشور' : 'Posts'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-foreground">
                                                            {selectedCreator?.totalSubscribers || 0}
                                                        </span>
                                                        <span className="text-muted-foreground ml-1">{isArabic ? 'مشترك' : 'Subscribers'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-foreground">
                                                            {creatorPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0)}
                                                        </span>
                                                        <span className="text-muted-foreground ml-1">{isArabic ? 'إعجاب' : 'Likes'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                {/* Show edit/upload buttons only for own profile */}
                                                {selectedCreator && session && selectedCreator.userId === session.user?.id ? (
                                                    <>
                                                        <Button
                                                            onClick={() => setEditProfileModalOpen(true)}
                                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-foreground font-bold px-6 py-2 rounded-full"
                                                        >
                                                            {isArabic ? 'تعديل الملف' : 'Edit Profile'}
                                                        </Button>
                                                        <Button
                                                            onClick={() => setUploadModalOpen(true)}
                                                            className="bg-card hover:bg-card-hover text-foreground font-semibold px-6 py-2 rounded-full border border-border"
                                                        >
                                                            <DynamicIcon name="Upload" className="w-4 h-4 mr-2" />
                                                            {isArabic ? 'رفع محتوى' : 'Upload'}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    /* Show subscribe/message buttons for other creators */
                                                    selectedCreator && (
                                                        <>
                                                            <Button
                                                                onClick={() => handleSubscribeClick(selectedCreator)}
                                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-2 rounded-full"
                                                            >
                                                                <DynamicIcon name="Crown" className="w-4 h-4 mr-2" />
                                                                {isArabic ? 'اشترك' : 'Subscribe'}
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleMessageClick(selectedCreator)}
                                                                className="bg-card hover:bg-card-hover text-foreground font-semibold px-6 py-2 rounded-full border border-border"
                                                            >
                                                                <DynamicIcon name="MessageCircle" className="w-4 h-4 mr-2" />
                                                                {isArabic ? 'رسالة' : 'Message'}
                                                            </Button>
                                                        </>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                                        <p className="text-foreground mb-4">
                                            {selectedCreator?.user?.bio || session.user?.name 
                                                ? `Welcome to ${(selectedCreator?.user?.name || session.user?.name)}'s exclusive content! 🔥`
                                                : 'Welcome to my exclusive content! 🔥 Subscribe for premium educational content, 1-on-1 coaching, and behind-the-scenes access.'}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedCreator?.expertise && (
                                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                    {selectedCreator.expertise}
                                                </Badge>
                                            )}
                                            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
                                                Content Creator
                                            </Badge>
                                            {isCreatorAccount && (
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                    Mentor
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Subscription Tiers */}
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-black text-foreground mb-4">
                                            {isArabic ? 'خطط الاشتراك' : 'Subscription Tiers'}
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Basic Tier */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/30 rounded-2xl p-6 hover:border-gray-400 transition-all"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                                        <DynamicIcon name="Users" className="w-5 h-5 text-foreground" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-foreground">{isArabic ? 'أساسي' : 'Basic'}</h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            {tierSubscribers.basic} {isArabic ? 'مشترك' : 'subscribers'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <span className="text-3xl font-black bg-gradient-to-r from-gray-400 to-gray-500 bg-clip-text text-transparent">
                                                        {selectedCreator?.basicMonthlyPrice || 49} EGP
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">/month</span>
                                                </div>
                                                <ul className="space-y-2 text-sm text-muted-foreground">
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-gray-400" />
                                                        All posts & updates
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-gray-400" />
                                                        Community access
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-gray-400" />
                                                        Weekly live sessions
                                                    </li>
                                                </ul>
                                            </motion.div>

                                            {/* Premium Tier */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.1 }}
                                                className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 rounded-2xl p-6 hover:border-purple-400 transition-all relative"
                                            >
                                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-foreground text-xs font-bold px-3 py-1 rounded-full">
                                                    POPULAR
                                                </div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                        <DynamicIcon name="Sparkles" className="w-5 h-5 text-foreground" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-foreground">{isArabic ? 'مميز' : 'Premium'}</h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            {tierSubscribers.premium} {isArabic ? 'مشترك' : 'subscribers'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <span className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                        {selectedCreator?.premiumMonthlyPrice || 99} EGP
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">/month</span>
                                                </div>
                                                <ul className="space-y-2 text-sm text-muted-foreground">
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-400" />
                                                        Everything in Basic
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-400" />
                                                        Exclusive content
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-400" />
                                                        Monthly Q&A
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-purple-400" />
                                                        Priority support
                                                    </li>
                                                </ul>
                                            </motion.div>

                                            {/* VIP Tier */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-400 transition-all"
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                                        <DynamicIcon name="Crown" className="w-5 h-5 text-foreground" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-foreground">{isArabic ? 'VIP' : 'VIP'}</h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            {tierSubscribers.vip} {isArabic ? 'مشترك' : 'subscribers'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mb-4">
                                                    <span className="text-3xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                                        {selectedCreator?.vipMonthlyPrice || 199} EGP
                                                    </span>
                                                    <span className="text-muted-foreground text-sm">/month</span>
                                                </div>
                                                <ul className="space-y-2 text-sm text-muted-foreground">
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-yellow-400" />
                                                        Everything in Premium
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-yellow-400" />
                                                        1-on-1 coaching
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-yellow-400" />
                                                        Direct messaging
                                                    </li>
                                                    <li className="flex items-center gap-2">
                                                        <DynamicIcon name="CheckCircle" className="w-4 h-4 text-yellow-400" />
                                                        Custom requests
                                                    </li>
                                                </ul>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Earnings Overview (Creator Stats) */}
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-black text-foreground mb-4">
                                            {isArabic ? 'نظرة عامة على الأرباح' : 'Earnings Overview'}
                                        </h2>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-card border border-border rounded-2xl p-6">
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    {isArabic ? 'هذا الشهر' : 'This Month'}
                                                </div>
                                                <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                                                    {creatorStats?.earnings?.thisMonth?.toLocaleString() || '0'}
                                                </div>
                                                <div className="text-xs text-green-400">
                                                    {creatorStats?.earnings?.percentChange 
                                                        ? `${creatorStats.earnings.percentChange > 0 ? '+' : ''}${creatorStats.earnings.percentChange}% vs last month`
                                                        : 'No data'}
                                                </div>
                                            </div>
                                            <div className="bg-card border border-border rounded-2xl p-6">
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    {isArabic ? 'الشهر الماضي' : 'Last Month'}
                                                </div>
                                                <div className="text-3xl font-black text-foreground mb-1">
                                                    {creatorStats?.earnings?.lastMonth?.toLocaleString() || '0'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">EGP</div>
                                            </div>
                                            <div className="bg-card border border-border rounded-2xl p-6">
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    {isArabic ? 'الإجمالي' : 'Total Earned'}
                                                </div>
                                                <div className="text-3xl font-black text-foreground mb-1">
                                                    {(selectedCreator as any)?.totalEarnings 
                                                        ? ((selectedCreator as any).totalEarnings / 1000).toFixed(1) + 'K'
                                                        : '0'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">EGP</div>
                                            </div>
                                            <div className="bg-card border border-border rounded-2xl p-6">
                                                <div className="text-sm text-muted-foreground mb-2">
                                                    {isArabic ? 'معلق' : 'Pending'}
                                                </div>
                                                <div className="text-3xl font-black text-foreground mb-1">
                                                    {creatorStats?.earnings?.pending?.toLocaleString() || '0'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">EGP</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground mb-4">
                                            {isArabic ? 'النشاط الأخير' : 'Recent Activity'}
                                        </h2>
                                        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                                            {creatorStats?.recentActivity && creatorStats.recentActivity.length > 0 ? (
                                                creatorStats.recentActivity.slice(0, 5).map((activity: any, index: number) => (
                                                    <div key={index} className="p-4 flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                            activity.type === 'new_subscription' 
                                                                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                                                                : activity.type === 'withdrawal'
                                                                ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                                                                : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
                                                        }`}>
                                                            {activity.type === 'new_subscription' ? (
                                                                <DynamicIcon name="Crown" className={`w-6 h-6 ${
                                                                    activity.tier === 'VIP' ? 'text-yellow-400' :
                                                                    activity.tier === 'PREMIUM' ? 'text-purple-400' :
                                                                    'text-gray-400'
                                                                }`} />
                                                            ) : activity.type === 'withdrawal' ? (
                                                                <DynamicIcon name="TrendingUp" className="w-6 h-6 text-green-400" />
                                                            ) : (
                                                                <DynamicIcon name="MessageCircle" className="w-6 h-6 text-blue-400" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-foreground font-semibold">
                                                                {activity.type === 'new_subscription' 
                                                                    ? `New ${activity.tier} Subscriber`
                                                                    : activity.type === 'withdrawal'
                                                                    ? 'Withdrawal Completed'
                                                                    : 'Activity'}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {activity.user || activity.description || 'New activity'}
                                                            </p>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {new Date(activity.time).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center text-muted-foreground">
                                                    {isArabic ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Creator Dashboard - Always Visible */}
                                    <div className="mt-6">
                                        {/* Creator Dashboard Header */}
                                        <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                            {isArabic ? 'لوحة تحكم المنشئ' : 'Creator Dashboard'}
                                                        </h2>
                                                        <p className="text-muted-foreground mt-1">
                                                            {isArabic ? 'إدارة محتواك والأرباح والمشتركين' : 'Manage your content, earnings, and subscribers'}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={() => toast.success(isArabic ? 'قريباً!' : 'Coming soon!')}
                                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-foreground font-bold"
                                                    >
                                                        <DynamicIcon name="Crown" className="w-4 h-4 mr-2" />
                                                        {isArabic ? 'ترقية الحساب' : 'Upgrade Account'}
                                                    </Button>
                                                </div>
                                                {/* Quick Stats Bar */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorStats?.subscribers?.total?.toLocaleString() || tierSubscribers.basic + tierSubscribers.premium + tierSubscribers.vip}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'مشترك نشط' : 'Active Subs'}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorStats?.earnings?.thisMonth 
                                                                ? (creatorStats.earnings.thisMonth / 1000).toFixed(1) + 'K'
                                                                : '0'} EGP
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'هذا الشهر' : 'This Month'}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorStats?.content?.totalViews 
                                                                ? (creatorStats.content.totalViews / 1000).toFixed(1) + 'K'
                                                                : creatorPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0).toLocaleString()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'المشاهدات' : 'Total Views'}</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className={`text-2xl font-black ${
                                                            (creatorStats?.earnings?.percentChange || 0) >= 0 
                                                                ? 'text-green-400' 
                                                                : 'text-red-400'
                                                        }`}>
                                                            {creatorStats?.earnings?.percentChange 
                                                                ? `${creatorStats.earnings.percentChange > 0 ? '+' : ''}${creatorStats.earnings.percentChange}%`
                                                                : '+0%'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'النمو' : 'Growth'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Media Management Section - OnlyFans Style */}
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                        <DynamicIcon name="ImageIcon" className="w-5 h-5 text-purple-400" />
                                                        {isArabic ? 'إدارة المحتوى' : 'Content Management'}
                                                    </h3>
                                                    <Button
                                                        onClick={() => setUploadModalOpen(true)}
                                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold px-6 py-3 rounded-full flex items-center gap-2"
                                                    >
                                                        <DynamicIcon name="Upload" className="w-5 h-5" />
                                                        {isArabic ? 'رفع محتوى جديد' : 'Upload New Content'}
                                                    </Button>
                                                </div>

                                                {/* Content Tabs */}
                                                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                                    <div className="flex items-center border-b border-border">
                                                        <button
                                                            onClick={() => setProfileTab('posts')}
                                                            className={`flex-1 py-4 px-6 font-semibold transition-all relative ${
                                                                profileTab === 'posts'
                                                                    ? 'text-foreground bg-card-hover'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-center gap-2">
                                                                <DynamicIcon name="ImageIcon" className="w-4 h-4" />
                                                                {isArabic ? 'جميع المنشورات' : 'All Posts'} ({creatorPosts.length})
                                                            </div>
                                                            {profileTab === 'posts' && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setProfileTab('media')}
                                                            className={`flex-1 py-4 px-6 font-semibold transition-all relative ${
                                                                profileTab === 'media'
                                                                    ? 'text-foreground bg-card-hover'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-center gap-2">
                                                                <DynamicIcon name="Film" className="w-4 h-4" />
                                                                {isArabic ? 'صور' : 'Photos'} ({creatorPosts.filter(p => p.type === 'IMAGE').length})
                                                            </div>
                                                            {profileTab === 'media' && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setProfileTab('videos')}
                                                            className={`flex-1 py-4 px-6 font-semibold transition-all relative ${
                                                                profileTab === 'videos'
                                                                    ? 'text-foreground bg-card-hover'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-center gap-2">
                                                                <DynamicIcon name="Video" className="w-4 h-4" />
                                                                {isArabic ? 'فيديو' : 'Videos'} ({creatorPosts.filter(p => p.type === 'VIDEO').length})
                                                            </div>
                                                            {profileTab === 'videos' && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setProfileTab('calendar')}
                                                            className={`flex-1 py-4 px-6 font-semibold transition-all relative ${
                                                                profileTab === 'calendar'
                                                                    ? 'text-foreground bg-card-hover'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-center gap-2">
                                                                <DynamicIcon name="Calendar" className="w-4 h-4" />
                                                                {isArabic ? 'التقويم' : 'Calendar'}
                                                            </div>
                                                            {profileTab === 'calendar' && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setProfileTab('stats')}
                                                            className={`flex-1 py-4 px-6 font-semibold transition-all relative ${
                                                                profileTab === 'stats'
                                                                    ? 'text-foreground bg-card-hover'
                                                                    : 'text-muted-foreground hover:text-foreground'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-center gap-2">
                                                                <DynamicIcon name="BarChart3" className="w-4 h-4" />
                                                                {isArabic ? 'الإحصائيات' : 'Analytics'}
                                                            </div>
                                                            {profileTab === 'stats' && (
                                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
                                                            )}
                                                        </button>
                                                    </div>

                                                    {/* Tab Content */}
                                                    <div className="p-6">
                                                        {/* Calendar Tab */}
                                                        {profileTab === 'calendar' && (
                                                            selectedCreator?.id ? (
                                                                <>
                                                                    {console.log('Rendering ContentCalendar with creatorId:', selectedCreator.id)}
                                                                    <ContentCalendar
                                                                        isArabic={isArabic}
                                                                        creatorId={selectedCreator.id}
                                                                        onCreateNew={() => setUploadModalOpen(true)}
                                                                        onEditPost={(post) => {
                                                                            // TODO: Open edit modal with post data
                                                                            console.log('Edit post:', post)
                                                                            setUploadModalOpen(true)
                                                                        }}
                                                                    />
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="text-center py-12">
                                                                        <DynamicIcon name="Calendar" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                                                        <h3 className="text-xl font-bold mb-2 text-foreground">
                                                                            {isArabic ? 'لم يتم العثور على ملف المنشئ' : 'Creator Profile Not Found'}
                                                                        </h3>
                                                                        <p className="text-muted-foreground mb-4">
                                                                            {isArabic 
                                                                                ? 'يرجى إكمال عملية تأهيل المنشئ للوصول إلى التقويم' 
                                                                                : 'Please complete the creator onboarding process to access the calendar'}
                                                                        </p>
                                                                        <Button
                                                                            onClick={() => router.push(`/${locale}/creator-apply`)}
                                                                            className="bg-purple-600 hover:bg-purple-700"
                                                                        >
                                                                            {isArabic ? 'أصبح منشئًا' : 'Become a Creator'}
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )
                                                        )}
                                                        
                                                        {/* Posts Management */}
                                                        {profileTab === 'posts' && (
                                                            <div className="space-y-4">
                                                                {/* View Toggle */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => setMediaView('grid')}
                                                                            className={`p-2 rounded-lg transition-all ${
                                                                                mediaView === 'grid'
                                                                                    ? 'bg-purple-500 text-white'
                                                                                    : 'bg-card-hover text-muted-foreground hover:text-foreground'
                                                                            }`}
                                                                        >
                                                                            <DynamicIcon name="Grid" className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setMediaView('list')}
                                                                            className={`p-2 rounded-lg transition-all ${
                                                                                mediaView === 'list'
                                                                                    ? 'bg-purple-500 text-white'
                                                                                    : 'bg-card-hover text-muted-foreground hover:text-foreground'
                                                                            }`}
                                                                        >
                                                                            <DynamicIcon name="List" className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <Button variant="outline" size="sm">
                                                                            {isArabic ? 'فلتر' : 'Filter'}
                                                                        </Button>
                                                                        <Button variant="outline" size="sm">
                                                                            {isArabic ? 'ترتيب' : 'Sort'}
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Grid View */}
                                                                {mediaView === 'grid' && (
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                                                        {loadingCreatorPosts ? (
                                                                            Array.from({ length: 8 }).map((_, i) => (
                                                                                <div key={i} className="aspect-square bg-card-hover rounded-xl animate-pulse" />
                                                                            ))
                                                                        ) : creatorPosts.length === 0 ? (
                                                                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                                                                {isArabic ? 'لا توجد منشورات بعد' : 'No posts yet'}
                                                                            </div>
                                                                        ) : (
                                                                            creatorPosts.map((post, i) => (
                                                                            <motion.div
                                                                                key={post.id}
                                                                                initial={{ opacity: 0, scale: 0.9 }}
                                                                                animate={{ opacity: 1, scale: 1 }}
                                                                                transition={{ delay: i * 0.05 }}
                                                                                onClick={() => setSelectedPost(post)}
                                                                                className="relative aspect-square bg-card-hover rounded-xl overflow-hidden group cursor-pointer border border-border hover:border-purple-500/50"
                                                                            >
                                                                                {(post.thumbnailUrl || post.mediaUrl) ? (
                                                                                    <div className="relative w-full h-full">
                                                                                        <img
                                                                                            src={post.thumbnailUrl || post.mediaUrl}
                                                                                            alt={post.title || 'Post'}
                                                                                            className="w-full h-full object-cover"
                                                                                            onError={(e) => {
                                                                                                // If image fails to load, show fallback
                                                                                                e.currentTarget.style.display = 'none'
                                                                                                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                                                                                                if (fallback) fallback.style.display = 'flex'
                                                                                            }}
                                                                                        />
                                                                                        <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20" style={{position: 'absolute', top: 0, left: 0}}>
                                                                                            <span className="text-4xl">{post.type === 'VIDEO' ? '🎥' : post.type === 'IMAGE' ? '🖼️' : '📝'}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                                                                        <span className="text-4xl">{post.type === 'VIDEO' ? '🎥' : post.type === 'IMAGE' ? '🖼️' : '📝'}</span>
                                                                                    </div>
                                                                                )}
                                                                                {post.type === 'VIDEO' && (
                                                                                    <>
                                                                                        {/* Play button overlay */}
                                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                                            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                                                                                <DynamicIcon name="Play" className="w-8 h-8 text-black ml-1" fill="black" />
                                                                                            </div>
                                                                                        </div>
                                                                                        {/* Duration badge */}
                                                                                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-semibold">
                                                                                            {post.duration ? `${Math.floor(post.duration / 60)}:${String(post.duration % 60).padStart(2, '0')}` : 'Video'}
                                                                                        </div>
                                                                                    </>
                                                                                )}
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                                                                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                                                                        {post.title && (
                                                                                            <h4 className="text-white font-semibold text-sm mb-2 line-clamp-1">
                                                                                                {post.title}
                                                                                            </h4>
                                                                                        )}
                                                                                        <div className="flex items-center justify-between text-white text-sm mb-2">
                                                                                            <div className="flex items-center gap-3">
                                                                                                <span className="flex items-center gap-1">
                                                                                                    <DynamicIcon name="Heart" className="w-4 h-4" />
                                                                                                    {post.likeCount || 0}
                                                                                                </span>
                                                                                                <span className="flex items-center gap-1">
                                                                                                    <DynamicIcon name="MessageCircle" className="w-4 h-4" />
                                                                                                    {post.commentCount || 0}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Button 
                                                                                                size="sm" 
                                                                                                variant="outline" 
                                                                                                className="flex-1 text-xs"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    handleEditPost(post)
                                                                                                }}
                                                                                            >
                                                                                                <DynamicIcon name="Edit" className="w-3 h-3 mr-1" />
                                                                                                {isArabic ? 'تعديل' : 'Edit'}
                                                                                            </Button>
                                                                                            <Button 
                                                                                                size="sm" 
                                                                                                variant="outline" 
                                                                                                className="flex-1 text-xs text-red-400 hover:text-red-500"
                                                                                                onClick={(e) => {
                                                                                                    e.stopPropagation()
                                                                                                    handleDeletePost(post.id)
                                                                                                }}
                                                                                            >
                                                                                                <DynamicIcon name="Trash2" className="w-3 h-3 mr-1" />
                                                                                                {isArabic ? 'حذف' : 'Delete'}
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="text-white/70 text-xs mt-2">
                                                                                            {post.viewCount || 0} {isArabic ? 'مشاهدة' : 'views'}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </motion.div>
                                                                        ))
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* List View */}
                                                                {mediaView === 'list' && (
                                                                    <div className="space-y-3">
                                                                        {loadingCreatorPosts ? (
                                                                            Array.from({ length: 5 }).map((_, i) => (
                                                                                <div key={i} className="h-24 bg-card-hover rounded-xl animate-pulse" />
                                                                            ))
                                                                        ) : creatorPosts.length === 0 ? (
                                                                            <div className="text-center py-12 text-muted-foreground">
                                                                                {isArabic ? 'لا توجد منشورات بعد' : 'No posts yet'}
                                                                            </div>
                                                                        ) : (
                                                                            creatorPosts.map((post) => (
                                                                            <div
                                                                                key={post.id}
                                                                                onClick={() => setSelectedPost(post)}
                                                                                className="flex items-center gap-4 bg-card-hover border border-border rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer"
                                                                            >
                                                                                {post.thumbnailUrl || post.mediaUrl ? (
                                                                                    <img
                                                                                        src={post.thumbnailUrl || post.mediaUrl}
                                                                                        alt={post.title || 'Post'}
                                                                                        className="w-24 h-24 rounded-lg object-cover"
                                                                                    />
                                                                                ) : (
                                                                                    <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                                                                        <span className="text-2xl">{post.type === 'VIDEO' ? '🎥' : post.type === 'IMAGE' ? '🖼️' : '📝'}</span>
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex-1">
                                                                                    <h4 className="font-bold text-foreground mb-1">
                                                                                        {post.title || 'Untitled Post'}
                                                                                    </h4>
                                                                                    <p className="text-sm text-muted-foreground mb-2">
                                                                                        Posted {new Date(post.createdAt).toLocaleDateString()}
                                                                                    </p>
                                                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                                        <span className="flex items-center gap-1">
                                                                                            <DynamicIcon name="Heart" className="w-3 h-3" />
                                                                                            {post.likeCount || 0}
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <DynamicIcon name="MessageCircle" className="w-3 h-3" />
                                                                                            {post.commentCount || 0}
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <DynamicIcon name="Eye" className="w-3 h-3" />
                                                                                            {post.viewCount || 0}
                                                                                        </span>
                                                                                        <Badge className={
                                                                                            post.tier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-400' : 
                                                                                            post.tier === 'SILVER' ? 'bg-purple-500/20 text-purple-400' : 
                                                                                            'bg-gray-500/20 text-gray-400'
                                                                                        }>
                                                                                            {post.tier === 'GOLD' ? 'VIP' : post.tier === 'SILVER' ? 'Premium' : 'Basic'}
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col gap-2">
                                                                                    <Button 
                                                                                        size="sm" 
                                                                                        variant="outline"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            toast.success(isArabic ? 'قريباً' : 'Coming soon')
                                                                                        }}
                                                                                    >
                                                                                        <DynamicIcon name="Edit" className="w-3 h-3 mr-1" />
                                                                                        {isArabic ? 'تعديل' : 'Edit'}
                                                                                    </Button>
                                                                                    <Button 
                                                                                        size="sm" 
                                                                                        variant="outline" 
                                                                                        className="text-red-400 hover:text-red-500"
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation()
                                                                                            toast.success(isArabic ? 'قريباً' : 'Coming soon')
                                                                                        }}
                                                                                    >
                                                                                        <DynamicIcon name="Trash2" className="w-3 h-3 mr-1" />
                                                                                        {isArabic ? 'حذف' : 'Delete'}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Media Tab */}
                                                        {profileTab === 'media' && (
                                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                                {loadingCreatorPosts ? (
                                                                    Array.from({ length: 12 }).map((_, i) => (
                                                                        <div key={i} className="aspect-square bg-card-hover rounded-lg animate-pulse" />
                                                                    ))
                                                                ) : creatorPosts.filter(post => post.type === 'IMAGE' && (post.mediaUrl || post.thumbnailUrl)).length === 0 ? (
                                                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                                                        {isArabic ? 'لا توجد صور بعد' : 'No images yet'}
                                                                    </div>
                                                                ) : (
                                                                    creatorPosts
                                                                        .filter(post => post.type === 'IMAGE' && (post.mediaUrl || post.thumbnailUrl))
                                                                        .map((post) => (
                                                                        <div 
                                                                            key={post.id} 
                                                                            onClick={() => setSelectedPost(post)}
                                                                            className="relative aspect-square bg-card-hover rounded-lg overflow-hidden group cursor-pointer"
                                                                        >
                                                                            <img
                                                                                src={post.mediaUrl || post.thumbnailUrl}
                                                                                alt={post.title || 'Image'}
                                                                                className="w-full h-full object-cover"
                                                                            />
                                                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                                                                <Button size="sm" variant="outline">
                                                                                    <DynamicIcon name="Eye" className="w-4 h-4" />
                                                                                </Button>
                                                                            </div>
                                                                            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                                <div className="flex items-center gap-2 text-white text-xs">
                                                                                    <DynamicIcon name="Heart" className="w-3 h-3" />
                                                                                    {post.likeCount || 0}
                                                                                    <DynamicIcon name="Eye" className="w-3 h-3 ml-2" />
                                                                                    {post.viewCount || 0}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Videos Tab */}
                                                        {profileTab === 'videos' && (
                                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                {loadingCreatorPosts ? (
                                                                    Array.from({ length: 6 }).map((_, i) => (
                                                                        <div key={i} className="aspect-video bg-card-hover rounded-xl animate-pulse" />
                                                                    ))
                                                                ) : creatorPosts.filter(post => post.type === 'VIDEO').length === 0 ? (
                                                                    <div className="col-span-full text-center py-12 text-muted-foreground">
                                                                        {isArabic ? 'لا توجد فيديوهات بعد' : 'No videos yet'}
                                                                    </div>
                                                                ) : (
                                                                    creatorPosts
                                                                        .filter(post => post.type === 'VIDEO')
                                                                        .map((post) => (
                                                                        <div 
                                                                            key={post.id}
                                                                            onClick={() => setSelectedPost(post)}
                                                                            className="relative aspect-video bg-card-hover rounded-xl overflow-hidden group cursor-pointer border border-border"
                                                                        >
                                                                            {post.thumbnailUrl || post.mediaUrl ? (
                                                                                <img
                                                                                    src={post.thumbnailUrl || post.mediaUrl}
                                                                                    alt={post.title || 'Video'}
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                                                                    <DynamicIcon name="Video" className="w-12 h-12 text-purple-400" />
                                                                                </div>
                                                                            )}
                                                                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                                                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                                                                                    <DynamicIcon name="Play" className="w-8 h-8 text-black ml-1" fill="black" />
                                                                                </div>
                                                                            </div>
                                                                            {post.duration && (
                                                                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-semibold px-2 py-1 rounded">
                                                                                    {Math.floor(post.duration / 60)}:{String(post.duration % 60).padStart(2, '0')}
                                                                                </div>
                                                                            )}
                                                                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                                                <DynamicIcon name="Eye" className="w-3 h-3 inline mr-1" />
                                                                                {post.viewCount || 0}
                                                                            </div>
                                                                            {post.title && (
                                                                                <div className="absolute bottom-2 right-2 left-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white text-sm font-semibold px-3 py-2 opacity-0 group-hover:opacity-100 transition-all">
                                                                                    {post.title}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Analytics Tab */}
                                                        {profileTab === 'stats' && (
                                                            <div className="space-y-4">
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                                                                        <DynamicIcon name="Heart" className="w-8 h-8 text-purple-400 mb-2" />
                                                                        <div className="text-2xl font-black text-foreground">
                                                                            {creatorPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0).toLocaleString()}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'إجمالي الإعجابات' : 'Total Likes'}</div>
                                                                    </div>
                                                                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
                                                                        <DynamicIcon name="MessageCircle" className="w-8 h-8 text-blue-400 mb-2" />
                                                                        <div className="text-2xl font-black text-foreground">
                                                                            {creatorPosts.reduce((sum, post) => sum + (post.commentCount || 0), 0).toLocaleString()}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'التعليقات' : 'Comments'}</div>
                                                                    </div>
                                                                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                                                                        <DynamicIcon name="Eye" className="w-8 h-8 text-green-400 mb-2" />
                                                                        <div className="text-2xl font-black text-foreground">
                                                                            {creatorPosts.reduce((sum, post) => sum + (post.viewCount || 0), 0).toLocaleString()}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'المشاهدات' : 'Views'}</div>
                                                                    </div>
                                                                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                                                                        <DynamicIcon name="Film" className="w-8 h-8 text-yellow-400 mb-2" />
                                                                        <div className="text-2xl font-black text-foreground">
                                                                            {creatorPosts.length}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'المنشورات' : 'Posts'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Withdrawal Section - OnlyFans Style */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {isArabic ? 'الأرباح والسحب' : 'Earnings & Withdrawals'}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                    {/* Available Balance */}
                                                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <div className="text-sm text-muted-foreground mb-1">
                                                                    {isArabic ? 'الرصيد المتاح' : 'Available Balance'}
                                                                </div>
                                                                <div className="text-4xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                                                                    {creatorStats?.earnings?.available?.toLocaleString() || '0'} EGP
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    {isArabic ? 'جاهز للسحب' : 'Ready to withdraw'}
                                                                </div>
                                                            </div>
                                                            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => setWithdrawalModalOpen(true)}
                                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold"
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {isArabic ? 'سحب الأموال' : 'Withdraw Funds'}
                                                        </Button>
                                                    </div>

                                                    {/* Pending Clearance */}
                                                    <div className="bg-card border border-border rounded-2xl p-6">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div>
                                                                <div className="text-sm text-muted-foreground mb-1">
                                                                    {isArabic ? 'قيد المعالجة' : 'Pending Clearance'}
                                                                </div>
                                                                <div className="text-4xl font-black text-foreground">
                                                                    {creatorStats?.earnings?.pending?.toLocaleString() || '0'} EGP
                                                                </div>
                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                    {isArabic ? 'متاح في 3-5 أيام' : 'Available in 3-5 days'}
                                                                </div>
                                                            </div>
                                                            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Withdrawal History */}
                                                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                                    <div className="p-4 border-b border-border flex items-center justify-between">
                                                        <h4 className="font-bold text-foreground">{isArabic ? 'سجل السحب' : 'Withdrawal History'}</h4>
                                                        <button className="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                                                            {isArabic ? 'عرض الكل' : 'View All'} →
                                                        </button>
                                                    </div>
                                                    <div className="divide-y divide-border">
                                                        {creatorStats?.recentActivity && creatorStats.recentActivity.length > 0 ? (
                                                            creatorStats.recentActivity
                                                                .filter((activity: any) => activity.type === 'withdrawal')
                                                                .slice(0, 3)
                                                                .map((withdrawal: any, i: number) => (
                                                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-card-hover transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                                <span className="text-green-400 font-bold">✓</span>
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-foreground">{withdrawal.amount?.toLocaleString() || '0'} EGP</div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {new Date(withdrawal.time).toLocaleDateString()}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                                            {withdrawal.status || 'Completed'}
                                                                        </Badge>
                                                                    </div>
                                                                ))
                                                        ) : (
                                                            <div className="p-8 text-center text-muted-foreground">
                                                                {isArabic ? 'لا يوجد سجل سحب حتى الآن' : 'No withdrawal history yet'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Revenue Analytics Chart */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <DynamicIcon name="TrendingUp" className="w-5 h-5 text-purple-400" />
                                                    {isArabic ? 'تحليلات الإيرادات' : 'Revenue Analytics'}
                                                </h3>
                                                <div className="bg-card border border-border rounded-2xl p-6">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div>
                                                            <div className="text-sm text-muted-foreground">{isArabic ? 'إجمالي الإيرادات' : 'Total Revenue'}</div>
                                                            <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                                {creatorStats?.earnings?.total?.toLocaleString() || '0'} EGP
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button size="sm" variant="outline">{isArabic ? '7 أيام' : '7D'}</Button>
                                                            <Button size="sm" variant="outline">{isArabic ? '30 يوم' : '30D'}</Button>
                                                            <Button size="sm" className="bg-purple-500/20 text-purple-400">{isArabic ? '6 شهور' : '6M'}</Button>
                                                        </div>
                                                    </div>
                                                    {/* Revenue Breakdown by Tier */}
                                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                                        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/30 rounded-xl p-4">
                                                            <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'أساسي' : 'Basic'}</div>
                                                            <div className="text-xl font-bold text-foreground">
                                                                {creatorStats?.revenue?.basicRevenue?.toLocaleString() || '0'} EGP
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {tierSubscribers.basic} {isArabic ? 'مشترك' : 'subscribers'}
                                                            </div>
                                                        </div>
                                                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                                                            <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'بريميوم' : 'Premium'}</div>
                                                            <div className="text-xl font-bold text-foreground">
                                                                {creatorStats?.revenue?.premiumRevenue?.toLocaleString() || '0'} EGP
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {tierSubscribers.premium} {isArabic ? 'مشترك' : 'subscribers'}
                                                            </div>
                                                        </div>
                                                        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-4">
                                                            <div className="text-xs text-muted-foreground mb-1">{isArabic ? 'VIP' : 'VIP'}</div>
                                                            <div className="text-xl font-bold text-foreground">
                                                                {creatorStats?.revenue?.vipRevenue?.toLocaleString() || '0'} EGP
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                {tierSubscribers.vip} {isArabic ? 'مشترك' : 'subscribers'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3">{isArabic ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                                    <Button 
                                                        onClick={() => setUploadModalOpen(true)} 
                                                        variant="outline"
                                                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all"
                                                    >
                                                        <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                        <span className="text-xs font-semibold text-foreground">{isArabic ? 'منشور جديد' : 'New Post'}</span>
                                                    </Button>
                                                    <Button 
                                                        onClick={() => toast.success(isArabic ? 'جدولة جلسة' : 'Schedule Session')} 
                                                        variant="outline"
                                                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                                                    >
                                                        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="text-xs font-semibold text-foreground">{isArabic ? 'جدولة' : 'Schedule'}</span>
                                                    </Button>
                                                    <Button 
                                                        onClick={() => toast.success(isArabic ? 'تحميل مورد' : 'Upload Resource')} 
                                                        variant="outline"
                                                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-green-500/10 hover:border-green-500/50 transition-all"
                                                    >
                                                        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        <span className="text-xs font-semibold text-foreground">{isArabic ? 'تحميل' : 'Upload'}</span>
                                                    </Button>
                                                    <Button 
                                                        onClick={() => {
                                                            setIsNavigating(true)
                                                            router.push(`/${locale}/messaging`)
                                                        }}
                                                        variant="outline"
                                                        disabled={isNavigating}
                                                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-pink-500/10 hover:border-pink-500/50 transition-all"
                                                    >
                                                        {isNavigating ? (
                                                            <DynamicIcon name="Loader2" className="w-6 h-6 text-pink-500 animate-spin" />
                                                        ) : (
                                                            <DynamicIcon name="MessageCircle" className="w-6 h-6 text-pink-500" />
                                                        )}
                                                        <span className="text-xs font-semibold text-foreground">{isArabic ? 'الرسائل' : 'Messages'}</span>
                                                    </Button>
                                                    <Button 
                                                        onClick={() => toast.success(isArabic ? 'إدارة المشتركين' : 'Manage Subscribers')} 
                                                        variant="outline"
                                                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all"
                                                    >
                                                        <DynamicIcon name="Users" className="w-6 h-6 text-yellow-500" />
                                                        <span className="text-xs font-semibold text-foreground">{isArabic ? 'المشتركون' : 'Subscribers'}</span>
                                                    </Button>
                                                    <Button 
                                                        onClick={() => setProfileTab('stats')} 
                                                        variant="outline"
                                                        className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all"
                                                    >
                                                        <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                        <span className="text-xs font-semibold text-foreground">{isArabic ? 'التحليلات' : 'Analytics'}</span>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Subscribers Breakdown */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <DynamicIcon name="Users" className="w-5 h-5 text-purple-400" />
                                                    {isArabic ? 'تحليل المشتركين' : 'Subscriber Analytics'}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/30 rounded-2xl p-6"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                                                <DynamicIcon name="Users" className="w-6 h-6 text-white" />
                                                            </div>
                                                            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Basic</Badge>
                                                        </div>
                                                        <div className="text-4xl font-black text-foreground mb-2">{tierSubscribers.basic}</div>
                                                        <div className="text-sm text-muted-foreground mb-3">{isArabic ? 'مشترك أساسي' : 'Basic subscribers'}</div>
                                                        <div className="text-sm text-foreground font-bold">
                                                            {(tierSubscribers.basic * (selectedCreator?.basicMonthlyPrice || 0)).toLocaleString()} EGP/mo
                                                        </div>
                                                    </motion.div>

                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 rounded-2xl p-6"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                                <DynamicIcon name="Sparkles" className="w-6 h-6 text-white" />
                                                            </div>
                                                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Premium</Badge>
                                                        </div>
                                                        <div className="text-4xl font-black text-foreground mb-2">{tierSubscribers.premium}</div>
                                                        <div className="text-sm text-muted-foreground mb-3">{isArabic ? 'مشترك مميز' : 'Premium subscribers'}</div>
                                                        <div className="text-sm text-foreground font-bold">
                                                            {(tierSubscribers.premium * (selectedCreator?.premiumMonthlyPrice || 0)).toLocaleString()} EGP/mo
                                                        </div>
                                                    </motion.div>

                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: 0.2 }}
                                                        className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                                                <DynamicIcon name="Crown" className="w-6 h-6 text-white" />
                                                            </div>
                                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">VIP</Badge>
                                                        </div>
                                                        <div className="text-4xl font-black text-foreground mb-2">{tierSubscribers.vip}</div>
                                                        <div className="text-sm text-muted-foreground mb-3">{isArabic ? 'مشترك VIP' : 'VIP subscribers'}</div>
                                                        <div className="text-sm text-foreground font-bold">
                                                            {(tierSubscribers.vip * (selectedCreator?.vipMonthlyPrice || 0)).toLocaleString()} EGP/mo
                                                        </div>
                                                    </motion.div>
                                                </div>

                                                {/* Subscriber Stats Grid */}
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="bg-card border border-border rounded-2xl p-4 text-center">
                                                        <div className="text-2xl font-black text-foreground">{selectedCreator?.totalSubscribers || 0}</div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'إجمالي المشتركين' : 'Total Subscribers'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content Performance */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <DynamicIcon name="Sparkles" className="w-5 h-5 text-purple-400" />
                                                    {isArabic ? 'أداء المحتوى' : 'Content Performance'}
                                                </h3>
                                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                                    <div className="bg-card border border-border rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all">
                                                        <svg className="w-8 h-8 text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                        <div className="text-2xl font-black text-foreground">{creatorStats?.content?.totalPosts || creatorPosts.length}</div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'منشورات' : 'Posts'}</div>
                                                    </div>
                                                    <div className="bg-card border border-border rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all">
                                                        <svg className="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorStats?.content?.totalViews 
                                                                ? `${(creatorStats.content.totalViews / 1000).toFixed(1)}K` 
                                                                : creatorPosts.reduce((sum, p) => sum + (p.viewCount || 0), 0)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'مشاهدات' : 'Views'}</div>
                                                    </div>
                                                    <div className="bg-card border border-border rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all">
                                                        <DynamicIcon name="Heart" className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorStats?.content?.avgLikes || Math.floor(creatorPosts.reduce((sum, p) => sum + (p.likeCount || 0), 0) / (creatorPosts.length || 1))}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'متوسط الإعجابات' : 'Avg Likes'}</div>
                                                    </div>
                                                    <div className="bg-card border border-border rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all">
                                                        <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                        </svg>
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorStats?.content?.engagementRate 
                                                                ? `${creatorStats.content.engagementRate.toFixed(1)}%` 
                                                                : '0%'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'التفاعل' : 'Engagement'}</div>
                                                    </div>
                                                    <div className="bg-card border border-border rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all">
                                                        <svg className="w-8 h-8 text-yellow-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorPosts.filter(p => p.scheduledAt && new Date(p.scheduledAt) > new Date()).length}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'مجدولة' : 'Scheduled'}</div>
                                                    </div>
                                                    <div className="bg-card border border-border rounded-2xl p-4 text-center hover:border-purple-500/50 transition-all">
                                                        <svg className="w-8 h-8 text-purple-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                                        </svg>
                                                        <div className="text-2xl font-black text-foreground">
                                                            {creatorPosts.reduce((sum, p) => sum + (p.commentCount || 0), 0)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'تعليقات' : 'Comments'}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Top Subscribers */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <DynamicIcon name="Crown" className="w-5 h-5 text-yellow-400" />
                                                    {isArabic ? 'أفضل المشتركين' : 'Top Subscribers'}
                                                </h3>
                                                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                                                    <div className="divide-y divide-border">
                                                        {creatorStats?.topSubscribers && creatorStats.topSubscribers.length > 0 ? (
                                                            creatorStats.topSubscribers.slice(0, 3).map((subscriber: any, i: number) => (
                                                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-card-hover transition-colors">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-2xl font-black text-muted-foreground">#{i + 1}</span>
                                                                    </div>
                                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                                                        <span className="text-xl font-bold text-white">{subscriber.name?.[0]?.toUpperCase() || 'U'}</span>
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <div className="font-bold text-foreground">{subscriber.name || 'Subscriber'}</div>
                                                                            {subscriber.tier === 'VIP' && <DynamicIcon name="Crown" className="w-4 h-4 text-yellow-400" />}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                            <Badge className={`${
                                                                                subscriber.tier === 'VIP' 
                                                                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                                                                                    : subscriber.tier === 'PREMIUM'
                                                                                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                                                    : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                                                            }`}>
                                                                                {subscriber.tier}
                                                                            </Badge>
                                                                            <span>• {subscriber.monthsSubscribed || 1} {isArabic ? 'شهر' : 'months'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                                                            {(subscriber.totalSpent || 0).toLocaleString()} EGP
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">{isArabic ? 'إجمالي الإنفاق' : 'Total spent'}</div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-8 text-center text-muted-foreground">
                                                                {isArabic ? 'لا يوجد مشتركون حتى الآن' : 'No subscribers yet'}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recent Subscriber Activity */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3">{isArabic ? 'نشاط المشتركين الأخير' : 'Recent Subscriber Activity'}</h3>
                                                <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                                                    {creatorStats?.recentActivity && creatorStats.recentActivity.length > 0 ? (
                                                        creatorStats.recentActivity
                                                            .filter((activity: any) => activity.type !== 'withdrawal')
                                                            .slice(0, 4)
                                                            .map((activity: any, i: number) => (
                                                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-card-hover transition-colors">
                                                                    <div className="text-2xl">
                                                                        {activity.type === 'new_subscription' && '🎉'}
                                                                        {activity.type === 'upgrade' && '⬆️'}
                                                                        {activity.type === 'renewal' && '🔄'}
                                                                        {activity.type === 'tip' && '💰'}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-foreground">
                                                                            {activity.type === 'new_subscription' && `${activity.user} subscribed`}
                                                                            {activity.type === 'upgrade' && `${activity.user} upgraded subscription`}
                                                                            {activity.type === 'renewal' && `${activity.user} renewed subscription`}
                                                                            {activity.type === 'tip' && `${activity.user} sent you ${activity.amount} EGP tip`}
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {new Date(activity.time).toLocaleDateString()} {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                    {activity.tier && (
                                                                        <Badge className={`${
                                                                            activity.tier === 'VIP' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                                            activity.tier === 'PREMIUM' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                                                                            'bg-gray-500/20 text-gray-400 border-gray-500/30'
                                                                        }`}>
                                                                            {activity.tier}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="p-8 text-center text-muted-foreground">
                                                            {isArabic ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content Calendar Preview */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {isArabic ? 'جدول المحتوى' : 'Content Calendar'}
                                                </h3>
                                                <div className="bg-card border border-border rounded-2xl p-6 text-center">
                                                    <p className="text-muted-foreground mb-4">
                                                        {isArabic ? 'عرض جدول المحتوى الكامل في علامة التبويب التقويم' : 'View full content calendar in the Calendar tab'}
                                                    </p>
                                                    <Button
                                                        onClick={() => setProfileTab('calendar')}
                                                        className="bg-purple-600 hover:bg-purple-700"
                                                    >
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {isArabic ? 'انتقل إلى التقويم' : 'Go to Calendar'}
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Goals & Milestones */}
                                            <div>
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                    </svg>
                                                    {isArabic ? 'الأهداف والإنجازات' : 'Goals & Milestones'}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {[
                                                        { title: '1,500 Subscribers', current: selectedCreator?.totalSubscribers || 0, target: 1500, color: 'purple' },
                                                        { title: '15,000 EGP/month', current: creatorStats?.earnings?.thisMonth || 0, target: 15000, color: 'green' }
                                                    ].map((goal, i) => (
                                                        <div key={i} className="bg-card border border-border rounded-2xl p-6">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="font-bold text-foreground">{goal.title}</h4>
                                                                <span className="text-sm font-bold text-muted-foreground">
                                                                    {Math.floor((goal.current / goal.target) * 100)}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-white/5 rounded-full h-3 mb-2 overflow-hidden">
                                                                <div
                                                                    className={`h-full bg-gradient-to-r ${
                                                                        goal.color === 'purple' 
                                                                            ? 'from-purple-500 to-pink-500' 
                                                                            : 'from-green-500 to-emerald-500'
                                                                    } transition-all`}
                                                                    style={{ width: `${(goal.current / goal.target) * 100}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                                <span>{goal.current.toLocaleString()}</span>
                                                                <span>{goal.target.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Member Perks & Benefits */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                                    </svg>
                                                    {isArabic ? 'المزايا والفوائد' : 'Member Perks & Benefits'}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* Basic Tier Perks */}
                                                    <div className="bg-gradient-to-br from-gray-500/5 to-gray-600/5 border border-gray-500/20 rounded-2xl p-5">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-foreground">Basic</h4>
                                                                <p className="text-xs text-muted-foreground">{selectedCreator?.basicMonthlyPrice || 49} EGP/mo</p>
                                                            </div>
                                                        </div>
                                                        <ul className="space-y-2 text-sm">
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'الوصول إلى جميع المنشورات' : 'Access to all posts'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'محتوى الأعضاء فقط' : 'Members-only content'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'مجموعة الأعضاء' : 'Community group access'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'شارة الدعم' : 'Supporter badge'}</span>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* Premium Tier Perks */}
                                                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-5 relative">
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                                                                {isArabic ? 'الأكثر شعبية' : 'Most Popular'}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 mb-4 mt-2">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                                                <DynamicIcon name="Sparkles" className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-foreground">Premium</h4>
                                                                <p className="text-xs text-muted-foreground">{selectedCreator?.premiumMonthlyPrice || 99} EGP/mo</p>
                                                            </div>
                                                        </div>
                                                        <ul className="space-y-2 text-sm">
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span className="font-semibold">{isArabic ? 'جميع مزايا Basic +' : 'All Basic perks +'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'الوصول إلى الساعات المكتبية' : 'Office hours access'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'أولوية في الأسئلة والأجوبة' : 'Priority Q&A responses'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? '5 رموز ملاحظات شهرياً' : '5 feedback tokens/month'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'شارة بريميوم' : 'Premium badge'}</span>
                                                            </li>
                                                        </ul>
                                                    </div>

                                                    {/* VIP Tier Perks */}
                                                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-5">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                                                                <DynamicIcon name="Crown" className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-foreground">VIP</h4>
                                                                <p className="text-xs text-muted-foreground">{selectedCreator?.vipMonthlyPrice || 199} EGP/mo</p>
                                                            </div>
                                                        </div>
                                                        <ul className="space-y-2 text-sm">
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span className="font-semibold">{isArabic ? 'جميع مزايا Premium +' : 'All Premium perks +'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? '1 جلسة 1:1 شهرياً' : '1 monthly 1-on-1 session'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'ملاحظات غير محدودة' : 'Unlimited feedback'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'وصول مباشر عبر الرسائل' : 'Direct messaging access'}</span>
                                                            </li>
                                                            <li className="flex items-start gap-2 text-foreground">
                                                                <svg className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                <span>{isArabic ? 'شارة VIP الحصرية' : 'Exclusive VIP badge'}</span>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Rewards & Achievements */}
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                    </svg>
                                                    {isArabic ? 'المكافآت والإنجازات' : 'Rewards & Achievements'}
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Active Contests */}
                                                    <div className="bg-card border border-border rounded-2xl p-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-bold text-foreground flex items-center gap-2">
                                                                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                                                </svg>
                                                                {isArabic ? 'المسابقات النشطة' : 'Active Contests'}
                                                            </h4>
                                                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                                                {isArabic ? '2 نشط' : '2 Active'}
                                                            </Badge>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-3">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="font-semibold text-foreground text-sm">{isArabic ? 'تحدي الإبداع' : 'Creative Challenge'}</span>
                                                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                                                                        {isArabic ? '15 يوم متبقي' : '15d left'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mb-2">{isArabic ? 'أفضل مشروع يفوز بـ 5,000 جنيه' : 'Best project wins 5,000 EGP'}</p>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <DynamicIcon name="Users" className="w-3 h-3" />
                                                                    <span className="text-muted-foreground">{isArabic ? '24 مشارك' : '24 participants'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-3">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className="font-semibold text-foreground text-sm">{isArabic ? 'مسابقة الاختبار' : 'Quiz Marathon'}</span>
                                                                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                                                                        {isArabic ? '7 أيام متبقية' : '7d left'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mb-2">{isArabic ? 'أعلى درجة تفوز بـ 3,000 جنيه' : 'Highest score wins 3,000 EGP'}</p>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <DynamicIcon name="Users" className="w-3 h-3" />
                                                                    <span className="text-muted-foreground">{isArabic ? '38 مشارك' : '38 participants'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Member Achievements */}
                                                    <div className="bg-card border border-border rounded-2xl p-5">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="font-bold text-foreground flex items-center gap-2">
                                                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                </svg>
                                                                {isArabic ? 'إنجازات الأعضاء' : 'Member Achievements'}
                                                            </h4>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-card-hover">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                                                                    <DynamicIcon name="Crown" className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-foreground text-sm">{isArabic ? 'الأعضاء المميزون' : 'Top Contributors'}</div>
                                                                    <div className="text-xs text-muted-foreground">{isArabic ? 'أكمل 10 دورات' : 'Completed 10 courses'}</div>
                                                                </div>
                                                                <div className="text-2xl">🏆</div>
                                                            </div>
                                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-card-hover">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                                                    <DynamicIcon name="Sparkles" className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-foreground text-sm">{isArabic ? 'قوة التعلم' : 'Learning Powerhouse'}</div>
                                                                    <div className="text-xs text-muted-foreground">{isArabic ? 'سلسلة 30 يوماً' : '30-day streak'}</div>
                                                                </div>
                                                                <div className="text-2xl">⚡</div>
                                                            </div>
                                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-card-hover">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                                    </svg>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-semibold text-foreground text-sm">{isArabic ? 'مساعد المجتمع' : 'Community Helper'}</div>
                                                                    <div className="text-xs text-muted-foreground">{isArabic ? 'ساعد 50 عضواً' : 'Helped 50 members'}</div>
                                                                </div>
                                                                <div className="text-2xl">🤝</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar - Who to Follow */}
                    <div className="hidden lg:block lg:col-span-3 p-4">
                        <div className="sticky top-20">
                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <DynamicIcon name="Search" className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder={isArabic ? 'بحث...' : 'Search...'}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-card border-border focus:border-purple-500 text-foreground pl-12 pr-4 py-3 rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Suggested Creators */}
                            <div className="bg-[#1f1f1f] border border-white/10 rounded-2xl overflow-hidden">
                                <div className="p-5 border-b border-white/10">
                                    <h3 className="font-bold text-xl text-white flex items-center gap-2">
                                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {isArabic ? 'منشئون مقترحون' : 'Suggested Creators'}
                                    </h3>
                                </div>
                                <div className="divide-y divide-white/10">
                                    {/* Show skeleton loading while creators are being fetched */}
                                    {loading ? (
                                        <>
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <CreatorCardSkeleton key={i} />
                                            ))}
                                        </>
                                    ) : (
                                        creators.slice(0, 5).map((creator, idx) => (
                                        <div
                                            key={creator.id}
                                            className="p-4 hover:bg-white/5 transition-all duration-200 group animate-fade-in"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <div 
                                                className="flex items-center gap-3 mb-3 cursor-pointer"
                                                onClick={() => handleCreatorClick(creator.id)}
                                            >
                                                {/* Profile Image */}
                                                <div className="relative flex-shrink-0">
                                                    <div className="absolute -inset-0.5 bg-[#0a84ff] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                                    {creator.user?.profileImage ? (
                                                        <Image
                                                            src={creator.user.profileImage}
                                                            alt={creator.user?.name || 'Creator'}
                                                            width={48} height={48} className="rounded-full object-cover w-12 h-12 relative border-2 border-white/10 group-hover:border-[#0a84ff] transition-colors duration-200"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center relative border-2 border-white/10 group-hover:border-[#0a84ff] transition-colors duration-200">
                                                            <span className="text-base font-bold text-white">
                                                                {creator.user?.name?.[0] || 'C'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Online Indicator */}
                                                    {creator.isOnline && (
                                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#0a84ff] rounded-full border-2 border-[#1f1f1f]" />
                                                    )}
                                                </div>

                                                {/* Creator Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                        <h4 className="font-semibold text-white text-sm truncate group-hover:text-[#0a84ff] transition-colors duration-200">
                                                            {creator.user?.name || 'Creator'}
                                                        </h4>
                                                        {creator.stats.averageRating >= 4.5 && (
                                                            <DynamicIcon name="CheckCircle" className="w-4 h-4 text-[#0a84ff] fill-[#0a84ff] flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-white/50">
                                                        <span className="flex items-center gap-1">
                                                            <DynamicIcon name="Users" className="w-3 h-3" />
                                                            {(creator.totalSubscribers / 1000).toFixed(1)}K
                                                        </span>
                                                        <span>·</span>
                                                        <span className="flex items-center gap-1">
                                                            <DynamicIcon name="Star" className="w-3 h-3 text-white/50" />
                                                            {creator.stats.averageRating.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs font-semibold text-white/70 mt-1">
                                                        {creator.basicMonthlyPrice} {isArabic ? 'ج.م/شهر' : 'EGP/mo'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                {creator.isSubscribed ? (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // TODO: Handle manage subscription
                                                            toast.success(`${isArabic ? 'مشترك في طبقة' : 'Subscribed to'} ${creator.subscribedTier} ${isArabic ? 'طبقة' : 'tier'}`)
                                                        }}
                                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs py-2 rounded-full border border-white/20 transition-all duration-200"
                                                        disabled
                                                    >
                                                        <DynamicIcon name="Check" className="w-3 h-3 mr-1" />
                                                        {isArabic ? `مشترك (${creator.subscribedTier})` : `Subscribed (${creator.subscribedTier})`}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleSubscribeClick(creator)
                                                        }}
                                                        className="flex-1 bg-[#0a84ff] hover:bg-[#0a84ff]/90 text-white font-semibold text-xs py-2 rounded-full transition-all duration-200"
                                                    >
                                                        <DynamicIcon name="Star" className="w-3 h-3 mr-1" />
                                                        {isArabic ? 'اشترك' : 'Subscribe'}
                                                    </Button>
                                                )}
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleTipClick(creator)
                                                    }}
                                                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-xs py-2 px-3 rounded-full transition-all duration-200"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </Button>
                                                <Button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleMessageClick(creator)
                                                    }}
                                                    disabled={isNavigating}
                                                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold text-xs py-2 px-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isNavigating ? (
                                                        <DynamicIcon name="Loader2" className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <DynamicIcon name="MessageCircle" className="w-3 h-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )))}
                                </div>
                                <button 
                                    className="w-full p-3 text-[#0a84ff] hover:text-white hover:bg-white/5 text-sm font-semibold transition-all text-center border-t border-white/10"
                                    onClick={() => setActiveView('feed')}
                                >
                                    {isArabic ? 'عرض المزيد' : 'Show more'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Post View Modal */}
            {selectedPost && (
                <div 
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedPost(null)}
                >
                    <div 
                        className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Post content */}
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h2 className="text-2xl font-bold">{selectedPost.title || 'Post'}</h2>
                                <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setSelectedPost(null)}
                                >
                                    <DynamicIcon name="X" className="w-5 h-5" />
                                </Button>
                            </div>
                            
                            {selectedPost.mediaUrl && (
                                <div className="mb-4 rounded-lg overflow-hidden">
                                    {selectedPost.type === 'VIDEO' ? (
                                        <video 
                                            controls 
                                            className="w-full"
                                            src={selectedPost.mediaUrl}
                                        />
                                    ) : (
                                        <img 
                                            src={selectedPost.mediaUrl} 
                                            alt={selectedPost.title || 'Post'} 
                                            className="w-full"
                                        />
                                    )}
                                </div>
                            )}
                            
                            <div className="prose prose-invert max-w-none">
                                <p>{selectedPost.content}</p>
                            </div>
                            
                            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
                                <Button variant="outline" className="flex items-center gap-2">
                                    <DynamicIcon name="Heart" className="w-4 h-4" />
                                    {selectedPost.likeCount || 0} {isArabic ? 'إعجاب' : 'Likes'}
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <DynamicIcon name="MessageCircle" className="w-4 h-4" />
                                    {selectedPost.commentCount || 0} {isArabic ? 'تعليق' : 'Comments'}
                                </Button>
                                <Button variant="outline" className="flex items-center gap-2">
                                    <DynamicIcon name="Eye" className="w-4 h-4" />
                                    {selectedPost.viewCount || 0} {isArabic ? 'مشاهدة' : 'Views'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedCreator && (
                <>
                    <SubscribeModal
                        isOpen={subscribeModalOpen}
                        onClose={() => setSubscribeModalOpen(false)}
                        creator={selectedCreator}
                        isArabic={isArabic}
                        onSuccess={() => {
                            // Refresh user subscriptions to update UI
                            fetchUserSubscriptions()
                        }}
                    />
                    
                    <TipModal
                        isOpen={tipModalOpen}
                        onClose={() => setTipModalOpen(false)}
                        creator={selectedCreator}
                        onSend={handleSendTip}
                    />
                    
                    <DirectMessageModal
                        isOpen={messageModalOpen && selectedCreator !== null}
                        onClose={() => setMessageModalOpen(false)}
                        creator={selectedCreator!}
                        onSendMessage={handleSendMessage}
                    />
                </>
            )}
            
            <WithdrawalModal
                isOpen={withdrawalModalOpen}
                onClose={() => setWithdrawalModalOpen(false)}
                availableBalance={creatorStats?.earnings?.available || creatorStats?.earnings?.thisMonth || 0}
                isArabic={isArabic}
            />

            <UploadMediaModal
                isOpen={uploadModalOpen || editPostModalOpen}
                onClose={() => {
                    setUploadModalOpen(false)
                    setEditPostModalOpen(false)
                    setSelectedPost(null)
                }}
                isArabic={isArabic}
                existingPost={editPostModalOpen ? selectedPost : undefined}
                onUploadSuccess={(post) => {
                    console.log('Post saved:', post)
                    toast.success(isArabic ? 'تم حفظ المنشور بنجاح!' : 'Post saved successfully!')
                    setUploadModalOpen(false)
                    setEditPostModalOpen(false)
                    setSelectedPost(null)
                    // Refresh posts
                    if (selectedCreator?.id) {
                        fetchCreatorPostsByCreatorId(selectedCreator.id)
                    }
                }}
            />

            {session && (
                <EditProfileModal
                    isOpen={editProfileModalOpen}
                    onClose={() => setEditProfileModalOpen(false)}
                    currentProfile={{
                        name: selectedCreator?.user?.name || session.user?.name || '',
                        arabicName: selectedCreator?.user?.arabicName || '',
                        bio: selectedCreator?.user?.bio || 'Welcome to my exclusive content! 🔥 Subscribe for premium educational content, 1-on-1 coaching, and behind-the-scenes access.',
                        expertise: selectedCreator?.expertise || 'Content Creator',
                        profileImage: selectedCreator?.user?.profileImage || (session.user as any)?.image || null,
                        coverImage: null,
                        socialLinks: {
                                twitter: '',
                                instagram: '',
                                linkedin: '',
                                youtube: '',
                                website: ''
                            },
                        basicMonthlyPrice: selectedCreator?.basicMonthlyPrice || 49,
                        premiumMonthlyPrice: selectedCreator?.premiumMonthlyPrice || 99,
                        vipMonthlyPrice: selectedCreator?.vipMonthlyPrice || 199
                    }}
                    isArabic={isArabic}
                />
            )}
        </div>
    )
}

