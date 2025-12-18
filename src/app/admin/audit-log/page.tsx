'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    History,
    Search,
    Filter,
    RefreshCw,
    Download,
    User,
    Clock,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Shield,
    Activity,
    Eye,
    XCircle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface AuditLog {
    id: string
    action: string
    module: string
    details: string | null
    status: string | null
    ipAddress: string | null
    userAgent: string | null
    metadata: any
    createdAt: string
    admin: {
        id: string
        name: string
        email: string
        profileImage: string | null
    }
}

interface FilterOption {
    name: string
    count: number
}

interface AdminOption {
    id: string
    name: string
    email: string
}

interface AuditStats {
    total: number
    todayCount: number
    weekCount: number
}

const statusColors: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const moduleColors: Record<string, string> = {
    users: 'from-blue-600 to-cyan-600',
    creators: 'from-purple-600 to-pink-600',
    courses: 'from-green-600 to-emerald-600',
    financial: 'from-yellow-600 to-orange-600',
    moderation: 'from-red-600 to-pink-600',
    settings: 'from-gray-600 to-slate-600'
}

export default function AuditLogPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [stats, setStats] = useState<AuditStats | null>(null)
    const [filters, setFilters] = useState<{
        modules: FilterOption[]
        actions: FilterOption[]
        admins: AdminOption[]
    }>({ modules: [], actions: [], admins: [] })

    // Filter states
    const [searchTerm, setSearchTerm] = useState('')
    const [moduleFilter, setModuleFilter] = useState<string>('')
    const [actionFilter, setActionFilter] = useState<string>('')
    const [adminFilter, setAdminFilter] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

    useEffect(() => {
        fetchLogs()
    }, [page, moduleFilter, actionFilter, adminFilter, startDate, endDate])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '50'
            })

            if (searchTerm) params.set('search', searchTerm)
            if (moduleFilter) params.set('module', moduleFilter)
            if (actionFilter) params.set('action', actionFilter)
            if (adminFilter) params.set('adminId', adminFilter)
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)

            const response = await fetch(`/api/admin/audit-log?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch audit logs')

            const data = await response.json()
            setLogs(data.logs || [])
            setTotal(data.pagination?.total || 0)
            setTotalPages(data.pagination?.pages || 1)
            setFilters(data.filters || { modules: [], actions: [], admins: [] })
            setStats(data.stats || null)
        } catch (err) {
            console.error('Failed to fetch audit logs:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = () => {
        setPage(1)
        fetchLogs()
    }

    const clearFilters = () => {
        setSearchTerm('')
        setModuleFilter('')
        setActionFilter('')
        setAdminFilter('')
        setStartDate('')
        setEndDate('')
        setPage(1)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const exportLogs = () => {
        const csvContent = [
            'Date,Admin,Action,Module,Details,Status,IP Address',
            ...logs.map(log => 
                `"${formatDate(log.createdAt)}","${log.admin.name}","${log.action}","${log.module}","${log.details || ''}","${log.status || ''}","${log.ipAddress || ''}"`
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading && logs.length === 0) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-white/5 rounded-2xl"></div>
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
                        Audit Log
                    </h1>
                    <p className="text-muted-foreground">
                        Track all administrative actions on the platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchLogs}
                        disabled={loading}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={exportLogs}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-600/20 rounded-xl p-3">
                                <History className="h-6 w-6 text-blue-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {stats.total.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Log Entries</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-green-600/20 rounded-xl p-3">
                                <Activity className="h-6 w-6 text-green-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {stats.todayCount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Actions Today</div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-border rounded-2xl p-6"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="bg-purple-600/20 rounded-xl p-3">
                                <Calendar className="h-6 w-6 text-purple-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {stats.weekCount.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Actions This Week</div>
                    </motion.div>
                </div>
            )}

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search logs..."
                            className="w-full bg-white/5 border border-border rounded-lg pl-10 pr-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                    </div>

                    <select
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                        <option value="">All Modules</option>
                        {filters.modules.map((mod) => (
                            <option key={mod.name} value={mod.name}>
                                {mod.name} ({mod.count})
                            </option>
                        ))}
                    </select>

                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                        <option value="">All Actions</option>
                        {filters.actions.map((act) => (
                            <option key={act.name} value={act.name}>
                                {act.name} ({act.count})
                            </option>
                        ))}
                    </select>

                    <select
                        value={adminFilter}
                        onChange={(e) => setAdminFilter(e.target.value)}
                        className="bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                        <option value="">All Admins</option>
                        {filters.admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                                {admin.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">From:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-white/5 border border-border rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">To:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-white/5 border border-border rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        />
                    </div>
                    <Button
                        onClick={clearFilters}
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Clear Filters
                    </Button>
                </div>
            </motion.div>

            {/* Logs Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Timestamp</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Admin</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Action</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Module</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Details</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No audit logs found</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(log.createdAt)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {log.admin.profileImage ? (
                                                    <Image
                                                        src={log.admin.profileImage}
                                                        alt={log.admin.name}
                                                        width={32}
                                                        height={32}
                                                        className="rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-foreground text-sm">{log.admin.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className="bg-white/10 text-foreground border-none">
                                                {log.action}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={`bg-gradient-to-r ${moduleColors[log.module.toLowerCase()] || 'from-gray-600 to-slate-600'} text-white border-none`}>
                                                {log.module}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-muted-foreground truncate max-w-xs block">
                                                {log.details || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    onClick={() => setSelectedLog(log)}
                                                    className="bg-white/10 hover:bg-white/20 text-foreground"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} entries
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-foreground px-2">
                                Page {page} of {totalPages}
                            </span>
                            <Button
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground">Audit Log Details</h3>
                            <Button
                                size="sm"
                                onClick={() => setSelectedLog(null)}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {/* Admin Info */}
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                {selectedLog.admin.profileImage ? (
                                    <Image
                                        src={selectedLog.admin.profileImage}
                                        alt={selectedLog.admin.name}
                                        width={48}
                                        height={48}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                )}
                                <div>
                                    <div className="font-semibold text-foreground">{selectedLog.admin.name}</div>
                                    <div className="text-sm text-muted-foreground">{selectedLog.admin.email}</div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Timestamp</div>
                                    <div className="text-foreground font-medium">
                                        {formatDate(selectedLog.createdAt)}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Module</div>
                                    <Badge className={`bg-gradient-to-r ${moduleColors[selectedLog.module.toLowerCase()] || 'from-gray-600 to-slate-600'} text-white border-none`}>
                                        {selectedLog.module}
                                    </Badge>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Action</div>
                                    <div className="text-foreground font-medium">{selectedLog.action}</div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                                    <Badge className={`${statusColors[selectedLog.status || ''] || 'bg-gray-100 text-gray-800'} border`}>
                                        {selectedLog.status || 'N/A'}
                                    </Badge>
                                </div>
                            </div>

                            {/* Details */}
                            {selectedLog.details && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Details</div>
                                    <div className="text-foreground">{selectedLog.details}</div>
                                </div>
                            )}

                            {/* IP Address */}
                            {selectedLog.ipAddress && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">IP Address</div>
                                    <div className="text-foreground font-mono">{selectedLog.ipAddress}</div>
                                </div>
                            )}

                            {/* User Agent */}
                            {selectedLog.userAgent && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">User Agent</div>
                                    <div className="text-foreground text-sm font-mono break-all">
                                        {selectedLog.userAgent}
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Metadata</div>
                                    <pre className="text-foreground text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
