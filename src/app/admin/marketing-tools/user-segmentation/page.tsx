'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Users,
    Plus,
    Filter,
    Download,
    Eye,
    Edit,
    Trash2,
    RefreshCw,
    UserCheck,
    UserX,
    Mail,
    Calendar
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface UserSegment {
    id: string
    name: string
    description: string
    criteria: {
        type: 'activity' | 'subscription' | 'engagement' | 'demographic'
        operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between'
        value: any
    }[]
    userCount: number
    createdAt: string
    lastUpdated: string
    isActive: boolean
}

export default function UserSegmentationPage() {
    const [segments, setSegments] = useState<UserSegment[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        fetchSegments()
    }, [])

    const fetchSegments = async () => {
        try {
            const response = await fetch('/api/admin/marketing-tools/user-segmentation')
            if (response.ok) {
                const data = await response.json()
                setSegments(data)
            }
        } catch (error) {
            console.error('Failed to fetch segments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateSegment = async (segmentData: Partial<UserSegment>) => {
        try {
            const response = await fetch('/api/admin/marketing-tools/user-segmentation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(segmentData)
            })
            if (response.ok) {
                await fetchSegments()
                setShowCreateModal(false)
            }
        } catch (error) {
            console.error('Failed to create segment:', error)
        }
    }

    const handleDeleteSegment = async (segmentId: string) => {
        if (!confirm('Are you sure you want to delete this segment?')) {
            return
        }

        try {
            const response = await fetch(`/api/admin/marketing-tools/user-segmentation/${segmentId}`, {
                method: 'DELETE'
            })
            if (response.ok) {
                await fetchSegments()
            }
        } catch (error) {
            console.error('Failed to delete segment:', error)
        }
    }

    const handleExportSegment = async (segmentId: string) => {
        try {
            const response = await fetch(`/api/admin/marketing-tools/user-segmentation/${segmentId}/export`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `segment-${segmentId}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error('Failed to export segment:', error)
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
                        User Segmentation
                    </h1>
                    <p className="text-muted-foreground">
                        Create and manage user segments for targeted marketing campaigns
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchSegments}
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
                        Create Segment
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
                        <Users className="w-8 h-8 text-blue-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">8</p>
                            <p className="text-sm text-muted-foreground">Active Segments</p>
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
                        <UserCheck className="w-8 h-8 text-green-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">45.2K</p>
                            <p className="text-sm text-muted-foreground">Total Users</p>
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
                        <Mail className="w-8 h-8 text-purple-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">12</p>
                            <p className="text-sm text-muted-foreground">Campaigns Using Segments</p>
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
                        <Filter className="w-8 h-8 text-orange-400" />
                        <div>
                            <p className="text-2xl font-bold text-foreground">24</p>
                            <p className="text-sm text-muted-foreground">Filter Rules</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Segments List */}
            <div className="space-y-4">
                {segments.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-12 text-center"
                    >
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">No Segments</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first user segment to start targeted marketing campaigns.
                        </p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Segment
                        </Button>
                    </motion.div>
                ) : (
                    segments.map((segment, index) => (
                        <motion.div
                            key={segment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-foreground">{segment.name}</h3>
                                            <Badge className={segment.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                                                {segment.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{segment.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => handleExportSegment(segment.id)}
                                        className="bg-white/10 hover:bg-white/20 text-foreground"
                                    >
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {/* Edit segment */}}
                                        className="bg-white/10 hover:bg-white/20 text-foreground"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleDeleteSegment(segment.id)}
                                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Users in Segment</div>
                                    <div className="text-lg font-bold text-foreground">{segment.userCount.toLocaleString()}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Filter Criteria</div>
                                    <div className="text-sm font-medium text-foreground">{segment.criteria.length} rules</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg">
                                    <div className="text-xs text-muted-foreground mb-1">Last Updated</div>
                                    <div className="text-sm font-medium text-foreground">
                                        {new Date(segment.lastUpdated).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="text-xs text-muted-foreground">
                                    Created: {new Date(segment.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                        <Eye className="w-4 h-4 mr-1" />
                                        View Users
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                        <Mail className="w-4 h-4 mr-1" />
                                        Create Campaign
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Create Segment Modal would go here */}
        </div>
    )
}