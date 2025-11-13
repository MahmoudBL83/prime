'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, User, Clock, CheckCircle, XCircle, Ban, Unlock, Star, Book, Zap, Calendar, Video, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'

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

interface MatchesListProps {
    initialMatches?: StudyBuddyMatchWithDetails[]
    onMatchAction?: (matchId: string, action: string) => Promise<void>
    onChat?: (matchId: string) => void
    onScheduleSession?: (match: StudyBuddyMatchWithDetails) => void
    onVideoCall?: (match: StudyBuddyMatchWithDetails) => void
}

export function MatchesList({ initialMatches = [], onMatchAction, onChat, onScheduleSession, onVideoCall }: MatchesListProps) {
    const [matches, setMatches] = useState<StudyBuddyMatchWithDetails[]>(initialMatches)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'accepted' | 'blocked'>('all')
    const router = useRouter()
    const locale = useLocale()

    useEffect(() => {
        if (initialMatches.length === 0) {
            fetchMatches()
        }
    }, [activeTab])

    const fetchMatches = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/study-buddy/matches?status=${activeTab}`)
            if (response.ok) {
                const data = await response.json()
                setMatches(data.matches)
            } else {
                toast.error('Failed to fetch matches')
            }
        } catch (error) {
            toast.error('Failed to fetch matches')
        } finally {
            setLoading(false)
        }
    }

    const handleMatchAction = async (matchId: string, action: string) => {
        try {
            const response = await fetch(`/api/study-buddy/matches?id=${matchId}&action=${action}`, {
                method: 'PATCH',
            })

            if (response.ok) {
                const result = await response.json()
                toast.success(result.message)

                // Update the match in the local state
                setMatches(prev => prev.map(match =>
                    match.id === matchId
                        ? { ...match, status: action === 'unblock' ? 'pending' : action }
                        : match
                ))

                if (onMatchAction) {
                    await onMatchAction(matchId, action)
                }
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to update match')
            }
        } catch (error) {
            toast.error('Failed to update match')
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />
            case 'accepted':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'blocked':
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-muted-foreground" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
            case 'accepted':
                return 'bg-green-500/20 text-green-300 border-green-400/30'
            case 'blocked':
                return 'bg-red-500/20 text-red-300 border-red-400/30'
            default:
                return 'bg-background0/20 text-muted-foreground border-gray-400/30'
        }
    }

    const filteredMatches = matches.filter(match => {
        if (activeTab === 'all') return true
        return match.status === activeTab
    })

    const tabs = [
        { id: 'all', label: 'All Matches', count: matches.length },
        { id: 'pending', label: 'Pending', count: matches.filter(m => m.status === 'pending').length },
        { id: 'accepted', label: 'Accepted', count: matches.filter(m => m.status === 'accepted').length },
        { id: 'blocked', label: 'Blocked', count: matches.filter(m => m.status === 'blocked').length },
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-3 border-purple-300/30 border-t-purple-400 rounded-full"
                />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Status Tabs */}
            <div className="bg-gradient-to-r from-white/8 to-white/5 backdrop-blur-xl border border-border rounded-3xl p-2 shadow-2xl">
                <nav className="flex flex-wrap justify-center gap-2">
                    {tabs.map((tab) => (
                        <motion.button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`relative px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center gap-2.5 min-w-[110px] justify-center ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-foreground shadow-xl shadow-purple-500/30'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                                }`}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <motion.span 
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`${activeTab === tab.id 
                                        ? 'bg-white/30 text-foreground' 
                                        : 'bg-purple-500/30 text-purple-300'
                                    } text-xs py-0.5 px-2 rounded-full font-bold`}
                                >
                                    {tab.count > 99 ? '99+' : tab.count}
                                </motion.span>
                            )}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeMatchTab"
                                    className="absolute inset-0 rounded-2xl ring-2 ring-white/40 ring-offset-2 ring-offset-transparent"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </nav>
            </div>

            {/* Matches List */}
            {filteredMatches.length === 0 ? (
                <div className="bg-white/8 backdrop-blur-lg border border-border rounded-3xl p-12 shadow-2xl">
                    <div className="text-center">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-400/30"
                        >
                            <User className="w-10 h-10 text-purple-300" />
                        </motion.div>
                        <motion.h3 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-3"
                        >
                            {activeTab === 'all' ? 'No Study Buddies Yet' : `No ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Matches`}
                        </motion.h3>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-muted-foreground text-lg mb-6"
                        >
                            {activeTab === 'all'
                                ? "Start discovering and swiping right on potential study partners!"
                                : activeTab === 'pending'
                                ? "No pending match requests at the moment"
                                : activeTab === 'accepted'
                                ? "You haven't accepted any matches yet"
                                : "No blocked matches"
                            }
                        </motion.p>
                        {activeTab === 'all' && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => window.location.reload()}
                                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-foreground rounded-2xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                            >
                                Start Discovering
                            </motion.button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredMatches.map((match, index) => (
                        <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative bg-gradient-to-br from-gray-900/95 via-purple-900/5 to-gray-900/95 backdrop-blur-xl border border-purple-400/20 rounded-3xl p-6 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 overflow-hidden"
                        >
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-pink-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            
                            {/* Decorative Glow */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors duration-500"></div>
                            
                            <div className="relative z-10">
                                {/* Header Section */}
                                <div className="flex items-start justify-between mb-5">
                                    <div className="flex items-start gap-4 flex-1">
                                        {/* Enhanced Profile Image */}
                                        <div className="relative flex-shrink-0">
                                            {match.otherUser.profileImage ? (
                                                <img
                                                    src={match.otherUser.profileImage}
                                                    alt={match.otherUser.name}
                                                    className="w-16 h-16 rounded-2xl object-cover border-2 border-purple-400/60 shadow-xl ring-4 ring-purple-500/20 group-hover:border-purple-400 group-hover:ring-purple-500/30 transition-all"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-600 flex items-center justify-center border-2 border-purple-400/60 shadow-xl ring-4 ring-purple-500/20">
                                                    <span className="text-foreground text-2xl font-bold">
                                                        {match.otherUser.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Online Status Indicator */}
                                            {match.status === 'accepted' && (
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                                            )}
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-purple-200 transition-colors">
                                                {match.otherUser.name}
                                            </h3>
                                            {match.otherUser.arabicName && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {match.otherUser.arabicName}
                                                </p>
                                            )}
                                            
                                            {/* Tags Row */}
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-sm ${getStatusColor(match.status)}`}>
                                                    {getStatusIcon(match.status)}
                                                    <span className="capitalize">{match.status}</span>
                                                </span>
                                                
                                                {match.otherUser.skillLevel && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded-xl text-xs font-medium">
                                                        <Zap className="w-3 h-3" />
                                                        <span className="capitalize">{match.otherUser.skillLevel.toLowerCase()}</span>
                                                    </span>
                                                )}
                                                
                                                {match.otherUser.learningMode && (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-xl text-xs font-medium">
                                                        <Book className="w-3 h-3" />
                                                        <span className="capitalize">{match.otherUser.learningMode}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shared Interests & Goals */}
                                {(match.sharedSubjects.length > 0 || match.sharedGoals.length > 0) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                        {match.sharedSubjects.length > 0 && (
                                            <div className="bg-purple-500/10 backdrop-blur-sm border border-purple-400/20 rounded-2xl p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Star className="w-4 h-4 text-purple-400" />
                                                    <span className="text-sm font-bold text-foreground">Shared Interests</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {match.sharedSubjects.slice(0, 4).map((subject) => (
                                                        <span
                                                            key={subject}
                                                            className="px-2.5 py-1 bg-purple-500/30 text-purple-200 text-xs rounded-lg font-medium"
                                                        >
                                                            {subject}
                                                        </span>
                                                    ))}
                                                    {match.sharedSubjects.length > 4 && (
                                                        <span className="text-xs text-muted-foreground px-2 py-1">
                                                            +{match.sharedSubjects.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {match.sharedGoals.length > 0 && (
                                            <div className="bg-blue-500/10 backdrop-blur-sm border border-blue-400/20 rounded-2xl p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Book className="w-4 h-4 text-blue-400" />
                                                    <span className="text-sm font-bold text-foreground">Shared Goals</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {match.sharedGoals.slice(0, 4).map((goal) => (
                                                        <span
                                                            key={goal}
                                                            className="px-2.5 py-1 bg-blue-500/30 text-blue-200 text-xs rounded-lg font-medium"
                                                        >
                                                            {goal}
                                                        </span>
                                                    ))}
                                                    {match.sharedGoals.length > 4 && (
                                                        <span className="text-xs text-muted-foreground px-2 py-1">
                                                            +{match.sharedGoals.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Match Info Footer */}
                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 pt-3 border-t border-border">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Matched {new Date(match.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {match.chatRoomId && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 text-green-400 rounded-lg">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="font-medium">Chat Active</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2.5">
                                    {match.status === 'accepted' && (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => router.push(`/${locale}/study-buddy/workspace?matchId=${match.id}`)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700 rounded-xl transition-all font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
                                                title="Shared Workspace"
                                            >
                                                <Users className="w-4 h-4" />
                                                <span>Workspace</span>
                                            </motion.button>

                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onChat?.(match.id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-foreground hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                                                title="Start Chat"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                <span>Chat</span>
                                            </motion.button>

                                            {onVideoCall && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onVideoCall(match)}
                                                    className="px-4 py-3 bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-400/30 rounded-xl transition-all backdrop-blur-sm hover:border-green-400 hover:shadow-lg hover:shadow-green-500/25"
                                                    title="Video Call"
                                                >
                                                    <Video className="w-4 h-4" />
                                                </motion.button>
                                            )}
                                            
                                            {onScheduleSession && (
                                                <motion.button
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => onScheduleSession(match)}
                                                    className="px-4 py-3 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-400/30 rounded-xl transition-all backdrop-blur-sm hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25"
                                                    title="Schedule Session"
                                                >
                                                    <Calendar className="w-4 h-4" />
                                                </motion.button>
                                            )}
                                        </>
                                    )}

                                    {match.status === 'pending' && (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleMatchAction(match.id, 'accept')}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-foreground hover:from-green-600 hover:to-green-700 rounded-xl transition-all font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                                                title="Accept Match"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Accept</span>
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleMatchAction(match.id, 'block')}
                                                className="px-4 py-3 bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-400/30 rounded-xl transition-all backdrop-blur-sm hover:border-red-400 hover:shadow-lg hover:shadow-red-500/25"
                                                title="Block"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </motion.button>
                                        </>
                                    )}

                                    {match.status === 'blocked' && (
                                        <motion.button
                                            whileHover={{ scale: 1.05, y: -2 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleMatchAction(match.id, 'unblock')}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-foreground hover:from-yellow-600 hover:to-yellow-700 rounded-xl transition-all font-semibold shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40"
                                            title="Unblock"
                                        >
                                            <Unlock className="w-4 h-4" />
                                            <span>Unblock</span>
                                        </motion.button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Refresh Button */}
            <div className="text-center">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={fetchMatches}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-foreground rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                    Refresh Matches
                </motion.button>
            </div>
        </div>
    )
}
