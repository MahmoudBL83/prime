'use client'

import { motion } from 'framer-motion'
import { Users, DollarSign, Edit, Trash2, Eye, EyeOff, Check, Lock, Unlock, MessageCircle, Video, FileText, BarChart3 } from 'lucide-react'

interface Tier {
    id: string
    name: string
    nameAr?: string
    description?: string
    price: number
    currency: string
    billingCycle: string
    icon?: string
    color?: string
    isActive: boolean
    subscriberCount?: number
    monthlyRevenue?: number
    features: string[]
    hasDiscussionAccess: boolean
    hasLiveAccess: boolean
    hasResourceAccess: boolean
    hasPollAccess: boolean
    hasDirectMessaging: boolean
    maxMembers?: number
}

interface TierCardProps {
    tier: Tier
    onEdit: (tier: Tier) => void
    onDelete: (tierId: string) => void
    onToggleActive: (tierId: string, isActive: boolean) => void
}

export default function TierCard({ tier, onEdit, onDelete, onToggleActive }: TierCardProps) {
    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(price)
    }

    const billingText = {
        MONTHLY: '/month',
        QUARTERLY: '/quarter',
        YEARLY: '/year'
    }[tier.billingCycle] || '/month'

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative bg-gradient-to-br from-gray-900 to-gray-800 border rounded-2xl overflow-hidden ${
                tier.isActive ? 'border-border' : 'border-border opacity-60'
            }`}
            style={{
                borderColor: tier.isActive && tier.color ? `${tier.color}40` : undefined
            }}
        >
            {/* Active/Inactive Badge */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={() => onToggleActive(tier.id, !tier.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        tier.isActive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700/50 text-muted-foreground'
                    }`}
                >
                    {tier.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {tier.isActive ? 'Active' : 'Inactive'}
                </button>
            </div>

            <div className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-6">
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                        style={{ backgroundColor: tier.color ? `${tier.color}20` : '#8B5CF620' }}
                    >
                        {tier.icon || '⭐'}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
                        {tier.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{tier.description}</p>
                        )}
                    </div>
                </div>

                {/* Pricing */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">
                            {formatPrice(tier.price, tier.currency)}
                        </span>
                        <span className="text-muted-foreground">{billingText}</span>
                    </div>
                    {tier.maxMembers && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Limited to {tier.maxMembers} members
                        </p>
                    )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-purple-400" />
                            <span className="text-xs text-muted-foreground">Subscribers</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">
                            {tier.subscriberCount || 0}
                        </p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-muted-foreground">Monthly Revenue</span>
                        </div>
                        <p className="text-xl font-bold text-foreground">
                            {formatPrice(tier.monthlyRevenue || 0, tier.currency)}
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Features & Benefits</h4>
                    <div className="space-y-2">
                        {tier.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">{feature}</span>
                            </div>
                        ))}
                        {tier.features.length > 3 && (
                            <p className="text-xs text-muted-foreground pl-6">
                                +{tier.features.length - 3} more features
                            </p>
                        )}
                    </div>
                </div>

                {/* Access Permissions */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Access</h4>
                    <div className="flex flex-wrap gap-2">
                        {tier.hasDiscussionAccess && (
                            <div className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                Discussion
                            </div>
                        )}
                        {tier.hasLiveAccess && (
                            <div className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs flex items-center gap-1">
                                <Video className="w-3 h-3" />
                                Live
                            </div>
                        )}
                        {tier.hasResourceAccess && (
                            <div className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Resources
                            </div>
                        )}
                        {tier.hasPollAccess && (
                            <div className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs flex items-center gap-1">
                                <BarChart3 className="w-3 h-3" />
                                Polls
                            </div>
                        )}
                        {tier.hasDirectMessaging && (
                            <div className="px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded text-xs flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                DM
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(tier)}
                        className="flex-1 px-4 py-2 bg-card hover:bg-gray-700 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Edit className="w-4 h-4" />
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(tier.id)}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={(tier.subscriberCount || 0) > 0}
                        title={(tier.subscriberCount || 0) > 0 ? 'Cannot delete tier with active subscribers' : 'Delete tier'}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Color Accent */}
            {tier.color && tier.isActive && (
                <div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: tier.color }}
                />
            )}
        </motion.div>
    )
}
