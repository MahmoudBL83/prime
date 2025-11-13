'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Users, Eye, CheckCircle, BarChart3, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PollOption {
    id: string
    text: string
    textAr?: string
}

interface PollResult {
    id: string
    text: string
    textAr?: string
    votes: number
    percentage: string
}

interface Poll {
    id: string
    question: string
    questionAr?: string
    options: PollOption[]
    allowMultiple: boolean
    isAnonymous: boolean
    targetTierIds: string[]
    totalVotes: number
    createdAt: string
    endsAt?: string
    targetTiers: Array<{
        id: string
        name: string
        nameAr?: string
        icon?: string
        color?: string
    }>
}

interface PollResultsModalProps {
    isOpen: boolean
    onClose: () => void
    channelId: string
    pollId: string
}

export default function PollResultsModal({
    isOpen,
    onClose,
    channelId,
    pollId
}: PollResultsModalProps) {
    const [poll, setPoll] = useState<Poll | null>(null)
    const [results, setResults] = useState<PollResult[]>([])
    const [loading, setLoading] = useState(true)
    const [exporting, setExporting] = useState(false)

    useEffect(() => {
        if (isOpen && pollId) {
            fetchPollResults()
        }
    }, [isOpen, pollId])

    const fetchPollResults = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/channels/${channelId}/polls/${pollId}`)
            if (!response.ok) throw new Error('Failed to fetch poll results')

            const data = await response.json()
            setPoll(data.poll)
            setResults(data.results)
        } catch (error) {
            console.error('Error fetching poll results:', error)
            toast.error('Failed to load poll results')
        } finally {
            setLoading(false)
        }
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            const response = await fetch(`/api/channels/${channelId}/polls/${pollId}/export`, {
                method: 'POST'
            })

            if (!response.ok) throw new Error('Failed to export')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `poll-results-${new Date().toISOString().split('T')[0]}.csv`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Results exported successfully!')
        } catch (error) {
            console.error('Error exporting results:', error)
            toast.error('Failed to export results')
        } finally {
            setExporting(false)
        }
    }

    if (!isOpen) return null

    const isActive = poll?.endsAt ? new Date(poll.endsAt) > new Date() : true
    const maxVotes = Math.max(...results.map(r => r.votes), 1)

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <BarChart3 className="w-6 h-6 text-purple-400" />
                                </div>
                                Poll Results
                            </h2>
                            <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                {isActive ? (
                                    <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
                                        Active
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 bg-background0/20 border border-gray-500/30 rounded text-xs text-muted-foreground">
                                        Ended
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                disabled={exporting}
                                className="p-2 hover:bg-card rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                title="Export Results"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-card rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                            </div>
                        ) : poll ? (
                            <div className="space-y-6">
                                {/* Question */}
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                        {poll.question}
                                    </h3>
                                    {poll.questionAr && (
                                        <p className="text-lg text-muted-foreground" dir="rtl">
                                            {poll.questionAr}
                                        </p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-muted-foreground">Total Votes</span>
                                        </div>
                                        <p className="text-2xl font-bold text-foreground">{poll.totalVotes}</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle className="w-4 h-4 text-purple-400" />
                                            <span className="text-sm text-muted-foreground">Options</span>
                                        </div>
                                        <p className="text-2xl font-bold text-foreground">{results.length}</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Eye className="w-4 h-4 text-green-400" />
                                            <span className="text-sm text-muted-foreground">Type</span>
                                        </div>
                                        <p className="text-sm font-bold text-foreground">
                                            {poll.allowMultiple ? 'Multiple Choice' : 'Single Choice'}
                                        </p>
                                    </div>
                                </div>

                                {/* Target Tiers */}
                                {poll.targetTiers && poll.targetTiers.length > 0 && (
                                    <div className="bg-gray-800/50 border border-border rounded-xl p-4">
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                                            Target Audience
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {poll.targetTiers.map(tier => (
                                                <div
                                                    key={tier.id}
                                                    className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-lg flex items-center gap-2"
                                                >
                                                    {tier.icon && <span>{tier.icon}</span>}
                                                    <span className="text-sm text-foreground">{tier.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Results */}
                                <div>
                                    <h4 className="text-lg font-semibold text-foreground mb-4">
                                        Results Breakdown
                                    </h4>
                                    <div className="space-y-4">
                                        {results.map((result, index) => (
                                            <motion.div
                                                key={result.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-gray-800/50 border border-border rounded-xl p-4"
                                            >
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-foreground mb-1">
                                                            {result.text}
                                                        </p>
                                                        {result.textAr && (
                                                            <p className="text-sm text-muted-foreground" dir="rtl">
                                                                {result.textAr}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 text-right">
                                                        <p className="text-2xl font-bold text-foreground">
                                                            {result.percentage}%
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {result.votes} votes
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="relative w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${result.percentage}%` }}
                                                        transition={{ duration: 0.8, delay: index * 0.1 }}
                                                        className={`h-full rounded-full ${
                                                            result.votes === maxVotes
                                                                ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                                                                : 'bg-gradient-to-r from-gray-500 to-gray-600'
                                                        }`}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* Info */}
                                {poll.isAnonymous && (
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <Eye className="w-5 h-5 text-blue-400 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground mb-1">
                                                    Anonymous Poll
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Voter identities are hidden in this poll
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">Poll not found</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
