'use client'

import { motion } from 'framer-motion'
import { Lock, Star, Trophy, Award, Sparkles } from 'lucide-react'

interface BadgeProps {
    title: string
    titleAr?: string
    description: string
    descriptionAr?: string
    icon: string
    color: string
    rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
    isEarned: boolean
    progress: number
    earnedAt?: Date | null
    xpReward: number
    onClick?: () => void
    showProgress?: boolean
    isArabic?: boolean
}

const rarityColors = {
    COMMON: {
        bg: 'from-gray-500 to-gray-600',
        border: 'border-gray-400',
        glow: 'shadow-gray-500/50',
        text: 'text-muted-foreground'
    },
    UNCOMMON: {
        bg: 'from-green-500 to-emerald-600',
        border: 'border-green-400',
        glow: 'shadow-green-500/50',
        text: 'text-green-400'
    },
    RARE: {
        bg: 'from-blue-500 to-blue-600',
        border: 'border-blue-400',
        glow: 'shadow-blue-500/50',
        text: 'text-blue-400'
    },
    EPIC: {
        bg: 'from-purple-500 to-purple-600',
        border: 'border-purple-400',
        glow: 'shadow-purple-500/50',
        text: 'text-purple-400'
    },
    LEGENDARY: {
        bg: 'from-yellow-400 via-orange-500 to-red-500',
        border: 'border-yellow-400',
        glow: 'shadow-yellow-500/50',
        text: 'text-yellow-400'
    }
}

export default function BadgeDisplay({
    title,
    titleAr,
    description,
    descriptionAr,
    icon,
    color,
    rarity,
    isEarned,
    progress,
    earnedAt,
    xpReward,
    onClick,
    showProgress = true,
    isArabic = false
}: BadgeProps) {
    const rarityStyle = rarityColors[rarity]
    const displayTitle = isArabic && titleAr ? titleAr : title
    const displayDescription = isArabic && descriptionAr ? descriptionAr : description

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: onClick ? 1.05 : 1 }}
            onClick={onClick}
            className={`relative bg-gray-900/50 backdrop-blur-sm border ${
                isEarned ? rarityStyle.border : 'border-border'
            } rounded-xl p-6 transition-all ${
                onClick ? 'cursor-pointer hover:bg-gray-900/70' : ''
            } ${isEarned ? `shadow-lg ${rarityStyle.glow}` : ''}`}
        >
            {/* Rarity indicator */}
            <div className="absolute top-2 right-2">
                <span className={`text-xs font-bold ${rarityStyle.text}`}>
                    {rarity}
                </span>
            </div>

            {/* Badge Icon */}
            <div className="flex flex-col items-center mb-4">
                <motion.div
                    animate={isEarned ? {
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{
                        duration: 2,
                        repeat: isEarned ? Infinity : 0,
                        repeatDelay: 3
                    }}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center border-4 ${
                        isEarned 
                            ? `bg-gradient-to-br ${rarityStyle.bg} ${rarityStyle.border}` 
                            : 'bg-card border-border'
                    }`}
                >
                    {isEarned ? (
                        <span className="text-4xl">{icon}</span>
                    ) : (
                        <Lock className="w-8 h-8 text-muted-foreground" />
                    )}

                    {/* Sparkle effect for earned badges */}
                    {isEarned && (
                        <motion.div
                            animate={{
                                opacity: [0, 1, 0],
                                scale: [0.8, 1.2, 0.8]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1
                            }}
                            className="absolute -top-2 -right-2"
                        >
                            <Sparkles className={`w-6 h-6 ${rarityStyle.text}`} />
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Badge Info */}
            <div className="text-center space-y-2">
                <h3 className={`font-bold text-lg ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {displayTitle}
                </h3>
                <p className={`text-sm ${isEarned ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {displayDescription}
                </p>

                {/* XP Reward */}
                <div className="flex items-center justify-center space-x-1 text-purple-400">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-semibold">+{xpReward} XP</span>
                </div>

                {/* Progress Bar */}
                {showProgress && !isEarned && progress > 0 && (
                    <div className="space-y-1">
                        <div className="w-full bg-card rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{progress.toFixed(0)}% complete</p>
                    </div>
                )}

                {/* Earned Date */}
                {isEarned && earnedAt && (
                    <div className="flex items-center justify-center space-x-1 text-muted-foreground text-xs">
                        <Trophy className="w-3 h-3" />
                        <span>
                            Earned {new Date(earnedAt).toLocaleDateString()}
                        </span>
                    </div>
                )}

                {/* Locked Message */}
                {!isEarned && progress === 0 && (
                    <div className="flex items-center justify-center space-x-1 text-muted-foreground text-xs">
                        <Lock className="w-3 h-3" />
                        <span>Not yet unlocked</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
