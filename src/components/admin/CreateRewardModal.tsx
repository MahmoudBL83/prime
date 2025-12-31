'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Trophy,
    Gift,
    Award,
    Target,
    Calendar,
    DollarSign,
    Users,
    FileText,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

interface CreateRewardModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

const REWARD_TYPES = [
    { value: 'SCHOLARSHIP', label: 'Scholarship', icon: Trophy },
    { value: 'COMPLETION_BONUS', label: 'Completion Bonus', icon: Award },
    { value: 'REFERRAL_BONUS', label: 'Referral Bonus', icon: Gift },
    { value: 'ACHIEVEMENT', label: 'Achievement', icon: Target },
    { value: 'OTHER', label: 'Other', icon: FileText }
]

export default function CreateRewardModal({ isOpen, onClose, onSuccess }: CreateRewardModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'SCHOLARSHIP',
        value: '',
        currency: 'EGP',
        maxWinners: '',
        startDate: '',
        endDate: '',
        requirements: '',
        courseId: '',
        imageUrl: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || formData.title.length < 10) {
            toast.error('Title must be at least 10 characters')
            return
        }
        if (!formData.description || formData.description.length < 20) {
            toast.error('Description must be at least 20 characters')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/admin/rewards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    value: formData.value || null,
                    maxWinners: formData.maxWinners || null,
                    startDate: formData.startDate || null,
                    endDate: formData.endDate || null,
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to create reward')
            }

            toast.success('Reward created successfully!')
            onSuccess?.()
            onClose()
            setFormData({
                title: '',
                description: '',
                type: 'SCHOLARSHIP',
                value: '',
                currency: 'EGP',
                maxWinners: '',
                startDate: '',
                endDate: '',
                requirements: '',
                courseId: '',
                imageUrl: ''
            })
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to create reward')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border-b border-purple-500/30 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600/20 rounded-xl p-2">
                                        <Trophy className="w-6 h-6 text-purple-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">Create New Reward</h2>
                                        <p className="text-sm text-muted-foreground">Set up a new reward or scholarship</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-400" />
                                    Basic Information
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="e.g., Top Course Completion Scholarship"
                                        className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        required
                                        minLength={10}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        placeholder="Describe the reward and how to earn it..."
                                        rows={3}
                                        className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                        required
                                        minLength={20}
                                    />
                                </div>
                            </div>

                            {/* Reward Type */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Award className="w-5 h-5 text-purple-400" />
                                    Reward Type
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {REWARD_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${formData.type === type.value
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-border bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            <type.icon className={`w-6 h-6 ${formData.type === type.value ? 'text-purple-400' : 'text-muted-foreground'}`} />
                                            <span className={`text-sm font-medium ${formData.type === type.value ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {type.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Value & Winners */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-purple-400" />
                                    Reward Value
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Value
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                name="value"
                                                value={formData.value}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="flex-1 bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            />
                                            <select
                                                name="currency"
                                                value={formData.currency}
                                                onChange={handleChange}
                                                className="bg-white/10 border border-border rounded-lg px-3 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            >
                                                <option value="EGP">EGP</option>
                                                <option value="USD">USD</option>
                                                <option value="EUR">EUR</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Max Winners
                                        </label>
                                        <input
                                            type="number"
                                            name="maxWinners"
                                            value={formData.maxWinners}
                                            onChange={handleChange}
                                            placeholder="Unlimited"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                    Duration
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Requirements */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Requirements (optional)
                                </label>
                                <textarea
                                    name="requirements"
                                    value={formData.requirements}
                                    onChange={handleChange}
                                    placeholder="Describe the requirements to earn this reward..."
                                    rows={2}
                                    className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-border">
                                <Button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 bg-white/10 hover:bg-white/20 text-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Trophy className="w-4 h-4 mr-2" />
                                            Create Reward
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
