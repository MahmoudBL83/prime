'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Search, Filter, Download, ArrowLeft, TrendingUp, UserCheck, UserX, Clock } from 'lucide-react'
import MemberRow from '@/components/membership/MemberRow'
import TierUpgradeModal from '@/components/membership/TierUpgradeModal'
import { toast } from 'react-hot-toast'

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
        price: number
    }
    status: string
    priceAtPurchase: number
    startedAt: string
    lastActivityAt: string
    totalMessages: number
    totalPollVotes: number
}

interface Stats {
    totalMembers: number
    activeMembers: number
    pausedMembers: number
    cancelledMembers: number
    totalRevenue: number
}

export default function MemberDirectoryPage() {
    const params = useParams()
    const router = useRouter()
    const channelId = params?.channelId as string

    const [members, setMembers] = useState<Member[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [tiers, setTiers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    // Upgrade modal
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
    const [selectedMember, setSelectedMember] = useState<Member | null>(null)

    // Filters
    const [search, setSearch] = useState('')
    const [selectedTier, setSelectedTier] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchTiers()
    }, [channelId])

    useEffect(() => {
        fetchMembers()
    }, [channelId, selectedTier, selectedStatus, currentPage])

    const fetchTiers = async () => {
        try {
            const response = await fetch(`/api/channels/${channelId}/tiers`)
            if (!response.ok) throw new Error('Failed to fetch tiers')
            const data = await response.json()
            setTiers(data.tiers || [])
        } catch (error) {
            console.error('Error fetching tiers:', error)
        }
    }

    const fetchMembers = async () => {
        try {
            setLoading(true)
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                ...(search && { search }),
                ...(selectedTier && { tierId: selectedTier }),
                ...(selectedStatus && { status: selectedStatus })
            })

            const response = await fetch(`/api/channels/${channelId}/members?${queryParams}`)
            if (!response.ok) throw new Error('Failed to fetch members')

            const data = await response.json()
            setMembers(data.members || [])
            setStats(data.stats)
            setTotalPages(data.pagination.totalPages)
        } catch (error) {
            console.error('Error fetching members:', error)
            toast.error('Failed to load members')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            const response = await fetch(`/api/channels/${channelId}/members/export`, {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Failed to export')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `members-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Members exported successfully!')
        } catch (error) {
            console.error('Error exporting members:', error)
            toast.error('Failed to export members')
        } finally {
            setExporting(false)
        }
    }

    const handleRemoveMember = async (userId: string) => {
        try {
            const response = await fetch(`/api/channels/${channelId}/members?userId=${userId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to remove member')

            toast.success('Member removed successfully')
            fetchMembers()
        } catch (error) {
            console.error('Error removing member:', error)
            toast.error('Failed to remove member')
        }
    }

    const handleUpgradeTier = (userId: string) => {
        const member = members.find(m => m.user.id === userId)
        if (member) {
            setSelectedMember(member)
            setUpgradeModalOpen(true)
        }
    }

    const handleUpgradeSuccess = () => {
        fetchMembers()
    }

    const handleSearch = () => {
        setCurrentPage(1)
        fetchMembers()
    }

    if (loading && members.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-800 rounded w-1/3" />
                        <div className="grid grid-cols-4 gap-4">
                            <div className="h-24 bg-gray-800 rounded-xl" />
                            <div className="h-24 bg-gray-800 rounded-xl" />
                            <div className="h-24 bg-gray-800 rounded-xl" />
                            <div className="h-24 bg-gray-800 rounded-xl" />
                        </div>
                        <div className="h-96 bg-gray-800 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <Users className="w-8 h-8 text-purple-400" />
                                Member Directory
                            </h1>
                            <p className="text-gray-400">
                                Manage your channel members and subscriptions
                            </p>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-5 h-5" />
                            {exporting ? 'Exporting...' : 'Export CSV'}
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-sm text-gray-400">Total Members</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalMembers}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <UserCheck className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="text-sm text-gray-400">Active</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.activeMembers}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border border-yellow-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-yellow-500/20 rounded-lg">
                                    <Clock className="w-5 h-5 text-yellow-400" />
                                </div>
                                <span className="text-sm text-gray-400">Paused</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.pausedMembers}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-sm text-gray-400">Monthly Revenue</span>
                            </div>
                            <p className="text-3xl font-bold text-white">
                                ${stats.totalRevenue.toFixed(0)}
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Search Members
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        placeholder="Search by name or email..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Filter by Tier
                            </label>
                            <select
                                value={selectedTier}
                                onChange={(e) => {
                                    setSelectedTier(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">All Tiers</option>
                                {tiers.map(tier => (
                                    <option key={tier.id} value={tier.id}>
                                        {tier.icon} {tier.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Filter by Status
                            </label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="PAUSED">Paused</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="EXPIRED">Expired</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Members Table */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Member</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Tier</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Joined</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Engagement</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Last Activity</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(member => (
                                    <MemberRow
                                        key={member.id}
                                        member={member}
                                        onRemove={handleRemoveMember}
                                        onUpgradeTier={handleUpgradeTier}
                                    />
                                ))}
                            </tbody>
                        </table>

                        {members.length === 0 && (
                            <div className="text-center py-16">
                                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    No members found
                                </h3>
                                <p className="text-gray-400">
                                    {search || selectedTier || selectedStatus
                                        ? 'Try adjusting your filters'
                                        : 'No one has subscribed yet'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-gray-400">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tier Upgrade Modal */}
            {selectedMember && (
                <TierUpgradeModal
                    isOpen={upgradeModalOpen}
                    onClose={() => {
                        setUpgradeModalOpen(false)
                        setSelectedMember(null)
                    }}
                    member={selectedMember}
                    channelId={channelId}
                    onSuccess={handleUpgradeSuccess}
                />
            )}
        </div>
    )
}
