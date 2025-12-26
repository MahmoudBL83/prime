'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Users, Eye, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Tier {
    id: string
    name: string
    icon?: string
    color?: string
    subscriberCount?: number
}

interface RecipientPreview {
    totalRecipients: number
    recipientsByTier: Array<{
        tier: Tier
        count: number
    }>
}

interface MessageComposerModalProps {
    isOpen: boolean
    onClose: () => void
    channelId: string
    onSuccess?: () => void
}

export default function MessageComposerModal({
    isOpen,
    onClose,
    channelId,
    onSuccess
}: MessageComposerModalProps) {
    const [tiers, setTiers] = useState<Tier[]>([])
    const [selectedTiers, setSelectedTiers] = useState<string[]>([])
    const [subject, setSubject] = useState('')
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchingTiers, setFetchingTiers] = useState(true)
    const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null)
    const [loadingPreview, setLoadingPreview] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchTiers()
        } else {
            // Reset form when modal closes
            setSelectedTiers([])
            setSubject('')
            setContent('')
            setRecipientPreview(null)
        }
    }, [isOpen, channelId])

    useEffect(() => {
        if (selectedTiers.length > 0) {
            fetchRecipientPreview()
        } else {
            setRecipientPreview(null)
        }
    }, [selectedTiers])

    const fetchTiers = async () => {
        try {
            setFetchingTiers(true)
            const response = await fetch(`/api/channels/${channelId}/tiers`)
            if (!response.ok) throw new Error('Failed to fetch tiers')

            const data = await response.json()
            setTiers(data.tiers || [])

            // Select all tiers by default
            setSelectedTiers(data.tiers.map((t: Tier) => t.id))
        } catch (error) {
            console.error('Error fetching tiers:', error)
            toast.error('Failed to load tiers')
        } finally {
            setFetchingTiers(false)
        }
    }

    const fetchRecipientPreview = async () => {
        try {
            setLoadingPreview(true)
            const response = await fetch(`/api/channels/${channelId}/messages/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetTierIds: selectedTiers })
            })

            if (!response.ok) throw new Error('Failed to fetch preview')

            const data = await response.json()
            setRecipientPreview(data)
        } catch (error) {
            console.error('Error fetching preview:', error)
        } finally {
            setLoadingPreview(false)
        }
    }

    const handleTierToggle = (tierId: string) => {
        setSelectedTiers(prev =>
            prev.includes(tierId)
                ? prev.filter(id => id !== tierId)
                : [...prev, tierId]
        )
    }

    const handleSelectAll = () => {
        if (selectedTiers.length === tiers.length) {
            setSelectedTiers([])
        } else {
            setSelectedTiers(tiers.map(t => t.id))
        }
    }

    const handleSend = async () => {
        if (!subject.trim() || !content.trim()) {
            toast.error('Please fill in subject and content')
            return
        }

        if (selectedTiers.length === 0) {
            toast.error('Please select at least one tier')
            return
        }

        try {
            setLoading(true)

            const response = await fetch(`/api/channels/${channelId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject,
                    content,
                    targetTierIds: selectedTiers
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to send message')
            }

            toast.success(`Message sent to ${recipientPreview?.totalRecipients || 0} members!`)
            onSuccess?.()
            onClose()
        } catch (error: any) {
            console.error('Error sending message:', error)
            toast.error(error.message || 'Failed to send message')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

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
                    className="relative w-full max-w-4xl bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Send className="w-6 h-6 text-purple-400" />
                                </div>
                                Send Message to Members
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Compose and send a message to your channel members
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-card rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        <div className="grid grid-cols-3 gap-6">
                            {/* Left: Message Form */}
                            <div className="col-span-2 space-y-4">
                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Subject <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Enter message subject..."
                                        className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        maxLength={200}
                                    />
                                    <div className="flex justify-end mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            {subject.length}/200
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Message Content <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="Write your message here..."
                                        rows={8}
                                        className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        maxLength={2000}
                                    />
                                    <div className="flex justify-end mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            {content.length}/2000
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Recipients */}
                            <div className="space-y-4">
                                {/* Tier Selection */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Select Recipients
                                        </label>
                                        <button
                                            onClick={handleSelectAll}
                                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            {selectedTiers.length === tiers.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>

                                    {fetchingTiers ? (
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-12 bg-card rounded-lg animate-pulse" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {tiers.map(tier => (
                                                <label
                                                    key={tier.id}
                                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedTiers.includes(tier.id)
                                                            ? 'border-purple-500 bg-purple-500/10'
                                                            : 'border-border hover:border-gray-600 bg-gray-800/50'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedTiers.includes(tier.id)}
                                                        onChange={() => handleTierToggle(tier.id)}
                                                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            {tier.icon && (
                                                                <span className="text-base">{tier.icon}</span>
                                                            )}
                                                            <span className="text-sm font-medium text-foreground">
                                                                {tier.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {tier.subscriberCount || 0} members
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Recipient Preview */}
                                {recipientPreview && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <Eye className="w-4 h-4 text-green-400" />
                                            <h3 className="text-sm font-semibold text-foreground">
                                                Recipient Preview
                                            </h3>
                                        </div>

                                        {loadingPreview ? (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-sm">Loading...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-3 pb-3 border-b border-green-500/30">
                                                    <span className="text-sm text-muted-foreground">Total Recipients:</span>
                                                    <span className="text-2xl font-bold text-green-400">
                                                        {recipientPreview.totalRecipients}
                                                    </span>
                                                </div>

                                                <div className="space-y-2">
                                                    {recipientPreview.recipientsByTier.map(({ tier, count }) => (
                                                        <div key={tier.id} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2">
                                                                {tier.icon && <span>{tier.icon}</span>}
                                                                <span className="text-muted-foreground">{tier.name}</span>
                                                            </div>
                                                            <span className="font-medium text-foreground">{count}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {recipientPreview.totalRecipients === 0 && (
                                                    <div className="flex items-center gap-2 mt-2 text-yellow-400">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span className="text-xs">No active members in selected tiers</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-border bg-gray-900/50">
                        <div className="text-sm text-muted-foreground">
                            {recipientPreview && recipientPreview.totalRecipients > 0 ? (
                                <span className="flex items-center gap-2 text-green-400">
                                    <CheckCircle className="w-4 h-4" />
                                    Ready to send to {recipientPreview.totalRecipients} members
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    Select tiers to see recipient count
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-6 py-2.5 bg-card hover:bg-gray-700 text-foreground rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={loading || !subject || !content || selectedTiers.length === 0 || !recipientPreview || recipientPreview.totalRecipients === 0}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
