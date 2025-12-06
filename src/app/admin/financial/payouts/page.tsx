'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    DollarSign,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Calendar,
    Users,
    Filter,
    Eye,
    Shield,
    RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed'

interface CreatorPayout {
    id: string
    creatorId: string
    creatorName: string
    email: string
    totalEarnings: number
    platformFee: number
    processingFee: number
    netPayout: number
    status: PayoutStatus
    periodStart: string
    periodEnd: string
    createdAt: string
    processedAt: string | null
    failureReason?: string | null
}

const payoutStatusColors: Record<PayoutStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
}

export default function PayoutBatchManagementPage() {
    const [payouts, setPayouts] = useState<CreatorPayout[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [apiStats, setApiStats] = useState<{ total: number; pending: number; processing: number; completed: number; failed: number; totalAmount: number; pendingAmount: number } | null>(null)
    const [statusFilter, setStatusFilter] = useState<'all' | PayoutStatus>('all')
    const [page, setPage] = useState(1)
    const [pageSize] = useState(25)
    const [meta, setMeta] = useState<{ total: number; page: number; pageSize: number; totalPages: number }>({ total: 0, page: 1, pageSize, totalPages: 1 })

    const fetchPayouts = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            params.set('page', page.toString())
            params.set('pageSize', pageSize.toString())
            if (statusFilter !== 'all') params.set('status', statusFilter)

            const response = await fetch(`/api/admin/payouts?${params.toString()}`, {
                credentials: 'include',
                cache: 'no-store'
            })
            if (!response.ok) throw new Error('Failed to fetch payouts')
            
            const data = await response.json()
            setPayouts(data.payouts || [])
            setApiStats(data.stats || null)
            setMeta({
                total: data.meta?.total || 0,
                page: data.meta?.page || page,
                pageSize: data.meta?.pageSize || pageSize,
                totalPages: data.meta?.totalPages || 1
            })
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }, [page, pageSize, statusFilter])

    useEffect(() => {
        fetchPayouts()
    }, [fetchPayouts])

    const stats = {
        totalPending: apiStats?.pendingAmount || 0,
        creatorsAwaitingPayout: apiStats?.pending || 0,
        processing: apiStats?.processing || 0,
        completed: apiStats?.completed || 0
    }

    const paginationLabel = meta.total === 0
        ? 'No payouts found'
        : `Showing ${(meta.page - 1) * meta.pageSize + 1}-${Math.min(meta.total, meta.page * meta.pageSize)} of ${meta.total}`

    const formatCurrency = (amount: number) => {
        return `E£${amount.toLocaleString()}`
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
                <div className="max-w-[1600px] mx-auto">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-white/5 rounded-lg w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-28 bg-white/5 rounded-lg"></div>
                            ))}
                        </div>
                        <div className="h-96 bg-white/5 rounded-lg"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
                <div className="max-w-[1600px] mx-auto">
                    <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-1">Error loading payouts</h3>
                                <div className="text-sm text-red-300">{error}</div>
                                <Button onClick={fetchPayouts} className="mt-4 bg-red-600 hover:bg-red-700">
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Creator Payouts</h1>
                        <p className="text-muted-foreground">Live data from payouts table with status and net amounts</p>
                    </div>
                    <Button onClick={fetchPayouts} className="bg-white/10 hover:bg-white/20 text-foreground">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.creatorsAwaitingPayout}</div>
                        <div className="text-sm text-muted-foreground mt-1">Pending Payouts</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalPending)}</div>
                        <div className="text-sm text-muted-foreground mt-1">Pending Amount</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.processing}</div>
                        <div className="text-sm text-muted-foreground mt-1">Processing</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.completed}</div>
                        <div className="text-sm text-muted-foreground mt-1">Completed</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value="payouts">
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="payouts" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Users className="w-4 h-4 mr-2" />
                                    Payouts
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="payouts" className="p-6 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Filter className="w-4 h-4" />
                                    Status
                                    <select
                                        value={statusFilter}
                                        onChange={(event) => {
                                            setStatusFilter(event.target.value as 'all' | PayoutStatus)
                                            setPage(1)
                                        }}
                                        className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                                    >
                                        <option value="all">All</option>
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Page {meta.page} / {meta.totalPages} · {meta.total.toLocaleString()} payouts
                                </div>
                            </div>

                            {payouts.length === 0 ? (
                                <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
                                    No payouts match this filter yet.
                                </div>
                            ) : (
                                <div className="border border-border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-white/5 border-b border-border">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Creator</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Period</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gross</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Fees</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net</th>
                                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dates</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {payouts.map((payout) => (
                                                <tr key={payout.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div>
                                                            <div className="font-medium text-foreground">{payout.creatorName}</div>
                                                            <div className="text-xs text-muted-foreground">{payout.creatorId}</div>
                                                            <div className="text-xs text-muted-foreground">{payout.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                                        <div>{formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="font-semibold text-foreground">{formatCurrency(payout.totalEarnings)}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="space-y-1 text-sm">
                                                            <div className="text-orange-400">-{formatCurrency(payout.platformFee)}</div>
                                                            <div className="text-orange-400">-{formatCurrency(payout.processingFee)}</div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <span className="font-bold text-green-400 text-lg">{formatCurrency(payout.netPayout)}</span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <Badge className={payoutStatusColors[payout.status]}>
                                                            {payout.status}
                                                        </Badge>
                                                        {payout.failureReason && (
                                                            <div className="text-xs text-red-300 mt-1">{payout.failureReason}</div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            Created {formatDate(payout.createdAt)}
                                                        </div>
                                                        {payout.processedAt && (
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                                Processed {formatDate(payout.processedAt)}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-2 flex-wrap text-sm text-muted-foreground">
                                <div>{paginationLabel}</div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        disabled={meta.page <= 1 || loading}
                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                        className="bg-white/10 text-foreground border border-border"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        type="button"
                                        disabled={meta.page >= meta.totalPages || loading}
                                        onClick={() => setPage(prev => Math.min(meta.totalPages, prev + 1))}
                                        className="bg-white/10 text-foreground border border-border"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
