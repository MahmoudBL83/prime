'use client'

import { motion } from 'framer-motion'
import { User, Mail, Calendar, MessageCircle, BarChart3, MoreVertical, X, ArrowUpCircle } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface Member {
    id: string
    user: {
        id: string
        name: string
        email: string
        profileImage?: string
        arabicName?: string
    }
    tier: {
        id: string
        name: string
        nameAr?: string
        color?: string
        icon?: string
    }
    status: string
    priceAtPurchase: number
    startedAt: string
    lastActivityAt: string
    totalMessages: number
    totalPollVotes: number
}

interface MemberRowProps {
    member: Member
    onRemove: (userId: string) => void
    onUpgradeTier: (userId: string) => void
}

const statusColors = {
    ACTIVE: 'bg-green-500/20 text-green-400',
    PAUSED: 'bg-yellow-500/20 text-yellow-400',
    CANCELLED: 'bg-red-500/20 text-red-400',
    EXPIRED: 'bg-background0/20 text-muted-foreground',
    PENDING: 'bg-blue-500/20 text-blue-400'
}

export default function MemberRow({ member, onRemove, onUpgradeTier }: MemberRowProps) {
    const [showActions, setShowActions] = useState(false)

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const daysSinceJoined = Math.floor(
        (new Date().getTime() - new Date(member.startedAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    return (
        <motion.tr
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-border hover:bg-gray-800/30 transition-colors"
        >
            {/* User Info */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        {member.user.profileImage ? (
                            <Image
                                src={member.user.profileImage}
                                alt={member.user.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-foreground font-medium">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.user.email}
                        </p>
                    </div>
                </div>
            </td>

            {/* Tier */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{member.tier.icon || '⭐'}</span>
                    <div>
                        <p className="text-foreground font-medium text-sm">{member.tier.name}</p>
                        <p className="text-xs text-muted-foreground">
                            ${member.priceAtPurchase}/month
                        </p>
                    </div>
                </div>
            </td>

            {/* Status */}
            <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[member.status as keyof typeof statusColors]}`}>
                    {member.status}
                </span>
            </td>

            {/* Joined Date */}
            <td className="px-6 py-4">
                <div className="text-sm">
                    <p className="text-foreground">{formatDate(member.startedAt)}</p>
                    <p className="text-xs text-muted-foreground">
                        {daysSinceJoined} days ago
                    </p>
                </div>
            </td>

            {/* Engagement */}
            <td className="px-6 py-4">
                <div className="flex gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="w-3 h-3" />
                        <span>{member.totalMessages}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BarChart3 className="w-3 h-3" />
                        <span>{member.totalPollVotes}</span>
                    </div>
                </div>
            </td>

            {/* Last Activity */}
            <td className="px-6 py-4">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(member.lastActivityAt)}
                </div>
            </td>

            {/* Actions */}
            <td className="px-6 py-4 relative">
                <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                </button>

                {showActions && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowActions(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-6 top-12 z-20 bg-card border border-border rounded-lg shadow-xl overflow-hidden min-w-[180px]"
                        >
                            <button
                                onClick={() => {
                                    onUpgradeTier(member.user.id)
                                    setShowActions(false)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <ArrowUpCircle className="w-4 h-4" />
                                Upgrade Tier
                            </button>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to remove this member?')) {
                                        onRemove(member.user.id)
                                    }
                                    setShowActions(false)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Remove Member
                            </button>
                        </motion.div>
                    </>
                )}
            </td>
        </motion.tr>
    )
}
