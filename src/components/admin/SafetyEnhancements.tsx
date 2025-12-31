'use client'

import React, { useState, useEffect } from 'react'
import {
    Shield,
    Search,
    Plus,
    Trash2,
    Edit,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TrendingUp,
    Filter,
    MessageSquare,
    Eye,
    EyeOff,
    Save,
    BarChart3,
    Clock,
    Users,
    Lock,
    Unlock,
    Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface KeywordRule {
    id: string
    keyword: string
    action: 'flag' | 'auto_moderate' | 'block'
    category: 'profanity' | 'harassment' | 'spam' | 'adult' | 'violence' | 'custom'
    severity: 'low' | 'medium' | 'high' | 'critical'
    caseSensitive: boolean
    wholeWordOnly: boolean
    enabled: boolean
    matchCount: number
    lastMatched?: string
    createdAt: string
}

interface MessageFilter {
    id: string
    name: string
    description: string
    enabled: boolean
    filterType: 'keyword' | 'pattern' | 'spam' | 'link' | 'repeated'
    action: 'warn' | 'mute' | 'block' | 'flag_for_review'
    threshold?: number
    matchCount: number
}

interface AgeControl {
    id: string
    feature: string
    minAge: number
    maxAge?: number
    enabled: boolean
    description: string
    enforcementLevel: 'soft' | 'hard' | 'verified_only'
}

const actionColors = {
    flag: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    auto_moderate: 'bg-orange-100 text-orange-800 border-orange-200',
    block: 'bg-red-100 text-red-800 border-red-200',
    warn: 'bg-blue-100 text-blue-800 border-blue-200',
    mute: 'bg-purple-100 text-purple-800 border-purple-200',
    flag_for_review: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const severityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
}

const categoryColors = {
    profanity: 'bg-red-100 text-red-800 border-red-200',
    harassment: 'bg-pink-100 text-pink-800 border-pink-200',
    spam: 'bg-orange-100 text-orange-800 border-orange-200',
    adult: 'bg-purple-100 text-purple-800 border-purple-200',
    violence: 'bg-red-100 text-red-800 border-red-200',
    custom: 'bg-muted text-gray-800 border-border'
}

const enforcementColors = {
    soft: 'bg-blue-100 text-blue-800 border-blue-200',
    hard: 'bg-orange-100 text-orange-800 border-orange-200',
    verified_only: 'bg-purple-100 text-purple-800 border-purple-200'
}

export default function SafetyEnhancementsPage() {
    const [activeTab, setActiveTab] = useState('keywords')
    const [keywords, setKeywords] = useState<KeywordRule[]>([])
    const [filters, setFilters] = useState<MessageFilter[]>([])
    const [ageControls, setAgeControls] = useState<AgeControl[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)

    useEffect(() => {
        fetchSafetySettings()
    }, [])

    const fetchSafetySettings = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/safety')
            if (!response.ok) throw new Error('Failed to fetch safety settings')
            const data = await response.json()
            setKeywords(data.keywords || [])
            setFilters(data.filters || [])
            setAgeControls(data.ageControls || [])
        } catch (error) {
            toast.error('Failed to load safety settings')
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async (type: 'keywords' | 'filters' | 'age-controls', data: any) => {
        try {
            const response = await fetch('/api/admin/safety', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data })
            })
            if (!response.ok) throw new Error('Failed to save settings')
            toast.success('Settings saved')
        } catch (error) {
            toast.error('Failed to save settings')
        }
    }

    const stats = {
        totalKeywords: keywords.length,
        activeKeywords: keywords.filter(k => k.enabled).length,
        totalMatches: keywords.reduce((sum, k) => sum + k.matchCount, 0),
        activeFilters: filters.filter(f => f.enabled).length,
        ageRestrictedFeatures: ageControls.filter(c => c.enabled).length
    }

    const filteredKeywords = keywords.filter(k =>
        k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const toggleKeyword = async (id: string) => {
        const updated = keywords.map(k =>
            k.id === id ? { ...k, enabled: !k.enabled } : k
        )
        setKeywords(updated)
        await saveSettings('keywords', updated)
    }

    const toggleFilter = async (id: string) => {
        const updated = filters.map(f =>
            f.id === id ? { ...f, enabled: !f.enabled } : f
        )
        setFilters(updated)
        await saveSettings('filters', updated)
    }

    const toggleAgeControl = async (id: string) => {
        const updated = ageControls.map(c =>
            c.id === id ? { ...c, enabled: !c.enabled } : c
        )
        setAgeControls(updated)
        await saveSettings('age-controls', updated)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading safety settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 group hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-500/20 rounded-xl p-2.5">
                            <Shield className="w-6 h-6 text-purple-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.totalKeywords}</div>
                    <div className="text-sm text-gray-400 font-medium tracking-wide uppercase text-[10px]">Keyword Rules</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 group hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-500/20 rounded-xl p-2.5">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.activeKeywords}</div>
                    <div className="text-sm text-gray-400 font-medium tracking-wide uppercase text-[10px]">Active Rules</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 group hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-500/20 rounded-xl p-2.5">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.totalMatches.toLocaleString()}</div>
                    <div className="text-sm text-gray-400 font-medium tracking-wide uppercase text-[10px]">Total Matches</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 group hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-500/20 rounded-xl p-2.5">
                            <Filter className="w-6 h-6 text-orange-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.activeFilters}</div>
                    <div className="text-sm text-gray-400 font-medium tracking-wide uppercase text-[10px]">Active Filters</div>
                </div>

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 group hover:bg-white/10 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-red-500/20 rounded-xl p-2.5">
                            <Lock className="w-6 h-6 text-red-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.ageRestrictedFeatures}</div>
                    <div className="text-sm text-gray-400 font-medium tracking-wide uppercase text-[10px]">Age Controls</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl transition-all duration-500">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="border-b border-border px-6">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="keywords" className="data-[state=active]:bg-purple-50">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Keyword Dashboard
                            </TabsTrigger>
                            <TabsTrigger value="filters" className="data-[state=active]:bg-purple-50">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message Filters
                            </TabsTrigger>
                            <TabsTrigger value="age" className="data-[state=active]:bg-purple-50">
                                <Lock className="w-4 h-4 mr-2" />
                                Age Controls
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Keyword Dashboard Tab */}
                    <TabsContent value="keywords" className="p-6">
                        <div className="space-y-4">
                            {/* Header Actions */}
                            <div className="flex items-center justify-between">
                                <div className="flex-1 max-w-md">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Search keywords..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Keyword Rule
                                </Button>
                            </div>

                            {/* Keywords Table */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-background border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Keyword</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Category</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Severity</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Action</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Matches</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Last Match</th>
                                            <th className="text-center py-3 px-4 font-medium text-foreground">Status</th>
                                            <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredKeywords.map((keyword) => (
                                            <tr key={keyword.id} className="hover:bg-background">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-foreground">{keyword.keyword}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {keyword.caseSensitive && (
                                                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                                                Case Sensitive
                                                            </Badge>
                                                        )}
                                                        {keyword.wholeWordOnly && (
                                                            <Badge className="bg-muted text-gray-800 border-border text-xs">
                                                                Whole Word
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={categoryColors[keyword.category]}>
                                                        {keyword.category}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={severityColors[keyword.severity]}>
                                                        {keyword.severity}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={actionColors[keyword.action]}>
                                                        {keyword.action.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-semibold text-foreground">
                                                            {keyword.matchCount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {keyword.lastMatched ? formatDate(keyword.lastMatched) : 'Never'}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button
                                                        onClick={() => toggleKeyword(keyword.id)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${keyword.enabled
                                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                                : 'bg-muted text-gray-800 border border-border'
                                                            }`}
                                                    >
                                                        {keyword.enabled ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3" />
                                                                Enabled
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-3 h-3" />
                                                                Disabled
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="outline" className="text-xs">
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-xs text-red-600 hover:text-red-700">
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Message Filters Tab */}
                    <TabsContent value="filters" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-foreground">Active Message Filters</h3>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Filter
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {filters.map((filter) => (
                                    <div key={filter.id} className="border border-border rounded-lg p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-foreground">{filter.name}</h4>
                                                    <Badge className={actionColors[filter.action]}>
                                                        {filter.action.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                        {filter.filterType}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{filter.description}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                        <BarChart3 className="w-4 h-4" />
                                                        <span>{filter.matchCount.toLocaleString()} matches</span>
                                                    </div>
                                                    {filter.threshold && (
                                                        <div className="flex items-center gap-1 text-muted-foreground">
                                                            <AlertTriangle className="w-4 h-4" />
                                                            <span>Threshold: {filter.threshold}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleFilter(filter.id)}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter.enabled
                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                            : 'bg-muted text-gray-800 border border-border'
                                                        }`}
                                                >
                                                    {filter.enabled ? (
                                                        <>
                                                            <Eye className="w-4 h-4" />
                                                            Enabled
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff className="w-4 h-4" />
                                                            Disabled
                                                        </>
                                                    )}
                                                </button>
                                                <Button size="sm" variant="outline">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Age Controls Tab */}
                    <TabsContent value="age" className="p-6">
                        <div className="space-y-4">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-foreground mb-2">Age-Gated Feature Controls</h3>
                                <p className="text-sm text-muted-foreground">
                                    Configure minimum age requirements for platform features to ensure user safety and compliance
                                </p>
                            </div>

                            <div className="space-y-3">
                                {ageControls.map((control) => (
                                    <div key={control.id} className="border border-border rounded-lg p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-semibold text-foreground">{control.feature}</h4>
                                                    <Badge className={enforcementColors[control.enforcementLevel]}>
                                                        {control.enforcementLevel.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-3">{control.description}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1 text-foreground">
                                                        <Users className="w-4 h-4 text-muted-foreground" />
                                                        <span className="font-medium">Min Age: {control.minAge}</span>
                                                    </div>
                                                    {control.maxAge && (
                                                        <div className="flex items-center gap-1 text-foreground">
                                                            <Users className="w-4 h-4 text-muted-foreground" />
                                                            <span className="font-medium">Max Age: {control.maxAge}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleAgeControl(control.id)}
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${control.enabled
                                                            ? 'bg-green-100 text-green-800 border border-green-200'
                                                            : 'bg-muted text-gray-800 border border-border'
                                                        }`}
                                                >
                                                    {control.enabled ? (
                                                        <>
                                                            <Lock className="w-4 h-4" />
                                                            Enforced
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Unlock className="w-4 h-4" />
                                                            Disabled
                                                        </>
                                                    )}
                                                </button>
                                                <Button size="sm" variant="outline">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-5 bg-purple-500/10 border border-purple-500/20 rounded-2xl backdrop-blur-md">
                                <div className="flex items-start gap-4">
                                    <div className="bg-purple-500/20 rounded-full p-2 mt-1">
                                        <Shield className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-purple-400 mb-2">Enforcement Standards</h4>
                                        <ul className="text-sm text-gray-300 space-y-2">
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                <span><strong>Soft Enforcement:</strong> Users receive real-time warnings but can still proceed with caution.</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                                                <span><strong>Hard Enforcement:</strong> Critical features are strictly blocked for users not meeting requirements.</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                                <span><strong>Verified Exclusive:</strong> Access is granted only after formal identity and age verification.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
