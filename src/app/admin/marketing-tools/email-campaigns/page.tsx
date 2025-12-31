'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Mail,
    Plus,
    Send,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    Users,
    TrendingUp,
    Calendar
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface EmailCampaign {
    id: string
    name: string
    subject: string
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
    recipientCount: number
    sentCount: number
    openRate: number
    clickRate: number
    scheduledFor?: string
    createdAt: string
    sentAt?: string
}

export default function EmailCampaignsPage() {
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchCampaigns()
    }, [])

    const fetchCampaigns = async () => {
        try {
            const response = await fetch('/api/admin/marketing-tools/email-campaigns')
            if (response.ok) {
                const data = await response.json()
                setCampaigns(data)
            }
        } catch (error) {
            console.error('Failed to fetch campaigns:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCampaign = async (name: string, subject: string) => {
        try {
            const response = await fetch('/api/admin/marketing-tools/email-campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, subject })
            })
            if (response.ok) {
                await fetchCampaigns()
                setShowCreateModal(false)
            }
        } catch (error) {
            console.error('Failed to create campaign:', error)
        }
    }

    const handleSendCampaign = async (campaignId: string) => {
        if (!confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/marketing-tools/email-campaigns/${campaignId}/send`, {
                method: 'POST'
            })
            if (response.ok) {
                await fetchCampaigns()
            }
        } catch (error) {
            console.error('Failed to send campaign:', error)
        }
    }

    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/marketing-tools/email-campaigns/${campaignId}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                await fetchCampaigns()
            }
        } catch (error) {
            console.error('Failed to delete campaign:', error)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-500/20 text-gray-400'
            case 'scheduled': return 'bg-blue-500/20 text-blue-400'
            case 'sending': return 'bg-yellow-500/20 text-yellow-400'
            case 'sent': return 'bg-green-500/20 text-green-400'
            case 'failed': return 'bg-red-500/20 text-red-400'
            default: return 'bg-gray-500/20 text-gray-400'
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-24 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Email Campaigns
                    </h1>
                    <p className="text-muted-foreground">
                        Create and manage email marketing campaigns
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchCampaigns}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Campaign
                    </Button>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-8 h-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">12</p>
                            <p className="text-sm text-muted-foreground">Total Campaigns</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">45.2K</p>
                            <p className="text-sm text-muted-foreground">Total Recipients</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Eye className="w-8 h-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">24.8%</p>
                            <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">3.2%</p>
                            <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Campaigns List */}
            <div className="space-y-4">
                {campaigns.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-12 text-center"
                    >
                        <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No Campaigns</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first email campaign to start engaging with your audience.
                        </p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Campaign
                        </Button>
                    </motion.div>
                ) : (
                    campaigns.map((campaign, index) => (
                        <motion.div
                            key={campaign.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{campaign.name}</h3>
                                        <p className="text-sm text-muted-foreground">{campaign.subject}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(campaign.status)}>
                                        {campaign.status}
                                    </Badge>
                                    {campaign.status === 'draft' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleSendCampaign(campaign.id)}
                                            className="bg-green-500/20 hover:bg-green-500/30 text-green-400"
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={() => {/* Edit campaign */}}
                                        className="bg-white/10 hover:bg-white/20 text-foreground"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleDeleteCampaign(campaign.id)}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Recipients</div>
                                    <div className="text-sm font-medium text-foreground">{campaign.recipientCount.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Sent</div>
                                    <div className="text-sm font-medium text-foreground">{campaign.sentCount.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Open Rate</div>
                                    <div className="text-sm font-medium text-foreground">{campaign.openRate}%</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Click Rate</div>
                                    <div className="text-sm font-medium text-foreground">{campaign.clickRate}%</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                <div className="text-xs text-muted-foreground">
                                    Created: {new Date(campaign.createdAt).toLocaleDateString()}
                                    {campaign.sentAt && ` • Sent: ${new Date(campaign.sentAt).toLocaleDateString()}`}
                                    {campaign.scheduledFor && ` • Scheduled: ${new Date(campaign.scheduledFor).toLocaleDateString()}`}
                                </div>
                                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Campaign Modal would go here */}
        </div>
    )
}