'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    Award, 
    TrendingUp, 
    Calendar, 
    Users, 
    BookOpen, 
    Target, 
    Flame, 
    Star,
    Trophy,
    Zap,
    Clock,
    CheckCircle,
    Heart,
    MessageCircle,
    Video
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    category: 'study' | 'social' | 'streak' | 'milestone'
    pointsValue: number
    unlockedAt?: string
    progress?: {
        current: number
        required: number
    }
}

interface ActivityItem {
    id: string
    type: 'achievement_unlocked' | 'study_session_completed' | 'match_created' | 'streak_milestone' | 'goal_completed'
    title: string
    description: string
    timestamp: string
    points?: number
    metadata?: Record<string, any>
    relatedUser?: {
        id: string
        name: string
        arabicName?: string
        profileImage?: string
    }
}

interface UserStats {
    totalPoints: number
    currentStreak: number
    longestStreak: number
    studyMinutes: number
    completedSessions: number
    totalMatches: number
    achievements: number
    level: number
    nextLevelPoints: number
    currentLevelPoints: number
}

interface ActivityFeedProps {
    userId: string
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ userId }) => {
    const [activities, setActivities] = useState<ActivityItem[]>([])
    const [achievements, setAchievements] = useState<Achievement[]>([])
    const [userStats, setUserStats] = useState<UserStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState<'all' | 'achievements' | 'sessions' | 'social'>('all')

    useEffect(() => {
        fetchActivityData()
    }, [userId])

    const fetchActivityData = async () => {
        setLoading(true)
        try {
            const [activitiesRes, achievementsRes, statsRes] = await Promise.all([
                fetch('/api/study-buddy/activity-feed'),
                fetch('/api/study-buddy/achievements'),
                fetch('/api/study-buddy/stats')
            ])

            if (activitiesRes.ok) {
                const activitiesData = await activitiesRes.json()
                setActivities(activitiesData.activities || [])
            }

            if (achievementsRes.ok) {
                const achievementsData = await achievementsRes.json()
                setAchievements(achievementsData.achievements || [])
            }

            if (statsRes.ok) {
                const statsData = await statsRes.json()
                setUserStats(statsData.stats)
            }

        } catch (error) {
            console.error('Failed to fetch activity data:', error)
            toast.error('Failed to load activity feed')
        } finally {
            setLoading(false)
        }
    }

    const getActivityIcon = (type: ActivityItem['type']) => {
        switch (type) {
            case 'achievement_unlocked':
                return Trophy
            case 'study_session_completed':
                return BookOpen
            case 'match_created':
                return Heart
            case 'streak_milestone':
                return Flame
            case 'goal_completed':
                return Target
            default:
                return Star
        }
    }

    const getActivityColor = (type: ActivityItem['type']) => {
        switch (type) {
            case 'achievement_unlocked':
                return 'from-yellow-500 to-orange-500'
            case 'study_session_completed':
                return 'from-blue-500 to-cyan-500'
            case 'match_created':
                return 'from-pink-500 to-red-500'
            case 'streak_milestone':
                return 'from-orange-500 to-red-500'
            case 'goal_completed':
                return 'from-green-500 to-emerald-500'
            default:
                return 'from-purple-500 to-blue-500'
        }
    }

    const filteredActivities = activities.filter(activity => {
        if (activeFilter === 'all') return true
        if (activeFilter === 'achievements') return activity.type === 'achievement_unlocked'
        if (activeFilter === 'sessions') return activity.type === 'study_session_completed'
        if (activeFilter === 'social') return activity.type === 'match_created'
        return true
    })

    const formatTimeAgo = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
        
        if (diffInHours < 1) return 'Just now'
        if (diffInHours < 24) return `${diffInHours}h ago`
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
        return date.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* User Stats Overview */}
            {userStats && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm border border-border rounded-2xl p-6"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Award className="w-8 h-8 text-foreground" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">{userStats.totalPoints.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Total Points</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Flame className="w-8 h-8 text-foreground" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">{userStats.currentStreak}</div>
                            <div className="text-sm text-muted-foreground">Day Streak</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="w-8 h-8 text-foreground" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">{Math.floor(userStats.studyMinutes / 60)}h</div>
                            <div className="text-sm text-muted-foreground">Study Time</div>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Users className="w-8 h-8 text-foreground" />
                            </div>
                            <div className="text-2xl font-bold text-foreground">{userStats.totalMatches}</div>
                            <div className="text-sm text-muted-foreground">Study Buddies</div>
                        </div>
                    </div>

                    {/* Level Progress */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-foreground font-semibold">Level {userStats.level}</span>
                            <span className="text-muted-foreground text-sm">
                                {userStats.currentLevelPoints} / {userStats.nextLevelPoints} XP
                            </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ 
                                    width: `${(userStats.currentLevelPoints / userStats.nextLevelPoints) * 100}%` 
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Filter Tabs */}
            <div className="flex space-x-2 p-1 bg-white/5 backdrop-blur-sm rounded-2xl border border-border w-fit">
                {[
                    { id: 'all', label: 'All Activity', icon: TrendingUp },
                    { id: 'achievements', label: 'Achievements', icon: Trophy },
                    { id: 'sessions', label: 'Study Sessions', icon: BookOpen },
                    { id: 'social', label: 'Social', icon: Heart }
                ].map(({ id, label, icon: Icon }) => (
                    <motion.button
                        key={id}
                        onClick={() => setActiveFilter(id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                            activeFilter === id
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-foreground shadow-lg'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </motion.button>
                ))}
            </div>

            {/* Activity Feed */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredActivities.map((activity, index) => {
                        const Icon = getActivityIcon(activity.type)
                        const colorClass = getActivityColor(activity.type)
                        
                        return (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white/5 backdrop-blur-sm border border-border rounded-2xl p-6 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 bg-gradient-to-r ${colorClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <Icon className="w-6 h-6 text-foreground" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-foreground font-semibold">{activity.title}</h3>
                                            <div className="flex items-center gap-2">
                                                {activity.points && (
                                                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-medium">
                                                        +{activity.points} XP
                                                    </span>
                                                )}
                                                <span className="text-muted-foreground text-sm">
                                                    {formatTimeAgo(activity.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-muted-foreground text-sm mb-2">{activity.description}</p>
                                        
                                        {activity.relatedUser && (
                                            <div className="flex items-center gap-2 mt-3">
                                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                                    <span className="text-foreground text-xs font-semibold">
                                                        {activity.relatedUser.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <span className="text-muted-foreground text-sm">
                                                    with {activity.relatedUser.arabicName || activity.relatedUser.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                
                {filteredActivities.length === 0 && (
                    <div className="text-center py-12">
                        <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-muted-foreground mb-2">No Activity Yet</h3>
                        <p className="text-muted-foreground">
                            Start studying with your buddies to see your activity here!
                        </p>
                    </div>
                )}
            </div>

            {/* Recent Achievements */}
            {achievements.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 backdrop-blur-sm border border-border rounded-2xl p-6"
                >
                    <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        Recent Achievements
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievements.slice(0, 4).map((achievement) => (
                            <div
                                key={achievement.id}
                                className="bg-white/5 border border-border rounded-xl p-4 flex items-center gap-3"
                            >
                                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                                    <Trophy className="w-6 h-6 text-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-foreground font-semibold">{achievement.title}</div>
                                    <div className="text-muted-foreground text-sm">{achievement.description}</div>
                                    <div className="text-yellow-400 text-xs font-medium">
                                        +{achievement.pointsValue} XP
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    )
}

export default ActivityFeed