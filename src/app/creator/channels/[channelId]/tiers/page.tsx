'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, ArrowLeft, Sparkles, TrendingUp, Users, DollarSign } from 'lucide-react'
import TierCard from '@/components/membership/TierCard'
import TierFormModal from '@/components/membership/TierFormModal'
import { toast } from 'react-hot-toast'

interface Tier {
    id: string
    name: string
    nameAr?: string
    description?: string
    descriptionAr?: string
    price: number
    currency: string
    billingCycle: string
    features: string[]
    maxMembers?: number
    hasDiscussionAccess: boolean
    hasLiveAccess: boolean
    hasResourceAccess: boolean
    hasPollAccess: boolean
    hasDirectMessaging: boolean
    color?: string
    icon?: string
    isActive: boolean
    subscriberCount?: number
    monthlyRevenue?: number
}

export default function TierManagementPage() {
    const params = useParams()
    const router = useRouter()
    const channelId = params?.channelId as string

    const [tiers, setTiers] = useState<Tier[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTier, setEditingTier] = useState<Tier | null>(null)

    // Stats
    const totalSubscribers = tiers.reduce((sum, tier) => sum + (tier.subscriberCount || 0), 0)
    const totalRevenue = tiers.reduce((sum, tier) => sum + (tier.monthlyRevenue || 0), 0)
    const activeTiers = tiers.filter(t => t.isActive).length

    useEffect(() => {
        fetchTiers()
    }, [channelId])

    const fetchTiers = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/channels/${channelId}/tiers`)
            if (!response.ok) throw new Error('Failed to fetch tiers')
            
            const data = await response.json()
            setTiers(data.tiers || [])
        } catch (error) {
            console.error('Error fetching tiers:', error)
            toast.error('Failed to load tiers')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateTier = async (data: any) => {
        try {
            const response = await fetch(`/api/channels/${channelId}/tiers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) throw new Error('Failed to create tier')

            toast.success('Tier created successfully!')
            fetchTiers()
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error creating tier:', error)
            toast.error('Failed to create tier')
            throw error
        }
    }

    const handleUpdateTier = async (data: any) => {
        if (!editingTier) return

        try {
            const response = await fetch(`/api/channels/${channelId}/tiers/${editingTier.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) throw new Error('Failed to update tier')

            toast.success('Tier updated successfully!')
            fetchTiers()
            setEditingTier(null)
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error updating tier:', error)
            toast.error('Failed to update tier')
            throw error
        }
    }

    const handleDeleteTier = async (tierId: string) => {
        if (!confirm('Are you sure you want to delete this tier?')) return

        try {
            const response = await fetch(`/api/channels/${channelId}/tiers/${tierId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete tier')
            }

            toast.success('Tier deleted successfully!')
            fetchTiers()
        } catch (error: any) {
            console.error('Error deleting tier:', error)
            toast.error(error.message || 'Failed to delete tier')
        }
    }

    const handleToggleActive = async (tierId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/channels/${channelId}/tiers/${tierId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive })
            })

            if (!response.ok) throw new Error('Failed to update tier status')

            toast.success(isActive ? 'Tier activated' : 'Tier deactivated')
            fetchTiers()
        } catch (error) {
            console.error('Error toggling tier status:', error)
            toast.error('Failed to update tier status')
        }
    }

    const handleEditTier = (tier: Tier) => {
        setEditingTier(tier)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setEditingTier(null)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-800 rounded w-1/3" />
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-32 bg-gray-800 rounded-xl" />
                            <div className="h-32 bg-gray-800 rounded-xl" />
                            <div className="h-32 bg-gray-800 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="h-96 bg-gray-800 rounded-2xl" />
                            <div className="h-96 bg-gray-800 rounded-2xl" />
                            <div className="h-96 bg-gray-800 rounded-2xl" />
                        </div>
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
                        Back to Channel
                    </button>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                                <Sparkles className="w-8 h-8 text-purple-400" />
                                Membership Tiers
                            </h1>
                            <p className="text-gray-400">
                                Manage your channel's subscription tiers and pricing
                            </p>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-500/25"
                        >
                            <Plus className="w-5 h-5" />
                            Create New Tier
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-sm text-gray-400">Active Tiers</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{activeTiers}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            out of {tiers.length} total
                        </p>
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
                            <span className="text-sm text-gray-400">Total Subscribers</span>
                        </div>
                        <p className="text-3xl font-bold text-white">{totalSubscribers}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            across all tiers
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <DollarSign className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-sm text-gray-400">Monthly Revenue</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'EGP',
                                minimumFractionDigits: 0
                            }).format(totalRevenue)}
                        </p>
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Recurring revenue
                        </p>
                    </motion.div>
                </div>

                {/* Tiers Grid */}
                {tiers.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                            No membership tiers yet
                        </h3>
                        <p className="text-gray-400 mb-6">
                            Create your first tier to start offering memberships
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Create Your First Tier
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tiers.map((tier) => (
                            <TierCard
                                key={tier.id}
                                tier={tier}
                                onEdit={handleEditTier}
                                onDelete={handleDeleteTier}
                                onToggleActive={handleToggleActive}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <TierFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={editingTier ? handleUpdateTier : handleCreateTier}
                initialData={editingTier || undefined}
                mode={editingTier ? 'edit' : 'create'}
            />
        </div>
    )
}
