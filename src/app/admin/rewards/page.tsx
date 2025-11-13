'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Trophy,
    Plus,
    Award,
    Target,
    Users,
    DollarSign,
    Calendar,
    CheckCircle,
    Clock,
    XCircle,
    Edit,
    Eye,
    AlertTriangle,
    TrendingUp,
    Gift,
    Medal,
    Star,
    Shield,
    Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'

type RewardStatus = 'active' | 'upcoming' | 'completed' | 'cancelled'
type RewardType = 'course' | 'exam' | 'project' | 'platform'

interface Reward {
    id: string
    name: string
    type: RewardType
    status: RewardStatus
    prizePool: number
    participants: number
    winners: number
    startDate: string
    endDate: string
    eligibility: string[]
    createdBy: 'platform' | 'creator'
}

export default function RewardsManagementPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all')
    const [showCreateModal, setShowCreateModal] = useState(false)

    const rewards: Reward[] = [
        {
            id: '1',
            name: 'Math Excellence Award 2024',
            type: 'exam',
            status: 'active',
            prizePool: 5000,
            participants: 1234,
            winners: 10,
            startDate: '2024-10-01',
            endDate: '2024-12-31',
            eligibility: ['Enrolled in Math courses', 'Completed at least 3 quizzes', 'Age 16+'],
            createdBy: 'platform'
        },
        {
            id: '2',
            name: 'Web Development Project Challenge',
            type: 'project',
            status: 'active',
            prizePool: 3000,
            participants: 567,
            winners: 5,
            startDate: '2024-09-15',
            endDate: '2024-11-30',
            eligibility: ['Submitted project', 'Passed peer review', 'Original work'],
            createdBy: 'creator'
        },
        {
            id: '3',
            name: 'Complete 100 Hours Learning',
            type: 'platform',
            status: 'active',
            prizePool: 10000,
            participants: 3456,
            winners: 50,
            startDate: '2024-10-01',
            endDate: '2024-12-31',
            eligibility: ['100+ learning hours', 'Active account', 'Verified email'],
            createdBy: 'platform'
        },
        {
            id: '4',
            name: 'Python Mastery Scholarship',
            type: 'course',
            status: 'upcoming',
            prizePool: 2500,
            participants: 0,
            winners: 15,
            startDate: '2024-11-01',
            endDate: '2025-01-31',
            eligibility: ['Complete Python course', '90%+ quiz scores', 'Final project'],
            createdBy: 'platform'
        },
        {
            id: '5',
            name: 'Summer Learning Champions',
            type: 'platform',
            status: 'completed',
            prizePool: 8000,
            participants: 2345,
            winners: 25,
            startDate: '2024-06-01',
            endDate: '2024-08-31',
            eligibility: ['50+ learning hours', 'Active during summer', 'Course completion'],
            createdBy: 'platform'
        }
    ]

    const stats = {
        totalRewards: rewards.length,
        activeRewards: rewards.filter(r => r.status === 'active').length,
        totalPrizePool: rewards.reduce((sum, r) => sum + r.prizePool, 0),
        totalParticipants: rewards.reduce((sum, r) => sum + r.participants, 0),
        totalWinners: rewards.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.winners, 0)
    }

    const filteredRewards = activeTab === 'all' 
        ? rewards 
        : rewards.filter(r => r.status === activeTab)

    const getStatusColor = (status: RewardStatus) => {
        switch (status) {
            case 'active': return 'bg-green-600/20 text-green-400 border-green-600/30'
            case 'upcoming': return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
            case 'completed': return 'bg-gray-600/20 text-muted-foreground border-gray-600/30'
            case 'cancelled': return 'bg-red-600/20 text-red-400 border-red-600/30'
        }
    }

    const getTypeIcon = (type: RewardType) => {
        switch (type) {
            case 'course': return Award
            case 'exam': return Target
            case 'project': return Trophy
            case 'platform': return Medal
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
                        Rewards & Scholarships
                    </h1>
                    <p className="text-muted-foreground">
                        Manage learning rewards, scholarships, and prize campaigns
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                        <Download className="w-4 h-4 mr-2" />
                        Export Winners
                    </Button>
                    <Button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Reward
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-600/20 rounded-xl p-3">
                            <Trophy className="h-6 w-6 text-purple-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {stats.totalRewards}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Rewards</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-600/20 rounded-xl p-3">
                            <CheckCircle className="h-6 w-6 text-green-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {stats.activeRewards}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Now</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-yellow-600/20 rounded-xl p-3">
                            <DollarSign className="h-6 w-6 text-yellow-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {formatPrice(stats.totalPrizePool)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Prize Pool</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-600/20 rounded-xl p-3">
                            <Users className="h-6 w-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {stats.totalParticipants.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Participants</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-600/20 rounded-xl p-3">
                            <Star className="h-6 w-6 text-orange-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {stats.totalWinners}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Winners</div>
                </motion.div>
            </div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-2"
            >
                <div className="flex gap-2">
                    {(['all', 'active', 'upcoming', 'completed'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all capitalize ${
                                activeTab === tab
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Rewards List */}
            <div className="space-y-4">
                {filteredRewards.map((reward, index) => {
                    const TypeIcon = getTypeIcon(reward.type)
                    return (
                        <motion.div
                            key={reward.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                                        reward.status === 'active' ? 'bg-gradient-to-br from-green-600 to-emerald-600' :
                                        reward.status === 'upcoming' ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
                                        reward.status === 'completed' ? 'bg-gradient-to-br from-gray-600 to-gray-700' :
                                        'bg-gradient-to-br from-red-600 to-pink-600'
                                    }`}>
                                        <TypeIcon className="w-8 h-8 text-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-foreground">{reward.name}</h3>
                                            <Badge className={getStatusColor(reward.status) + ' capitalize'}>
                                                {reward.status}
                                            </Badge>
                                            <Badge className={`${
                                                reward.createdBy === 'platform' 
                                                    ? 'bg-purple-600/20 text-purple-400 border-purple-600/30'
                                                    : 'bg-orange-600/20 text-orange-400 border-orange-600/30'
                                            } capitalize`}>
                                                {reward.createdBy}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Prize Pool</p>
                                                <p className="text-sm font-semibold text-green-400">
                                                    {formatPrice(reward.prizePool)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Participants</p>
                                                <p className="text-sm font-semibold text-blue-400">
                                                    {reward.participants.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Winners</p>
                                                <p className="text-sm font-semibold text-yellow-400">
                                                    {reward.winners}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Duration</p>
                                                <p className="text-sm font-semibold text-foreground">
                                                    {new Date(reward.startDate).toLocaleDateString()} - {new Date(reward.endDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Eligibility Requirements:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {reward.eligibility.map((req, i) => (
                                                    <Badge key={i} className="bg-white/5 text-muted-foreground border-border text-xs">
                                                        <CheckCircle className="w-3 h-3 mr-1" />
                                                        {req}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Fraud Detection Alert */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-r from-red-600/20 to-orange-600/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
            >
                <div className="flex items-start gap-4">
                    <div className="bg-red-600/20 rounded-xl p-3">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Fraud Detection System
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            AI-powered monitoring detects suspicious patterns in submissions, voting, and winner selection.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-green-400" />
                                    <span className="text-sm font-semibold text-foreground">Identity Verification</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Required for prizes over $100
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm font-semibold text-foreground">Duplicate Detection</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Prevents multiple accounts
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold text-foreground">Pattern Analysis</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Detects gaming behavior
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
