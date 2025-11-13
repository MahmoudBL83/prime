'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, BookOpen, MessageSquare, Bell, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface StudyBuddy {
    id: string
    name: string
    arabicName?: string | null
    profileImage?: string | null
}

interface SessionSchedulerModalProps {
    isOpen: boolean
    onClose: () => void
    studyBuddy: StudyBuddy
    matchId: string
}

export function SessionSchedulerModal({ isOpen, onClose, studyBuddy, matchId }: SessionSchedulerModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        studyTopics: [] as string[],
    })
    const [topicInput, setTopicInput] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.title || !formData.scheduledAt) {
            toast.error('Please fill in required fields')
            return
        }

        setIsSubmitting(true)

        try {
            const response = await fetch('/api/study-buddy/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    ...formData,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to schedule session')
            }

            const result = await response.json()
            toast.success('Study session scheduled successfully! 🎉')
            onClose()
            
            // Reset form
            setFormData({
                title: '',
                description: '',
                scheduledAt: '',
                duration: 60,
                studyTopics: [],
            })
            setTopicInput('')
        } catch (error) {
            console.error('Schedule session error:', error)
            toast.error('Failed to schedule session. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const addTopic = () => {
        if (topicInput.trim() && formData.studyTopics.length < 5) {
            setFormData({
                ...formData,
                studyTopics: [...formData.studyTopics, topicInput.trim()],
            })
            setTopicInput('')
        }
    }

    const removeTopic = (index: number) => {
        setFormData({
            ...formData,
            studyTopics: formData.studyTopics.filter((_, i) => i !== index),
        })
    }

    // Get minimum date (current date + 1 hour)
    const getMinDateTime = () => {
        const now = new Date()
        now.setHours(now.getHours() + 1)
        return now.toISOString().slice(0, 16)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50"
                    >
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-purple-500/30 rounded-3xl shadow-2xl shadow-purple-500/20 p-8 m-4">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Schedule Study Session
                                    </h2>
                                    <p className="text-gray-400 mt-1">
                                        Plan a session with <span className="text-purple-400 font-semibold">{studyBuddy.name}</span>
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-700/50 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Session Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        <MessageSquare className="w-4 h-4 inline mr-2" />
                                        Session Title *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Math Study Session"
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    />
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                                            <Calendar className="w-4 h-4 inline mr-2" />
                                            Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            required
                                            min={getMinDateTime()}
                                            value={formData.scheduledAt}
                                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                                            <Clock className="w-4 h-4 inline mr-2" />
                                            Duration (minutes) *
                                        </label>
                                        <select
                                            value={formData.duration}
                                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        >
                                            <option value={30}>30 minutes</option>
                                            <option value={60}>1 hour</option>
                                            <option value={90}>1.5 hours</option>
                                            <option value={120}>2 hours</option>
                                            <option value={180}>3 hours</option>
                                            <option value={240}>4 hours</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Add details about what you'll cover in this session..."
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                                    />
                                </div>

                                {/* Study Topics */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                                        <BookOpen className="w-4 h-4 inline mr-2" />
                                        Study Topics (Optional)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={topicInput}
                                            onChange={(e) => setTopicInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                                            placeholder="Add a topic and press Enter"
                                            className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={addTopic}
                                            disabled={!topicInput.trim() || formData.studyTopics.length >= 5}
                                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    {formData.studyTopics.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {formData.studyTopics.map((topic, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-lg text-purple-300"
                                                >
                                                    <span className="text-sm">{topic}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTopic(index)}
                                                        className="hover:text-purple-100 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Reminder Notice */}
                                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 flex items-start gap-3">
                                    <Bell className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-blue-300 font-medium">
                                            Automatic Reminders
                                        </p>
                                        <p className="text-xs text-blue-400 mt-1">
                                            Both you and {studyBuddy.name} will receive reminders 1 hour and 15 minutes before the session.
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Scheduling...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                <span>Schedule Session</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
