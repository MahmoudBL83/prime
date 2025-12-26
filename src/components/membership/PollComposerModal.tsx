'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, BarChart3, Calendar, Users, Loader2, Settings } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Tier {
    id: string
    name: string
    icon?: string
    color?: string
}

interface PollComposerModalProps {
    isOpen: boolean
    onClose: () => void
    channelId: string
    onSuccess?: () => void
}

interface PollOption {
    id: string
    text: string
}

export default function PollComposerModal({
    isOpen,
    onClose,
    channelId,
    onSuccess
}: PollComposerModalProps) {
    const [tiers, setTiers] = useState<Tier[]>([])
    const [selectedTiers, setSelectedTiers] = useState<string[]>([])
    const [question, setQuestion] = useState('')
    const [options, setOptions] = useState<PollOption[]>([
        { id: '1', text: '' },
        { id: '2', text: '' }
    ])
    const [allowMultiple, setAllowMultiple] = useState(false)
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [hasEndDate, setHasEndDate] = useState(false)
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchingTiers, setFetchingTiers] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetchTiers()
        } else {
            // Reset form
            setSelectedTiers([])
            setQuestion('')
            setOptions([
                { id: '1', text: '' },
                { id: '2', text: '' }
            ])
            setAllowMultiple(false)
            setIsAnonymous(false)
            setHasEndDate(false)
            setEndDate('')
        }
    }, [isOpen, channelId])

    const fetchTiers = async () => {
        try {
            setFetchingTiers(true)
            const response = await fetch(`/api/channels/${channelId}/tiers`)
            if (!response.ok) throw new Error('Failed to fetch tiers')

            const data = await response.json()
            setTiers(data.tiers || [])
            setSelectedTiers(data.tiers.map((t: Tier) => t.id))
        } catch (error) {
            console.error('Error fetching tiers:', error)
            toast.error('Failed to load tiers')
        } finally {
            setFetchingTiers(false)
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

    const addOption = () => {
        if (options.length >= 10) {
            toast.error('Maximum 10 options allowed')
            return
        }
        const newId = (Math.max(...options.map(o => parseInt(o.id))) + 1).toString()
        setOptions([...options, { id: newId, text: '' }])
    }

    const removeOption = (id: string) => {
        if (options.length <= 2) {
            toast.error('At least 2 options required')
            return
        }
        setOptions(options.filter(opt => opt.id !== id))
    }

    const updateOption = (id: string, field: 'text', value: string) => {
        setOptions(options.map(opt =>
            opt.id === id ? { ...opt, [field]: value } : opt
        ))
    }

    const handleCreate = async () => {
        if (!question.trim()) {
            toast.error('Please enter a question')
            return
        }

        const filledOptions = options.filter(opt => opt.text.trim())
        if (filledOptions.length < 2) {
            toast.error('Please add at least 2 options')
            return
        }

        try {
            setLoading(true)

            const response = await fetch(`/api/channels/${channelId}/polls`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    options: filledOptions,
                    allowMultiple,
                    isAnonymous,
                    targetTierIds: selectedTiers.length > 0 ? selectedTiers : null,
                    endsAt: hasEndDate && endDate ? new Date(endDate).toISOString() : null
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create poll')
            }

            toast.success('Poll created successfully!')
            onSuccess?.()
            onClose()
        } catch (error: any) {
            console.error('Error creating poll:', error)
            toast.error(error.message || 'Failed to create poll')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    const minDate = new Date().toISOString().split('T')[0]

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
                                    <BarChart3 className="w-6 h-6 text-purple-400" />
                                </div>
                                Create Poll or Survey
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Engage your members with polls and surveys
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
                            {/* Left: Poll Form */}
                            <div className="col-span-2 space-y-4">
                                {/* Question */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Question <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        placeholder="What would you like to ask your members?"
                                        className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        maxLength={200}
                                    />
                                    <div className="flex justify-end mt-1">
                                        <span className="text-xs text-muted-foreground">
                                            {question.length}/200
                                        </span>
                                    </div>
                                </div>

                                {/* Options */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Answer Options <span className="text-red-400">*</span>
                                        </label>
                                        <button
                                            onClick={addOption}
                                            disabled={options.length >= 10}
                                            className="text-xs text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Add Option
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {options.map((option, index) => (
                                            <div key={option.id} className="space-y-2">
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            value={option.text}
                                                            onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                                                            placeholder={`Option ${index + 1}`}
                                                            className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                            maxLength={100}
                                                        />
                                                    </div>
                                                    {options.length > 2 && (
                                                        <button
                                                            onClick={() => removeOption(option.id)}
                                                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {options.filter(o => o.text.trim()).length}/10 options filled
                                    </p>
                                </div>

                                {/* Settings */}
                                <div className="bg-gray-800/50 border border-border rounded-xl p-4 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                                        <Settings className="w-4 h-4" />
                                        Poll Settings
                                    </div>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allowMultiple}
                                            onChange={(e) => setAllowMultiple(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-foreground">
                                                Allow multiple selections
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Members can select more than one option
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isAnonymous}
                                            onChange={(e) => setIsAnonymous(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-foreground">
                                                Anonymous voting
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Hide voter identities in results
                                            </p>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={hasEndDate}
                                            onChange={(e) => setHasEndDate(e.target.checked)}
                                            className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                        />
                                        <div className="flex-1">
                                            <span className="text-sm font-medium text-foreground flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                Set end date
                                            </span>
                                            {hasEndDate && (
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => setEndDate(e.target.value)}
                                                    min={minDate}
                                                    className="mt-2 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                                />
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Right: Target Tiers */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Target Audience
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
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
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
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-gray-900/50">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-2.5 bg-card hover:bg-gray-700 text-foreground rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={loading || !question || options.filter(o => o.text.trim()).length < 2}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-4 h-4" />
                                    Create Poll
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
