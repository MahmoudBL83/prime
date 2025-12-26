'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, Settings, Users, DollarSign, Lock, Unlock } from 'lucide-react'

interface TierFormData {
    name: string
    description?: string
    price: string
    currency: string
    billingCycle: string
    features: string[]
    maxMembers?: string
    hasDiscussionAccess: boolean
    hasLiveAccess: boolean
    hasResourceAccess: boolean
    hasPollAccess: boolean
    hasDirectMessaging: boolean
    color?: string
    icon?: string
}

interface TierFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: TierFormData) => Promise<void>
    initialData?: Partial<TierFormData>
    mode: 'create' | 'edit'
}

export default function TierFormModal({
    isOpen,
    onClose,
    onSave,
    initialData,
    mode
}: TierFormModalProps) {
    const [formData, setFormData] = useState<TierFormData>({
        name: initialData?.name || '',
        description: initialData?.description || '',
        price: initialData?.price || '',
        currency: initialData?.currency || 'EGP',
        billingCycle: initialData?.billingCycle || 'MONTHLY',
        features: initialData?.features || [],
        maxMembers: initialData?.maxMembers || '',
        hasDiscussionAccess: initialData?.hasDiscussionAccess ?? true,
        hasLiveAccess: initialData?.hasLiveAccess ?? false,
        hasResourceAccess: initialData?.hasResourceAccess ?? false,
        hasPollAccess: initialData?.hasPollAccess ?? false,
        hasDirectMessaging: initialData?.hasDirectMessaging ?? false,
        color: initialData?.color || '#8B5CF6',
        icon: initialData?.icon || '⭐'
    })

    const [newFeature, setNewFeature] = useState('')
    const [loading, setLoading] = useState(false)

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...prev.features, newFeature.trim()]
            }))
            setNewFeature('')
        }
    }

    const handleRemoveFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error('Error saving tier:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-background border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">
                            {mode === 'create' ? 'Create New Tier' : 'Edit Tier'}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Set pricing, features, and access permissions
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-card rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
                    <div className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Settings className="w-5 h-5 text-purple-400" />
                                Basic Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Tier Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., Premium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    rows={2}
                                    placeholder="Describe what's included in this tier..."
                                />
                            </div>

                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Icon/Emoji
                                </label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="⭐"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Color
                                </label>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    className="w-full h-10 bg-card border border-border rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-400" />
                            Pricing
                        </h3>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Price *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="99.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Currency
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="EGP">EGP</option>
                                    <option value="USD">USD</option>
                                    <option value="EUR">EUR</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Billing Cycle
                                </label>
                                <select
                                    value={formData.billingCycle}
                                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                                    className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="QUARTERLY">Quarterly</option>
                                    <option value="YEARLY">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Max Members (Leave empty for unlimited)
                            </label>
                            <input
                                type="number"
                                value={formData.maxMembers}
                                onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                                className="w-full px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Unlimited"
                            />
                        </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Check className="w-5 h-5 text-blue-400" />
                            Features & Benefits
                        </h3>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                                className="flex-1 px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Add a feature..."
                            />
                            <button
                                type="button"
                                onClick={handleAddFeature}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-foreground rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            {formData.features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-card rounded-lg"
                                >
                                    <span className="text-foreground">{feature}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveFeature(index)}
                                        className="p-1 hover:bg-gray-700 rounded transition-colors"
                                    >
                                        <X className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Access Permissions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Lock className="w-5 h-5 text-yellow-400" />
                            Access Permissions
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 p-4 bg-card rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.hasDiscussionAccess}
                                    onChange={(e) => setFormData({ ...formData, hasDiscussionAccess: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-foreground">Discussion Access</span>
                            </label>

                            <label className="flex items-center gap-3 p-4 bg-card rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.hasLiveAccess}
                                    onChange={(e) => setFormData({ ...formData, hasLiveAccess: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-foreground">Live Sessions</span>
                            </label>

                            <label className="flex items-center gap-3 p-4 bg-card rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.hasResourceAccess}
                                    onChange={(e) => setFormData({ ...formData, hasResourceAccess: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-foreground">Resource Library</span>
                            </label>

                            <label className="flex items-center gap-3 p-4 bg-card rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.hasPollAccess}
                                    onChange={(e) => setFormData({ ...formData, hasPollAccess: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-foreground">Polls & Surveys</span>
                            </label>

                            <label className="flex items-center gap-3 p-4 bg-card rounded-lg cursor-pointer hover:bg-gray-750 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.hasDirectMessaging}
                                    onChange={(e) => setFormData({ ...formData, hasDirectMessaging: e.target.checked })}
                                    className="w-5 h-5 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                />
                                <span className="text-foreground">Direct Messaging</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-gray-900/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                {mode === 'create' ? 'Create Tier' : 'Save Changes'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </motion.div>
        </div >
    )
}
