'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    DollarSign,
    TrendingUp,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Ban,
    Search,
    Filter,
    MoreVertical,
    Play,
    FileText,
    MessageSquare,
    BarChart3,
    Shield,
    Flag
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Channel {
    id: string
    name: string
    creator: {
        id: string
        name: string
        avatar: string
        verified: boolean
    }
    pricing: {
        monthly: number
        annual: number
    }
    subscribers: number
    revenue: number
    status: 'active' | 'pending' | 'suspended' | 'rejected'
    contentCount: {
        videos: number
        documents: number
        discussions: number
    }
    compliance: {
        policyViolations: number
        contentFlags: number
        dmcaNotices: number
    }
    createdAt: string
    lastActivity: string
}

const mockChannels: Channel[] = [
    {
        id: '1',
        name: 'Advanced JavaScript Mastery',
        creator: {
            id: 'c1',
            name: 'Ahmed Hassan',
            avatar: 'AH',
            verified: true
        },
        pricing: {
            monthly: 299,
            annual: 2999
        },
        subscribers: 847,
        revenue: 253130,
        status: 'active',
        contentCount: {
            videos: 45,
            documents: 120,
            discussions: 234
        },
        compliance: {
            policyViolations: 0,
            contentFlags: 0,
            dmcaNotices: 0
        },
        createdAt: '2025-08-15',
        lastActivity: '2025-10-14'
    },
    {
        id: '2',
        name: 'Medical School Prep Community',
        creator: {
            id: 'c2',
            name: 'Dr. Fatima Ali',
            avatar: 'FA',
            verified: true
        },
        pricing: {
            monthly: 499,
            annual: 4999
        },
        subscribers: 562,
        revenue: 280438,
        status: 'active',
        contentCount: {
            videos: 78,
            documents: 340,
            discussions: 892
        },
        compliance: {
            policyViolations: 0,
            contentFlags: 1,
            dmcaNotices: 0
        },
        createdAt: '2025-07-20',
        lastActivity: '2025-10-15'
    },
    {
        id: '3',
        name: 'UI/UX Design Inner Circle',
        creator: {
            id: 'c3',
            name: 'Omar Khalil',
            avatar: 'OK',
            verified: false
        },
        pricing: {
            monthly: 399,
            annual: 3999
        },
        subscribers: 0,
        revenue: 0,
        status: 'pending',
        contentCount: {
            videos: 0,
            documents: 5,
            discussions: 0
        },
        compliance: {
            policyViolations: 0,
            contentFlags: 0,
            dmcaNotices: 0
        },
        createdAt: '2025-10-10',
        lastActivity: '2025-10-12'
    },
    {
        id: '4',
        name: 'Engineering Mathematics Elite',
        creator: {
            id: 'c4',
            name: 'Mohamed Samir',
            avatar: 'MS',
            verified: true
        },
        pricing: {
            monthly: 349,
            annual: 3499
        },
        subscribers: 234,
        revenue: 81666,
        status: 'active',
        contentCount: {
            videos: 32,
            documents: 89,
            discussions: 156
        },
        compliance: {
            policyViolations: 0,
            contentFlags: 0,
            dmcaNotices: 0
        },
        createdAt: '2025-09-01',
        lastActivity: '2025-10-13'
    },
    {
        id: '5',
        name: 'Business Strategy Mastermind',
        creator: {
            id: 'c5',
            name: 'Sarah Ibrahim',
            avatar: 'SI',
            verified: false
        },
        pricing: {
            monthly: 799,
            annual: 7999
        },
        subscribers: 12,
        revenue: 9588,
        status: 'suspended',
        contentCount: {
            videos: 8,
            documents: 15,
            discussions: 23
        },
        compliance: {
            policyViolations: 3,
            contentFlags: 7,
            dmcaNotices: 1
        },
        createdAt: '2025-09-20',
        lastActivity: '2025-10-05'
    }
]

export default function AdminChannelsPage() {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'issues'>('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)

    const stats = {
        totalChannels: 42,
        pendingApproval: 5,
        activeChannels: 35,
        suspended: 2,
        totalRevenue: 1847293,
        avgSubscribers: 418,
        flaggedContent: 12
    }

    const filteredChannels = mockChannels.filter(channel => {
        const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            channel.creator.name.toLowerCase().includes(searchQuery.toLowerCase())
        
        if (activeTab === 'all') return matchesSearch
        if (activeTab === 'pending') return matchesSearch && channel.status === 'pending'
        if (activeTab === 'active') return matchesSearch && channel.status === 'active'
        if (activeTab === 'issues') return matchesSearch && (channel.status === 'suspended' || 
            channel.compliance.policyViolations > 0 || 
            channel.compliance.contentFlags > 0 || 
            channel.compliance.dmcaNotices > 0)
        return matchesSearch
    })

    const getStatusColor = (status: Channel['status']) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
            case 'suspended': return 'bg-red-500/20 text-red-400 border-red-500/30'
            case 'rejected': return 'bg-background0/20 text-muted-foreground border-gray-500/30'
        }
    }

    const getStatusIcon = (status: Channel['status']) => {
        switch (status) {
            case 'active': return <CheckCircle className="w-4 h-4" />
            case 'pending': return <Clock className="w-4 h-4" />
            case 'suspended': return <Ban className="w-4 h-4" />
            case 'rejected': return <XCircle className="w-4 h-4" />
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-red-950/20">
            <div className="p-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-purple-400">
                                Membership Channels
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Category C: Private Membership Communities
                            </p>
                        </div>
                        <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-foreground">
                            <Eye className="w-4 h-4 mr-2" />
                            View Pricing Guidelines
                        </Button>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Channels', value: stats.totalChannels, icon: Users, color: 'from-blue-600 to-cyan-600' },
                        { label: 'Pending Approval', value: stats.pendingApproval, icon: Clock, color: 'from-yellow-600 to-orange-600', badge: true },
                        { label: 'Total Revenue', value: `E£${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-green-600 to-emerald-600' },
                        { label: 'Flagged Content', value: stats.flaggedContent, icon: Flag, color: 'from-red-600 to-pink-600', badge: stats.flaggedContent > 0 }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border transition-all group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <stat.icon className={`w-8 h-8 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                                    {stat.badge && (
                                        <Badge className="bg-red-600 text-foreground">
                                            Action Required
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6">
                    {[
                        { id: 'all', label: 'All Channels', count: mockChannels.length },
                        { id: 'pending', label: 'Pending Approval', count: mockChannels.filter(c => c.status === 'pending').length },
                        { id: 'active', label: 'Active', count: mockChannels.filter(c => c.status === 'active').length },
                        { id: 'issues', label: 'Issues', count: mockChannels.filter(c => c.status === 'suspended' || c.compliance.policyViolations > 0).length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-foreground'
                                    : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                            }`}
                        >
                            {tab.label}
                            <Badge className="ml-2 bg-white/20 text-foreground">
                                {tab.count}
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search channels or creators..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                    </div>
                    <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters
                    </Button>
                </div>

                {/* Channels List */}
                <div className="space-y-4">
                    {filteredChannels.map((channel, index) => (
                        <motion.div
                            key={channel.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Creator Avatar */}
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center text-foreground font-bold text-xl">
                                            {channel.creator.avatar}
                                        </div>
                                        {channel.creator.verified && (
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-4 h-4 text-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Channel Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-bold text-foreground">{channel.name}</h3>
                                            <Badge className={`${getStatusColor(channel.status)} border`}>
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(channel.status)}
                                                    <span className="capitalize">{channel.status}</span>
                                                </div>
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-3">by {channel.creator.name}</p>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Users className="w-4 h-4 text-blue-400" />
                                                    <p className="text-xs text-muted-foreground">Subscribers</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{channel.subscribers}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <DollarSign className="w-4 h-4 text-green-400" />
                                                    <p className="text-xs text-muted-foreground">Revenue</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">E£{channel.revenue.toLocaleString()}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Play className="w-4 h-4 text-purple-400" />
                                                    <p className="text-xs text-muted-foreground">Videos</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{channel.contentCount.videos}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="w-4 h-4 text-yellow-400" />
                                                    <p className="text-xs text-muted-foreground">Documents</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{channel.contentCount.documents}</p>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare className="w-4 h-4 text-pink-400" />
                                                    <p className="text-xs text-muted-foreground">Discussions</p>
                                                </div>
                                                <p className="text-lg font-bold text-foreground">{channel.contentCount.discussions}</p>
                                            </div>
                                        </div>

                                        {/* Pricing */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-lg px-4 py-2">
                                                <p className="text-xs text-muted-foreground mb-1">Monthly</p>
                                                <p className="text-lg font-bold text-green-400">E£{channel.pricing.monthly}</p>
                                            </div>
                                            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-lg px-4 py-2">
                                                <p className="text-xs text-muted-foreground mb-1">Annual</p>
                                                <p className="text-lg font-bold text-blue-400">E£{channel.pricing.annual}</p>
                                            </div>
                                        </div>

                                        {/* Compliance Flags */}
                                        {(channel.compliance.policyViolations > 0 || 
                                          channel.compliance.contentFlags > 0 || 
                                          channel.compliance.dmcaNotices > 0) && (
                                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                                    <p className="text-sm font-semibold text-red-400">Compliance Issues</p>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm">
                                                    {channel.compliance.policyViolations > 0 && (
                                                        <span className="text-muted-foreground">
                                                            {channel.compliance.policyViolations} Policy Violations
                                                        </span>
                                                    )}
                                                    {channel.compliance.contentFlags > 0 && (
                                                        <span className="text-muted-foreground">
                                                            {channel.compliance.contentFlags} Content Flags
                                                        </span>
                                                    )}
                                                    {channel.compliance.dmcaNotices > 0 && (
                                                        <span className="text-muted-foreground">
                                                            {channel.compliance.dmcaNotices} DMCA Notices
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Dates */}
                                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                            <span>Created: {new Date(channel.createdAt).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>Last Activity: {new Date(channel.lastActivity).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {channel.status === 'pending' && (
                                        <>
                                            <Button className="bg-green-600 hover:bg-green-700 text-foreground">
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Approve
                                            </Button>
                                            <Button className="bg-red-600 hover:bg-red-700 text-foreground">
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {channel.status === 'active' && (
                                        <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border">
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Details
                                        </Button>
                                    )}
                                    {channel.status === 'suspended' && (
                                        <Button className="bg-blue-600 hover:bg-blue-700 text-foreground">
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Restore
                                        </Button>
                                    )}
                                    <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border px-3">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredChannels.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">No channels found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
