'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, Trash2, MoreVertical, Clock, CheckCircle, XCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Poll {
    id: string
    question: string
    questionAr?: string
    options: any[]
    totalVotes: number
    createdAt: string
    endsAt?: string
}

interface PollRowProps {
    poll: Poll
    onDelete: (pollId: string) => void
    onViewResults: (pollId: string) => void
    onEndPoll?: (pollId: string) => void
}

export default function PollRow({ poll, onDelete, onViewResults, onEndPoll }: PollRowProps) {
    const [showActions, setShowActions] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const isActive = poll.endsAt ? new Date(poll.endsAt) > new Date() : true

    const handleDelete = () => {
        setShowDeleteConfirm(false)
        onDelete(poll.id)
    }

    const handleEndPoll = () => {
        setShowActions(false)
        onEndPoll?.(poll.id)
    }

    return (
        <>
            <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-border hover:bg-card-hover transition-colors cursor-pointer"
                onClick={() => onViewResults(poll.id)}
            >
                {/* Question */}
                <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg mt-0.5">
                            <BarChart3 className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground line-clamp-2">
                                {poll.question}
                            </p>
                            {poll.questionAr && (
                                <p className="text-sm text-muted-foreground line-clamp-1 mt-1" dir="rtl">
                                    {poll.questionAr}
                                </p>
                            )}
                        </div>
                    </div>
                </td>

                {/* Options Count */}
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                            {poll.options.length}
                        </span>
                    </div>
                </td>

                {/* Total Votes */}
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-foreground font-medium">
                            {poll.totalVotes}
                        </span>
                    </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                    {isActive ? (
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-sm text-green-400 font-medium">Active</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground font-medium">Ended</span>
                        </div>
                    )}
                </td>

                {/* Created Date */}
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowActions(!showActions)
                            }}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                        </button>

                        {showActions && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowActions(false)
                                    }}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                                >
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowActions(false)
                                            onViewResults(poll.id)
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-foreground"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        View Results
                                    </button>
                                    {isActive && onEndPoll && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEndPoll()
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-yellow-400"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            End Poll Now
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowActions(false)
                                            setShowDeleteConfirm(true)
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Poll
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </div>
                </td>
            </motion.tr>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <tr>
                    <td colSpan={6} className="px-6 py-0">
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-2"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground mb-1">
                                            Delete this poll?
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            This will delete all {poll.totalVotes} votes. This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-4 py-2 bg-card hover:bg-gray-700 text-foreground rounded-lg text-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-foreground rounded-lg text-sm transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </td>
                </tr>
            )}
        </>
    )
}
