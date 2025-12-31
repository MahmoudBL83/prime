'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Key,
    Plus,
    Trash2,
    Copy,
    RefreshCw,
    Eye,
    EyeOff,
    AlertCircle,
    CheckCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface ApiKey {
    id: string
    name: string
    description: string
    key: string
    createdAt: string
    lastUsed?: string
    permissions: string[]
    status: 'active' | 'inactive'
}

export default function ApiKeysPage() {
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
    const router = useRouter()

    useEffect(() => {
        fetchApiKeys()
    }, [])

    const fetchApiKeys = async () => {
        try {
            const response = await fetch('/api/admin/developer-tools/api-keys')
            if (response.ok) {
                const data = await response.json()
                setApiKeys(data)
            }
        } catch (error) {
            console.error('Failed to fetch API keys:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateKey = async (name: string, description: string, permissions: string[]) => {
        try {
            const response = await fetch('/api/admin/developer-tools/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, permissions })
            })
            if (response.ok) {
                await fetchApiKeys()
                setShowCreateModal(false)
            }
        } catch (error) {
            console.error('Failed to create API key:', error)
        }
    }

    const handleDeleteKey = async (keyId: string) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/developer-tools/api-keys/${keyId}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                await fetchApiKeys()
            }
        } catch (error) {
            console.error('Failed to delete API key:', error)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const toggleKeyVisibility = (keyId: string) => {
        const newVisible = new Set(visibleKeys)
        if (newVisible.has(keyId)) {
            newVisible.delete(keyId)
        } else {
            newVisible.add(keyId)
        }
        setVisibleKeys(newVisible)
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
                        API Keys Management
                    </h1>
                    <p className="text-muted-foreground">
                        Manage API keys for external integrations and services
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchApiKeys}
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
                        Create API Key
                    </Button>
                </div>
            </motion.div>

            {/* API Keys List */}
            <div className="space-y-4">
                {apiKeys.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-12 text-center"
                    >
                        <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No API Keys</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first API key to start integrating with external services.
                        </p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create API Key
                        </Button>
                    </motion.div>
                ) : (
                    apiKeys.map((key, index) => (
                        <motion.div
                            key={key.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Key className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{key.name}</h3>
                                        <p className="text-sm text-muted-foreground">{key.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                                        {key.status}
                                    </Badge>
                                    <Button
                                        size="sm"
                                        onClick={() => handleDeleteKey(key.id)}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-sm text-muted-foreground">API Key:</span>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm font-mono text-foreground bg-black/20 px-2 py-1 rounded">
                                            {visibleKeys.has(key.id) ? key.key : '•'.repeat(32)}
                                        </code>
                                        <Button
                                            size="sm"
                                            onClick={() => toggleKeyVisibility(key.id)}
                                            className="bg-white/10 hover:bg-white/20 text-foreground"
                                        >
                                            {visibleKeys.has(key.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => copyToClipboard(key.key)}
                                            className="bg-white/10 hover:bg-white/20 text-foreground"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Permissions:</span>
                                    <div className="flex gap-1">
                                        {key.permissions.map((permission) => (
                                            <Badge key={permission} variant="outline" className="text-xs">
                                                {permission}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Created:</span>
                                    <span className="text-foreground">{new Date(key.createdAt).toLocaleDateString()}</span>
                                </div>

                                {key.lastUsed && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Last Used:</span>
                                        <span className="text-foreground">{new Date(key.lastUsed).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create API Key Modal would go here */}
        </div>
    )
}