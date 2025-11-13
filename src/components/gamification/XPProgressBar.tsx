'use client'

import { motion } from 'framer-motion'
import { Zap, TrendingUp } from 'lucide-react'

interface XPProgressBarProps {
    currentXP: number
    totalXP: number
    currentLevel: number
    xpToNextLevel: number
    levelProgress: number
    showDetails?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export default function XPProgressBar({
    currentXP,
    totalXP,
    currentLevel,
    xpToNextLevel,
    levelProgress,
    showDetails = true,
    size = 'md'
}: XPProgressBarProps) {
    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    }

    const textSizeClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    }

    return (
        <div className="space-y-2">
            {showDetails && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                            <span className="text-foreground font-bold text-sm">{currentLevel}</span>
                        </div>
                        <div>
                            <p className="text-foreground font-semibold">Level {currentLevel}</p>
                            <p className={`text-muted-foreground ${textSizeClasses[size]}`}>
                                {currentXP.toLocaleString()} / {(currentXP + xpToNextLevel).toLocaleString()} XP
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center space-x-1 text-purple-400">
                            <Zap className="w-4 h-4" />
                            <span className="font-bold">{totalXP.toLocaleString()}</span>
                        </div>
                        <p className={`text-muted-foreground ${textSizeClasses[size]}`}>Total XP</p>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="relative">
                <div className={`w-full bg-card rounded-full overflow-hidden ${sizeClasses[size]}`}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${levelProgress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 relative"
                        style={{
                            boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
                        }}
                    >
                        {/* Shimmer effect */}
                        <motion.div
                            animate={{
                                x: ['-100%', '100%']
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'linear'
                            }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                    </motion.div>
                </div>

                {/* Next level indicator */}
                <div className="absolute -right-1 -top-2 flex flex-col items-center">
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg">
                        <span className="text-xs font-bold text-foreground">{currentLevel + 1}</span>
                    </div>
                </div>
            </div>

            {/* XP needed text */}
            {showDetails && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-muted-foreground text-xs">
                        <TrendingUp className="w-3 h-3" />
                        <span>{levelProgress.toFixed(1)}% to next level</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {xpToNextLevel.toLocaleString()} XP needed
                    </span>
                </div>
            )}
        </div>
    )
}
