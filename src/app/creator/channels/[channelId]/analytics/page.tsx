'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    DollarSign,
    MessageSquare,
    BarChart3,
    Download,
    TrendingUp,
    Calendar,
    Loader2,
    FileDown,
    ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import StatCard from '@/components/analytics/StatCard'
import LineChart from '@/components/analytics/LineChart'
import BarChart from '@/components/analytics/BarChart'
import { toast } from 'react-hot-toast'

interface Overview {
    totalMembers: number
    activeMembers: number
    memberGrowth: number
    totalRevenue: number
    periodRevenue: number
    revenueGrowth: number
    totalMessages: number
    periodMessages: number
    totalPolls: number
    activePolls: number
    totalResources: number
    totalDownloads: number
}

interface RevenueData {
    revenue: {
        labels: string[]
        data: number[]
        total: number
        average: number
        peak: number
        peakDate: string
    }
    members: {
        labels: string[]
        data: number[]
        total: number
    }
}

interface EngagementData {
    timeline: {
        labels: string[]
        messages: number[]
        polls: number[]
        downloads: number[]
        votes: number[]
    }
    topContent: {
        messages: Array<{ id: string; title: string; engagement: number; reach: number }>
        polls: Array<{ id: string; title: string; votes: number }>
        resources: Array<{ id: string; title: string; downloads: number; type: string }>
    }
    rates: {
        messageReach: number
        pollParticipation: number
    }
}

interface PageProps {
    params: Promise<{
        channelId: string
    }>
}

export default function AnalyticsPage({ params }: PageProps) {
    const router = useRouter()
    const [channelId, setChannelId] = useState<string>('')
    const [overview, setOverview] = useState<Overview | null>(null)
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
    const [engagementData, setEngagementData] = useState<EngagementData | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('30')

    useEffect(() => {
        params.then(p => setChannelId(p.channelId))
    }, [params])

    useEffect(() => {
        if (channelId) {
            fetchAnalytics()
        }
    }, [channelId, period])

    const fetchAnalytics = async () => {
        try {
            setLoading(true)

            const [overviewRes, revenueRes, engagementRes] = await Promise.all([
                fetch(`/api/channels/${channelId}/analytics/overview?period=${period}`),
                fetch(`/api/channels/${channelId}/analytics/revenue?period=${period}`),
                fetch(`/api/channels/${channelId}/analytics/engagement?period=${period}`)
            ])

            if (!overviewRes.ok || !revenueRes.ok || !engagementRes.ok) {
                throw new Error('Failed to fetch analytics')
            }

            const [overviewData, revenueData, engagementData] = await Promise.all([
                overviewRes.json(),
                revenueRes.json(),
                engagementRes.json()
            ])

            setOverview(overviewData.overview)
            setRevenueData(revenueData)
            setEngagementData(engagementData)
        } catch (error) {
            console.error('Error fetching analytics:', error)
            toast.error('Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    const exportAnalytics = () => {
        if (!overview || !revenueData || !engagementData) return

        const csvContent = `Membership Analytics Report
Generated: ${new Date().toLocaleDateString()}
Period: Last ${period} days

OVERVIEW METRICS
Total Members,${overview.totalMembers}
Active Members,${overview.activeMembers}
Member Growth,${overview.memberGrowth}%
Total Revenue,$${overview.totalRevenue}
Period Revenue,$${overview.periodRevenue}
Revenue Growth,${overview.revenueGrowth}%
Total Messages,${overview.totalMessages}
Total Polls,${overview.totalPolls}
Total Resources,${overview.totalResources}
Total Downloads,${overview.totalDownloads}

REVENUE BREAKDOWN
Date,Revenue,New Members
${revenueData.revenue.labels.map((label, i) => 
    `${label},$${revenueData.revenue.data[i]},${revenueData.members.data[i]}`
).join('\n')}

TOP MESSAGES
Title,Engagement Rate,Reach
${engagementData.topContent.messages.map(m => 
    `"${m.title}",${m.engagement}%,${m.reach}`
).join('\n')}

TOP POLLS
Question,Total Votes
${engagementData.topContent.polls.map(p => 
    `"${p.title}",${p.votes}`
).join('\n')}

TOP RESOURCES
Title,Downloads,Type
${engagementData.topContent.resources.map(r => 
    `"${r.title}",${r.downloads},${r.type}`
).join('\n')}
`

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${channelId}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast.success('Analytics exported successfully!')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <BarChart3 className="w-8 h-8 text-purple-400" />
                                </div>
                                Analytics Dashboard
                            </h1>
                            <p className="text-gray-400 mt-1">
                                Comprehensive insights into your membership performance
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Period Filter */}
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                        </select>

                        {/* Export Button */}
                        <button
                            onClick={exportAnalytics}
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all flex items-center gap-2 font-medium"
                        >
                            <FileDown className="w-5 h-5" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Overview Stats */}
                {overview && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Members"
                            value={overview.totalMembers}
                            change={overview.memberGrowth}
                            icon={Users}
                            color="border-blue-500/30"
                            gradient="from-blue-500/20 to-blue-600/10"
                            delay={0.1}
                        />
                        <StatCard
                            title="Total Revenue"
                            value={`$${overview.totalRevenue.toLocaleString()}`}
                            change={overview.revenueGrowth}
                            icon={DollarSign}
                            color="border-green-500/30"
                            gradient="from-green-500/20 to-green-600/10"
                            delay={0.2}
                        />
                        <StatCard
                            title="Total Messages"
                            value={overview.totalMessages}
                            icon={MessageSquare}
                            color="border-purple-500/30"
                            gradient="from-purple-500/20 to-purple-600/10"
                            delay={0.3}
                        />
                        <StatCard
                            title="Total Downloads"
                            value={overview.totalDownloads}
                            icon={Download}
                            color="border-orange-500/30"
                            gradient="from-orange-500/20 to-orange-600/10"
                            delay={0.4}
                        />
                    </div>
                )}

                {/* Revenue Trends */}
                {revenueData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <TrendingUp className="w-6 h-6 text-green-400" />
                                    Revenue Trends
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Total: ${revenueData.revenue.total.toLocaleString()} | 
                                    Avg: ${revenueData.revenue.average.toLocaleString()}/day | 
                                    Peak: ${revenueData.revenue.peak} on {revenueData.revenue.peakDate}
                                </p>
                            </div>
                        </div>
                        <LineChart
                            data={revenueData.revenue.data}
                            labels={revenueData.revenue.labels}
                            label="Revenue"
                            color="#10b981"
                            height={250}
                        />
                    </motion.div>
                )}

                {/* Member Growth */}
                {revenueData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Users className="w-6 h-6 text-blue-400" />
                                    Member Growth
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    New members: {revenueData.members.total}
                                </p>
                            </div>
                        </div>
                        <LineChart
                            data={revenueData.members.data}
                            labels={revenueData.members.labels}
                            label="Members"
                            color="#3b82f6"
                            height={250}
                        />
                    </motion.div>
                )}

                {/* Engagement Metrics */}
                {engagementData && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <BarChart3 className="w-6 h-6 text-purple-400" />
                                    Engagement Overview
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Message reach: {engagementData.rates.messageReach}% | 
                                    Poll participation: {engagementData.rates.pollParticipation}%
                                </p>
                            </div>
                        </div>
                        <BarChart
                            data={[
                                engagementData.timeline.messages.reduce((a, b) => a + b, 0),
                                engagementData.timeline.polls.reduce((a, b) => a + b, 0),
                                engagementData.timeline.downloads.reduce((a, b) => a + b, 0),
                                engagementData.timeline.votes.reduce((a, b) => a + b, 0)
                            ]}
                            labels={['Messages Sent', 'Polls Created', 'Downloads', 'Poll Votes']}
                            colors={['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']}
                            height={200}
                        />
                    </motion.div>
                )}

                {/* Top Content */}
                {engagementData && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Messages */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4">Top Messages</h3>
                            <div className="space-y-3">
                                {engagementData.topContent.messages.slice(0, 5).map((msg, i) => (
                                    <div key={msg.id} className="p-3 bg-gray-800/50 rounded-lg">
                                        <p className="text-sm text-white font-medium line-clamp-1 mb-1">
                                            {msg.title}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>{msg.engagement}% engagement</span>
                                            <span>{msg.reach} reach</span>
                                        </div>
                                    </div>
                                ))}
                                {engagementData.topContent.messages.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Top Polls */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4">Top Polls</h3>
                            <div className="space-y-3">
                                {engagementData.topContent.polls.slice(0, 5).map((poll, i) => (
                                    <div key={poll.id} className="p-3 bg-gray-800/50 rounded-lg">
                                        <p className="text-sm text-white font-medium line-clamp-2 mb-1">
                                            {poll.title}
                                        </p>
                                        <div className="text-xs text-gray-400">
                                            {poll.votes} votes
                                        </div>
                                    </div>
                                ))}
                                {engagementData.topContent.polls.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No polls yet</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Top Resources */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.0 }}
                            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6"
                        >
                            <h3 className="text-lg font-bold text-white mb-4">Top Resources</h3>
                            <div className="space-y-3">
                                {engagementData.topContent.resources.slice(0, 5).map((resource, i) => (
                                    <div key={resource.id} className="p-3 bg-gray-800/50 rounded-lg">
                                        <p className="text-sm text-white font-medium line-clamp-1 mb-1">
                                            {resource.title}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>{resource.type}</span>
                                            <span>{resource.downloads} downloads</span>
                                        </div>
                                    </div>
                                ))}
                                {engagementData.topContent.resources.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No resources yet</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    )
}
