'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Users, Eye, Trash2, MoreVertical, CheckCircle2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

interface MessageRowProps {
    message: Message
    onDelete: (messageId: string) => void
    onClick?: (messageId: string) => void
}

export default function MessageRow({ message, onDelete, onClick }: MessageRowProps) {
    const [showActions, setShowActions] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const readRate = message.sentCount > 0 
        ? ((message.readCount / message.sentCount) * 100).toFixed(0)
        : '0'

    const handleDelete = () => {
        setShowDeleteConfirm(false)
        onDelete(message.id)
    }

    return (
        <>
            <motion.tr
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-border hover:bg-card-hover transition-colors cursor-pointer"
                onClick={() => onClick?.(message.id)}
            >
                {/* Subject */}
                <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg mt-0.5">
                            <Mail className="w-4 h-4 text-purple-400" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground line-clamp-1">
                                {message.subject}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {message.content}
                            </p>
                        </div>
                    </div>
                </td>

                {/* Recipients */}
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">
                            {message.recipientCount}
                        </span>
                    </div>
                </td>

                {/* Sent */}
                <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-foreground font-medium">
                            {message.sentCount}
                        </span>
                    </div>
                </td>

                {/* Read Rate */}
                <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-foreground font-medium">{readRate}%</span>
                                <span className="text-xs text-muted-foreground">
                                    {message.readCount}/{message.sentCount}
                                </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full transition-all ${
                                        parseInt(readRate) >= 70 ? 'bg-green-500' :
                                        parseInt(readRate) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${readRate}%` }}
                                />
                            </div>
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                </td>

                {/* Sent Date */}
                <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                        {message.sentAt 
                            ? formatDistanceToNow(new Date(message.sentAt), { addSuffix: true })
                            : formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })
                        }
                    </span>
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
                                            setShowDeleteConfirm(true)
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors flex items-center gap-3 text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete Message
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
                                        <p className="text-sm font-medium text-foreground">
                                            Delete this message?
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            This action cannot be undone
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
