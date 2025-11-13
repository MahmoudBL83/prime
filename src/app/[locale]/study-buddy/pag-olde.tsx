'use client'

import { useState, useEffect } from 'react'
import { SwipeInterface } from '@/components/study-buddy/SwipeInterface'
import { MatchesList } from '@/components/study-buddy/MatchesList'
import { MatchingInsights } from '@/components/study-buddy/MatchingInsights'
import ProfileCompletionGuide from '@/components/study-buddy/ProfileCompletionGuide'
import VideoCallInitiator from '@/components/study-buddy/VideoCallInitiator'
import { ActivityFeed } from '@/components/study-buddy/ActivityFeed'
import { StudyPreferencesModal } from '@/components/study-buddy/StudyPreferencesModal'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { User, Settings, Bell, Heart, Users, Star, Edit3, Brain, TrendingUp, Zap, Calendar, Plus, X, Clock, Target } from 'lucide-react'
import { useLocale } from 'next-intl'
import Image from 'next/image'

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
    sharedInterests: string[]
    sharedGoals: string[]
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

interface StudySession {
    id: string
    title?: string
    description?: string
    status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
    duration: number
    scheduledAt?: string
    startedAt?: string
    completedAt?: string
    meetingLink?: string
    studyTopics?: string[]
    notes?: string
    createdBy?: string
    otherUser?: {
        id: string
        name: string
        arabicName?: string | null
        profileImage?: string | null
    }
    createdAt: string
    updatedAt: string
}

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
    stats?: {
        totalMatches: number
        acceptedMatches: number
        profileCompleteness: number
    }
}

export default function StudyBuddyPage() {
    const locale = useLocale()
    const [activeTab, setActiveTab] = useState<'discover' | 'matches' | 'sessions' | 'profile' | 'activity'>('discover')
    const [potentialMatches, setPotentialMatches] = useState<StudyBuddy[]>([])
    const [existingMatches, setExistingMatches] = useState<StudyBuddyMatchWithDetails[]>([])
    const [studySessions, setStudySessions] = useState<StudySession[]>([])
    const [userProfile, setUserProfile] = useState<StudyBuddyProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [profileStats, setProfileStats] = useState<any>(null)
    const [showScheduleModal, setShowScheduleModal] = useState(false)
    const [selectedMatch, setSelectedMatch] = useState<StudyBuddyMatchWithDetails | null>(null)
    const [showPreferencesModal, setShowPreferencesModal] = useState(false)
    const [showVideoCallModal, setShowVideoCallModal] = useState(false)
    const [selectedVideoCallMatch, setSelectedVideoCallMatch] = useState<StudyBuddyMatchWithDetails | null>(null)
    const [profileIncomplete, setProfileIncomplete] = useState<{
        missing: string[]
        message: string
        nextSteps: string[]
    } | null>(null)

    useEffect(() => {
        loadUserProfile()
        if (activeTab === 'discover') {
            fetchPotentialMatches()
        } else if (activeTab === 'matches') {
            fetchExistingMatches()
        } else if (activeTab === 'sessions') {
            fetchStudySessions()
        }
    }, [activeTab])

    const loadUserProfile = async () => {
        console.log('📖 [RELOAD] Loading user profile...')
        
        // First check if we have a session
        const sessionResponse = await fetch('/api/auth/session')
        if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json()
            console.log('📖 [RELOAD] Current session:', sessionData)
            
            if (!sessionData.user) {
                console.log('📖 [RELOAD] No user in session, redirecting to login')
                window.location.href = `/${locale}/auth/login`
                return
            }
        } else {
            console.log('📖 [RELOAD] No session found, redirecting to login')
            window.location.href = `/${locale}/auth/login`
            return
        }
        
        try {
            const response = await fetch('/api/study-buddy/profile')
            console.log('📖 [RELOAD] Profile fetch response status:', response.status)
            
            if (response.ok) {
                const data = await response.json()
                console.log('📖 [RELOAD] Profile data received:', data)
                setUserProfile(data.profile)
                setProfileStats(data.stats)
                console.log('📖 [RELOAD] Profile state updated successfully')
            } else {
                const errorData = await response.json()
                console.error('📖 [RELOAD] Failed to load profile:', response.status, errorData)
                
                // If user not found or session invalid, redirect to login
                if (response.status === 404 || errorData.code === 'USER_NOT_FOUND' || errorData.code === 'SESSION_INVALID') {
                    console.log('📖 [RELOAD] Session invalid or user not found, redirecting to login')
                    toast.error('Session expired. Please log in again.')
                    window.location.href = `/${locale}/auth/login`
                    return
                }
                
                // If not authenticated, redirect to login
                if (response.status === 401 || errorData.code === 'NOT_AUTHENTICATED') {
                    console.log('📖 [RELOAD] Not authenticated, redirecting to login')
                    toast.error('Please log in to access Study Buddy')
                    window.location.href = `/${locale}/auth/login`
                    return
                }
            }
        } catch (error) {
            console.error('📖 [RELOAD] Failed to load profile:', error)
        }
    }

    const updateProfile = async (profileData: any) => {
        console.log('🔄 [MAIN] Updating profile with data:', profileData)
        console.log('🔄 [MAIN] Data type check:', {
            bio: typeof profileData.bio,
            interests: Array.isArray(profileData.interests) ? 'array' : typeof profileData.interests,
            goals: Array.isArray(profileData.goals) ? 'array' : typeof profileData.goals,
            skillLevel: typeof profileData.skillLevel,
            learningMode: typeof profileData.learningMode
        })
        
        try {
            const response = await fetch('/api/study-buddy/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            })

            console.log('📡 [MAIN] Profile update response status:', response.status)
            
            if (response.ok) {
                const data = await response.json()
                console.log('✅ [MAIN] Profile update successful:', data)
                setUserProfile(data.profile)
                toast.success('Profile updated successfully!')
                return data.profile
            } else {
                const errorData = await response.json()
                console.error('❌ [MAIN] Profile update failed:', errorData)
                toast.error(errorData.error || 'Failed to update profile')
                throw new Error(errorData.error || 'Failed to update profile')
            }
        } catch (error) {
            console.error('🚨 [MAIN] Profile update error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to update profile')
            throw error
        }
    }

    const fetchPotentialMatches = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/study-buddy/match?limit=20')
            const data = await response.json()
            
            if (response.ok) {
                setPotentialMatches(data.matches || [])
                console.log('🔍 [DISCOVER] Potential matches loaded:', {
                    count: data.matches?.length || 0,
                    matches: data.matches?.map((m: any) => ({ id: m.id, name: m.name })) || [],
                    isDemo: data.matches?.some((m: any) => m.name?.includes('demo')) || false
                })
                
                // Show helpful message if no matches found
                if (!data.matches || data.matches.length === 0) {
                    if (data.totalAvailable === 0) {
                        toast.success('No other learners available yet. Invite friends to join!')
                    } else {
                        toast.success('No compatible matches found. Try updating your preferences.')
                    }
                }
            } else {
                // Handle specific error codes
                if (data.code === 'NOT_AUTHENTICATED') {
                    toast.error('Please log in to find study buddies')
                    // Redirect to login page
                    window.location.href = '/auth/login'
                    return
                } else if (data.code === 'USER_NOT_FOUND' || data.code === 'SESSION_INVALID') {
                    console.log('🚨 Session/User error:', data)
                    toast.error('Session expired. Please log in again.')
                    // Redirect to login to refresh session
                    window.location.href = `/${locale}/auth/login`
                } else if (data.code === 'PROFILE_INCOMPLETE') {
                    console.log('📋 Profile incomplete:', data)
                    // Show specific missing fields in toast
                    if (data.missingFieldsDetail && data.missingFieldsDetail.length > 0) {
                        toast.error(`Profile incomplete: ${data.missingFieldsDetail.join(', ')}`)
                    } else if (data.missingFields && data.missingFields.length > 0) {
                        toast.error(`Please complete: ${data.missingFields.join(', ')}`)
                    } else {
                        toast.error(data.message || 'Please complete your profile to find study buddies')
                    }
                    // Set the incomplete profile state to show guidance
                    setProfileIncomplete({
                        missing: data.missingFields || [],
                        message: data.message || 'Please complete your profile',
                        nextSteps: data.missingFieldsDetail || data.nextSteps || [
                            'Add your interests',
                            'Set your learning goals', 
                            'Choose your skill level',
                            'Select your learning mode'
                        ]
                    })
                    // Automatically switch to profile tab to help user complete it
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
                setExistingMatches(data.matches || [])
            } else {
                toast.error('Failed to fetch existing matches')
            }
        } catch (error) {
            toast.error('Failed to fetch existing matches')
        } finally {
            setLoading(false)
        }
    }

    const fetchStudySessions = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/study-buddy/sessions')
            if (response.ok) {
                const sessions = await response.json()
                setStudySessions(sessions || [])
            } else {
                toast.error('Failed to fetch study sessions')
            }
        } catch (error) {
            toast.error('Failed to fetch study sessions')
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

    const handleScheduleSession = async (match: StudyBuddyMatchWithDetails) => {
        setSelectedMatch(match)
        setShowScheduleModal(true)
    }

    const handleCreateSession = async (sessionData: {
        title: string
        description?: string
        scheduledAt: string
        duration: number
        studyTopics: string[]
        notes?: string
    }) => {
        if (!selectedMatch) return

        try {
            const response = await fetch('/api/study-buddy/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...sessionData,
                    otherUserId: selectedMatch.otherUser.id,
                    matchId: selectedMatch.id
                }),
            })

            if (response.ok) {
                const newSession = await response.json()
                setStudySessions(prev => [newSession, ...prev])
                toast.success('Study session scheduled successfully!')
                setShowScheduleModal(false)
                setSelectedMatch(null)
                
                // Switch to sessions tab to see the new session
                setActiveTab('sessions')
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to schedule session')
            }
        } catch (error) {
            toast.error('Failed to schedule session')
        }
    }

    const handleChat = async (matchId: string) => {
        try {
            // Find the match to get the other user's details
            const match = existingMatches.find(m => m.id === matchId)
            if (!match) {
                toast.error('Match not found')
                return
            }

            // Check if conversation already exists or create one
            const response = await fetch('/api/study-buddy/conversation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matchId: matchId,
                    otherUserId: match.otherUser.id
                }),
            })

            if (response.ok) {
                const data = await response.json()
                
                // Navigate to messaging system with the specific conversation
                window.location.href = `/${locale}/messaging?conversationId=${data.conversationId}`
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to create conversation')
            }
        } catch (error) {
            toast.error('Failed to start conversation')
        }
    }

    const handleVideoCall = (match: StudyBuddyMatchWithDetails) => {
        if (!userProfile?.id) {
            toast.error('Please wait for your profile to load')
            return
        }
        setSelectedVideoCallMatch(match)
        setShowVideoCallModal(true)
    }

    const createStudySession = async (sessionData: {
        title: string
        description?: string
        scheduledAt: string
        duration: number
        studyTopics: string[]
    }) => {
        if (!selectedMatch) return

        try {
            const response = await fetch('/api/study-buddy/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId: selectedMatch.id,
                    ...sessionData
                })
            })

            if (response.ok) {
                toast.success('Study session scheduled successfully!')
                setShowScheduleModal(false)
                setSelectedMatch(null)
                fetchStudySessions()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to schedule session')
            }
        } catch (error) {
            toast.error('Failed to schedule session')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8 relative"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
                        Study Buddy
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Find your perfect learning partner and achieve your goals together
                    </p>
                    
                    {/* Preferences Button */}
                    <motion.button
                        onClick={() => setShowPreferencesModal(true)}
                        className="absolute top-0 right-0 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-300 shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Study Preferences"
                    >
                        <Settings className="w-6 h-6" />
                    </motion.button>
                </motion.div>

                {/* Navigation Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="bg-white/8 backdrop-blur-lg border border-white/20 rounded-3xl p-2 shadow-2xl shadow-purple-500/10">
                        <div className="flex flex-wrap justify-center gap-2">
                            {[
                                { key: 'discover', label: 'Discover', icon: Heart, count: potentialMatches.length > 0 ? potentialMatches.length : undefined, color: 'from-purple-500 to-pink-500' },
                                { key: 'matches', label: 'Matches', icon: Users, count: existingMatches.filter(m => m.status === 'accepted').length > 0 ? existingMatches.filter(m => m.status === 'accepted').length : undefined, color: 'from-blue-500 to-cyan-500' },
                                { key: 'sessions', label: 'Sessions', icon: Calendar, count: studySessions.filter(s => s.status === 'SCHEDULED' || s.status === 'CONFIRMED').length > 0 ? studySessions.filter(s => s.status === 'SCHEDULED' || s.status === 'CONFIRMED').length : undefined, color: 'from-orange-500 to-yellow-500' },
                                { key: 'activity', label: 'Activity', icon: TrendingUp, color: 'from-indigo-500 to-purple-500' },
                                { key: 'profile', label: 'Profile', icon: User, color: 'from-green-500 to-emerald-500' }
                            ].map(({ key, label, icon: Icon, count, color }) => {
                                // Debug logging for discover tab
                                if (key === 'discover') {
                                    console.log('🏷️ [DISCOVER TAB] Badge info:', {
                                        potentialMatchesLength: potentialMatches.length,
                                        potentialMatches: potentialMatches.slice(0, 3).map(m => ({ id: m.id, name: m.name })),
                                        count: count
                                    })
                                }
                                return (
                                <motion.button
                                    key={key}
                                    onClick={() => setActiveTab(key as any)}
                                    className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all duration-300 relative min-w-[120px] justify-center ${
                                        activeTab === key
                                            ? `bg-gradient-to-r ${color} text-white shadow-lg transform scale-105 shadow-${key === 'discover' ? 'purple' : key === 'matches' ? 'blue' : 'green'}-500/25`
                                            : 'text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105 hover:shadow-lg'
                                    }`}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-semibold text-sm">{label}</span>
                                    {count !== undefined && count > 0 && (
                                        <motion.span 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg"
                                        >
                                            {count > 99 ? '99+' : count}
                                        </motion.span>
                                    )}
                                    {activeTab === key && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 rounded-2xl border-2 border-white/30"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </motion.button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <motion.div 
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'discover' && (
                        <DiscoverTab 
                            potentialMatches={potentialMatches}
                            onSwipe={handleSwipe}
                            loading={loading}
                            profileIncomplete={profileIncomplete}
                            onEditProfile={() => setActiveTab('profile')}
                        />
                    )}

                    {activeTab === 'matches' && (
                        <MatchesTab 
                            initialMatches={existingMatches}
                            onMatchAction={handleMatchAction}
                            onChat={handleChat}
                            onScheduleSession={handleScheduleSession}
                            onVideoCall={handleVideoCall}
                        />
                    )}

                    {activeTab === 'sessions' && (
                        <SessionsTab 
                            sessions={studySessions}
                            matches={existingMatches}
                            onScheduleSession={handleScheduleSession}
                            onRefresh={fetchStudySessions}
                            loading={loading}
                        />
                    )}

                    {activeTab === 'activity' && (
                        <ActivityTab userId={userProfile?.id || 'current-user'} />
                    )}

                    {activeTab === 'profile' && (
                        <ProfileTab 
                            profile={userProfile}
                            stats={profileStats}
                            onUpdate={updateProfile}
                            onProfileReload={loadUserProfile}
                        />
                    )}
                </motion.div>
            </div>

            {/* Study Preferences Modal */}
            <StudyPreferencesModal
                isOpen={showPreferencesModal}
                onClose={() => setShowPreferencesModal(false)}
                onSave={() => {
                    // Refresh potential matches when preferences are updated
                    if (activeTab === 'discover') {
                        fetchPotentialMatches()
                    }
                }}
            />

            {/* Schedule Session Modal */}
            {showScheduleModal && selectedMatch && (
                <ScheduleSessionModal
                    match={selectedMatch}
                    onClose={() => {
                        setShowScheduleModal(false)
                        setSelectedMatch(null)
                    }}
                    onSchedule={createStudySession}
                />
            )}

            {/* Video Call Modal */}
            {showVideoCallModal && selectedVideoCallMatch && userProfile?.id && (
                <VideoCallInitiator
                    studyBuddy={{
                        id: selectedVideoCallMatch.otherUser.id,
                        name: selectedVideoCallMatch.otherUser.name,
                        arabicName: selectedVideoCallMatch.otherUser.arabicName || undefined,
                        profileImage: selectedVideoCallMatch.otherUser.profileImage || undefined,
                        isOnline: true // For now, assume online - could be enhanced with real-time status
                    }}
                    currentUserId={userProfile.id}
                    onClose={() => {
                        setShowVideoCallModal(false)
                        setSelectedVideoCallMatch(null)
                    }}
                />
            )}
        </div>
    )
}

// Discover Tab Component
function DiscoverTab({ 
    potentialMatches, 
    onSwipe, 
    loading,
    profileIncomplete,
    onEditProfile
}: {
    potentialMatches: StudyBuddy[]
    onSwipe: (userId: string, action: 'like' | 'pass') => Promise<void>
    loading: boolean
    profileIncomplete?: {
        missing: string[]
        message: string
        nextSteps: string[]
    } | null
    onEditProfile: () => void
}) {
    return (
        <div className="space-y-8">
            {/* Show Profile Completion Guide if profile is incomplete */}
            {profileIncomplete && (
                <div className="w-full max-w-4xl mx-auto">
                    <ProfileCompletionGuide
                        missingFields={profileIncomplete.missing}
                        nextSteps={profileIncomplete.nextSteps}
                        onStartEditing={onEditProfile}
                        completionPercentage={Math.max(0, Math.round((4 - profileIncomplete.missing.length) / 4 * 100))}
                    />
                </div>
            )}
            
            {/* Enhanced Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <motion.div 
                    className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-300/20 rounded-2xl p-6 text-center"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-purple-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{potentialMatches.length}</h3>
                    <p className="text-purple-200 text-sm">Potential Matches</p>
                </motion.div>
                
                <motion.div 
                    className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-300/20 rounded-2xl p-6 text-center"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Zap className="w-6 h-6 text-blue-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">AI</h3>
                    <p className="text-blue-200 text-sm">Smart Matching</p>
                </motion.div>
                
                <motion.div 
                    className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-300/20 rounded-2xl p-6 text-center"
                    whileHover={{ scale: 1.02 }}
                >
                    <div className="w-12 h-12 bg-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="w-6 h-6 text-green-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">100%</h3>
                    <p className="text-green-200 text-sm">Success Rate</p>
                </motion.div>
            </div>

            {/* Main Swipe Interface */}
            <div className="flex flex-col items-center">
                <div className="w-full max-w-md mb-32">
                    <SwipeInterface
                        potentialMatches={potentialMatches}
                        onSwipe={onSwipe}
                        isLoading={loading}
                    />
                </div>

                {/* Enhanced Instructions */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-4xl text-center">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center justify-center gap-2">
                        <Brain className="w-6 h-6 text-purple-400" />
                        How Study Buddy Works
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
                        <motion.div 
                            className="text-center p-4 rounded-xl bg-white/5"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="w-8 h-8 text-purple-400" />
                            </div>
                            <div className="font-semibold mb-2 text-white text-lg">1. Discover</div>
                            <p>Swipe through potential study buddies who share your interests and goals. Our AI matches you based on compatibility.</p>
                        </motion.div>
                        
                        <motion.div 
                            className="text-center p-4 rounded-xl bg-white/5"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-blue-400" />
                            </div>
                            <div className="font-semibold mb-2 text-white text-lg">2. Match & Chat</div>
                            <p>When both users like each other, you'll have a mutual match and can start chatting immediately.</p>
                        </motion.div>
                        
                        <motion.div 
                            className="text-center p-4 rounded-xl bg-white/5"
                            whileHover={{ scale: 1.02 }}
                        >
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-green-400" />
                            </div>
                            <div className="font-semibold mb-2 text-white text-lg">3. Study Together</div>
                            <p>Schedule study sessions, join video calls, and achieve your learning goals together!</p>
                        </motion.div>
                    </div>

                    {/* Session Booking CTA */}
                    <motion.div 
                        className="mt-8 p-6 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-300/20 rounded-2xl"
                        whileHover={{ scale: 1.02 }}
                    >
                        <h4 className="text-xl font-bold text-white mb-3 flex items-center justify-center gap-2">
                            <Calendar className="w-5 h-5 text-orange-400" />
                            Ready to Schedule Your First Session?
                        </h4>
                        <p className="text-orange-200 mb-4">
                            Find matches first, then book study sessions in the "Sessions" tab!
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <span className="px-4 py-2 bg-orange-500/30 text-orange-200 rounded-full text-sm">
                                📚 Group Study
                            </span>
                            <span className="px-4 py-2 bg-orange-500/30 text-orange-200 rounded-full text-sm">
                                🎯 1-on-1 Tutoring
                            </span>
                            <span className="px-4 py-2 bg-orange-500/30 text-orange-200 rounded-full text-sm">
                                💻 Virtual Sessions
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

// Matches Tab Component
function MatchesTab({ 
    initialMatches, 
    onMatchAction, 
    onChat,
    onScheduleSession,
    onVideoCall
}: {
    initialMatches: StudyBuddyMatchWithDetails[]
    onMatchAction: (matchId: string, action: string) => Promise<void>
    onChat: (matchId: string) => void
    onScheduleSession: (match: StudyBuddyMatchWithDetails) => void
    onVideoCall: (match: StudyBuddyMatchWithDetails) => void
}) {
    return (
        <div>
            <MatchesList
                initialMatches={initialMatches}
                onMatchAction={onMatchAction}
                onChat={onChat}
                onScheduleSession={onScheduleSession}
                onVideoCall={onVideoCall}
            />
        </div>
    )
}

// Profile Tab Component
function ProfileTab({ 
    profile, 
    stats, 
    onUpdate, 
    onProfileReload 
}: {
    profile: StudyBuddyProfile | null
    stats: any
    onUpdate: (data: Partial<StudyBuddyProfile>) => Promise<void>
    onProfileReload: () => Promise<void>
}) {
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState({
        bio: '',
        interests: [] as string[],
        goals: [] as string[],
        skillLevel: 'BEGINNER',
        learningMode: 'online',
        studyBuddyPreferences: {}
    })
    const [newInterest, setNewInterest] = useState('')
    const [newGoal, setNewGoal] = useState('')
    const [saving, setSaving] = useState(false)

    // Initialize form when profile changes
    useEffect(() => {
        if (profile) {
            setEditForm({
                bio: profile.bio || '',
                interests: profile.interests || [],
                goals: profile.goals || [],
                skillLevel: profile.skillLevel || 'BEGINNER',
                learningMode: profile.learningMode || 'online',
                studyBuddyPreferences: profile.studyBuddyPreferences || {}
            })
        }
    }, [profile])

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('📝 [FORM] Form submission started')
        console.log('📝 [FORM] Current editForm state:', editForm)
        
        setSaving(true)

        try {
            console.log('📝 [FORM] Submitting profile form with data:', editForm)
            
            // Ensure the data is properly structured
            const profileUpdateData = {
                bio: editForm.bio,
                interests: editForm.interests,
                goals: editForm.goals,
                skillLevel: editForm.skillLevel,
                learningMode: editForm.learningMode,
                studyBuddyPreferences: editForm.studyBuddyPreferences || {}
            }
            
            console.log('📝 [FORM] Processed data for API:', profileUpdateData)
            console.log('📝 [FORM] Calling onUpdate function...')
            
            const result = await onUpdate(profileUpdateData)
            console.log('📝 [FORM] onUpdate result:', result)
            
            setEditMode(false)
            console.log('📝 [FORM] Switched off edit mode')
            
            toast.success('Profile updated successfully!')
            console.log('📝 [FORM] Calling profile reload...')
            
            await onProfileReload()
            console.log('📝 [FORM] Profile reload completed')
            
        } catch (error) {
            console.error('❌ [FORM] Failed to update profile:', error)
            toast.error('Failed to update profile. Please try again.')
        } finally {
            setSaving(false)
            console.log('📝 [FORM] Form submission completed')
        }
    }

    const addInterest = () => {
        if (newInterest.trim() && !editForm.interests.includes(newInterest.trim())) {
            setEditForm(prev => ({
                ...prev,
                interests: [...prev.interests, newInterest.trim()]
            }))
            setNewInterest('')
        }
    }

    const removeInterest = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            interests: prev.interests.filter((_, i) => i !== index)
        }))
    }

    const addGoal = () => {
        if (newGoal.trim() && !editForm.goals.includes(newGoal.trim())) {
            setEditForm(prev => ({
                ...prev,
                goals: [...prev.goals, newGoal.trim()]
            }))
            setNewGoal('')
        }
    }

    const removeGoal = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }))
    }

    if (!profile) {
        return <CreateProfileForm onSuccess={onProfileReload} />
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white text-3xl font-semibold mx-auto mb-4">
                        {profile.name.charAt(0)}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
                    <p className="text-gray-400 capitalize">{profile.skillLevel?.toLowerCase() || 'Learning'}</p>
                </div>

                {profile.bio && (
                    <div className="mb-6">
                        <h3 className="text-white font-semibold mb-2">About</h3>
                        <p className="text-gray-300">{profile.bio}</p>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.interests && profile.interests.length > 0 ? (
                            profile.interests.map((interest, index) => (
                                <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                                    {interest}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-sm">No interests added yet</span>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">Learning Goals</h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.goals && profile.goals.length > 0 ? (
                            profile.goals.map((goal, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                                    {goal}
                                </span>
                            ))
                        ) : (
                            <span className="text-gray-500 text-sm">No goals added yet</span>
                        )}
                    </div>
                </div>

                {stats && (
                    <div className="mb-6 grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{stats.totalMatches || 0}</div>
                            <div className="text-sm text-gray-400">Total Matches</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-400">{stats.acceptedMatches || 0}</div>
                            <div className="text-sm text-gray-400">Active Partners</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{stats.profileCompleteness || 0}%</div>
                            <div className="text-sm text-gray-400">Profile Complete</div>
                        </div>
                    </div>
                )}

                <button 
                    onClick={() => setEditMode(true)}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                    <Edit3 className="w-5 h-5 inline mr-2" />
                    Edit Profile
                </button>
            </div>

            {/* Edit Profile Modal */}
            {editMode && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 w-full max-w-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
                            <button
                                onClick={() => setEditMode(false)}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div>
                                <label className="block text-white font-medium mb-2">Bio</label>
                                <textarea
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                                    placeholder="Tell others about your learning journey..."
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-white font-medium mb-2">Skill Level</label>
                                    <select
                                        value={editForm.skillLevel}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, skillLevel: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
                                    >
                                        <option value="BEGINNER" className="bg-gray-800">Beginner</option>
                                        <option value="INTERMEDIATE" className="bg-gray-800">Intermediate</option>
                                        <option value="ADVANCED" className="bg-gray-800">Advanced</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-white font-medium mb-2">Learning Mode</label>
                                    <select
                                        value={editForm.learningMode}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, learningMode: e.target.value }))}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
                                    >
                                        <option value="online" className="bg-gray-800">Online</option>
                                        <option value="offline" className="bg-gray-800">In-person</option>
                                        <option value="hybrid" className="bg-gray-800">Hybrid</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Interests</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newInterest}
                                        onChange={(e) => setNewInterest(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                                        placeholder="Add an interest"
                                    />
                                    <button
                                        type="button"
                                        onClick={addInterest}
                                        className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editForm.interests.map((interest, index) => (
                                        <motion.span 
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-1"
                                            onClick={() => removeInterest(index)}
                                        >
                                            {interest} <X className="w-3 h-3" />
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Learning Goals</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newGoal}
                                        onChange={(e) => setNewGoal(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                        className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                                        placeholder="Add a learning goal"
                                    />
                                    <button
                                        type="button"
                                        onClick={addGoal}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {editForm.goals.map((goal, index) => (
                                        <motion.span 
                                            key={index}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center gap-1"
                                            onClick={() => removeGoal(index)}
                                        >
                                            {goal} <X className="w-3 h-3" />
                                        </motion.span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-4 pt-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                                            />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Settings className="w-4 h-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setEditMode(false)}
                                    className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

// Create Profile Form Component
function CreateProfileForm({ onSuccess }: { onSuccess: () => Promise<void> }) {
    const [formData, setFormData] = useState({
        bio: '',
        interests: [] as string[],
        goals: [] as string[],
        skillLevel: 'BEGINNER',
        learningMode: 'online'
    })
    const [newInterest, setNewInterest] = useState('')
    const [newGoal, setNewGoal] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch('/api/study-buddy/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (response.ok) {
                toast.success('Profile updated successfully!')
                onSuccess()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to update profile')
            }
        } catch (error) {
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    const addInterest = () => {
        if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
            setFormData(prev => ({
                ...prev,
                interests: [...prev.interests, newInterest.trim()]
            }))
            setNewInterest('')
        }
    }

    const addGoal = () => {
        if (newGoal.trim() && !formData.goals.includes(newGoal.trim())) {
            setFormData(prev => ({
                ...prev,
                goals: [...prev.goals, newGoal.trim()]
            }))
            setNewGoal('')
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Complete Your Study Buddy Profile</h2>
                    <p className="text-gray-400">Let others know what you're learning and what you're passionate about</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-white font-medium mb-2">Bio</label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none"
                            placeholder="Tell others about your learning journey..."
                        />
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Skill Level</label>
                        <select
                            value={formData.skillLevel}
                            onChange={(e) => setFormData(prev => ({ ...prev, skillLevel: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
                        >
                            <option value="BEGINNER">Beginner</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Learning Mode</label>
                        <select
                            value={formData.learningMode}
                            onChange={(e) => setFormData(prev => ({ ...prev, learningMode: e.target.value }))}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
                        >
                            <option value="online">Online</option>
                            <option value="offline">In-person</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Interests</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newInterest}
                                onChange={(e) => setNewInterest(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                                placeholder="Add an interest"
                            />
                            <button
                                type="button"
                                onClick={addInterest}
                                className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.interests.map((interest, index) => (
                                <span 
                                    key={index} 
                                    className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        interests: prev.interests.filter((_, i) => i !== index)
                                    }))}
                                >
                                    {interest} ×
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-white font-medium mb-2">Learning Goals</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={newGoal}
                                onChange={(e) => setNewGoal(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                                placeholder="Add a learning goal"
                            />
                            <button
                                type="button"
                                onClick={addGoal}
                                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.goals.map((goal, index) => (
                                <span 
                                    key={index} 
                                    className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        goals: prev.goals.filter((_, i) => i !== index)
                                    }))}
                                >
                                    {goal} ×
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating Profile...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    )
}

// Sessions Tab Component
function SessionsTab({
    sessions,
    matches,
    onScheduleSession,
    onRefresh,
    loading
}: {
    sessions: StudySession[]
    matches: StudyBuddyMatchWithDetails[]
    onScheduleSession: (match: StudyBuddyMatchWithDetails) => void
    onRefresh: () => void
    loading: boolean
}) {
    const upcomingSessions = sessions.filter(s => ['SCHEDULED', 'CONFIRMED'].includes(s.status))
    const pastSessions = sessions.filter(s => ['COMPLETED', 'CANCELLED'].includes(s.status))
    const activeSessions = sessions.filter(s => s.status === 'IN_PROGRESS')

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-blue-500/20 text-blue-300'
            case 'CONFIRMED': return 'bg-green-500/20 text-green-300'
            case 'IN_PROGRESS': return 'bg-orange-500/20 text-orange-300'
            case 'COMPLETED': return 'bg-gray-500/20 text-gray-300'
            case 'CANCELLED': return 'bg-red-500/20 text-red-300'
            default: return 'bg-gray-500/20 text-gray-300'
        }
    }

    const acceptedMatches = matches.filter(m => m.status === 'accepted')

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Quick Schedule Section */}
            {acceptedMatches.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Schedule New Session</h3>
                        <Calendar className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {acceptedMatches.slice(0, 3).map((match) => (
                            <motion.div
                                key={match.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors"
                                onClick={() => onScheduleSession(match)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {match.otherUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{match.otherUser.name}</div>
                                        <div className="text-gray-400 text-sm">{match.otherUser.arabicName}</div>
                                    </div>
                                </div>
                                <button className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 py-2 rounded-lg text-sm hover:from-purple-500/30 hover:to-blue-500/30 transition-colors flex items-center justify-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Schedule Session
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Active Sessions */}
            {activeSessions.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        Active Sessions
                    </h3>
                    <div className="space-y-4">
                        {activeSessions.map((session) => (
                            <div key={session.id} className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {session.otherUser?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{session.title}</div>
                                            <div className="text-gray-400 text-sm">with {session.otherUser?.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                            {session.status.replace('_', ' ')}
                                        </div>
                                        <div className="text-gray-400 text-sm mt-1">{session.duration} min</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Sessions */}
            {upcomingSessions.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-400" />
                        Upcoming Sessions ({upcomingSessions.length})
                    </h3>
                    <div className="space-y-4">
                        {upcomingSessions.map((session) => (
                            <motion.div
                                key={session.id}
                                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {session.otherUser?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{session.title}</div>
                                            <div className="text-gray-400 text-sm">with {session.otherUser?.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                            {session.status.replace('_', ' ')}
                                        </div>
                                        <div className="text-gray-400 text-sm mt-1">{session.duration} min</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="text-gray-300 text-sm">{session.scheduledAt ? formatDate(session.scheduledAt) : 'TBD'}</div>
                                    {session.studyTopics && session.studyTopics.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {session.studyTopics.slice(0, 3).map((topic, index) => (
                                                <span key={index} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                                                    {topic}
                                                </span>
                                            ))}
                                            {session.studyTopics.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs">
                                                    +{session.studyTopics.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {session.description && (
                                    <div className="text-gray-400 text-sm mt-2 bg-white/5 rounded p-2">
                                        {session.description}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Past Sessions ({pastSessions.length})</h3>
                    <div className="space-y-4">
                        {pastSessions.slice(0, 5).map((session) => (
                            <div key={session.id} className="bg-white/5 border border-white/10 rounded-xl p-4 opacity-75">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-500/50 rounded-full flex items-center justify-center text-gray-300 text-sm font-bold">
                                            {session.otherUser?.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-gray-300 font-medium">{session.title}</div>
                                            <div className="text-gray-500 text-sm">with {session.otherUser?.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                            {session.status.replace('_', ' ')}
                                        </div>
                                        <div className="text-gray-500 text-sm mt-1">{session.scheduledAt ? formatDate(session.scheduledAt) : 'TBD'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {sessions.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Study Sessions Yet</h3>
                    <p className="text-gray-400 mb-6">Schedule your first study session with a study buddy</p>
                    {acceptedMatches.length > 0 && (
                        <button
                            onClick={() => onScheduleSession(acceptedMatches[0])}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                        >
                            Schedule First Session
                        </button>
                    )}
                </div>
            )}

            {loading && (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading sessions...</p>
                </div>
            )}
        </div>
    )
}

// Schedule Session Modal Component
function ScheduleSessionModal({
    match,
    onClose,
    onSchedule
}: {
    match: StudyBuddyMatchWithDetails
    onClose: () => void
    onSchedule: (data: {
        title: string
        description?: string
        scheduledAt: string
        duration: number
        studyTopics: string[]
    }) => void
}) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        studyTopics: [] as string[]
    })
    const [newTopic, setNewTopic] = useState('')

    const addTopic = () => {
        if (newTopic.trim() && !formData.studyTopics.includes(newTopic.trim())) {
            setFormData(prev => ({
                ...prev,
                studyTopics: [...prev.studyTopics, newTopic.trim()]
            }))
            setNewTopic('')
        }
    }

    const removeTopic = (topicToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            studyTopics: prev.studyTopics.filter(topic => topic !== topicToRemove)
        }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.title.trim() && formData.scheduledAt) {
            onSchedule({
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                scheduledAt: formData.scheduledAt,
                duration: formData.duration,
                studyTopics: formData.studyTopics
            })
        }
    }

    // Set minimum date to current date
    const minDate = new Date()
    minDate.setMinutes(minDate.getMinutes() - minDate.getTimezoneOffset())
    const minDateString = minDate.toISOString().slice(0, 16)

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Schedule Study Session</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-xl">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {match.otherUser.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-white font-medium">{match.otherUser.name}</div>
                            <div className="text-gray-400 text-sm">{match.otherUser.arabicName}</div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-white font-medium mb-2">Session Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                                placeholder="e.g., JavaScript Study Session"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-white font-medium mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 resize-none h-20"
                                placeholder="What will you study together?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-white font-medium mb-2">Date & Time *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.scheduledAt}
                                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                    min={minDateString}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-white font-medium mb-2">Duration</label>
                                <select
                                    value={formData.duration}
                                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400"
                                >
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={90}>1.5 hours</option>
                                    <option value={120}>2 hours</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-white font-medium mb-2">Study Topics</label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newTopic}
                                    onChange={(e) => setNewTopic(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                                    placeholder="Add a study topic"
                                />
                                <button
                                    type="button"
                                    onClick={addTopic}
                                    className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.studyTopics.map((topic, index) => (
                                    <span 
                                        key={index} 
                                        className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                                        onClick={() => removeTopic(topic)}
                                    >
                                        {topic} ×
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-600 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                disabled={!formData.title.trim() || !formData.scheduledAt}
                            >
                                Schedule Session
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}

// Activity Tab Component
function ActivityTab({ userId }: { userId: string }) {
    return (
        <div className="max-w-4xl mx-auto">
            <ActivityFeed userId={userId} />
        </div>
    )
}