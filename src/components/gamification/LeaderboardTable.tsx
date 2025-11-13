'use client'

import { motion } from 'framer-motion'
import { Trophy, Medal, Award, TrendingUp, User } from 'lucide-react'
import Image from 'next/image'

interface LeaderboardEntry {
    rank: number
    userId: string
    userName: string
    userNameAr?: string
    profileImage?: string
    totalXP?: number
    currentLevel?: number
    currentStreak?: number
    totalScore?: number
    quizScore?: number
    projectScore?: number
    participationScore?: number
}

interface LeaderboardTableProps {
    entries: LeaderboardEntry[]
    type: 'xp' | 'course'
    currentUserId?: string
    currentUserRank?: any
    isArabic?: boolean
}

export default function LeaderboardTable({
    entries,
    type,
    currentUserId,
    currentUserRank,
    isArabic = false
}: LeaderboardTableProps) {
    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            case 2:
                return <Medal className="w-6 h-6 text-muted-foreground fill-gray-300" />
            case 3:
                return <Medal className="w-6 h-6 text-orange-400 fill-orange-400" />
            default:
                return <span className="text-muted-foreground font-bold">#{rank}</span>
        }
    }

    const getRankBackground = (rank: number) => {
        switch (rank) {
            case 1:
                return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30'
            case 2:
                return 'from-gray-400/20 to-gray-500/20 border-gray-400/30'
            case 3:
                return 'from-orange-500/20 to-orange-600/20 border-orange-500/30'
            default:
                return 'from-gray-900/50 to-gray-800/50 border-border'
        }
    }

    const isCurrentUser = (userId: string) => userId === currentUserId

    return (
        <div className="space-y-4">
            {/* Current user rank highlight */}
            {currentUserRank && currentUserRank.rank > 10 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-purple-900/30 border border-purple-500/50 rounded-xl p-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-full border-2 border-purple-500">
                                <span className="text-purple-300 font-bold">#{currentUserRank.rank}</span>
                            </div>
                            <div>
                                <p className="text-foreground font-semibold">Your Position</p>
                                <p className="text-sm text-muted-foreground">
                                    {type === 'xp' 
                                        ? `Level ${currentUserRank.currentLevel} • ${currentUserRank.totalXP.toLocaleString()} XP`
                                        : `${currentUserRank.totalScore.toLocaleString()} points`
                                    }
                                </p>
                            </div>
                        </div>
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                </motion.div>
            )}

            {/* Leaderboard entries */}
            <div className="space-y-3">
                {entries.map((entry, index) => (
                    <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`relative bg-gradient-to-r ${getRankBackground(entry.rank)} backdrop-blur-sm border rounded-xl p-4 ${
                            isCurrentUser(entry.userId) ? 'ring-2 ring-purple-500' : ''
                        } hover:border-purple-500/50 transition-all`}
                    >
                        <div className="flex items-center space-x-4">
                            {/* Rank */}
                            <div className="flex-shrink-0 w-12 flex items-center justify-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* User Info */}
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {entry.profileImage ? (
                                    <Image
                                        src={entry.profileImage}
                                        alt={entry.userName}
                                        width={48}
                                        height={48}
                                        className="rounded-full border-2 border-border"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center border-2 border-gray-600">
                                        <User className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-foreground font-semibold truncate">
                                        {isArabic && entry.userNameAr ? entry.userNameAr : entry.userName}
                                        {isCurrentUser(entry.userId) && (
                                            <span className="ml-2 text-xs text-purple-400">(You)</span>
                                        )}
                                    </h4>
                                    {type === 'xp' ? (
                                        <p className="text-sm text-muted-foreground">
                                            Level {entry.currentLevel} • {entry.currentStreak} day streak 🔥
                                        </p>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">
                                            Quiz: {entry.quizScore} • Project: {entry.projectScore} • Participation: {entry.participationScore}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Score */}
                            <div className="flex-shrink-0 text-right">
                                <div className="flex items-center space-x-2">
                                    {type === 'xp' ? (
                                        <>
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-bold text-foreground">
                                                    {entry.totalXP?.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-muted-foreground">XP</span>
                                            </div>
                                            <Award className="w-6 h-6 text-purple-400" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex flex-col items-end">
                                                <span className="text-2xl font-bold text-foreground">
                                                    {entry.totalScore?.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-muted-foreground">points</span>
                                            </div>
                                            <Trophy className="w-6 h-6 text-purple-400" />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Podium decoration for top 3 */}
                        {entry.rank <= 3 && (
                            <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
                                <div className={`absolute top-2 right-2 w-16 h-16 ${
                                    entry.rank === 1 ? 'bg-yellow-400/10' :
                                    entry.rank === 2 ? 'bg-gray-400/10' :
                                    'bg-orange-400/10'
                                } rounded-full blur-xl`} />
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Empty state */}
            {entries.length === 0 && (
                <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg font-semibold">No leaderboard entries yet</p>
                    <p className="text-muted-foreground text-sm mt-2">Be the first to join the leaderboard!</p>
                </div>
            )}
        </div>
    )
}
