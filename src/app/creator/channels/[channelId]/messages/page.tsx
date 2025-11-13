'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Send, ArrowLeft, TrendingUp, Users, Eye, CheckCircle } from 'lucide-react'
import MessageRow from '@/components/membership/MessageRow'
import MessageComposerModal from '@/components/membership/MessageComposerModal'
import { toast } from 'react-hot-toast'

interface Message {
    id: string
    subject: string
    content: string
    targetTierIds: string[]
    recipientCount: number
    sentCount: number
    readCount: number
    createdAt: string
    sentAt?: string
}

interface Stats {
    totalMessages: number
    totalRecipients: number
    totalSent: number
    totalRead: number
    readRate: string
}

export default function MessagesPage() {
    const params = useParams()
    const router = useRouter()
    const channelId = params?.channelId as string

    const [messages, setMessages] = useState<Message[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [composerOpen, setComposerOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchMessages()
    }, [channelId, currentPage])

    const fetchMessages = async () => {
        try {
            setLoading(true)
            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '20'
            })

            const response = await fetch(`/api/channels/${channelId}/messages?${queryParams}`)
            if (!response.ok) throw new Error('Failed to fetch messages')

            const data = await response.json()
            setMessages(data.messages || [])
            setStats(data.stats)
            setTotalPages(data.pagination.totalPages)
        } catch (error) {
            console.error('Error fetching messages:', error)
            toast.error('Failed to load messages')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        try {
            const response = await fetch(`/api/channels/${channelId}/messages/${messageId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to delete message')

            toast.success('Message deleted successfully')
            fetchMessages()
        } catch (error) {
            console.error('Error deleting message:', error)
            toast.error('Failed to delete message')
        }
    }

    const handleMessageClick = (messageId: string) => {
        // TODO: Open message details modal
        console.log('View message:', messageId)
    }

    if (loading && messages.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-800 rounded w-1/3" />
                        <div className="grid grid-cols-5 gap-4">
                            <div className="h-24 bg-gray-800 rounded-xl" />
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
                                <Mail className="w-8 h-8 text-purple-400" />
                                Member Messages
                            </h1>
                            <p className="text-gray-400">
                                Send and manage messages to your channel members
                            </p>
                        </div>

                        <button
                            onClick={() => setComposerOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all flex items-center gap-2"
                        >
                            <Send className="w-5 h-5" />
                            Compose Message
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-5 gap-6 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Mail className="w-5 h-5 text-purple-400" />
                                </div>
                                <span className="text-sm text-gray-400">Total Messages</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalMessages}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Users className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-sm text-gray-400">Recipients</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalRecipients}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                </div>
                                <span className="text-sm text-gray-400">Sent</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalSent}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-cyan-500/20 rounded-lg">
                                    <Eye className="w-5 h-5 text-cyan-400" />
                                </div>
                                <span className="text-sm text-gray-400">Read</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.totalRead}</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-orange-500/20 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-orange-400" />
                                </div>
                                <span className="text-sm text-gray-400">Read Rate</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{stats.readRate}%</p>
                        </motion.div>
                    </div>
                )}

                {/* Messages Table */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800 bg-gray-800/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Subject</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Recipients</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Sent</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Read Rate</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Sent Date</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {messages.map(message => (
                                    <MessageRow
                                        key={message.id}
                                        message={message}
                                        onDelete={handleDeleteMessage}
                                        onClick={handleMessageClick}
                                    />
                                ))}
                            </tbody>
                        </table>

                        {messages.length === 0 && (
                            <div className="text-center py-16">
                                <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">
                                    No messages sent yet
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Start engaging with your members by sending your first message
                                </p>
                                <button
                                    onClick={() => setComposerOpen(true)}
                                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors inline-flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    Compose Message
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

            {/* Message Composer Modal */}
            <MessageComposerModal
                isOpen={composerOpen}
                onClose={() => setComposerOpen(false)}
                channelId={channelId}
                onSuccess={fetchMessages}
            />
        </div>
    )
}
