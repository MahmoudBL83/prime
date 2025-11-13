'use client'

import React, { useState } from 'react'
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
    Unlock
} from 'lucide-react'
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

const MOCK_KEYWORDS: KeywordRule[] = [
    {
        id: '1',
        keyword: 'spam',
        action: 'auto_moderate',
        category: 'spam',
        severity: 'medium',
        caseSensitive: false,
        wholeWordOnly: true,
        enabled: true,
        matchCount: 156,
        lastMatched: '2024-10-15T14:30:00Z',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: '2',
        keyword: 'harassment',
        action: 'flag',
        category: 'harassment',
        severity: 'high',
        caseSensitive: false,
        wholeWordOnly: false,
        enabled: true,
        matchCount: 43,
        lastMatched: '2024-10-15T11:20:00Z',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: '3',
        keyword: 'inappropriate content',
        action: 'block',
        category: 'adult',
        severity: 'critical',
        caseSensitive: false,
        wholeWordOnly: false,
        enabled: true,
        matchCount: 89,
        lastMatched: '2024-10-15T09:45:00Z',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: '4',
        keyword: 'violence',
        action: 'flag',
        category: 'violence',
        severity: 'high',
        caseSensitive: false,
        wholeWordOnly: true,
        enabled: true,
        matchCount: 27,
        lastMatched: '2024-10-14T16:10:00Z',
        createdAt: '2024-01-01T00:00:00Z'
    }
]

const MOCK_FILTERS: MessageFilter[] = [
    {
        id: '1',
        name: 'Excessive Links Filter',
        description: 'Blocks messages with more than 3 links',
        enabled: true,
        filterType: 'link',
        action: 'block',
        threshold: 3,
        matchCount: 234
    },
    {
        id: '2',
        name: 'Spam Detection',
        description: 'AI-powered spam message detection',
        enabled: true,
        filterType: 'spam',
        action: 'flag_for_review',
        matchCount: 567
    },
    {
        id: '3',
        name: 'Repeated Messages',
        description: 'Prevents sending the same message multiple times',
        enabled: true,
        filterType: 'repeated',
        action: 'warn',
        threshold: 2,
        matchCount: 189
    },
    {
        id: '4',
        name: 'Profanity Filter',
        description: 'Blocks common profanity and offensive language',
        enabled: true,
        filterType: 'keyword',
        action: 'auto_moderate',
        matchCount: 1234
    }
]

const MOCK_AGE_CONTROLS: AgeControl[] = [
    {
        id: '1',
        feature: 'Study Buddy Matching',
        minAge: 16,
        maxAge: 25,
        enabled: true,
        description: 'Restricts study buddy matching to users within age range',
        enforcementLevel: 'hard'
    },
    {
        id: '2',
        feature: 'Private Messaging',
        minAge: 18,
        enabled: true,
        description: 'Requires users to be 18+ to send private messages',
        enforcementLevel: 'verified_only'
    },
    {
        id: '3',
        feature: 'Group Discussions',
        minAge: 13,
        enabled: true,
        description: 'Minimum age requirement for participating in group discussions',
        enforcementLevel: 'soft'
    },
    {
        id: '4',
        feature: 'Creator Applications',
        minAge: 18,
        enabled: true,
        description: 'Must be 18+ to apply as a content creator',
        enforcementLevel: 'verified_only'
    },
    {
        id: '5',
        feature: 'Course Reviews',
        minAge: 13,
        enabled: true,
        description: 'Minimum age to post course reviews',
        enforcementLevel: 'soft'
    }
]

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
    const [keywords, setKeywords] = useState<KeywordRule[]>(MOCK_KEYWORDS)
    const [filters, setFilters] = useState<MessageFilter[]>(MOCK_FILTERS)
    const [ageControls, setAgeControls] = useState<AgeControl[]>(MOCK_AGE_CONTROLS)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)

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

    const toggleKeyword = (id: string) => {
        setKeywords(keywords.map(k =>
            k.id === id ? { ...k, enabled: !k.enabled } : k
        ))
    }

    const toggleFilter = (id: string) => {
        setFilters(filters.map(f =>
            f.id === id ? { ...f, enabled: !f.enabled } : f
        ))
    }

    const toggleAgeControl = (id: string) => {
        setAgeControls(ageControls.map(c =>
            c.id === id ? { ...c, enabled: !c.enabled } : c
        ))
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Shield className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.totalKeywords}</div>
                    <div className="text-sm text-muted-foreground">Keyword Rules</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.activeKeywords}</div>
                    <div className="text-sm text-muted-foreground">Active Rules</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.totalMatches.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Matches</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Filter className="w-8 h-8 text-orange-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.activeFilters}</div>
                    <div className="text-sm text-muted-foreground">Active Filters</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Lock className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{stats.ageRestrictedFeatures}</div>
                    <div className="text-sm text-muted-foreground">Age Controls</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-background rounded-lg border border-border">
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
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                                            keyword.enabled
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
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        filter.enabled
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
                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                        control.enabled
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

                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">Enforcement Levels</h4>
                                        <ul className="text-sm text-blue-800 space-y-1">
                                            <li><strong>Soft:</strong> Users see a warning but can proceed</li>
                                            <li><strong>Hard:</strong> Users are blocked from accessing the feature</li>
                                            <li><strong>Verified Only:</strong> Requires age verification (ID document)</li>
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
