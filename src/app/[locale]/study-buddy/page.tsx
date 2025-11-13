'use client'

import { useState, useEffect } from 'react'
import { SwipeInterface } from '@/components/study-buddy/SwipeInterface'
import { MatchesList } from '@/components/study-buddy/MatchesList'
import { MatchingInsights } from '@/components/study-buddy/MatchingInsights'
import ProfileCompletionGuide from '@/components/study-buddy/ProfileCompletionGuide'
import { VideoCallInitiator } from '@/components/study-buddy/VideoCallInitiator'
import { SessionSchedulerModal } from '@/components/study-buddy/SessionSchedulerModal'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { User, Settings, Bell, Heart, Users, Star, Edit3, Brain, TrendingUp, Zap, CheckCircle, Clock, MessageCircle, Calendar, Video, BookOpen, Target, CalendarPlus } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface StudyBuddyProfile {
    id: string
    name: string
    arabicName?: string | null
    profileImage?: string | null
    bio?: string | null
    interests: string[]
    goals: string[]
    skillLevel?: string | null
    learningMode?: string | null
    studyBuddyPreferences?: any
    createdAt: string
}

interface StudyBuddy {
    id: string
    name: string
    arabicName?: string | null
    interests: string[]
    goals: string[]
    skillLevel: string | null
    learningMode?: string | null
    profileImage?: string | null
    compatibilityScore: number
    compatibilityBreakdown?: {
        interestsScore: number
        goalsScore: number
        skillLevelScore: number
        communicationScore: number
        learningStyleScore: number
        scheduleScore: number
        subjectScore: number
        preferencesScore: number
    }
    sharedInterests: string[]
    sharedGoals: string[]
    reasonsForMatch?: string[]
}

interface StudyBuddyMatchWithDetails {
    id: string
    status: string
    sharedSubjects: string[]
    sharedGoals: string[]
    chatRoomId?: string | null
    createdAt: string
    updatedAt: string
    otherUser: {
        id: string
        name: string
        arabicName?: string | null
        profileImage?: string | null
        interests: string[]
        goals: string[]
        skillLevel: string | null
        learningMode?: string | null
    }
}

export default function StudyBuddyPage() {
    const locale = useLocale()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'discover' | 'matches' | 'profile' | 'notifications'>('discover')
    const [potentialMatches, setPotentialMatches] = useState<StudyBuddy[]>([])
    const [existingMatches, setExistingMatches] = useState<StudyBuddyMatchWithDetails[]>([])
    const [userProfile, setUserProfile] = useState<StudyBuddyProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [profileIncomplete, setProfileIncomplete] = useState<{
        missing: string[]
        message: string
        nextSteps: string[]
    } | null>(null)
    const [profileStats, setProfileStats] = useState<any>(null)
    const [showVideoCallModal, setShowVideoCallModal] = useState(false)
    const [selectedVideoCallMatch, setSelectedVideoCallMatch] = useState<StudyBuddyMatchWithDetails | null>(null)
    const [showSessionModal, setShowSessionModal] = useState(false)
    const [selectedSessionMatch, setSelectedSessionMatch] = useState<StudyBuddyMatchWithDetails | null>(null)

    useEffect(() => {
        loadUserProfile()
        if (activeTab === 'discover') {
            fetchPotentialMatches()
        } else if (activeTab === 'matches') {
            fetchExistingMatches()
        }
    }, [activeTab])

    const loadUserProfile = async () => {
        try {
            const response = await fetch('/api/study-buddy/profile')
            if (response.ok) {
                const data = await response.json()
                setUserProfile(data.profile)
                setProfileStats(data.stats)
            }
        } catch (error) {
            console.error('Failed to load profile:', error)
        }
    }

    const updateProfile = async (profileData: Partial<StudyBuddyProfile>) => {
        try {
            const response = await fetch('/api/study-buddy/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            })

            if (response.ok) {
                const data = await response.json()
                setUserProfile(data.profile)
                toast.success('Profile updated successfully!')
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to update profile')
            }
        } catch (error) {
            toast.error('Failed to update profile')
        }
    }

    const fetchPotentialMatches = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/study-buddy/match?limit=20')
            const data = await response.json()
            
            if (response.ok) {
                setPotentialMatches(data.matches || [])
                
                // Clear any previous profile incomplete state
                setProfileIncomplete(null)
                
                // Show helpful message if no matches found
                if (!data.matches || data.matches.length === 0) {
                    if (data.totalAvailable === 0) {
                        toast('No other learners available yet. Invite friends to join!')
                    } else {
                        toast('No compatible matches found. Try updating your preferences.')
                    }
                }
            } else {
                // Handle specific error codes
                if (data.code === 'NOT_AUTHENTICATED') {
                    toast.error('Please log in to find study buddies')
                    window.location.href = '/auth/login'
                    return
                } else if (data.code === 'PROFILE_INCOMPLETE') {
                    // Show profile completion guide instead of error
                    setProfileIncomplete({
                        missing: data.missingFields || [],
                        message: data.message || 'Please complete your profile',
                        nextSteps: data.nextSteps || []
                    })
                    setPotentialMatches([])
                } else if (data.code === 'USER_NOT_FOUND') {
                    toast.error('Please complete your profile to find study buddies')
                    setActiveTab('profile')
                } else {
                    toast.error(data.error || 'Failed to fetch potential matches')
                }
                setPotentialMatches([])
            }
        } catch (error) {
            console.error('Error fetching potential matches:', error)
            toast.error('Network error. Please check your connection.')
            setPotentialMatches([])
        } finally {
            setLoading(false)
        }
    }

    const fetchExistingMatches = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/study-buddy/matches')
            if (response.ok) {
                const data = await response.json()
                setExistingMatches(data.matches)
            } else {
                toast.error('Failed to fetch existing matches')
            }
        } catch (error) {
            toast.error('Failed to fetch existing matches')
        } finally {
            setLoading(false)
        }
    }

    const handleSwipe = async (userId: string, action: 'like' | 'pass') => {
        try {
            const response = await fetch('/api/study-buddy/swipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    targetUserId: userId,
                    action: action,
                }),
            })

            if (response.ok) {
                const result = await response.json()

                if (result.isMutual) {
                    toast.success('🎉 Mutual match! Check your matches tab.')
                    // Refresh matches list if we're on that tab
                    if (activeTab === 'matches') {
                        fetchExistingMatches()
                    }
                } else if (action === 'like') {
                    toast.success('Like sent! Waiting for response.')
                }
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to process swipe')
            }
        } catch (error) {
            toast.error('Failed to process swipe')
        }
    }

    const handleMatchAction = async (matchId: string, action: string) => {
        // Refresh the matches list after any action
        await fetchExistingMatches()
    }

    const handleChat = (matchId: string) => {
        // Navigate to messaging system with the specific conversation
        router.push(`/${locale}/messaging?matchId=${matchId}`)
    }

    const handleScheduleSession = (match: StudyBuddyMatchWithDetails) => {
        setSelectedSessionMatch(match)
        setShowSessionModal(true)
    }

    const handleVideoCall = (match: StudyBuddyMatchWithDetails) => {
        setSelectedVideoCallMatch(match)
        setShowVideoCallModal(true)
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Study Buddy</h1>
                            <p className="text-sm text-gray-400">Find your perfect learning partner</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="mb-8">
                    <div className="border-b border-gray-800">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'discover'
                                    ? 'border-purple-500 text-purple-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                                    }`}
                            >
                                Discover Matches
                                {potentialMatches.length > 0 && (
                                    <span className="ml-2 bg-purple-500/20 text-purple-400 py-0.5 px-2 rounded-full text-xs">
                                        {potentialMatches.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('matches')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'matches'
                                    ? 'border-purple-500 text-purple-400'
                                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                                    }`}
                            >
                                My Matches
                                {existingMatches.length > 0 && (
                                    <span className="ml-2 bg-green-500/20 text-green-400 py-0.5 px-2 rounded-full text-xs">
                                        {existingMatches.filter(m => m.status === 'accepted').length}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'discover' ? (
                    <div className="space-y-6">
                        {/* Profile Completion Guide - Top Banner */}
                        {profileIncomplete && (
                            <ProfileCompletionGuide
                                missingFields={profileIncomplete.missing}
                                nextSteps={profileIncomplete.nextSteps}
                                completionPercentage={Math.max(0, 100 - (profileIncomplete.missing.length * 12))}
                                onStartEditing={() => {
                                    setActiveTab('profile')
                                    setProfileIncomplete(null)
                                }}
                            />
                        )}

                        {/* Main Content Grid - Two Column Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column - Swipe Interface (2/3 width) */}
                            <div className="lg:col-span-2">
                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-500/20 rounded-xl">
                                                <Users className="w-5 h-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white">{potentialMatches.length}</div>
                                                <div className="text-xs text-gray-400">Available</div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm border border-blue-400/20 rounded-2xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-xl">
                                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white">
                                                    {Math.round(
                                                        potentialMatches.length > 0 
                                                            ? potentialMatches.reduce((sum, match) => sum + match.compatibilityScore, 0) / potentialMatches.length
                                                            : 0
                                                    )}%
                                                </div>
                                                <div className="text-xs text-gray-400">Avg Match</div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm border border-green-400/20 rounded-2xl p-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500/20 rounded-xl">
                                                <Heart className="w-5 h-5 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white">{existingMatches.filter(m => m.status === 'accepted').length}</div>
                                                <div className="text-xs text-gray-400">Matched</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Swipe Card - Center Focus */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <SwipeInterface
                                        potentialMatches={potentialMatches}
                                        onSwipe={handleSwipe}
                                        isLoading={loading}
                                        onMatch={(match) => {
                                            toast.success('New match found!')
                                            setActiveTab('matches')
                                        }}
                                    />
                                </motion.div>

                                {/* How It Works - Compact Version */}
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="mt-6 bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Brain className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-sm font-semibold text-white">How It Works</h3>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 text-xs">
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-purple-500/20 rounded-lg flex-shrink-0 mt-0.5">
                                                <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white mb-1">Smart Discovery</div>
                                                <div className="text-gray-400 leading-relaxed">AI analyzes your preferences</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-blue-500/20 rounded-lg flex-shrink-0 mt-0.5">
                                                <Heart className="w-3.5 h-3.5 text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white mb-1">Swipe to Connect</div>
                                                <div className="text-gray-400 leading-relaxed">Right to like, left to pass</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <div className="p-1.5 bg-green-500/20 rounded-lg flex-shrink-0 mt-0.5">
                                                <Zap className="w-3.5 h-3.5 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white mb-1">Start Learning</div>
                                                <div className="text-gray-400 leading-relaxed">Chat and schedule sessions</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right Column - Insights Sidebar (1/3 width) */}
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="lg:col-span-1"
                            >
                                <MatchingInsights
                                    totalMatches={potentialMatches.length}
                                    averageCompatibility={Math.round(
                                        potentialMatches.length > 0 
                                            ? potentialMatches.reduce((sum, match) => sum + match.compatibilityScore, 0) / potentialMatches.length
                                            : 0
                                    )}
                                    topCategories={
                                        [...new Set(
                                            potentialMatches
                                                .flatMap(match => [...match.sharedInterests, ...match.sharedGoals])
                                                .filter(item => item && item.length > 0)
                                        )].slice(0, 8)
                                    }
                                    matchingStats={{
                                        interestsMatches: potentialMatches.filter(match => match.sharedInterests.length > 0).length,
                                        goalsMatches: potentialMatches.filter(match => match.sharedGoals.length > 0).length,
                                        scheduleMatches: potentialMatches.filter(match => match.compatibilityBreakdown?.scheduleScore && match.compatibilityBreakdown.scheduleScore > 60).length,
                                        communicationMatches: potentialMatches.filter(match => match.compatibilityBreakdown?.communicationScore && match.compatibilityBreakdown.communicationScore > 70).length,
                                    }}
                                />
                            </motion.div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Matches Tab Stats Header */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                        >
                            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-500/20 rounded-xl">
                                        <Users className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">{existingMatches.length}</div>
                                        <div className="text-xs text-gray-400">Total Matches</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm border border-green-400/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-500/20 rounded-xl">
                                        <CheckCircle className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {existingMatches.filter(m => m.status === 'accepted' || m.status === 'ACTIVE').length}
                                        </div>
                                        <div className="text-xs text-gray-400">Active</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 backdrop-blur-sm border border-yellow-400/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                                        <Clock className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {existingMatches.filter(m => m.status === 'pending').length}
                                        </div>
                                        <div className="text-xs text-gray-400">Pending</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm border border-blue-400/20 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-500/20 rounded-xl">
                                        <MessageCircle className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {existingMatches.filter(m => m.chatRoomId).length}
                                        </div>
                                        <div className="text-xs text-gray-400">Chatting</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Enhanced Matches Grid */}
                        {existingMatches.length === 0 ? (
                            <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-12 text-center">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-12 h-12 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4">
                                    No Matches Yet
                                </h2>
                                <p className="text-gray-300 mb-6">
                                    Start swiping on the Discover tab to find your perfect study buddy!
                                </p>
                                <Button 
                                    onClick={() => setActiveTab('discover')}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                                >
                                    Start Discovering
                                </Button>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {existingMatches.map((match, index) => {
                                    const matchedUser = match.otherUser
                                    const isActive = match.status === 'accepted' || match.status === 'ACTIVE'

                                    return (
                                        <motion.div
                                            key={match.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ y: -8, scale: 1.02 }}
                                            className="group relative"
                                        >
                                            {/* Glow Effect */}
                                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500"></div>
                                            
                                            <Card className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-gray-900/95 backdrop-blur-xl border-2 border-gray-700/50 group-hover:border-purple-500/50 rounded-3xl p-6 overflow-hidden transition-all duration-300 shadow-2xl group-hover:shadow-purple-500/20">
                                                {/* Animated Background Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-pink-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                
                                                {/* Decorative Orbs */}
                                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
                                                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all duration-500"></div>
                                                
                                                <div className="relative z-10">
                                                    {/* Header Section */}
                                                    <div className="flex items-start gap-5 mb-6">
                                                        {/* Enhanced Profile Image with Ring */}
                                                        <div className="relative flex-shrink-0">
                                                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-75 group-hover:opacity-100 blur group-hover:blur-md transition-all duration-300"></div>
                                                            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-3 border-gray-900 shadow-2xl ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all duration-300">
                                                                {matchedUser.profileImage ? (
                                                                    <Image
                                                                        src={matchedUser.profileImage}
                                                                        alt={matchedUser.name}
                                                                        width={80}
                                                                        height={80}
                                                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center">
                                                                        <Users className="w-10 h-10 text-white" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Online Status Indicator */}
                                                            {isActive && (
                                                                <div className="absolute -bottom-1 -right-1">
                                                                    <div className="relative">
                                                                        <div className="w-6 h-6 bg-green-500 rounded-full border-3 border-gray-900"></div>
                                                                        <div className="absolute inset-0 w-6 h-6 bg-green-400 rounded-full animate-ping opacity-75"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* User Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-xl font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300 truncate">
                                                                {matchedUser.name}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Clock className="w-3.5 h-3.5 text-gray-500" />
                                                                <span className="text-sm text-gray-400">
                                                                    {new Date(match.createdAt).toLocaleDateString('en', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            
                                                            {/* Status and Tags Row */}
                                                            <div className="flex flex-wrap gap-2">
                                                                <Badge
                                                                    className={`${
                                                                        isActive
                                                                            ? 'bg-green-500/20 text-green-300 border-green-400/40'
                                                                            : 'bg-gray-500/20 text-gray-300 border-gray-400/40'
                                                                    } backdrop-blur-sm font-semibold`}
                                                                >
                                                                    {isActive ? (
                                                                        <>
                                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                                            Active
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Clock className="w-3 h-3 mr-1" />
                                                                            {match.status}
                                                                        </>
                                                                    )}
                                                                </Badge>
                                                                
                                                                {match.chatRoomId && (
                                                                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/40 backdrop-blur-sm">
                                                                        <MessageCircle className="w-3 h-3 mr-1" />
                                                                        Chat Active
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Shared Interests & Goals in Grid */}
                                                    {(match.sharedSubjects?.length > 0 || match.sharedGoals?.length > 0) && (
                                                        <div className="space-y-3 mb-5">
                                                            {match.sharedSubjects && match.sharedSubjects.length > 0 && (
                                                                <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/20 rounded-2xl p-4 group-hover:bg-blue-500/15 transition-colors duration-300">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="p-1.5 bg-blue-500/30 rounded-lg">
                                                                            <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-blue-200">
                                                                            Shared Subjects
                                                                        </span>
                                                                        <span className="ml-auto text-xs text-blue-400 font-semibold">
                                                                            {match.sharedSubjects.length}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {match.sharedSubjects.slice(0, 3).map((subject, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="px-3 py-1.5 bg-blue-500/30 text-blue-200 text-xs rounded-lg font-medium backdrop-blur-sm border border-blue-400/20 hover:bg-blue-500/40 transition-colors"
                                                                            >
                                                                                {subject}
                                                                            </span>
                                                                        ))}
                                                                        {match.sharedSubjects.length > 3 && (
                                                                            <span className="px-3 py-1.5 text-xs text-blue-400 font-medium">
                                                                                +{match.sharedSubjects.length - 3} more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {match.sharedGoals && match.sharedGoals.length > 0 && (
                                                                <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-4 group-hover:bg-purple-500/15 transition-colors duration-300">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <div className="p-1.5 bg-purple-500/30 rounded-lg">
                                                                            <Target className="w-3.5 h-3.5 text-purple-300" />
                                                                        </div>
                                                                        <span className="text-sm font-bold text-purple-200">
                                                                            Shared Goals
                                                                        </span>
                                                                        <span className="ml-auto text-xs text-purple-400 font-semibold">
                                                                            {match.sharedGoals.length}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {match.sharedGoals.slice(0, 3).map((goal, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="px-3 py-1.5 bg-purple-500/30 text-purple-200 text-xs rounded-lg font-medium backdrop-blur-sm border border-purple-400/20 hover:bg-purple-500/40 transition-colors"
                                                                            >
                                                                                {goal}
                                                                            </span>
                                                                        ))}
                                                                        {match.sharedGoals.length > 3 && (
                                                                            <span className="px-3 py-1.5 text-xs text-purple-400 font-medium">
                                                                                +{match.sharedGoals.length - 3} more
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Action Buttons */}
                                                    {isActive && (
                                                        <div className="space-y-3">
                                                            <motion.button
                                                                whileHover={{ scale: 1.05, y: -2 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => router.push(`/${locale}/study-buddy/workspace?matchId=${match.id}`)}
                                                                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:shadow-xl"
                                                            >
                                                                <Users className="w-5 h-5" />
                                                                <span>Open Workspace</span>
                                                                <Star className="w-4 h-4 ml-auto animate-pulse" />
                                                            </motion.button>
                                                            
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => router.push(`/${locale}/messaging?userId=${matchedUser.id}`)}
                                                                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 border border-blue-400/30 hover:border-blue-400/50 rounded-xl transition-all font-semibold backdrop-blur-sm shadow-lg hover:shadow-blue-500/20"
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    <span className="text-sm">Chat</span>
                                                                </motion.button>
                                                                
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => handleVideoCall(match)}
                                                                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 hover:text-green-200 border border-green-400/30 hover:border-green-400/50 rounded-xl transition-all font-semibold backdrop-blur-sm shadow-lg hover:shadow-green-500/20"
                                                                >
                                                                    <Video className="w-4 h-4" />
                                                                    <span className="text-sm">Video</span>
                                                                </motion.button>
                                                                
                                                                <motion.button
                                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    onClick={() => handleScheduleSession(match)}
                                                                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 hover:text-orange-200 border border-orange-400/30 hover:border-orange-400/50 rounded-xl transition-all font-semibold backdrop-blur-sm shadow-lg hover:shadow-orange-500/20"
                                                                >
                                                                    <CalendarPlus className="w-4 h-4" />
                                                                    <span className="text-sm">Schedule</span>
                                                                </motion.button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Pending State */}
                                                    {!isActive && match.status === 'pending' && (
                                                        <div className="bg-yellow-500/10 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-4 text-center">
                                                            <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                                                            <p className="text-sm text-yellow-300 font-medium">
                                                                Waiting for response...
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Video Call Modal */}
            {showVideoCallModal && selectedVideoCallMatch && userProfile?.id && (
                <VideoCallInitiator
                    studyBuddy={{
                        id: selectedVideoCallMatch.otherUser.id,
                        name: selectedVideoCallMatch.otherUser.name,
                        arabicName: selectedVideoCallMatch.otherUser.arabicName || undefined,
                        profileImage: selectedVideoCallMatch.otherUser.profileImage || undefined,
                        isOnline: true
                    }}
                    currentUserId={userProfile.id}
                    onClose={() => {
                        setShowVideoCallModal(false)
                        setSelectedVideoCallMatch(null)
                    }}
                />
            )}

            {/* Session Scheduler Modal */}
            {showSessionModal && selectedSessionMatch && (
                <SessionSchedulerModal
                    isOpen={showSessionModal}
                    onClose={() => {
                        setShowSessionModal(false)
                        setSelectedSessionMatch(null)
                    }}
                    studyBuddy={{
                        id: selectedSessionMatch.otherUser.id,
                        name: selectedSessionMatch.otherUser.name,
                        arabicName: selectedSessionMatch.otherUser.arabicName || undefined,
                        profileImage: selectedSessionMatch.otherUser.profileImage || undefined,
                    }}
                    matchId={selectedSessionMatch.id}
                />
            )}
        </div>
    )
}