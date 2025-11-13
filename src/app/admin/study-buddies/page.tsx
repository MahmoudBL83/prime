'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Heart,
    TrendingUp,
    Target,
    MessageSquare,
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Settings as SettingsIcon,
    Search,
    Filter,
    Eye,
    Ban,
    Zap,
    Globe,
    Book
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Match {
    id: string
    user1: {
        name: string
        subjects: string[]
    }
    user2: {
        name: string
        subjects: string[]
    }
    compatibilityScore: number
    status: 'active' | 'inactive' | 'reported'
    matchedAt: string
    lastActivity: string
    sessionsCompleted: number
}

export default function StudyBuddyManagementPage() {
    const [activeTab, setActiveTab] = useState<'matches' | 'reported' | 'analytics' | 'settings'>('matches')

    const matches: Match[] = [
        {
            id: '1',
            user1: { name: 'Ahmed Hassan', subjects: ['Mathematics', 'Physics'] },
            user2: { name: 'Sara Mohamed', subjects: ['Mathematics', 'Chemistry'] },
            compatibilityScore: 89,
            status: 'active',
            matchedAt: '2024-10-10T10:00:00',
            lastActivity: '2024-10-15T14:30:00',
            sessionsCompleted: 12
        },
        {
            id: '2',
            user1: { name: 'Omar Ali', subjects: ['Programming', 'Web Development'] },
            user2: { name: 'Layla Ibrahim', subjects: ['Programming', 'Design'] },
            compatibilityScore: 92,
            status: 'active',
            matchedAt: '2024-10-08T15:00:00',
            lastActivity: '2024-10-15T11:20:00',
            sessionsCompleted: 18
        },
        {
            id: '3',
            user1: { name: 'Fatma Youssef', subjects: ['English', 'Literature'] },
            user2: { name: 'Mohamed Kamal', subjects: ['English', 'History'] },
            compatibilityScore: 76,
            status: 'inactive',
            matchedAt: '2024-09-20T09:00:00',
            lastActivity: '2024-10-01T10:00:00',
            sessionsCompleted: 5
        },
        {
            id: '4',
            user1: { name: 'Nour Ahmed', subjects: ['Biology', 'Chemistry'] },
            user2: { name: 'Suspicious User', subjects: ['Biology'] },
            compatibilityScore: 84,
            status: 'reported',
            matchedAt: '2024-10-12T13:00:00',
            lastActivity: '2024-10-14T16:45:00',
            sessionsCompleted: 3
        }
    ]

    const stats = {
        totalMatches: 1247,
        activeMatches: 892,
        avgCompatibility: 82,
        avgSessionsPerMatch: 8.5,
        reportedMatches: 12,
        matchSuccessRate: 78
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-600/20 text-green-400 border-green-600/30'
            case 'inactive': return 'bg-gray-600/20 text-muted-foreground border-gray-600/30'
            case 'reported': return 'bg-red-600/20 text-red-400 border-red-600/30'
            default: return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
        }
    }

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Study Buddy Management
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor matching system, compatibility scores, and learner connections
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                    <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-foreground">
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Algorithm Settings
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-pink-600/20 rounded-xl p-2">
                            <Heart className="h-5 w-5 text-pink-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.totalMatches.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Matches</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-600/20 rounded-xl p-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.activeMatches}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Now</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600/20 rounded-xl p-2">
                            <Target className="h-5 w-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.avgCompatibility}%
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Compatibility</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-600/20 rounded-xl p-2">
                            <MessageSquare className="h-5 w-5 text-purple-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.avgSessionsPerMatch}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Sessions</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-600/20 rounded-xl p-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.reportedMatches}
                    </div>
                    <div className="text-xs text-muted-foreground">Reported</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-yellow-600/20 rounded-xl p-2">
                            <TrendingUp className="h-5 w-5 text-yellow-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.matchSuccessRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                </motion.div>
            </div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-2"
            >
                <div className="flex gap-2">
                    {[
                        { id: 'matches' as const, label: 'All Matches', icon: Heart },
                        { id: 'reported' as const, label: 'Reported', icon: AlertTriangle },
                        { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
                        { id: 'settings' as const, label: 'Algorithm', icon: SettingsIcon }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Matches Content */}
            {activeTab === 'matches' && (
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="bg-white/5 backdrop-blur-xl border border-border rounded-xl p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search matches by user name, subject..."
                                className="w-full bg-white/10 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                            />
                        </div>
                    </div>

                    {/* Matches List */}
                    {matches.map((match, index) => (
                        <motion.div
                            key={match.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 + index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-start gap-6">
                                <div className="flex items-center gap-4 flex-1">
                                    {/* User 1 */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-foreground font-bold">
                                                {match.user1.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{match.user1.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {match.user1.subjects.map((subject, i) => (
                                                        <Badge key={i} className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">
                                                            {subject}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Compatibility */}
                                    <div className="flex flex-col items-center px-6">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                            match.compatibilityScore >= 85 ? 'bg-gradient-to-br from-green-600 to-emerald-600' :
                                            match.compatibilityScore >= 70 ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
                                            'bg-gradient-to-br from-yellow-600 to-orange-600'
                                        }`}>
                                            <span className="text-lg font-bold text-foreground">{match.compatibilityScore}%</span>
                                        </div>
                                        <Heart className="w-5 h-5 text-pink-400 mt-2" />
                                    </div>

                                    {/* User 2 */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-red-600 rounded-full flex items-center justify-center text-foreground font-bold">
                                                {match.user2.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{match.user2.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {match.user2.subjects.map((subject, i) => (
                                                        <Badge key={i} className="bg-pink-600/20 text-pink-400 border-pink-600/30 text-xs">
                                                            {subject}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Match Info */}
                                <div className="flex flex-col gap-2 min-w-[200px]">
                                    <Badge className={getStatusColor(match.status) + ' capitalize justify-center'}>
                                        {match.status}
                                    </Badge>
                                    <div className="bg-white/5 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Sessions</span>
                                            <span className="text-foreground font-semibold">{match.sessionsCompleted}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Matched</span>
                                            <span className="text-foreground font-semibold">
                                                {new Date(match.matchedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Last Active</span>
                                            <span className="text-foreground font-semibold">
                                                {new Date(match.lastActivity).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button className="flex-1 bg-white/10 hover:bg-white/20 text-foreground text-xs py-1">
                                            <Eye className="w-3 h-3" />
                                        </Button>
                                        {match.status === 'reported' && (
                                            <Button className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs py-1">
                                                <Ban className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Algorithm Settings */}
            {activeTab === 'settings' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-8 space-y-6"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Compatibility Algorithm</h2>
                        <p className="text-muted-foreground">Configure matching signals and weights</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { name: 'Subject Overlap', weight: 40, icon: Book, color: 'blue' },
                            { name: 'Timezone Match', weight: 20, icon: Globe, color: 'green' },
                            { name: 'Goal Alignment', weight: 15, icon: Target, color: 'purple' },
                            { name: 'Study Pace', weight: 15, icon: Zap, color: 'yellow' },
                            { name: 'Availability', weight: 10, icon: Calendar, color: 'orange' }
                        ].map((signal, index) => (
                            <div key={index} className="bg-white/5 border border-border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`bg-${signal.color}-600/20 rounded-lg p-2`}>
                                        <signal.icon className={`w-5 h-5 text-${signal.color}-400`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">{signal.name}</p>
                                        <p className="text-xs text-muted-foreground">Weight: {signal.weight}%</p>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    defaultValue={signal.weight}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                            Reset to Default
                        </Button>
                        <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-foreground">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
