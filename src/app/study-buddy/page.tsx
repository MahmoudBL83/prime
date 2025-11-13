'use client'

import { useState, useEffect } from 'react'
import { SwipeInterface } from '@/components/study-buddy/SwipeInterface'
import { MatchesList } from '@/components/study-buddy/MatchesList'
import { MatchingInsights } from '@/components/study-buddy/MatchingInsights'
import ProfileCompletionGuide from '@/components/study-buddy/ProfileCompletionGuide'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { User, Settings, Bell, Heart, Users, Star, Edit3, Brain, TrendingUp, Zap } from 'lucide-react'
import Image from 'next/image'

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
                        toast.info('No other learners available yet. Invite friends to join!')
                    } else {
                        toast.info('No compatible matches found. Try updating your preferences.')
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
        window.location.href = `/messaging?matchId=${matchId}`
    }

    const handleScheduleSession = (match: StudyBuddyMatchWithDetails) => {
        // For now, show a toast message. Later this can open a modal or navigate to a scheduling page
        toast.success(`Schedule session with ${match.otherUser.name} - Feature coming soon!`)
        // TODO: Implement session scheduling modal or navigation
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-background shadow-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Study Buddy</h1>
                            <p className="text-sm text-muted-foreground">Find your perfect learning partner</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs */}
                <div className="mb-8">
                    <div className="border-b border-border">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('discover')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'discover'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`}
                            >
                                Discover Matches
                                {potentialMatches.length > 0 && (
                                    <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                                        {potentialMatches.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('matches')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'matches'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`}
                            >
                                My Matches
                                {existingMatches.length > 0 && (
                                    <span className="ml-2 bg-green-100 text-green-600 py-0.5 px-2 rounded-full text-xs">
                                        {existingMatches.filter(m => m.status === 'accepted').length}
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'discover' ? (
                    <div className="space-y-8">
                        {/* Profile Completion Guide */}
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
                        
                        {/* Enhanced Matching Insights */}
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
                        
                        {/* Swipe Interface */}
                        <div className="flex flex-col items-center">
                            <div className="w-full max-w-md mb-8">
                                <SwipeInterface
                                    potentialMatches={potentialMatches}
                                    onSwipe={handleSwipe}
                                    isLoading={loading}
                                    onMatch={(match) => {
                                        toast.success('New match found!')
                                        setActiveTab('matches')
                                    }}
                                />
                            </div>

                            {/* Enhanced Instructions */}
                            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-6 max-w-2xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl">
                                        <Brain className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">Enhanced AI Matching</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                    <div className="text-center">
                                        <div className="p-3 bg-purple-500/10 rounded-xl mb-3 mx-auto w-fit">
                                            <TrendingUp className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="font-medium mb-2 text-foreground">Smart Discovery</div>
                                        <p>Advanced algorithm considers study preferences, communication styles, and schedule compatibility</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="p-3 bg-blue-500/10 rounded-xl mb-3 mx-auto w-fit">
                                            <Heart className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div className="font-medium mb-2 text-foreground">Perfect Matches</div>
                                        <p>Detailed compatibility scores help you find study partners who truly complement your learning style</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="p-3 bg-green-500/10 rounded-xl mb-3 mx-auto w-fit">
                                            <Zap className="w-6 h-6 text-green-400" />
                                        </div>
                                        <div className="font-medium mb-2 text-foreground">Instant Connection</div>
                                        <p>Start meaningful study sessions with pre-matched interests and compatible schedules</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <MatchesList
                            initialMatches={existingMatches}
                            onMatchAction={handleMatchAction}
                            onChat={handleChat}
                            onScheduleSession={handleScheduleSession}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
