"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import {
    Heart,
    TrendingUp,
    Target,
    MessageSquare,
    Calendar,
    CheckCircle,
    AlertTriangle,
    Settings as SettingsIcon,
    Search,
    Eye,
    Ban,
    Zap,
    Globe,
    Book,
    Loader2,
    RefreshCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import UserDetailsModal from '@/components/admin/UserDetailsModal'

type MatchStatus = 'active' | 'reported' | 'blocked' | 'inactive' | 'unknown' | string

interface Match {
    id: string
    status: MatchStatus
    rawStatus?: string | null
    matchedAt: string
    lastActivity: string
    sharedSubjects: string[]
    sharedGoals: string[]
    compatibilityScore: number
    sessionsCompleted: number
    user1: {
        id: string
        name: string
        interests?: string[]
    }
    user2: {
        id: string
        name: string
        interests?: string[]
    }
}

interface Stats {
    totalMatches: number
    activeMatches: number
    avgCompatibility: number
    avgSessions: number
    reportedMatches: number
    matchSuccessRate: number
}

interface Meta {
    total: number
    page: number
    pageSize: number
}

const DEFAULT_STATS: Stats = {
    totalMatches: 0,
    activeMatches: 0,
    avgCompatibility: 0,
    avgSessions: 0,
    reportedMatches: 0,
    matchSuccessRate: 0
}

const SIGNAL_CONFIG = [
    { name: 'Subject Overlap', key: 'subjectOverlap', icon: Book, bg: 'bg-blue-600/20', text: 'text-blue-400' },
    { name: 'Timezone Match', key: 'timezoneMatch', icon: Globe, bg: 'bg-green-600/20', text: 'text-green-400' },
    { name: 'Goal Alignment', key: 'goalAlignment', icon: Target, bg: 'bg-purple-600/20', text: 'text-purple-400' },
    { name: 'Study Pace', key: 'studyPace', icon: Zap, bg: 'bg-yellow-600/20', text: 'text-yellow-400' },
    { name: 'Availability', key: 'availability', icon: Calendar, bg: 'bg-orange-600/20', text: 'text-orange-400' }
] as const

type SignalKey = (typeof SIGNAL_CONFIG)[number]['key']

type AlgorithmSettings = {
    weights: Record<SignalKey, number>
}

const DEFAULT_ALGORITHM_SETTINGS: AlgorithmSettings = {
    weights: {
        subjectOverlap: 40,
        timezoneMatch: 20,
        goalAlignment: 15,
        studyPace: 15,
        availability: 10
    }
}

const PAGE_SIZE = 10

export default function StudyBuddyManagementPage() {
    const router = useRouter()
    const { data: session, status: sessionStatus } = useSession()

    const [activeTab, setActiveTab] = useState<'matches' | 'reported' | 'analytics' | 'settings'>('matches')
    const [matches, setMatches] = useState<Match[]>([])
    const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
    const [pagination, setPagination] = useState<Meta>({ total: 0, page: 1, pageSize: PAGE_SIZE })
    const [loading, setLoading] = useState(true)
    const [searchInput, setSearchInput] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [algoSettings, setAlgoSettings] = useState<AlgorithmSettings>(DEFAULT_ALGORITHM_SETTINGS)
    const [algoLoading, setAlgoLoading] = useState(false)
    const [algoDirty, setAlgoDirty] = useState(false)
    const [showUserModal, setShowUserModal] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    useEffect(() => {
        if (sessionStatus === 'loading') return
        if (!session?.user?.role || session.user.role !== 'ADMIN') {
            router.push('/dashboard')
        }
    }, [session, sessionStatus, router])

    useEffect(() => {
        const debounce = setTimeout(() => setSearch(searchInput.trim()), 400)
        return () => clearTimeout(debounce)
    }, [searchInput])

    useEffect(() => {
        setPage(1)
    }, [search, activeTab])

    const normalizeStatus = (status: string | null | undefined) => (status ? status.toLowerCase() : 'unknown')

    const isReported = (status: string) => {
        const normalized = normalizeStatus(status)
        return normalized.includes('report') || normalized.includes('block')
    }

    const getStatusColor = (status: MatchStatus) => {
        const normalized = normalizeStatus(status)
        if (normalized === 'active' || normalized === 'accepted') return 'bg-green-600/20 text-green-400 border-green-600/30'
        if (normalized === 'reported' || normalized === 'blocked') return 'bg-red-600/20 text-red-400 border-red-600/30'
        if (normalized === 'inactive' || normalized === 'pending') return 'bg-gray-600/20 text-muted-foreground border-gray-600/30'
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30'
    }

    const getStatusLabel = (status: MatchStatus) => {
        const normalized = normalizeStatus(status)
        if (normalized === 'accepted') return 'active'
        if (normalized === 'reported' || normalized === 'blocked') return 'reported'
        if (normalized === 'pending') return 'pending'
        if (normalized === 'inactive') return 'inactive'
        return normalized || 'unknown'
    }

    const formatDate = (value: string) => {
        try {
            return new Date(value).toLocaleDateString()
        } catch (error) {
            return '—'
        }
    }

    const fetchMatches = useCallback(async () => {
        if (sessionStatus === 'loading') return
        if (session?.user?.role !== 'ADMIN') {
            setLoading(false)
            return
        }
        setLoading(true)
        const params = new URLSearchParams()
        if (activeTab === 'reported') params.set('status', 'reported')
        if (search) params.set('search', search)
        params.set('page', page.toString())
        params.set('pageSize', PAGE_SIZE.toString())

        try {
            const response = await fetch(`/api/admin/study-buddies?${params.toString()}`, {
                cache: 'no-store',
                credentials: 'include'
            })
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                throw new Error(errorBody.error || 'Failed to load matches')
            }
            const result = await response.json()
            setMatches(result.matches || [])
            setStats(result.stats || DEFAULT_STATS)
            const meta = result.meta as Meta | undefined
            const metaPage = meta?.page ?? page
            setPagination({
                total: meta?.total ?? (result.matches?.length || 0),
                page: metaPage,
                pageSize: meta?.pageSize ?? PAGE_SIZE
            })
            if (metaPage !== page) {
                setPage(metaPage)
            }
        } catch (error: any) {
            console.error('Failed to load study buddies', error)
            setMatches([])
            setStats(DEFAULT_STATS)
            setPagination({ total: 0, page: 1, pageSize: PAGE_SIZE })
            toast.error(error?.message || 'Unable to load study buddies')
        } finally {
            setLoading(false)
        }
    }, [activeTab, page, search, session, sessionStatus])

    useEffect(() => {
        fetchMatches()
    }, [fetchMatches])

    const openUserDetails = (userId: string) => {
        setSelectedUserId(userId)
        setShowUserModal(true)
    }

    const fetchAlgoSettings = useCallback(async () => {
        if (sessionStatus === 'loading') return
        if (session?.user?.role !== 'ADMIN') return
        try {
            setAlgoLoading(true)
            const response = await fetch('/api/admin/study-buddies/settings', {
                cache: 'no-store',
                credentials: 'include'
            })
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                throw new Error(errorBody.error || 'Failed to load algorithm settings')
            }
            const result = await response.json()
            if (result.settings?.weights) {
                setAlgoSettings(result.settings)
                setAlgoDirty(false)
            }
        } catch (error: any) {
            console.error('Failed to load algorithm settings', error)
            toast.error(error?.message || 'Unable to load algorithm settings')
            setAlgoSettings(DEFAULT_ALGORITHM_SETTINGS)
        } finally {
            setAlgoLoading(false)
        }
    }, [session, sessionStatus])

    useEffect(() => {
        fetchAlgoSettings()
    }, [fetchAlgoSettings])

    const handleStatusUpdate = async (matchId: string, status: string) => {
        setUpdatingId(matchId)
        try {
            const response = await fetch('/api/admin/study-buddies', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, status }),
                credentials: 'include'
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                throw new Error(errorBody.error || 'Update failed')
            }

            const result = await response.json()
            if (result.match) {
                setMatches(prev => prev.map(item => (item.id === result.match.id ? { ...item, ...result.match } : item)))
            }
            toast.success('Status updated')
        } catch (error: any) {
            console.error('Failed to update match status', error)
            toast.error(error?.message || 'Could not update status')
        } finally {
            setUpdatingId(null)
        }
    }

    const displayedMatches = useMemo(() => {
        if (activeTab === 'reported') {
            return matches.filter(match => isReported(match.status))
        }
        return matches
    }, [activeTab, matches])

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    }, [pagination])

    const paginationLabel = useMemo(() => {
        if (pagination.total === 0) return 'No matches to display'
        const start = (pagination.page - 1) * pagination.pageSize + 1
        const end = Math.min(pagination.total, pagination.page * pagination.pageSize)
        return `Showing ${start}-${end} of ${pagination.total}`
    }, [pagination])

    const topSubjects = useMemo(() => {
        const counts: Record<string, number> = {}
        matches.forEach(match => {
            match.sharedSubjects.forEach(subject => {
                counts[subject] = (counts[subject] || 0) + 1
            })
        })
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
    }, [matches])

    return (
        <div className="min-h-screen p-8 space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Study Buddy Management
                    </h1>
                    <p className="text-muted-foreground">
                        Monitor matching system, compatibility scores, and learner connections
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={fetchMatches} className="bg-white/10 hover:bg-white/20 text-foreground">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                        Refresh
                    </Button>
                    <Button className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-foreground">
                        <SettingsIcon className="w-4 h-4 mr-2" />
                        Algorithm Settings
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-pink-600/20 to-purple-600/20 backdrop-blur-xl border border-pink-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-pink-600/20 rounded-xl p-2">
                            <Heart className="h-5 w-5 text-pink-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.totalMatches.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Matches</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-600/20 rounded-xl p-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.activeMatches}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Now</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600/20 rounded-xl p-2">
                            <Target className="h-5 w-5 text-blue-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.avgCompatibility}%
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Compatibility</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-purple-600/20 rounded-xl p-2">
                            <MessageSquare className="h-5 w-5 text-purple-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.avgSessions}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Sessions</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-red-600/20 to-orange-600/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-red-600/20 rounded-xl p-2">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.reportedMatches}
                    </div>
                    <div className="text-xs text-muted-foreground">Reported</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-yellow-600/20 rounded-xl p-2">
                            <TrendingUp className="h-5 w-5 text-yellow-400" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                        {stats.matchSuccessRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                </motion.div>
            </div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-2"
            >
                <div className="flex gap-2">
                    {[
                        { id: 'matches' as const, label: 'All Matches', icon: Heart },
                        { id: 'reported' as const, label: 'Reported', icon: AlertTriangle },
                        { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
                        { id: 'settings' as const, label: 'Algorithm', icon: SettingsIcon }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Matches Content */}
            {['matches', 'reported'].includes(activeTab) && (
                <div className="space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl border border-border rounded-xl p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                placeholder="Search matches by user name, subject..."
                                className="w-full bg-white/10 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                        </div>
                    ) : displayedMatches.length === 0 ? (
                        <div className="bg-white/5 border border-border rounded-2xl p-10 text-center text-muted-foreground">
                            <p className="text-sm">No matches found for this filter.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayedMatches.map((match, index) => {
                            const user1Subjects = (match.user1.interests && match.user1.interests.length > 0 ? match.user1.interests : match.sharedSubjects).slice(0, 6)
                            const user2Subjects = (match.user2.interests && match.user2.interests.length > 0 ? match.user2.interests : match.sharedSubjects).slice(0, 6)
                            const reported = isReported(match.status)

                            return (
                                <motion.div
                                    key={match.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + index * 0.03 }}
                                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:bg-white/10 transition-all"
                                >
                                    <div className="flex items-start gap-6">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-foreground font-bold">
                                                        {match.user1.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{match.user1.name}</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {user1Subjects.map((subject, i) => (
                                                                <Badge key={i} className="bg-blue-600/20 text-blue-400 border-blue-600/30 text-xs">
                                                                    {subject}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center px-6">
                                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                                    match.compatibilityScore >= 85 ? 'bg-gradient-to-br from-green-600 to-emerald-600' :
                                                    match.compatibilityScore >= 70 ? 'bg-gradient-to-br from-blue-600 to-cyan-600' :
                                                    'bg-gradient-to-br from-yellow-600 to-orange-600'
                                                }`}>
                                                    <span className="text-lg font-bold text-foreground">{match.compatibilityScore}%</span>
                                                </div>
                                                <Heart className="w-5 h-5 text-pink-400 mt-2" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-red-600 rounded-full flex items-center justify-center text-foreground font-bold">
                                                        {match.user2.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{match.user2.name}</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {user2Subjects.map((subject, i) => (
                                                                <Badge key={i} className="bg-pink-600/20 text-pink-400 border-pink-600/30 text-xs">
                                                                    {subject}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 min-w-[220px]">
                                            <Badge className={getStatusColor(match.status) + ' capitalize justify-center'}>
                                                {getStatusLabel(match.status)}
                                            </Badge>
                                            <div className="bg-white/5 rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Sessions</span>
                                                    <span className="text-foreground font-semibold">{match.sessionsCompleted}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Matched</span>
                                                    <span className="text-foreground font-semibold">{formatDate(match.matchedAt)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Last Active</span>
                                                    <span className="text-foreground font-semibold">{formatDate(match.lastActivity)}</span>
                                                </div>
                                                {match.sharedGoals.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 text-[10px]">
                                                        {match.sharedGoals.slice(0, 4).map((goal, i) => (
                                                            <Badge key={i} className="bg-purple-600/20 text-purple-200 border-purple-600/30">{goal}</Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    type="button"
                                                    onClick={() => openUserDetails(match.user1.id)}
                                                    className="flex-1 min-w-[140px] bg-white/10 hover:bg-white/20 text-foreground text-xs py-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    <span className="ml-1">View {match.user1.name?.split(' ')?.[0] || 'User 1'}</span>
                                                </Button>
                                                <Button
                                                    type="button"
                                                    onClick={() => openUserDetails(match.user2.id)}
                                                    className="flex-1 min-w-[140px] bg-white/10 hover:bg-white/20 text-foreground text-xs py-1"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    <span className="ml-1">View {match.user2.name?.split(' ')?.[0] || 'User 2'}</span>
                                                </Button>
                                                {reported ? (
                                                    <Button
                                                        onClick={() => handleStatusUpdate(match.id, 'BLOCKED')}
                                                        disabled={updatingId === match.id}
                                                        className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs py-1"
                                                    >
                                                        {updatingId === match.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
                                                        <span className="ml-1">Block</span>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleStatusUpdate(match.id, 'ACTIVE')}
                                                        disabled={updatingId === match.id}
                                                        className="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs py-1"
                                                    >
                                                        {updatingId === match.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                        <span className="ml-1">Mark Active</span>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}

                            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 border border-border rounded-xl p-3">
                                <div className="text-sm text-muted-foreground">{paginationLabel}</div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        disabled={page <= 1 || loading}
                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                        className="bg-white/5 text-foreground border border-border"
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                        Page {pagination.page} / {totalPages}
                                    </span>
                                    <Button
                                        type="button"
                                        disabled={page >= totalPages || loading}
                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                        className="bg-white/5 text-foreground border border-border"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/5 border border-border rounded-2xl p-6">
                            <p className="text-sm text-muted-foreground mb-2">Match Success Rate</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-foreground">{stats.matchSuccessRate}%</span>
                                <Badge className="bg-green-600/20 text-green-300 border-green-600/40">Quality</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Active matches vs total</p>
                        </div>
                        <div className="bg-white/5 border border-border rounded-2xl p-6">
                            <p className="text-sm text-muted-foreground mb-2">Average Sessions</p>
                            <div className="text-3xl font-bold text-foreground">{stats.avgSessions}</div>
                            <p className="text-xs text-muted-foreground mt-2">Per match across the network</p>
                        </div>
                        <div className="bg-white/5 border border-border rounded-2xl p-6">
                            <p className="text-sm text-muted-foreground mb-2">Reported Matches</p>
                            <div className="text-3xl font-bold text-foreground">{stats.reportedMatches}</div>
                            <p className="text-xs text-muted-foreground mt-2">Needs moderation attention</p>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-border rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground">Top Shared Subjects</h3>
                                <p className="text-sm text-muted-foreground">What buddies have most in common</p>
                            </div>
                            <Badge className="bg-purple-600/20 text-purple-200 border-purple-600/30">Top 5</Badge>
                        </div>
                        {topSubjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Not enough data yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {topSubjects.map(([subject, count], index) => (
                                    <div key={subject} className="flex items-center justify-between bg-white/5 border border-border rounded-xl px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-pink-600/20 text-pink-200 border-pink-600/30 text-xs">#{index + 1}</Badge>
                                            <span className="text-sm text-foreground">{subject}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Algorithm Settings */}
            {activeTab === 'settings' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-8 space-y-6"
                >
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Compatibility Algorithm</h2>
                        <p className="text-muted-foreground">Configure matching signals and weights</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SIGNAL_CONFIG.map((signal, index) => (
                            <div key={signal.key} className="bg-white/5 border border-border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`${signal.bg} rounded-lg p-2`}>
                                        <signal.icon className={`w-5 h-5 ${signal.text}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">{signal.name}</p>
                                        <p className="text-xs text-muted-foreground">Weight: {algoSettings.weights[signal.key]}%</p>
                                    </div>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={algoSettings.weights[signal.key]}
                                    onChange={(event) => {
                                        const next = Math.min(100, Math.max(0, Number(event.target.value)))
                                        setAlgoSettings(prev => ({
                                            weights: { ...prev.weights, [signal.key]: next }
                                        }))
                                        setAlgoDirty(true)
                                    }}
                                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            onClick={() => {
                                setAlgoSettings(DEFAULT_ALGORITHM_SETTINGS)
                                setAlgoDirty(true)
                            }}
                            disabled={algoLoading}
                            className="bg-white/10 hover:bg-white/20 text-foreground"
                        >
                            Reset to Default
                        </Button>
                        <Button
                            type="button"
                            disabled={!algoDirty || algoLoading}
                            onClick={async () => {
                                try {
                                    setAlgoLoading(true)
                                    const response = await fetch('/api/admin/study-buddies/settings', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(algoSettings),
                                        credentials: 'include'
                                    })
                                    if (!response.ok) {
                                        const errorBody = await response.json().catch(() => ({}))
                                        throw new Error(errorBody.error || 'Failed to save settings')
                                    }
                                    const result = await response.json()
                                    setAlgoSettings(result.settings || algoSettings)
                                    setAlgoDirty(false)
                                    toast.success('Algorithm settings saved')
                                } catch (error: any) {
                                    console.error('Failed to save algorithm settings', error)
                                    toast.error(error?.message || 'Unable to save settings')
                                } finally {
                                    setAlgoLoading(false)
                                }
                            }}
                            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-foreground"
                        >
                            {algoLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </motion.div>
            )}

            <UserDetailsModal
                userId={selectedUserId || ''}
                isOpen={showUserModal && !!selectedUserId}
                onClose={() => {
                    setShowUserModal(false)
                    setSelectedUserId(null)
                }}
                onUserUpdated={fetchMatches}
            />
        </div>
    )
}
