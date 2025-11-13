'use client'

import { motion } from 'framer-motion'
import { Trophy, Star, Clock, BookOpen } from 'lucide-react'
import Image from 'next/image'

interface AchievementCardProps {
    type: string
    title: string
    titleAr?: string
    description: string
    descriptionAr?: string
    icon?: string
    points: number
    unlockedAt: Date
    course?: {
        title: string
        thumbnail?: string
    } | null
    isArabic?: boolean
    delay?: number
}

const achievementIcons: Record<string, string> = {
    FIRST_COURSE_COMPLETED: '🎓',
    QUIZ_MASTER: '📝',
    PERFECT_SCORE: '💯',
    FAST_LEARNER: '⚡',
    CONSISTENT_LEARNER: '🔥',
    TOP_PERFORMER: '🏆',
    PEER_REVIEWER: '👥',
    COMMUNITY_HELPER: '🤝',
    CERTIFICATE_EARNED: '📜',
    STREAK_MILESTONE: '🎯'
}

export default function AchievementCard({
    type,
    title,
    titleAr,
    description,
    descriptionAr,
    icon,
    points,
    unlockedAt,
    course,
    isArabic = false,
    delay = 0
}: AchievementCardProps) {
    const displayTitle = isArabic && titleAr ? titleAr : title
    const displayDescription = isArabic && descriptionAr ? descriptionAr : description
    const displayIcon = icon || achievementIcons[type] || '🏆'

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
            whileHover={{ scale: 1.02 }}
            className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 overflow-hidden group hover:border-purple-500/50 transition-all"
        >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Sparkle decoration */}
            <motion.div
                animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.1, 1]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity
                }}
                className="absolute top-2 right-2"
            >
                <Star className="w-6 h-6 text-yellow-400/50 fill-yellow-400/50" />
            </motion.div>

            <div className="relative z-10 flex items-start space-x-4">
                {/* Icon */}
                <motion.div
                    animate={{
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3
                    }}
                    className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-4 border-gray-900 shadow-lg shadow-purple-500/50"
                >
                    <span className="text-3xl">{displayIcon}</span>
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <h3 className="text-foreground font-bold text-lg mb-1">
                                {displayTitle}
                            </h3>
                            <p className="text-muted-foreground text-sm">
                                {displayDescription}
                            </p>
                        </div>
                        <div className="flex items-center space-x-1 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30 ml-4">
                            <Trophy className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 font-bold text-sm">
                                +{points}
                            </span>
                        </div>
                    </div>

                    {/* Course info if available */}
                    {course && (
                        <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-800/50 rounded-lg">
                            {course.thumbnail ? (
                                <Image
                                    src={course.thumbnail}
                                    alt={course.title}
                                    width={40}
                                    height={40}
                                    className="rounded object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                                </div>
                            )}
                            <span className="text-muted-foreground text-sm truncate">{course.title}</span>
                        </div>
                    )}

                    {/* Date unlocked */}
                    <div className="flex items-center space-x-1 text-muted-foreground text-xs">
                        <Clock className="w-3 h-3" />
                        <span>Unlocked {formatDate(unlockedAt)}</span>
                    </div>
                </div>
            </div>

            {/* Achievement type badge */}
            <div className="absolute bottom-2 right-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {type.replace(/_/g, ' ')}
                </span>
            </div>
        </motion.div>
    )
}
