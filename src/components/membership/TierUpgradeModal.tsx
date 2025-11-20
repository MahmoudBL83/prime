'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowUp, DollarSign, Calendar, TrendingUp, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Tier {
    id: string
    name: string
    nameAr?: string
    description?: string
    price: number
    currency: string
    billingCycle: string
    color?: string
    icon?: string
    features: string[]
    maxMembers?: number
    subscriberCount?: number
}

interface Member {
    id: string
    user: {
        id: string
        name: string
        email: string
        profileImage?: string
    }
    tier: {
        id: string
        name: string
        price: number
    }
    priceAtPurchase: number
}

interface TierUpgradeModalProps {
    isOpen: boolean
    onClose: () => void
    member: Member
    channelId: string
    onSuccess?: () => void
}

export default function TierUpgradeModal({
    isOpen,
    onClose,
    member,
    channelId,
    onSuccess
}: TierUpgradeModalProps) {
    const [tiers, setTiers] = useState<Tier[]>([])
    const [selectedTier, setSelectedTier] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [fetchingTiers, setFetchingTiers] = useState(true)
    const [applyProRata, setApplyProRata] = useState(true)

    useEffect(() => {
        if (isOpen) {
            fetchTiers()
        }
    }, [isOpen, channelId])

    const fetchTiers = async () => {
        try {
            setFetchingTiers(true)
            const response = await fetch(`/api/channels/${channelId}/tiers`)
            if (!response.ok) throw new Error('Failed to fetch tiers')
            
            const data = await response.json()
            // Filter out current tier and lower tiers
            const availableTiers = data.tiers.filter((tier: Tier) => 
                tier.id !== member.tier.id && tier.price > member.priceAtPurchase
            )
            setTiers(availableTiers)
        } catch (error) {
            console.error('Error fetching tiers:', error)
            toast.error('Failed to load available tiers')
        } finally {
            setFetchingTiers(false)
        }
    }

    const handleUpgrade = async () => {
        if (!selectedTier) {
            toast.error('Please select a tier')
            return
        }

        try {
            setLoading(true)
            
            // TODO: Implement actual upgrade API endpoint
            // For now, we'll simulate the upgrade
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            toast.success('Member upgraded successfully!')
            onSuccess?.()
            onClose()
        } catch (error) {
            console.error('Error upgrading member:', error)
            toast.error('Failed to upgrade member')
        } finally {
            setLoading(false)
        }
    }

    const selectedTierData = tiers.find(t => t.id === selectedTier)
    const priceDifference = selectedTierData 
        ? selectedTierData.price - member.priceAtPurchase 
        : 0

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
                    className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-purple-400" />
                                </div>
                                Upgrade Member Tier
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Move {member.user.name} to a higher tier
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
                        {/* Current Tier Info */}
                        <div className="bg-gray-800/50 border border-border rounded-xl p-4 mb-6">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Current Subscription</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-foreground">{member.tier.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        ${member.priceAtPurchase.toFixed(2)}/month
                                    </p>
                                </div>
                                <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                                    <span className="text-sm font-medium text-green-400">Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Available Tiers */}
                        {fetchingTiers ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : tiers.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    No Higher Tiers Available
                                </h3>
                                <p className="text-muted-foreground">
                                    This member is already on the highest tier
                                </p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                                    Select New Tier
                                </h3>
                                <div className="space-y-3 mb-6">
                                    {tiers.map(tier => {
                                        const isSelected = selectedTier === tier.id
                                        const isFull = Boolean(tier.maxMembers && tier.subscriberCount && 
                                                      tier.subscriberCount >= tier.maxMembers)

                                        return (
                                            <motion.button
                                                key={tier.id}
                                                onClick={() => !isFull && setSelectedTier(tier.id)}
                                                disabled={isFull}
                                                whileHover={!isFull ? { scale: 1.02 } : {}}
                                                whileTap={!isFull ? { scale: 0.98 } : {}}
                                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                    isSelected
                                                        ? 'border-purple-500 bg-purple-500/10'
                                                        : isFull
                                                        ? 'border-border bg-gray-800/30 opacity-50 cursor-not-allowed'
                                                        : 'border-border hover:border-gray-600 bg-gray-800/50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            {tier.icon && (
                                                                <span className="text-xl">{tier.icon}</span>
                                                            )}
                                                            <h4 className="font-semibold text-foreground">{tier.name}</h4>
                                                            {isFull && (
                                                                <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-400">
                                                                    Full
                                                                </span>
                                                            )}
                                                        </div>
                                                        {tier.description && (
                                                            <p className="text-sm text-muted-foreground mb-2">
                                                                {tier.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <span className="text-muted-foreground">
                                                                <DollarSign className="w-4 h-4 inline mr-1" />
                                                                ${tier.price.toFixed(2)}/{tier.billingCycle}
                                                            </span>
                                                            {tier.maxMembers && (
                                                                <span className="text-muted-foreground">
                                                                    {tier.subscriberCount || 0}/{tier.maxMembers} members
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="ml-4 p-2 bg-purple-500 rounded-full">
                                                            <ArrowUp className="w-5 h-5 text-foreground" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Features Preview */}
                                                {tier.features && tier.features.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-border">
                                                        <div className="flex flex-wrap gap-2">
                                                            {tier.features.slice(0, 3).map((feature, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-2 py-1 bg-gray-700/50 rounded text-xs text-muted-foreground"
                                                                >
                                                                    <Sparkles className="w-3 h-3 inline mr-1" />
                                                                    {feature}
                                                                </span>
                                                            ))}
                                                            {tier.features.length > 3 && (
                                                                <span className="px-2 py-1 text-xs text-muted-foreground">
                                                                    +{tier.features.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                </div>

                                {/* Upgrade Details */}
                                {selectedTierData && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-4"
                                    >
                                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Upgrade Summary
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Current Price:</span>
                                                <span className="text-foreground">
                                                    ${member.priceAtPurchase.toFixed(2)}/month
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">New Price:</span>
                                                <span className="text-foreground">
                                                    ${selectedTierData.price.toFixed(2)}/month
                                                </span>
                                            </div>
                                            <div className="pt-2 border-t border-purple-500/30">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Price Difference:</span>
                                                    <span className="text-purple-400 font-semibold">
                                                        +${priceDifference.toFixed(2)}/month
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pro-rata Option */}
                                        <div className="mt-4 pt-4 border-t border-purple-500/30">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={applyProRata}
                                                    onChange={(e) => setApplyProRata(e.target.checked)}
                                                    className="mt-1 w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                                                />
                                                <div className="flex-1">
                                                    <span className="text-sm font-medium text-foreground">
                                                        Apply pro-rata billing
                                                    </span>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        Calculate prorated amount for remaining billing period
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {tiers.length > 0 && (
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-gray-900/50">
                            <button
                                onClick={onClose}
                                disabled={loading}
                                className="px-6 py-2.5 bg-card hover:bg-gray-700 text-foreground rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpgrade}
                                disabled={!selectedTier || loading}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <TrendingUp className="w-4 h-4" />
                                        Upgrade Tier
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
