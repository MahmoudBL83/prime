'use client'

import React, { useState } from 'react'
import {
    DollarSign,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Calendar,
    Users,
    CreditCard,
    Banknote,
    Filter,
    Eye,
    PlayCircle,
    PauseCircle,
    FileText,
    TrendingUp,
    Shield,
    RefreshCw
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

type BatchStatus = 'draft' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'partially_failed' | 'failed'
type PaymentMethod = 'bank_transfer' | 'vodafone_cash' | 'paypal'
type PayoutStatus = 'ready' | 'on_hold' | 'failed' | 'completed'

interface PayoutBatch {
    id: string
    batchNumber: string
    createdDate: string
    scheduledDate: string
    status: BatchStatus
    totalCreators: number
    totalAmount: number
    platformFee: number
    processingFee: number
    netAmount: number
    createdBy: string
    approvedBy?: string
    approvedDate?: string
}

interface CreatorPayout {
    id: string
    creatorId: string
    creatorName: string
    email: string
    earningsBreakdown: {
        subscriptions: number
        courseSales: number
        tips: number
    }
    totalEarnings: number
    platformFee: number
    processingFee: number
    netPayout: number
    paymentMethod: PaymentMethod
    bankInfo?: string
    status: PayoutStatus
    holdReason?: string
    failureReason?: string
}

const MOCK_BATCHES: PayoutBatch[] = [
    {
        id: '1',
        batchNumber: 'BATCH-2024-10-001',
        createdDate: '2024-10-15T10:00:00Z',
        scheduledDate: '2024-10-20T00:00:00Z',
        status: 'pending_approval',
        totalCreators: 156,
        totalAmount: 487500,
        platformFee: 73125,
        processingFee: 9750,
        netAmount: 404625,
        createdBy: 'Admin Team'
    },
    {
        id: '2',
        batchNumber: 'BATCH-2024-09-004',
        createdDate: '2024-09-28T10:00:00Z',
        scheduledDate: '2024-10-05T00:00:00Z',
        status: 'completed',
        totalCreators: 142,
        totalAmount: 445000,
        platformFee: 66750,
        processingFee: 8900,
        netAmount: 369350,
        createdBy: 'Admin Team',
        approvedBy: 'Finance Manager',
        approvedDate: '2024-09-29T14:30:00Z'
    },
    {
        id: '3',
        batchNumber: 'BATCH-2024-09-003',
        createdDate: '2024-09-20T10:00:00Z',
        scheduledDate: '2024-09-25T00:00:00Z',
        status: 'partially_failed',
        totalCreators: 138,
        totalAmount: 423000,
        platformFee: 63450,
        processingFee: 8460,
        netAmount: 351090,
        createdBy: 'Admin Team',
        approvedBy: 'Finance Manager',
        approvedDate: '2024-09-21T11:15:00Z'
    }
]

const MOCK_CREATOR_PAYOUTS: CreatorPayout[] = [
    {
        id: '1',
        creatorId: 'CRT-1001',
        creatorName: 'Dr. Ahmed Hassan',
        email: 'ahmed@example.com',
        earningsBreakdown: {
            subscriptions: 12500,
            courseSales: 8900,
            tips: 450
        },
        totalEarnings: 21850,
        platformFee: 3278,
        processingFee: 437,
        netPayout: 18135,
        paymentMethod: 'bank_transfer',
        bankInfo: 'Bank Misr ****1234',
        status: 'ready'
    },
    {
        id: '2',
        creatorId: 'CRT-1002',
        creatorName: 'Fatma Mohamed',
        email: 'fatma@example.com',
        earningsBreakdown: {
            subscriptions: 8700,
            courseSales: 5400,
            tips: 230
        },
        totalEarnings: 14330,
        platformFee: 2150,
        processingFee: 287,
        netPayout: 11893,
        paymentMethod: 'vodafone_cash',
        bankInfo: 'Vodafone 0100****567',
        status: 'ready'
    },
    {
        id: '3',
        creatorId: 'CRT-1003',
        creatorName: 'Omar Khaled',
        email: 'omar@example.com',
        earningsBreakdown: {
            subscriptions: 3200,
            courseSales: 1800,
            tips: 120
        },
        totalEarnings: 5120,
        platformFee: 768,
        processingFee: 102,
        netPayout: 4250,
        paymentMethod: 'bank_transfer',
        bankInfo: 'NBE ****5678',
        status: 'on_hold',
        holdReason: 'Pending KYC verification'
    },
    {
        id: '4',
        creatorId: 'CRT-1004',
        creatorName: 'Sara Ali',
        email: 'sara@example.com',
        earningsBreakdown: {
            subscriptions: 15600,
            courseSales: 9800,
            tips: 670
        },
        totalEarnings: 26070,
        platformFee: 3911,
        processingFee: 521,
        netPayout: 21638,
        paymentMethod: 'paypal',
        bankInfo: 'PayPal sara****@gmail.com',
        status: 'ready'
    },
    {
        id: '5',
        creatorId: 'CRT-1005',
        creatorName: 'Khaled Ibrahim',
        email: 'khaled@example.com',
        earningsBreakdown: {
            subscriptions: 2100,
            courseSales: 1200,
            tips: 80
        },
        totalEarnings: 3380,
        platformFee: 507,
        processingFee: 68,
        netPayout: 2805,
        paymentMethod: 'bank_transfer',
        status: 'on_hold',
        holdReason: 'Missing tax documentation'
    }
]

const batchStatusColors = {
    draft: 'bg-muted text-gray-800 border-border',
    pending_approval: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    processing: 'bg-purple-100 text-purple-800 border-purple-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    partially_failed: 'bg-orange-100 text-orange-800 border-orange-200',
    failed: 'bg-red-100 text-red-800 border-red-200'
}

const payoutStatusColors = {
    ready: 'bg-green-100 text-green-800 border-green-200',
    on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    completed: 'bg-blue-100 text-blue-800 border-blue-200'
}

const paymentMethodIcons = {
    bank_transfer: Banknote,
    vodafone_cash: CreditCard,
    paypal: DollarSign
}

export default function PayoutBatchManagementPage() {
    const [activeTab, setActiveTab] = useState('batches')
    const [batches] = useState<PayoutBatch[]>(MOCK_BATCHES)
    const [selectedBatch, setSelectedBatch] = useState<PayoutBatch | null>(null)
    const [creatorPayouts] = useState<CreatorPayout[]>(MOCK_CREATOR_PAYOUTS)
    const [showBatchDetails, setShowBatchDetails] = useState(false)
    const [showApprovalModal, setShowApprovalModal] = useState(false)

    const stats = {
        pendingBatches: batches.filter(b => b.status === 'pending_approval').length,
        totalPending: batches.filter(b => b.status === 'pending_approval').reduce((sum, b) => sum + b.netAmount, 0),
        creatorsAwaitingPayout: creatorPayouts.filter(p => p.status === 'ready').length,
        onHoldPayouts: creatorPayouts.filter(p => p.status === 'on_hold').length
    }

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

    const handleApproveBatch = (batch: PayoutBatch) => {
        setSelectedBatch(batch)
        setShowApprovalModal(true)
    }

    const handleViewBatch = (batch: PayoutBatch) => {
        setSelectedBatch(batch)
        setShowBatchDetails(true)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Payout Batch Management</h1>
                        <p className="text-muted-foreground">Manage creator payouts, batch processing, and payment distribution</p>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Create New Batch
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.pendingBatches}</div>
                        <div className="text-sm text-muted-foreground mt-1">Pending Approval</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalPending)}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Pending Amount</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.creatorsAwaitingPayout}</div>
                        <div className="text-sm text-muted-foreground mt-1">Creators Awaiting Payout</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-orange-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.onHoldPayouts}</div>
                        <div className="text-sm text-muted-foreground mt-1">Payouts On Hold</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="batches" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Batch History
                                </TabsTrigger>
                                <TabsTrigger value="creators" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Users className="w-4 h-4 mr-2" />
                                    Creator Payouts
                                </TabsTrigger>
                                <TabsTrigger value="holds" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <PauseCircle className="w-4 h-4 mr-2" />
                                    On Hold ({stats.onHoldPayouts})
                                </TabsTrigger>
                                <TabsTrigger value="reserves" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Reserves
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Batch History Tab */}
                        <TabsContent value="batches" className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">Payout Batches</h3>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                                            <Filter className="w-4 h-4 mr-2" />
                                            Filter
                                        </Button>
                                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {batches.map((batch) => (
                                        <div key={batch.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-purple-500/20 rounded-lg p-2">
                                                            <FileText className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground text-lg">{batch.batchNumber}</h4>
                                                            <p className="text-sm text-muted-foreground">Created: {formatDate(batch.createdDate)}</p>
                                                        </div>
                                                        <Badge className={batchStatusColors[batch.status]}>
                                                            {batch.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-5 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Total Creators</div>
                                                            <div className="text-lg font-semibold text-foreground">{batch.totalCreators}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Total Earnings</div>
                                                            <div className="text-lg font-semibold text-foreground">{formatCurrency(batch.totalAmount)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Platform Fee (15%)</div>
                                                            <div className="text-lg font-semibold text-orange-400">-{formatCurrency(batch.platformFee)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Processing Fee</div>
                                                            <div className="text-lg font-semibold text-orange-400">-{formatCurrency(batch.processingFee)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Net Payout</div>
                                                            <div className="text-lg font-semibold text-green-400">{formatCurrency(batch.netAmount)}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            Scheduled: {formatDate(batch.scheduledDate)}
                                                        </span>
                                                        {batch.approvedBy && (
                                                            <span className="flex items-center gap-1">
                                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                                Approved by {batch.approvedBy}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    {batch.status === 'pending_approval' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-foreground"
                                                            onClick={() => handleApproveBatch(batch)}
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                        onClick={() => handleViewBatch(batch)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Creator Payouts Tab */}
                        <TabsContent value="creators" className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground">Individual Creator Payouts</h3>
                                    <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                                        <Download className="w-4 h-4 mr-2" />
                                        Export Report
                                    </Button>
                                </div>

                                <div className="border border-border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-white/5 border-b border-border">
                                            <tr>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Creator</th>
                                                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Earnings Breakdown</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total Earnings</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Fees</th>
                                                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Payout</th>
                                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Payment Method</th>
                                                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/10">
                                            {creatorPayouts.map((payout) => {
                                                const PaymentIcon = paymentMethodIcons[payout.paymentMethod]
                                                return (
                                                    <tr key={payout.id} className="hover:bg-white/5 transition-colors">
                                                        <td className="py-3 px-4">
                                                            <div>
                                                                <div className="font-medium text-foreground">{payout.creatorName}</div>
                                                                <div className="text-xs text-muted-foreground">{payout.creatorId}</div>
                                                                <div className="text-xs text-muted-foreground">{payout.email}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="space-y-1 text-sm">
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>Subscriptions:</span>
                                                                    <span className="text-foreground">{formatCurrency(payout.earningsBreakdown.subscriptions)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>Course Sales:</span>
                                                                    <span className="text-foreground">{formatCurrency(payout.earningsBreakdown.courseSales)}</span>
                                                                </div>
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>Tips:</span>
                                                                    <span className="text-foreground">{formatCurrency(payout.earningsBreakdown.tips)}</span>
                                                                </div>
                                                            </div>
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
                                                            <div className="flex items-center justify-center gap-2">
                                                                <PaymentIcon className="w-4 h-4 text-muted-foreground" />
                                                                <div className="text-sm">
                                                                    <div className="text-foreground">{payout.paymentMethod.replace('_', ' ')}</div>
                                                                    <div className="text-xs text-muted-foreground">{payout.bankInfo}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <Badge className={payoutStatusColors[payout.status]}>
                                                                {payout.status.replace('_', ' ')}
                                                            </Badge>
                                                            {payout.holdReason && (
                                                                <div className="text-xs text-yellow-400 mt-1">{payout.holdReason}</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </TabsContent>

                        {/* On Hold Tab */}
                        <TabsContent value="holds" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-yellow-300 mb-1">Payouts Requiring Attention</h4>
                                            <p className="text-sm text-yellow-200/80">
                                                {stats.onHoldPayouts} creators have payouts on hold. Resolve issues to process payments.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {creatorPayouts.filter(p => p.status === 'on_hold').map((payout) => (
                                    <div key={payout.id} className="bg-white/5 rounded-lg p-5 border border-yellow-500/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-400 font-bold">
                                                        {payout.creatorName[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{payout.creatorName}</h4>
                                                        <p className="text-sm text-muted-foreground">{payout.creatorId} • {payout.email}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-3">
                                                    <div className="flex items-center gap-2 text-yellow-300">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <span className="font-medium">Hold Reason:</span>
                                                        <span>{payout.holdReason}</span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Total Earnings</div>
                                                        <div className="text-lg font-semibold text-foreground">{formatCurrency(payout.totalEarnings)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Fees</div>
                                                        <div className="text-lg font-semibold text-orange-400">-{formatCurrency(payout.platformFee + payout.processingFee)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Net Payout</div>
                                                        <div className="text-lg font-semibold text-green-400">{formatCurrency(payout.netPayout)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Payment Method</div>
                                                        <div className="text-sm text-foreground">{payout.paymentMethod.replace('_', ' ')}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-foreground">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Resolve Hold
                                                </Button>
                                                <Button size="sm" variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Reserves Tab */}
                        <TabsContent value="reserves" className="p-6">
                            <div className="space-y-4">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-blue-300 mb-1">Reserve Policy</h4>
                                            <p className="text-sm text-blue-200/80">
                                                Platform holds 10% of creator payouts for 30 days as a reserve for chargebacks and disputes. Reserves are automatically released after the holding period.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <div className="text-sm text-muted-foreground mb-1">Total Reserve Balance</div>
                                        <div className="text-2xl font-bold text-foreground">E£127,450</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <div className="text-sm text-muted-foreground mb-1">Due for Release (7 days)</div>
                                        <div className="text-2xl font-bold text-green-400">E£42,300</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                        <div className="text-sm text-muted-foreground mb-1">Average Reserve Period</div>
                                        <div className="text-2xl font-bold text-blue-400">28 days</div>
                                    </div>
                                </div>

                                <div className="text-center py-12 text-muted-foreground">
                                    <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                                    <p>Reserve management dashboard coming soon</p>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Approval Modal */}
            <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Approve Payout Batch</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Review batch details and approve for processing
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBatch && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">{selectedBatch.batchNumber}</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-muted-foreground">Total Creators</div>
                                        <div className="text-foreground font-semibold">{selectedBatch.totalCreators}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Total Amount</div>
                                        <div className="text-foreground font-semibold">{formatCurrency(selectedBatch.totalAmount)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Platform Fee (15%)</div>
                                        <div className="text-orange-400 font-semibold">-{formatCurrency(selectedBatch.platformFee)}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">Processing Fee</div>
                                        <div className="text-orange-400 font-semibold">-{formatCurrency(selectedBatch.processingFee)}</div>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-border">
                                        <div className="text-muted-foreground">Net Payout to Creators</div>
                                        <div className="text-green-400 font-bold text-xl">{formatCurrency(selectedBatch.netAmount)}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-300 mb-2">Approval Confirmation</h4>
                                <p className="text-sm text-blue-200/80">
                                    By approving this batch, you authorize the payment of {formatCurrency(selectedBatch.netAmount)} to {selectedBatch.totalCreators} creators. This action cannot be undone.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-foreground"
                                    onClick={() => {
                                        console.log('Batch approved:', selectedBatch.id)
                                        setShowApprovalModal(false)
                                    }}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve & Process Batch
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                    onClick={() => setShowApprovalModal(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Batch Details Modal */}
            <Dialog open={showBatchDetails} onOpenChange={setShowBatchDetails}>
                <DialogContent className="bg-background text-foreground border-border max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Batch Details</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Complete information about this payout batch
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBatch && (
                        <div className="space-y-4 mt-4 max-h-[600px] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Batch Number</div>
                                    <div className="text-lg font-semibold text-foreground">{selectedBatch.batchNumber}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                                    <Badge className={batchStatusColors[selectedBatch.status]}>
                                        {selectedBatch.status.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-3">Financial Summary</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Creator Earnings:</span>
                                        <span className="text-foreground font-semibold">{formatCurrency(selectedBatch.totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Platform Fee (15%):</span>
                                        <span className="text-orange-400 font-semibold">-{formatCurrency(selectedBatch.platformFee)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Processing Fee (~2%):</span>
                                        <span className="text-orange-400 font-semibold">-{formatCurrency(selectedBatch.processingFee)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-border">
                                        <span className="text-muted-foreground font-semibold">Net Payout:</span>
                                        <span className="text-green-400 font-bold text-lg">{formatCurrency(selectedBatch.netAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                                <p>Showing {selectedBatch.totalCreators} creators in this batch</p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
