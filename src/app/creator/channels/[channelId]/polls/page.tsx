'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BarChart3, Plus, ArrowLeft, TrendingUp, Users, CheckCircle, XCircle } from 'lucide-react'
import PollRow from '@/components/membership/PollRow'
import PollComposerModal from '@/components/membership/PollComposerModal'
import PollResultsModal from '@/components/membership/PollResultsModal'
import { toast } from 'react-hot-toast'

interface Poll {
    id: string
    question: string
    questionAr?: string
    options: any[]
    totalVotes: number
    createdAt: string
    endsAt?: string
}

interface Stats {
    totalPolls: number
    activePolls: number
    endedPolls: number
    totalVotes: number
}

export default function PollsPage() {
    const params = useParams()
    const router = useRouter()
    const channelId = params?.channelId as string

    const [polls, setPolls] = useState<Poll[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [composerOpen, setComposerOpen] = useState(false)
    const [resultsOpen, setResultsOpen] = useState(false)
    const [selectedPollId, setSelectedPollId] = useState<string>('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        fetchPolls()
    }, [channelId, currentPage, statusFilter])

    const fetchPolls = async () => {
        try {
            setLoading(true)
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20',
                ...(statusFilter && { status: statusFilter })
            })

            const response = await fetch(`/api/channels/${channelId}/polls?${queryParams}`)
            if (!response.ok) throw new Error('Failed to fetch polls')

            const data = await response.json()
            setPolls(data.polls || [])
            setStats(data.stats)
            setTotalPages(data.pagination.totalPages)
        } catch (error) {
            console.error('Error fetching polls:', error)
            toast.error('Failed to load polls')
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePoll = async (pollId: string) => {
        try {
            const response = await fetch(`/api/channels/${channelId}/polls/${pollId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete poll')

            toast.success('Poll deleted successfully')
            fetchPolls()
        } catch (error) {
            console.error('Error deleting poll:', error)
            toast.error('Failed to delete poll')
        }
    }

    const handleEndPoll = async (pollId: string) => {
        try {
            const response = await fetch(`/api/channels/${channelId}/polls/${pollId}`, {
                method: 'PUT'
            })

            if (!response.ok) throw new Error('Failed to end poll')

            toast.success('Poll ended successfully')
            fetchPolls()
        } catch (error) {
            console.error('Error ending poll:', error)
            toast.error('Failed to end poll')
        }
    }

    const handleViewResults = (pollId: string) => {
        setSelectedPollId(pollId)
        setResultsOpen(true)
    }

    if (loading && polls.length === 0) {
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
                                <BarChart3 className="w-8 h-8 text-purple-400" />
                                Polls & Surveys
                            </h1>
                            <p className="text-gray-400">
                                Create polls and gather feedback from your members
                            </p>
                        </div>

                        <button
                            onClick={() => setComposerOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create Poll
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-4 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <BarChart3 className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-sm text-gray-400">Total Polls</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalPolls}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="text-sm text-gray-400">Active</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.activePolls}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gray-500/20 rounded-lg">
                                    <XCircle className="w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-sm text-gray-400">Ended</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.endedPolls}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-sm text-gray-400">Total Votes</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalVotes}</p>
                        </motion.div>
                    </div>
                )}

                {/* Filter */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-gray-300">Filter:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">All Polls</option>
                            <option value="active">Active Only</option>
                            <option value="ended">Ended Only</option>
                        </select>
                    </div>
                </div>

                {/* Polls Table */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Question</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Options</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Votes</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Created</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {polls.map(poll => (
                                    <PollRow
                                        key={poll.id}
                                        poll={poll}
                                        onDelete={handleDeletePoll}
                                        onViewResults={handleViewResults}
                                        onEndPoll={handleEndPoll}
                                    />
                                ))}
                            </tbody>
                        </table>

                        {polls.length === 0 && (
                            <div className="text-center py-16">
                                <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    No polls created yet
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Start engaging with your members by creating your first poll
                                </p>
                                <button
                                    onClick={() => setComposerOpen(true)}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Poll
                                </button>
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

            {/* Poll Composer Modal */}
            <PollComposerModal
                isOpen={composerOpen}
                onClose={() => setComposerOpen(false)}
                channelId={channelId}
                onSuccess={fetchPolls}
            />

            {/* Poll Results Modal */}
            {selectedPollId && (
                <PollResultsModal
                    isOpen={resultsOpen}
                    onClose={() => {
                        setResultsOpen(false)
                        setSelectedPollId('')
                    }}
                    channelId={channelId}
                    pollId={selectedPollId}
                />
            )}
        </div>
    )
}
