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
    Building2
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Withdrawal {
    id: string
    amount: number
    method: string
    accountDetails: string
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED'
    requestedAt: string
    processedAt: string | null
    completedAt: string | null
    notes: string | null
    transactionId: string | null
    creator: {
        id: string
        userId: string
        name: string
        arabicName: string | null
        email: string
        profileImage: string | null
    }
}

interface WithdrawalStats {
    pending: { _count: number; _sum: { amount: number | null } }
    processing: { _count: number; _sum: { amount: number | null } }
    completed: { _count: number; _sum: { amount: number | null } }
    rejected: { _count: number; _sum: { amount: number | null } }
}

const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200'
}

const statusIcons = {
    PENDING: Clock,
    PROCESSING: Loader2,
    COMPLETED: CheckCircle,
    REJECTED: XCircle
}

const methodIcons = {
    BANK_TRANSFER: Building2,
    PAYPAL: CreditCard,
    STRIPE: CreditCard
}

export default function WithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
    const [stats, setStats] = useState<WithdrawalStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [processing, setProcessing] = useState<string | null>(null)
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null)
    const [actionNotes, setActionNotes] = useState('')
    const [transactionId, setTransactionId] = useState('')

    useEffect(() => {
        fetchWithdrawals()
    }, [statusFilter, page])

    const fetchWithdrawals = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            })
            if (statusFilter !== 'all') {
                params.set('status', statusFilter)
            }

            const response = await fetch(`/api/admin/withdrawals?${params.toString()}`)
            if (!response.ok) throw new Error('Failed to fetch withdrawals')

            const data = await response.json()
            setWithdrawals(data.withdrawals || [])
            setStats(data.stats || null)
            setTotalPages(data.pagination?.totalPages || 1)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (withdrawalId: string, action: 'approve' | 'complete' | 'reject') => {
        setProcessing(withdrawalId)
        try {
            const response = await fetch('/api/admin/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    withdrawalId,
                    action,
                    notes: actionNotes,
                    transactionId: action === 'complete' ? transactionId : undefined
                })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Action failed')
            }

            toast.success(`Withdrawal ${action === 'approve' ? 'approved' : action === 'complete' ? 'completed' : 'rejected'} successfully`)
            setSelectedWithdrawal(null)
            setActionNotes('')
            setTransactionId('')
            fetchWithdrawals()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Action failed')
        } finally {
            setProcessing(null)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const statCards = stats ? [
        {
            title: 'Pending',
            count: stats.pending._count,
            amount: stats.pending._sum?.amount || 0,
            icon: Clock,
            color: 'from-yellow-600 to-orange-600',
            iconBg: 'bg-yellow-600/20',
            iconColor: 'text-yellow-400'
        },
        {
            title: 'Processing',
            count: stats.processing._count,
            amount: stats.processing._sum?.amount || 0,
            icon: Loader2,
            color: 'from-blue-600 to-cyan-600',
            iconBg: 'bg-blue-600/20',
            iconColor: 'text-blue-400'
        },
        {
            title: 'Completed',
            count: stats.completed._count,
            amount: stats.completed._sum?.amount || 0,
            icon: CheckCircle,
            color: 'from-green-600 to-emerald-600',
            iconBg: 'bg-green-600/20',
            iconColor: 'text-green-400'
        },
        {
            title: 'Rejected',
            count: stats.rejected._count,
            amount: stats.rejected._sum?.amount || 0,
            icon: XCircle,
            color: 'from-red-600 to-pink-600',
            iconBg: 'bg-red-600/20',
            iconColor: 'text-red-400'
        }
    ] : []

    if (loading && withdrawals.length === 0) {
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
                        Withdrawal Requests
                    </h1>
                    <p className="text-muted-foreground">
                        Manage creator payout requests and process withdrawals
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={fetchWithdrawals}
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
                            className={`bg-gradient-to-br ${stat.color}/20 backdrop-blur-xl border border-border rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform ${
                                statusFilter === stat.title.toUpperCase() ? 'ring-2 ring-white/30' : ''
                            }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${stat.iconBg} rounded-xl p-3`}>
                                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                </div>
                                <Badge className="bg-white/10 text-foreground border-none">
                                    {stat.count} requests
                                </Badge>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-foreground mb-1">
                                    {formatPrice(stat.amount)}
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
                    className="bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                >
                    <option value="all">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Withdrawals Table */}
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
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Amount</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Method</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-semibold text-muted-foreground">Requested</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {withdrawals.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                        No withdrawal requests found
                                    </td>
                                </tr>
                            ) : (
                                withdrawals.map((withdrawal) => {
                                    const StatusIcon = statusIcons[withdrawal.status]
                                    const MethodIcon = methodIcons[withdrawal.method as keyof typeof methodIcons] || CreditCard

                                    return (
                                        <tr key={withdrawal.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {withdrawal.creator.profileImage ? (
                                                        <Image
                                                            src={withdrawal.creator.profileImage}
                                                            alt={withdrawal.creator.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-white" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-foreground">{withdrawal.creator.name}</div>
                                                        <div className="text-sm text-muted-foreground">{withdrawal.creator.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-2xl font-bold text-foreground">
                                                    {formatPrice(withdrawal.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <MethodIcon className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-foreground">{withdrawal.method.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge className={`${statusColors[withdrawal.status]} border`}>
                                                    <StatusIcon className={`w-3 h-3 mr-1 ${withdrawal.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                                                    {withdrawal.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {formatDate(withdrawal.requestedAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setSelectedWithdrawal(withdrawal)}
                                                        className="bg-white/10 hover:bg-white/20 text-foreground"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {withdrawal.status === 'PENDING' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAction(withdrawal.id, 'approve')}
                                                                disabled={processing === withdrawal.id}
                                                                className="bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                {processing === withdrawal.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAction(withdrawal.id, 'reject')}
                                                                disabled={processing === withdrawal.id}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    {withdrawal.status === 'PROCESSING' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setSelectedWithdrawal(withdrawal)}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                                        >
                                                            Complete
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
            {selectedWithdrawal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 border border-border rounded-2xl p-6 max-w-lg w-full"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-foreground">Withdrawal Details</h3>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setSelectedWithdrawal(null)
                                    setActionNotes('')
                                    setTransactionId('')
                                }}
                                className="bg-white/10 hover:bg-white/20 text-foreground"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {/* Creator Info */}
                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                                {selectedWithdrawal.creator.profileImage ? (
                                    <Image
                                        src={selectedWithdrawal.creator.profileImage}
                                        alt={selectedWithdrawal.creator.name}
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
                                    <div className="font-semibold text-foreground">{selectedWithdrawal.creator.name}</div>
                                    <div className="text-sm text-muted-foreground">{selectedWithdrawal.creator.email}</div>
                                </div>
                            </div>

                            {/* Amount */}
                            <div className="p-4 bg-white/5 rounded-xl text-center">
                                <div className="text-4xl font-bold text-foreground mb-2">
                                    {formatPrice(selectedWithdrawal.amount)}
                                </div>
                                <Badge className={`${statusColors[selectedWithdrawal.status]} border`}>
                                    {selectedWithdrawal.status}
                                </Badge>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Method</div>
                                    <div className="text-foreground font-medium">
                                        {selectedWithdrawal.method.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Requested</div>
                                    <div className="text-foreground font-medium">
                                        {formatDate(selectedWithdrawal.requestedAt)}
                                    </div>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="p-3 bg-white/5 rounded-xl">
                                <div className="text-xs text-muted-foreground mb-1">Account Details</div>
                                <div className="text-foreground font-mono text-sm">
                                    {selectedWithdrawal.accountDetails}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedWithdrawal.notes && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Notes</div>
                                    <div className="text-foreground text-sm">{selectedWithdrawal.notes}</div>
                                </div>
                            )}

                            {/* Transaction ID */}
                            {selectedWithdrawal.transactionId && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <div className="text-xs text-muted-foreground mb-1">Transaction ID</div>
                                    <div className="text-foreground font-mono text-sm">
                                        {selectedWithdrawal.transactionId}
                                    </div>
                                </div>
                            )}

                            {/* Action Form */}
                            {(selectedWithdrawal.status === 'PENDING' || selectedWithdrawal.status === 'PROCESSING') && (
                                <div className="border-t border-border pt-4 space-y-3">
                                    <textarea
                                        value={actionNotes}
                                        onChange={(e) => setActionNotes(e.target.value)}
                                        placeholder="Add notes (optional)"
                                        className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                                        rows={2}
                                    />

                                    {selectedWithdrawal.status === 'PROCESSING' && (
                                        <input
                                            type="text"
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            placeholder="Transaction ID (optional)"
                                            className="w-full bg-white/5 border border-border rounded-lg px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                        />
                                    )}

                                    <div className="flex gap-3">
                                        {selectedWithdrawal.status === 'PENDING' && (
                                            <>
                                                <Button
                                                    onClick={() => handleAction(selectedWithdrawal.id, 'approve')}
                                                    disabled={processing === selectedWithdrawal.id}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    {processing === selectedWithdrawal.id ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                    )}
                                                    Approve
                                                </Button>
                                                <Button
                                                    onClick={() => handleAction(selectedWithdrawal.id, 'reject')}
                                                    disabled={processing === selectedWithdrawal.id}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        {selectedWithdrawal.status === 'PROCESSING' && (
                                            <Button
                                                onClick={() => handleAction(selectedWithdrawal.id, 'complete')}
                                                disabled={processing === selectedWithdrawal.id}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                {processing === selectedWithdrawal.id ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                )}
                                                Mark as Completed
                                            </Button>
                                        )}
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
