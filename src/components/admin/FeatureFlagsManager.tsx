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
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 border border-white/20 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-2 mb-6 text-purple-400">
                        <Plus className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-white">Create New Flag</h3>
                    </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flags.map(flag => (
                    <div
                        key={flag.id}
                        className={`group relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:bg-white/10 ${flag.enabled ? 'border-purple-500/30 shadow-purple-500/5' : 'border-white/10'
                            }`}
                    >
                        <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{flag.name}</h3>
                                    <code className="text-[10px] px-2 py-0.5 bg-white/10 rounded-md text-gray-400 font-mono">
                                        {flag.key}
                                    </code>
                                </div>
                                <div className="flex items-center gap-2">
                                    {flag.enabled ? (
                                        <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    ) : (
                                        <div className="flex h-2 w-2 rounded-full bg-gray-500" />
                                    )}
                                </div>
                            </div>

                            {flag.description && (
                                <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-2">{flag.description}</p>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-gray-400">
                                        <Percent className="w-3.5 h-3.5" />
                                        <span>{flag.rolloutPercentage}% Rollout</span>
                                    </div>
                                    <span className={flag.enabled ? 'text-green-400 font-bold' : 'text-gray-500'}>
                                        {flag.enabled ? 'Active' : 'Disabled'}
                                    </span>
                                </div>

                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${flag.enabled ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-white/10'}`}
                                        style={{ width: `${flag.rolloutPercentage}%` }}
                                    />
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex -space-x-2">
                                        {flag.targetRoles.map(role => (
                                            <div
                                                key={role}
                                                className="w-6 h-6 rounded-full bg-purple-600 border-2 border-[#0a0a14] flex items-center justify-center text-[8px] font-bold text-white shadow-lg"
                                                title={role}
                                            >
                                                {role[0]}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => toggleFlag(flag)}
                                            className={`p-2 rounded-xl transition-all ${flag.enabled
                                                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                                }`}
                                        >
                                            {flag.enabled ? (
                                                <ToggleRight className="w-5 h-5" />
                                            ) : (
                                                <ToggleLeft className="w-5 h-5" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => deleteFlag(flag)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
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
