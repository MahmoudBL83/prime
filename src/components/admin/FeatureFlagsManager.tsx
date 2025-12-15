'use client'

import { useState, useEffect } from 'react'
import {
    Flag,
    ToggleLeft,
    ToggleRight,
    Users,
    Percent,
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    Check,
    Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface FeatureFlag {
    id: string
    key: string
    name: string
    description?: string
    enabled: boolean
    rolloutPercentage: number
    targetRoles: string[]
    targetUsers: string[]
    createdAt: string
    updatedAt: string
}

interface FeatureFlagsManagerProps {
    className?: string
}

export default function FeatureFlagsManager({ className = '' }: FeatureFlagsManagerProps) {
    const [flags, setFlags] = useState<FeatureFlag[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [saving, setSaving] = useState(false)

    const [newFlag, setNewFlag] = useState({
        key: '',
        name: '',
        description: '',
        enabled: false,
        rolloutPercentage: 100,
        targetRoles: [] as string[]
    })

    const roles = ['LEARNER', 'CREATOR', 'ADMIN']

    useEffect(() => {
        fetchFlags()
    }, [])

    const fetchFlags = async () => {
        try {
            const response = await fetch('/api/admin/feature-flags')
            if (response.ok) {
                const data = await response.json()
                setFlags(data.flags)
            }
        } catch (error) {
            console.error('Failed to fetch flags:', error)
            toast.error('Failed to load feature flags')
        } finally {
            setLoading(false)
        }
    }

    const toggleFlag = async (flag: FeatureFlag) => {
        try {
            const response = await fetch('/api/admin/feature-flags', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: flag.id,
                    enabled: !flag.enabled
                })
            })

            if (response.ok) {
                setFlags(flags.map(f =>
                    f.id === flag.id ? { ...f, enabled: !f.enabled } : f
                ))
                toast.success(`${flag.name} ${!flag.enabled ? 'enabled' : 'disabled'}`)
            }
        } catch (error) {
            toast.error('Failed to update flag')
        }
    }

    const updateRollout = async (flag: FeatureFlag, percentage: number) => {
        try {
            const response = await fetch('/api/admin/feature-flags', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: flag.id,
                    rolloutPercentage: percentage
                })
            })

            if (response.ok) {
                setFlags(flags.map(f =>
                    f.id === flag.id ? { ...f, rolloutPercentage: percentage } : f
                ))
                toast.success('Rollout updated')
            }
        } catch (error) {
            toast.error('Failed to update rollout')
        }
    }

    const createFlag = async () => {
        if (!newFlag.key || !newFlag.name) {
            toast.error('Key and name are required')
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/admin/feature-flags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFlag)
            })

            if (response.ok) {
                const data = await response.json()
                setFlags([...flags, data.flag])
                setNewFlag({
                    key: '',
                    name: '',
                    description: '',
                    enabled: false,
                    rolloutPercentage: 100,
                    targetRoles: []
                })
                setShowCreateForm(false)
                toast.success('Feature flag created')
            } else {
                const error = await response.json()
                toast.error(error.error || 'Failed to create flag')
            }
        } catch (error) {
            toast.error('Failed to create flag')
        } finally {
            setSaving(false)
        }
    }

    const deleteFlag = async (flag: FeatureFlag) => {
        if (!confirm(`Delete "${flag.name}"? This cannot be undone.`)) return

        try {
            const response = await fetch(`/api/admin/feature-flags?id=${flag.id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setFlags(flags.filter(f => f.id !== flag.id))
                toast.success('Feature flag deleted')
            }
        } catch (error) {
            toast.error('Failed to delete flag')
        }
    }

    if (loading) {
        return (
            <div className={`p-6 ${className}`}>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-800 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Flag className="w-6 h-6 text-purple-400" />
                    <div>
                        <h2 className="text-xl font-bold text-white">Feature Flags</h2>
                        <p className="text-sm text-gray-400">
                            {flags.length} flags • {flags.filter(f => f.enabled).length} enabled
                        </p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="bg-purple-600 hover:bg-purple-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New Flag
                </Button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-gray-700">
                    <h3 className="font-medium text-white mb-4">Create New Flag</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Key</label>
                            <input
                                type="text"
                                value={newFlag.key}
                                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                                placeholder="feature_key"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Name</label>
                            <input
                                type="text"
                                value={newFlag.name}
                                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                                placeholder="Feature Name"
                                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="text-sm text-gray-400 block mb-1">Description</label>
                        <input
                            type="text"
                            value={newFlag.description}
                            onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                            placeholder="What does this flag do?"
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                        />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Rollout %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={newFlag.rolloutPercentage}
                                onChange={(e) => setNewFlag({ ...newFlag, rolloutPercentage: parseInt(e.target.value) })}
                                className="w-24 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400 block mb-1">Target Roles</label>
                            <div className="flex gap-2">
                                {roles.map(role => (
                                    <button
                                        key={role}
                                        onClick={() => {
                                            const newRoles = newFlag.targetRoles.includes(role)
                                                ? newFlag.targetRoles.filter(r => r !== role)
                                                : [...newFlag.targetRoles, role]
                                            setNewFlag({ ...newFlag, targetRoles: newRoles })
                                        }}
                                        className={`px-3 py-1 rounded-full text-sm ${newFlag.targetRoles.includes(role)
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                            Cancel
                        </Button>
                        <Button onClick={createFlag} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                            Create
                        </Button>
                    </div>
                </div>
            )}

            {/* Flags List */}
            <div className="space-y-3">
                {flags.map(flag => (
                    <div
                        key={flag.id}
                        className={`bg-gray-800/50 rounded-xl p-4 border ${flag.enabled ? 'border-green-500/30' : 'border-gray-700'
                            }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="font-medium text-white">{flag.name}</h3>
                                    <code className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                                        {flag.key}
                                    </code>
                                    {flag.enabled ? (
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                            Enabled
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-400">
                                            Disabled
                                        </Badge>
                                    )}
                                </div>
                                {flag.description && (
                                    <p className="text-sm text-gray-400 mb-2">{flag.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Percent className="w-4 h-4" />
                                        <span>{flag.rolloutPercentage}% rollout</span>
                                    </div>
                                    {flag.targetRoles.length > 0 && (
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Users className="w-4 h-4" />
                                            <span>{flag.targetRoles.join(', ')}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Rollout slider */}
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={flag.rolloutPercentage}
                                    onChange={(e) => updateRollout(flag, parseInt(e.target.value))}
                                    className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    disabled={!flag.enabled}
                                />

                                {/* Toggle */}
                                <button
                                    onClick={() => toggleFlag(flag)}
                                    className={`p-2 rounded-lg transition-colors ${flag.enabled
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                        }`}
                                >
                                    {flag.enabled ? (
                                        <ToggleRight className="w-5 h-5" />
                                    ) : (
                                        <ToggleLeft className="w-5 h-5" />
                                    )}
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={() => deleteFlag(flag)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {flags.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Flag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No feature flags yet</p>
                    <p className="text-sm">Create your first flag to get started</p>
                </div>
            )}
        </div>
    )
}
