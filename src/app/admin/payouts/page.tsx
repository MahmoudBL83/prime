'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    Wallet,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Search,
    Filter,
    RefreshCw,
    Download,
    Eye,
    ChevronLeft,
    ChevronRight,
    User,
    CreditCard,
    Building2,
    Calendar
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Payout {
    id: string
    creatorId: string
    creatorName: string
    email: string
    totalEarnings: number
    platformFee: number
    processingFee: number
    netPayout: number
    status: string
    periodStart: string
    periodEnd: string
    createdAt: string
    processedAt: string | null
    failureReason: string | null
}

interface PayoutStats {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    totalAmount: number
    pendingAmount: number
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
}

const statusIcons: Record<string, any> = {
    pending: Clock,
    processing: Loader2,
    completed: CheckCircle,
    failed: XCircle
}

export default function PayoutsPage() {
    const [payouts, setPayouts] = useState<Payout[]>([])
    const [stats, setStats] = useState<PayoutStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
    const [failReason, setFailReason] = useState('')

    useEffect(() => {
        fetchPayouts()
    }, [statusFilter, page])

    const fetchPayouts = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                pageSize: '20'
            })
            if (statusFilter !== 'all') {
                params.set('status', statusFilter.toLowerCase())
            }

            const response = await fetch(`/api/admin/payouts?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch payouts')

            const data = await response.json()
            setPayouts(data.payouts || [])
            setStats(data.stats || null)
            setTotalPages(data.meta?.totalPages || 1)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            toast.error('Failed to load payouts')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (payoutId: string, action: 'approve' | 'fail') => {
        setProcessingId(payoutId)
        try {
            const response = await fetch('/api/admin/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payoutId,
                    action,
                    reason: action === 'fail' ? failReason : undefined
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Action failed')
            }

            toast.success(`Payout ${action === 'approve' ? 'approved' : 'marked as failed'} successfully`)
            if (action === 'fail') {
                setSelectedPayout(null)
                setFailReason('')
            }
            fetchPayouts()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Action failed')
        } finally {
            setProcessingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const statCards = stats ? [
        {
            title: 'Pending',
            count: stats.pending,
            amount: stats.pendingAmount,
            icon: Clock,
            color: 'from-yellow-600 to-orange-600',
            iconBg: 'bg-yellow-600/20',
            iconColor: 'text-yellow-400'
        },
        {
            title: 'Processing',
            count: stats.processing,
            amount: 0, // Not explicitly provided in total amount by status but could be inferred
            icon: Loader2,
            color: 'from-blue-600 to-cyan-600',
            iconBg: 'bg-blue-600/20',
            iconColor: 'text-blue-400'
        },
        {
            title: 'Completed',
            count: stats.completed,
            amount: 0,
            icon: CheckCircle,
            color: 'from-green-600 to-emerald-600',
            iconBg: 'bg-green-600/20',
            iconColor: 'text-green-400'
        },
        {
            title: 'Failed',
            count: stats.failed,
            amount: 0,
            icon: XCircle,
            color: 'from-red-600 to-pink-600',
            iconBg: 'bg-red-600/20',
            iconColor: 'text-red-400'
        }
    ] : []

    if (loading && payouts.length === 0) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
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
                        Creator Payouts
                    </h1>
                    <p className="text-muted-foreground">
                        Manage platform payouts and financial distributions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchPayouts}
                        disabled={loading}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((stat, index) => (
                        <motion.div
                            key={stat.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setStatusFilter(stat.title.toUpperCase())}
                            className={`bg-gradient-to-br ${stat.color}/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform ${statusFilter === stat.title.toUpperCase() ? 'ring-2 ring-white/30' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${stat.iconBg} rounded-xl p-3`}>
                                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                </div>
                                <Badge className="bg-white/10 text-foreground border-none">
                                    {stat.count}
                                </Badge>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground mb-1">
                                    {stat.title === 'Pending' ? formatPrice(stat.amount) : stat.count}
                                </div>
                                <div className="text-sm text-muted-foreground">{stat.title}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value)
                        setPage(1)
                    }}
                    className="bg-white/5 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                </select>
            </div>

            {/* Payouts Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5 border-b border-border">
                            <tr>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Creator</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Period</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Net Payout</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Created</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {payouts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No payouts found
                                    </td>
                                </tr>
                            ) : (
                                payouts.map((payout) => {
                                    const StatusIcon = statusIcons[payout.status.toLowerCase()] || Clock

                                    return (
                                        <tr key={payout.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-foreground">{payout.creatorName}</div>
                                                    <div className="text-sm text-muted-foreground">{payout.email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-foreground">
                                                    <Calendar className="w-3 h-3 text-muted-foreground" />
                                                    {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-lg font-bold text-foreground">
                                                    {formatPrice(payout.netPayout)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${statusColors[payout.status.toLowerCase()] || 'bg-gray-100'} border`}>
                                                    <StatusIcon className={`w-3 h-3 mr-1 ${payout.status === 'processing' ? 'animate-spin' : ''}`} />
                                                    {payout.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {formatDate(payout.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setSelectedPayout(payout)}
                                                        className="bg-white/10 hover:bg-white/20 text-foreground"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {payout.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAction(payout.id, 'approve')}
                                                            disabled={processingId === payout.id}
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            {processingId === payout.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                            Page {page} of {totalPages}
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
            {selectedPayout && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-border rounded-2xl p-6 max-w-lg w-full"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground">Payout Details</h3>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setSelectedPayout(null)
                                    setFailReason('')
                                }}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {/* Creator Info */}
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground">{selectedPayout.creatorName}</div>
                                    <div className="text-sm text-muted-foreground">{selectedPayout.email}</div>
                                </div>
                            </div>

                            {/* Amount breakdown */}
                            <div className="p-4 bg-white/5 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Gross Earnings</span>
                                    <span className="text-foreground font-medium">{formatPrice(selectedPayout.totalEarnings)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Platform Fee (15%)</span>
                                    <span className="text-red-400">-{formatPrice(selectedPayout.platformFee)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Processing Fee (2%)</span>
                                    <span className="text-red-400">-{formatPrice(selectedPayout.processingFee)}</span>
                                </div>
                                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-lg font-bold">
                                    <span className="text-foreground">Net Payout</span>
                                    <span className="text-green-400">{formatPrice(selectedPayout.netPayout)}</span>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Status</div>
                                    <div className="text-foreground font-medium">
                                        {selectedPayout.status.toUpperCase()}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Created</div>
                                    <div className="text-foreground font-medium">
                                        {formatDate(selectedPayout.createdAt)}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl">
                                <div className="text-xs text-muted-foreground mb-1">Period</div>
                                <div className="text-foreground font-medium">
                                    {formatDate(selectedPayout.periodStart)} - {formatDate(selectedPayout.periodEnd)}
                                </div>
                            </div>

                            {selectedPayout.failureReason && (
                                <div className="p-3 bg-red-900/20 border border-red-900/50 rounded-xl">
                                    <div className="text-xs text-red-400 mb-1 flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Failure Reason
                                    </div>
                                    <div className="text-red-200 text-sm italic">
                                        {selectedPayout.failureReason}
                                    </div>
                                </div>
                            )}

                            {/* Action Form */}
                            {selectedPayout.status === 'pending' && (
                                <div className="border-t border-white/10 pt-4 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs text-muted-foreground">Mark as Failed (Optional Reason)</label>
                                        <textarea
                                            value={failReason}
                                            onChange={(e) => setFailReason(e.target.value)}
                                            placeholder="Reason for failure"
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => handleAction(selectedPayout.id, 'approve')}
                                            disabled={!!processingId}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            {processingId === selectedPayout.id ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Approve Payout
                                        </Button>
                                        <Button
                                            onClick={() => handleAction(selectedPayout.id, 'fail')}
                                            disabled={!!processingId}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Mark Failed
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
