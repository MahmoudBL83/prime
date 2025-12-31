'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Webhook,
    Plus,
    Trash2,
    RefreshCw,
    Play,
    Pause,
    AlertCircle,
    CheckCircle,
    ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface WebhookConfig {
    id: string
    name: string
    url: string
    events: string[]
    secret: string
    status: 'active' | 'inactive' | 'failed'
    createdAt: string
    lastTriggered?: string
    failureCount: number
}

export default function WebhooksPage() {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchWebhooks()
    }, [])

    const fetchWebhooks = async () => {
        try {
            const response = await fetch('/api/admin/developer-tools/webhooks')
            if (response.ok) {
                const data = await response.json()
                setWebhooks(data)
            }
        } catch (error) {
            console.error('Failed to fetch webhooks:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateWebhook = async (name: string, url: string, events: string[]) => {
        try {
            const response = await fetch('/api/admin/developer-tools/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, url, events })
            })
            if (response.ok) {
                await fetchWebhooks()
                setShowCreateModal(false)
            }
        } catch (error) {
            console.error('Failed to create webhook:', error)
        }
    }

    const handleDeleteWebhook = async (webhookId: string) => {
        if (!confirm('Are you sure you want to delete this webhook?')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/developer-tools/webhooks/${webhookId}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                await fetchWebhooks()
            }
        } catch (error) {
            console.error('Failed to delete webhook:', error)
        }
    }

    const handleToggleWebhook = async (webhookId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

        try {
            const response = await fetch(`/api/admin/developer-tools/webhooks/${webhookId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (response.ok) {
                await fetchWebhooks()
            }
        } catch (error) {
            console.error('Failed to update webhook:', error)
        }
    }

    const handleTestWebhook = async (webhookId: string) => {
        try {
            const response = await fetch(`/api/admin/developer-tools/webhooks/${webhookId}/test`, {
                method: 'POST'
            })
            if (response.ok) {
                alert('Test webhook sent successfully!')
                await fetchWebhooks()
            } else {
                alert('Failed to send test webhook')
            }
        } catch (error) {
            console.error('Failed to test webhook:', error)
            alert('Failed to send test webhook')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
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
                        Webhook Configuration
                    </h1>
                    <p className="text-muted-foreground">
                        Configure webhooks for real-time notifications and integrations
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchWebhooks}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Webhook
                    </Button>
                </div>
            </motion.div>

            {/* Webhooks List */}
            <div className="space-y-4">
                {webhooks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-12 text-center"
                    >
                        <Webhook className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No Webhooks</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first webhook to receive real-time notifications.
                        </p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Webhook
                        </Button>
                    </motion.div>
                ) : (
                    webhooks.map((webhook, index) => (
                        <motion.div
                            key={webhook.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        webhook.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                        webhook.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        <Webhook className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{webhook.name}</h3>
                                        <p className="text-sm text-muted-foreground font-mono">{webhook.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={
                                        webhook.status === 'active' ? 'default' :
                                        webhook.status === 'failed' ? 'destructive' : 'secondary'
                                    }>
                                        {webhook.status}
                                    </Badge>
                                    <Button
                                        size="sm"
                                        onClick={() => handleTestWebhook(webhook.id)}
                                        className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
                                    >
                                        <Play className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleToggleWebhook(webhook.id, webhook.status)}
                                        className={`${
                                            webhook.status === 'active'
                                                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400'
                                                : 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                                        }`}
                                    >
                                        {webhook.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Events</div>
                                    <div className="flex flex-wrap gap-1">
                                        {webhook.events.map((event) => (
                                            <Badge key={event} variant="outline" className="text-xs">
                                                {event}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                                    <div className="text-sm text-foreground">
                                        {new Date(webhook.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Last Triggered</div>
                                    <div className="text-sm text-foreground">
                                        {webhook.lastTriggered
                                            ? new Date(webhook.lastTriggered).toLocaleDateString()
                                            : 'Never'
                                        }
                                    </div>
                                    {webhook.failureCount > 0 && (
                                        <div className="text-xs text-red-400 mt-1">
                                            {webhook.failureCount} failures
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Webhook Modal would go here */}
        </div>
    )
}