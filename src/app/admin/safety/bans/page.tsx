'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Ban,
    AlertTriangle,
    Clock,
    Shield,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    MessageSquare,
    Upload,
    Eye,
    Filter,
    Download,
    TrendingUp,
    RefreshCw,
    Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type BanType = 'temporary' | 'permanent' | 'feature_specific' | 'shadow'
type BanStatus = 'active' | 'expired' | 'appealed' | 'lifted'
type BanDuration = '1_day' | '3_days' | '7_days' | '14_days' | '30_days' | '90_days' | 'permanent'

interface BanRecord {
    id: string
    userId: string
    userName: string
    userEmail: string
    banType: BanType | 'warning'
    duration: string
    status: BanStatus | 'appealed'
    reason: string
    evidence: string[]
    restrictedFeatures?: string[]
    bannedBy: string
    bannedAt: string
    expiresAt?: string
    liftedAt?: string
    appealStatus?: 'pending' | 'approved' | 'rejected' | 'none'
    banHistory?: {
        previousBans: number
        lastBanDate?: string
    }
}

const banTypeColors = {
    temporary: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    permanent: 'bg-red-100 text-red-800 border-red-200',
    feature_specific: 'bg-orange-100 text-orange-800 border-orange-200',
    shadow: 'bg-purple-100 text-purple-800 border-purple-200'
}

const statusColors = {
    active: 'bg-red-100 text-red-800 border-red-200',
    expired: 'bg-muted text-gray-800 border-border',
    appealed: 'bg-blue-100 text-blue-800 border-blue-200',
    lifted: 'bg-green-100 text-green-800 border-green-200'
}

export default function BanManagementPage() {
    const [activeTab, setActiveTab] = useState('active')
    const [bans, setBans] = useState<BanRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedBan, setSelectedBan] = useState<BanRecord | null>(null)
    const [showBanModal, setShowBanModal] = useState(false)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [showLiftModal, setShowLiftModal] = useState(false)
    const [liftReason, setLiftReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLifting, setIsLifting] = useState(false)
    const [apiStats, setApiStats] = useState<{ totalActive: number; totalPermanent: number; totalTemporary: number; expiringSoon: number; appealed: number } | null>(null)
    
    // New ban form state
    const [newBan, setNewBan] = useState({
        userName: '',
        userId: '',
        banType: 'temporary' as BanType,
        duration: '7_days' as BanDuration,
        reason: '',
        evidence: '',
        restrictedFeatures: [] as string[]
    })

    const fetchBans = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/admin/safety/bans', {
                credentials: 'include',
                cache: 'no-store'
            })
            if (!response.ok) throw new Error('Failed to fetch bans')
            const data = await response.json()
            setBans(data.bans || [])
            setApiStats(data.stats || null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBans()
    }, [fetchBans])

    const activeBans = bans.filter(b => b.status === 'active')
    const expiredBans = bans.filter(b => b.status === 'expired')
    const appealedBans = bans.filter(b => b.status === 'appealed')
    const liftedBans = bans.filter(b => b.status === 'lifted')

    const stats = {
        totalActive: apiStats?.totalActive ?? activeBans.length,
        temporary: apiStats?.totalTemporary ?? activeBans.filter(b => b.banType === 'temporary').length,
        permanent: apiStats?.totalPermanent ?? activeBans.filter(b => b.banType === 'permanent').length,
        featureSpecific: activeBans.filter(b => b.banType === 'feature_specific').length,
        shadow: activeBans.filter(b => b.banType === 'shadow').length,
        appealed: apiStats?.appealed ?? appealedBans.length
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getDaysRemaining = (expiresAt?: string) => {
        if (!expiresAt) return null
        const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        return days > 0 ? days : 0
    }

    const formatDuration = (duration: string) => {
        const map: Record<string, string> = {
            one_day: '1 day',
            three_days: '3 days',
            seven_days: '7 days',
            fourteen_days: '14 days',
            thirty_days: '30 days',
            ninety_days: '90 days',
            permanent: 'Permanent'
        }
        const key = duration?.toLowerCase().replace(/ /g, '_')
        return map[key] || duration.replace(/_/g, ' ')
    }

    const handleViewDetails = (ban: BanRecord) => {
        setSelectedBan(ban)
        setShowDetailsModal(true)
    }

    const handleLiftBan = (ban: BanRecord) => {
        setSelectedBan(ban)
        setShowLiftModal(true)
    }

    const handleCreateBan = async () => {
        try {
            setIsSubmitting(true)
            if (!newBan.userId || !newBan.reason.trim()) {
                setError('User ID and reason are required')
                return
            }
            const banTypeMap: Record<BanType, string> = {
                temporary: 'TEMPORARY',
                permanent: 'PERMANENT',
                feature_specific: 'FEATURE_SPECIFIC',
                shadow: 'SHADOW'
            }
            const durationMap: Record<BanDuration, string> = {
                '1_day': 'ONE_DAY',
                '3_days': 'THREE_DAYS',
                '7_days': 'SEVEN_DAYS',
                '14_days': 'FOURTEEN_DAYS',
                '30_days': 'THIRTY_DAYS',
                '90_days': 'NINETY_DAYS',
                'permanent': 'PERMANENT'
            }

            const response = await fetch('/api/admin/safety/bans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    userId: newBan.userId,
                    banType: banTypeMap[newBan.banType],
                    duration: durationMap[newBan.duration],
                    reason: newBan.reason,
                    evidence: newBan.evidence
                        ? newBan.evidence.split('\n').map(line => line.trim()).filter(Boolean)
                        : [],
                })
            })
            
            if (!response.ok) throw new Error('Failed to create ban')
            
            setShowBanModal(false)
            setNewBan({
                userName: '',
                userId: '',
                banType: 'temporary',
                duration: '7_days',
                reason: '',
                evidence: '',
                restrictedFeatures: []
            })
            await fetchBans()
        } catch (err) {
            console.error('Failed to create ban:', err)
            setError(err instanceof Error ? err.message : 'Failed to create ban')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                    <Button onClick={fetchBans} className="mt-4">Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Ban Management</h1>
                        <p className="text-muted-foreground">Manage user bans and restrictions across the platform</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowBanModal(true)}
                            className="bg-red-600 hover:bg-red-700 text-foreground"
                        >
                            <Ban className="w-4 h-4 mr-2" />
                            Issue New Ban
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                            onClick={fetchBans}
                            disabled={loading}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(bans, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const link = document.createElement('a')
                                link.href = url
                                link.download = 'bans-export.json'
                                link.click()
                                URL.revokeObjectURL(url)
                            }}
                            disabled={bans.length === 0}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export JSON
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Ban className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalActive}</div>
                        <div className="text-sm text-muted-foreground mt-1">Active Bans</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.temporary}</div>
                        <div className="text-sm text-muted-foreground mt-1">Temporary</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <XCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.permanent}</div>
                        <div className="text-sm text-muted-foreground mt-1">Permanent</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.featureSpecific}</div>
                        <div className="text-sm text-muted-foreground mt-1">Feature Restricted</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Eye className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.shadow}</div>
                        <div className="text-sm text-muted-foreground mt-1">Shadow Bans</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <RefreshCw className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.appealed}</div>
                        <div className="text-sm text-muted-foreground mt-1">Under Appeal</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="active" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Ban className="w-4 h-4 mr-2" />
                                    Active Bans ({stats.totalActive})
                                </TabsTrigger>
                                <TabsTrigger value="appealed" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Under Appeal ({stats.appealed})
                                </TabsTrigger>
                                <TabsTrigger value="expired" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Expired ({expiredBans.length})
                                </TabsTrigger>
                                <TabsTrigger value="lifted" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Lifted ({liftedBans.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Active Bans Tab */}
                        <TabsContent value="active" className="p-6">
                            <div className="space-y-4">
                                {activeBans.map((ban) => {
                                    const daysRemaining = getDaysRemaining(ban.expiresAt)
                                    
                                    return (
                                        <div key={ban.id} className="bg-white/5 rounded-lg p-5 border border-red-500/20 hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-red-500/20 rounded-lg p-2">
                                                            <User className="w-5 h-5 text-red-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground text-lg">{ban.userName}</h4>
                                                            <p className="text-sm text-muted-foreground">{ban.userEmail} • ID: {ban.userId}</p>
                                                        </div>
                                                        <Badge className={banTypeColors[ban.banType as BanType] || 'bg-white/10 text-foreground border-border'}>
                                                            {ban.banType.replace(/_/g, ' ')}
                                                        </Badge>
                                                        <Badge className={statusColors[ban.status]}>
                                                            {ban.status}
                                                        </Badge>
                                                        {(ban.banHistory?.previousBans || 0) > 0 && (
                                                            <Badge className="bg-red-100 text-red-800 border-red-200">
                                                                Repeat Offender ({ban.banHistory?.previousBans} previous)
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Ban Type</div>
                                                            <div className="text-sm text-foreground capitalize">{ban.banType.replace(/_/g, ' ')}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Duration</div>
                                                            <div className="text-sm text-foreground">
                                                                {formatDuration(ban.duration)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Time Remaining</div>
                                                            <div className="text-sm text-foreground">
                                                                {daysRemaining !== null ? `${daysRemaining} days` : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Issued By</div>
                                                            <div className="text-sm text-foreground">{ban.bannedBy}</div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                                                        <h5 className="text-sm font-semibold text-red-300 mb-1">Reason</h5>
                                                        <p className="text-sm text-muted-foreground">{ban.reason}</p>
                                                    </div>

                                                    {ban.restrictedFeatures && ban.restrictedFeatures.length > 0 && (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground">Restricted Features:</span>
                                                            {ban.restrictedFeatures.map((feature) => (
                                                                <Badge key={feature} className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                                                                    {feature.replace(/_/g, ' ')}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        Banned on: {formatDate(ban.bannedAt)}
                                                        {ban.expiresAt && ` • Expires: ${formatDate(ban.expiresAt)}`}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 ml-4">
                                                    <Button
                                                        className="bg-blue-600 hover:bg-blue-700 text-foreground"
                                                        onClick={() => handleViewDetails(ban)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                    <Button
                                                        className="bg-green-600 hover:bg-green-700 text-foreground"
                                                        onClick={() => handleLiftBan(ban)}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Lift Ban
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        {/* Under Appeal Tab */}
                        <TabsContent value="appealed" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <RefreshCw className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-300 mb-1">Bans Under Appeal</h4>
                                            <p className="text-sm text-blue-200/80">
                                                Users have submitted appeals for these bans. Review evidence and make a decision.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {appealedBans.map((ban) => (
                                    <div key={ban.id} className="bg-white/5 rounded-lg p-5 border border-blue-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="bg-blue-500/20 rounded-lg p-2">
                                                        <RefreshCw className="w-5 h-5 text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{ban.userName}</h4>
                                                        <p className="text-sm text-muted-foreground">{ban.userEmail}</p>
                                                    </div>
                                                    <Badge className={banTypeColors[ban.banType as BanType] || 'bg-white/10 text-foreground border-border'}>
                                                        {ban.banType.replace(/_/g, ' ')}
                                                    </Badge>
                                                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                        Appeal {ban.appealStatus}
                                                    </Badge>
                                                </div>

                                                <div className="text-sm text-muted-foreground mb-2">
                                                    <strong>Original Ban Reason:</strong> {ban.reason}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Banned: {formatDate(ban.bannedAt)} • {(ban.banHistory?.previousBans || 0)} previous bans
                                                </div>
                                            </div>

                                            <Button
                                                className="bg-purple-600 hover:bg-purple-700 text-foreground ml-4"
                                                onClick={() => {
                                                    // Navigate to appeals page with this ban ID
                                                    window.location.href = `/admin/safety/appeals?banId=${ban.id}`
                                                }}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Review Appeal
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Expired Bans Tab */}
                        <TabsContent value="expired" className="p-6">
                            <div className="space-y-4">
                                {expiredBans.map((ban) => (
                                    <div key={ban.id} className="bg-white/5 rounded-lg p-5 border border-border opacity-60">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-background0/20 rounded-lg p-2">
                                                        <User className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{ban.userName}</h4>
                                                        <p className="text-sm text-muted-foreground">{ban.userEmail}</p>
                                                    </div>
                                                    <Badge className={statusColors[ban.status]}>
                                                        {ban.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {ban.reason}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    Expired: {ban.liftedAt && formatDate(ban.liftedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Lifted Bans Tab */}
                        <TabsContent value="lifted" className="p-6">
                            <div className="text-center py-8 text-muted-foreground">
                                No lifted bans to display
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Issue New Ban Modal */}
            <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-red-400">Issue New Ban</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Restrict user access to the platform or specific features
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="userName">User Name</Label>
                                <input
                                    id="userName"
                                    type="text"
                                    value={newBan.userName}
                                    onChange={(e) => setNewBan({ ...newBan, userName: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground"
                                    placeholder="Enter user name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="userId">User ID</Label>
                                <input
                                    id="userId"
                                    type="text"
                                    value={newBan.userId}
                                    onChange={(e) => setNewBan({ ...newBan, userId: e.target.value })}
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground"
                                    placeholder="user-123"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="banType">Ban Type</Label>
                                <Select value={newBan.banType} onValueChange={(value) => setNewBan({ ...newBan, banType: value as BanType })}>
                                    <SelectTrigger className="bg-white/5 border-border text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="temporary">Temporary Ban</SelectItem>
                                        <SelectItem value="permanent">Permanent Ban</SelectItem>
                                        <SelectItem value="feature_specific">Feature Specific</SelectItem>
                                        <SelectItem value="shadow">Shadow Ban</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="duration">Duration</Label>
                                <Select value={newBan.duration} onValueChange={(value) => setNewBan({ ...newBan, duration: value as BanDuration })}>
                                    <SelectTrigger className="bg-white/5 border-border text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1_day">1 Day</SelectItem>
                                        <SelectItem value="3_days">3 Days</SelectItem>
                                        <SelectItem value="7_days">7 Days</SelectItem>
                                        <SelectItem value="14_days">14 Days</SelectItem>
                                        <SelectItem value="30_days">30 Days</SelectItem>
                                        <SelectItem value="90_days">90 Days</SelectItem>
                                        <SelectItem value="permanent">Permanent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="reason">Ban Reason *</Label>
                            <Textarea
                                id="reason"
                                value={newBan.reason}
                                onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
                                className="bg-white/5 border-border text-foreground min-h-[80px]"
                                placeholder="Explain why this ban is being issued..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="evidence">Evidence & Documentation</Label>
                            <Textarea
                                id="evidence"
                                value={newBan.evidence}
                                onChange={(e) => setNewBan({ ...newBan, evidence: e.target.value })}
                                className="bg-white/5 border-border text-foreground min-h-[100px]"
                                placeholder="List evidence, screenshots, reports, etc..."
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowBanModal(false)}
                                className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateBan}
                                disabled={isSubmitting}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-foreground"
                            >
                                <Ban className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Issuing...' : 'Issue Ban'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Ban Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Ban Details</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Complete information and evidence for this ban
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBan && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">User Information</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="text-foreground ml-2 font-semibold">{selectedBan.userName}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Email:</span>
                                        <span className="text-foreground ml-2">{selectedBan.userEmail}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">User ID:</span>
                                        <span className="text-foreground ml-2">{selectedBan.userId}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Previous Bans:</span>
                                        <span className="text-foreground ml-2">{selectedBan?.banHistory?.previousBans ?? 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Ban Details</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Type:</span>
                                        <Badge className={banTypeColors[selectedBan.banType as BanType] || 'bg-white/10 text-foreground border-border'}>
                                            {selectedBan.banType.replace(/_/g, ' ')}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Duration:</span>
                                        <span className="text-foreground">{formatDuration(selectedBan.duration)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge className={statusColors[selectedBan.status]}>
                                            {selectedBan.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Issued By:</span>
                                        <span className="text-foreground">{selectedBan.bannedBy}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Issued On:</span>
                                        <span className="text-foreground">{formatDate(selectedBan.bannedAt)}</span>
                                    </div>
                                    {selectedBan.expiresAt && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Expires On:</span>
                                            <span className="text-foreground">{formatDate(selectedBan.expiresAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                <h4 className="font-semibold text-red-300 mb-2">Reason for Ban</h4>
                                <p className="text-sm text-muted-foreground">{selectedBan.reason}</p>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Evidence & Documentation</h4>
                                <ul className="space-y-2">
                                    {selectedBan.evidence?.map((item, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Lift Ban Modal */}
            <Dialog open={showLiftModal} onOpenChange={setShowLiftModal}>
                <DialogContent className="bg-background text-foreground border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-green-400">Lift Ban</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Are you sure you want to lift this ban?
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBan && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <p className="text-sm text-muted-foreground">
                                    <strong>User:</strong> {selectedBan.userName} ({selectedBan.userEmail})
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    <strong>Ban Type:</strong> {selectedBan.banType.replace(/_/g, ' ')}
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="liftReason">Reason for Lifting Ban</Label>
                                <Textarea
                                    id="liftReason"
                                    className="bg-white/5 border-border text-foreground"
                                    placeholder="Explain why this ban is being lifted..."
                                    value={liftReason}
                                    onChange={(e) => setLiftReason(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowLiftModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={async () => {
                                        if (!selectedBan) return
                                        try {
                                            setIsLifting(true)
                                            const response = await fetch('/api/admin/safety/bans', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                credentials: 'include',
                                                body: JSON.stringify({
                                                    banId: selectedBan.id,
                                                    action: 'lift',
                                                    reason: liftReason,
                                                })
                                            })
                                            if (!response.ok) throw new Error('Failed to lift ban')
                                            setShowLiftModal(false)
                                            setLiftReason('')
                                            await fetchBans()
                                        } catch (err) {
                                            console.error(err)
                                            setError(err instanceof Error ? err.message : 'Failed to lift ban')
                                        } finally {
                                            setIsLifting(false)
                                        }
                                    }}
                                    disabled={isLifting}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-foreground"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    {isLifting ? 'Lifting...' : 'Confirm Lift Ban'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
