'use client'

import React, { useState } from 'react'
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    DollarSign,
    AlertCircle,
    CheckCircle,
    XCircle,
    TrendingUp,
    Clock,
    FileText,
    Award,
    AlertTriangle,
    Download,
    Eye
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'

interface Creator {
    id: string
    userId: string
    kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
    expertise: string | null
    teachingGoals: string | null
    contractSigned: boolean
    contractSignedAt: string | null
    totalEarnings: number
    totalSubscribers: number
    createdAt: string
    updatedAt: string
    user: {
        id: string
        name: string
        email: string
        phone: string | null
        arabicName: string | null
        emailVerified: string | null
        onboardingCompleted: boolean
        createdAt: string
    }
    _count: {
        courses: number
    }
}

interface EnhancedCreatorDetailsModalProps {
    creator: Creator
    onClose: () => void
}

interface ContentStrike {
    id: string
    courseId: string
    courseTitle: string
    reason: string
    severity: 'minor' | 'major' | 'critical'
    status: 'active' | 'appealed' | 'resolved' | 'expired'
    issuedAt: string
    expiresAt?: string
    description: string
    appealNotes?: string
}

interface Payout {
    id: string
    amount: number
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'on_hold'
    period: string // e.g., "December 2023"
    scheduledDate: string
    processedDate?: string
    method: 'bank_transfer' | 'vodafone_cash' | 'paypal'
    earnings: {
        subscriptions: number
        courseSales: number
        tips: number
    }
    fees: {
        platform: number
        transaction: number
    }
    notes?: string
}

interface Contract {
    id: string
    type: 'creator_agreement' | 'content_license' | 'nda'
    status: 'pending' | 'signed' | 'expired' | 'terminated'
    signedAt?: string
    expiresAt?: string
    documentUrl: string
    version: string
}

// Mock data
const MOCK_STRIKES: Record<string, ContentStrike[]> = {
    default: [
        {
            id: 'st1',
            courseId: 'c123',
            courseTitle: 'Arabic Literature Fundamentals',
            reason: 'Quality Standards Violation',
            severity: 'minor',
            status: 'resolved',
            issuedAt: '2023-11-15T10:00:00Z',
            expiresAt: '2024-02-15T10:00:00Z',
            description: 'Audio quality below platform standards in lessons 3-5'
        },
        {
            id: 'st2',
            courseId: 'c456',
            courseTitle: 'Egyptian History Overview',
            reason: 'Incomplete Content',
            severity: 'major',
            status: 'active',
            issuedAt: '2023-12-20T14:30:00Z',
            expiresAt: '2024-06-20T14:30:00Z',
            description: 'Course published with only 3 out of promised 12 lessons'
        }
    ]
}

const MOCK_PAYOUTS: Record<string, Payout[]> = {
    default: [
        {
            id: 'p1',
            amount: 3450,
            status: 'completed',
            period: 'December 2023',
            scheduledDate: '2024-01-10T00:00:00Z',
            processedDate: '2024-01-11T08:30:00Z',
            method: 'bank_transfer',
            earnings: {
                subscriptions: 2800,
                courseSales: 600,
                tips: 50
            },
            fees: {
                platform: 520,
                transaction: 30
            }
        },
        {
            id: 'p2',
            amount: 4120,
            status: 'processing',
            period: 'January 2024',
            scheduledDate: '2024-02-10T00:00:00Z',
            method: 'bank_transfer',
            earnings: {
                subscriptions: 3200,
                courseSales: 850,
                tips: 70
            },
            fees: {
                platform: 620,
                transaction: 35
            }
        },
        {
            id: 'p3',
            amount: 2890,
            status: 'on_hold',
            period: 'November 2023',
            scheduledDate: '2023-12-10T00:00:00Z',
            method: 'bank_transfer',
            earnings: {
                subscriptions: 2400,
                courseSales: 450,
                tips: 40
            },
            fees: {
                platform: 435,
                transaction: 25
            },
            notes: 'On hold due to KYC verification pending'
        }
    ]
}

const MOCK_CONTRACTS: Record<string, Contract[]> = {
    default: [
        {
            id: 'con1',
            type: 'creator_agreement',
            status: 'signed',
            signedAt: '2023-10-15T12:00:00Z',
            documentUrl: '/contracts/creator-agreement-2023.pdf',
            version: '2.1'
        },
        {
            id: 'con2',
            type: 'content_license',
            status: 'signed',
            signedAt: '2023-10-15T12:05:00Z',
            documentUrl: '/contracts/content-license-2023.pdf',
            version: '1.5'
        },
        {
            id: 'con3',
            type: 'nda',
            status: 'signed',
            signedAt: '2023-10-15T12:10:00Z',
            documentUrl: '/contracts/nda-2023.pdf',
            version: '1.0'
        }
    ]
}

const kycStatusColors = {
    NOT_STARTED: 'bg-muted text-gray-800 border-border',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    VERIFIED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200'
}

const strikeStatusColors = {
    active: 'bg-red-100 text-red-800 border-red-200',
    appealed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    expired: 'bg-muted text-gray-800 border-border'
}

const severityColors = {
    minor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    major: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
}

const payoutStatusColors = {
    pending: 'bg-muted text-gray-800 border-border',
    processing: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    on_hold: 'bg-orange-100 text-orange-800 border-orange-200'
}

const contractStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    signed: 'bg-green-100 text-green-800 border-green-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    terminated: 'bg-muted text-gray-800 border-border'
}

export default function EnhancedCreatorDetailsModal({ creator, onClose }: EnhancedCreatorDetailsModalProps) {
    const [activeTab, setActiveTab] = useState('overview')

    const strikes = MOCK_STRIKES.default || []
    const payouts = MOCK_PAYOUTS.default || []
    const contracts = MOCK_CONTRACTS.default || []

    const activeStrikes = strikes.filter(s => s.status === 'active').length
    const totalPayouts = payouts.reduce((sum, p) => sum + p.amount, 0)

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const formatCurrency = (amount: number) => {
        return `E£${amount.toLocaleString()}`
    }

    const getPaymentMethodLabel = (method: string) => {
        const labels = {
            'bank_transfer': 'Bank Transfer',
            'vodafone_cash': 'Vodafone Cash',
            'paypal': 'PayPal'
        }
        return labels[method as keyof typeof labels] || method
    }

    const getContractTypeLabel = (type: string) => {
        const labels = {
            'creator_agreement': 'Creator Agreement',
            'content_license': 'Content License',
            'nda': 'Non-Disclosure Agreement'
        }
        return labels[type as keyof typeof labels] || type
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-background rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-foreground">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold mb-2">{creator.user.name}</h2>
                                {creator.user.arabicName && (
                                    <p className="text-purple-100 mb-2">{creator.user.arabicName}</p>
                                )}
                                <div className="flex items-center gap-3 flex-wrap mb-3">
                                    <Badge className="bg-white/20 text-foreground border-white/30">
                                        CREATOR
                                    </Badge>
                                    <Badge className={`${kycStatusColors[creator.kycStatus]} bg-opacity-90`}>
                                        KYC: {creator.kycStatus.replace('_', ' ')}
                                    </Badge>
                                    {creator.contractSigned ? (
                                        <Badge className="bg-green-500/20 text-foreground border-green-400/30">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Contract Signed
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-yellow-500/20 text-foreground border-yellow-400/30">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Contract Pending
                                        </Badge>
                                    )}
                                    {activeStrikes > 0 && (
                                        <Badge className="bg-red-500/20 text-foreground border-red-400/30">
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            {activeStrikes} Active Strike{activeStrikes > 1 ? 's' : ''}
                                        </Badge>
                                    )}
                                </div>
                                {creator.expertise && (
                                    <p className="text-sm text-purple-100">Expertise: {creator.expertise}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-6">
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Total Courses</div>
                                <div className="text-2xl font-bold">{creator._count.courses}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Subscribers</div>
                                <div className="text-2xl font-bold">{creator.totalSubscribers}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Total Earnings</div>
                                <div className="text-2xl font-bold">{formatCurrency(creator.totalEarnings)}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-3">
                                <div className="text-xs text-purple-100 mb-1">Content Strikes</div>
                                <div className="text-2xl font-bold">{activeStrikes}</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <TabsList className="w-full justify-start border-b rounded-none bg-background p-0">
                                <TabsTrigger value="overview" className="data-[state=active]:bg-background">
                                    <User className="w-4 h-4 mr-2" />
                                    Overview
                                </TabsTrigger>
                                <TabsTrigger value="payouts" className="data-[state=active]:bg-background">
                                    <DollarSign className="w-4 h-4 mr-2" />
                                    Payouts
                                </TabsTrigger>
                                <TabsTrigger value="strikes" className="data-[state=active]:bg-background">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Strike History
                                </TabsTrigger>
                                <TabsTrigger value="contracts" className="data-[state=active]:bg-background">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Contracts
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Overview Tab */}
                                <TabsContent value="overview" className="mt-0">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Email</div>
                                                        <div className="text-foreground">{creator.user.email}</div>
                                                    </div>
                                                </div>
                                                {creator.user.phone && (
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="text-sm text-muted-foreground">Phone</div>
                                                            <div className="text-foreground">{creator.user.phone}</div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="text-sm text-muted-foreground">Joined as Creator</div>
                                                        <div className="text-foreground">{formatDate(creator.createdAt)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold text-foreground mb-4">Creator Status</h3>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">KYC Verification</span>
                                                    <Badge className={kycStatusColors[creator.kycStatus]}>
                                                        {creator.kycStatus.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Contract Status</span>
                                                    {creator.contractSigned ? (
                                                        <Badge className="bg-green-100 text-green-800 border-green-200">
                                                            Signed
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                            Pending
                                                        </Badge>
                                                    )}
                                                </div>
                                                {creator.contractSignedAt && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">Contract Signed</span>
                                                        <span className="text-sm font-medium">{formatDate(creator.contractSignedAt)}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">Email Verified</span>
                                                    {creator.user.emailVerified ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-600" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {creator.teachingGoals && (
                                            <div className="col-span-2">
                                                <h3 className="font-semibold text-foreground mb-2">Teaching Goals</h3>
                                                <p className="text-sm text-muted-foreground">{creator.teachingGoals}</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Payouts Tab */}
                                <TabsContent value="payouts" className="mt-0">
                                    <div className="mb-6">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-purple-50 rounded-lg p-4">
                                                <div className="text-sm text-muted-foreground mb-1">Total Paid Out</div>
                                                <div className="text-2xl font-bold text-foreground">{formatCurrency(totalPayouts)}</div>
                                            </div>
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <div className="text-sm text-muted-foreground mb-1">This Month</div>
                                                <div className="text-2xl font-bold text-foreground">
                                                    {formatCurrency(payouts.find(p => p.status === 'processing')?.amount || 0)}
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-4">
                                                <div className="text-sm text-muted-foreground mb-1">Next Payout</div>
                                                <div className="text-sm font-medium text-foreground">
                                                    {payouts.find(p => p.status === 'processing')
                                                        ? formatDate(payouts.find(p => p.status === 'processing')!.scheduledDate)
                                                        : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {payouts.map((payout) => (
                                            <div key={payout.id} className="border border-border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h4 className="font-semibold text-foreground text-lg">{formatCurrency(payout.amount)}</h4>
                                                        <p className="text-sm text-muted-foreground">{payout.period}</p>
                                                    </div>
                                                    <Badge className={payoutStatusColors[payout.status]}>
                                                        {payout.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-foreground mb-2">Earnings Breakdown</h5>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Subscriptions:</span>
                                                                <span className="font-medium">{formatCurrency(payout.earnings.subscriptions)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Course Sales:</span>
                                                                <span className="font-medium">{formatCurrency(payout.earnings.courseSales)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Tips:</span>
                                                                <span className="font-medium">{formatCurrency(payout.earnings.tips)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h5 className="text-xs font-semibold text-foreground mb-2">Fees & Details</h5>
                                                        <div className="space-y-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Platform Fee (15%):</span>
                                                                <span className="font-medium">-{formatCurrency(payout.fees.platform)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Transaction Fee:</span>
                                                                <span className="font-medium">-{formatCurrency(payout.fees.transaction)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Payment Method:</span>
                                                                <span className="font-medium">{getPaymentMethodLabel(payout.method)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                                                    <div>
                                                        Scheduled: {formatDate(payout.scheduledDate)}
                                                        {payout.processedDate && ` • Processed: ${formatDate(payout.processedDate)}`}
                                                    </div>
                                                    {payout.status === 'on_hold' && payout.notes && (
                                                        <div className="flex items-center gap-1 text-orange-600">
                                                            <AlertCircle className="w-3 h-3" />
                                                            <span>{payout.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Strike History Tab */}
                                <TabsContent value="strikes" className="mt-0">
                                    <div className="space-y-4">
                                        {strikes.length > 0 ? (
                                            strikes.map((strike) => (
                                                <div key={strike.id} className="border border-border rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge className={severityColors[strike.severity]}>
                                                                    {strike.severity} severity
                                                                </Badge>
                                                                <Badge className={strikeStatusColors[strike.status]}>
                                                                    {strike.status}
                                                                </Badge>
                                                            </div>
                                                            <h4 className="font-semibold text-foreground mb-1">{strike.reason}</h4>
                                                            <p className="text-sm text-muted-foreground mb-2">Course: {strike.courseTitle}</p>
                                                            <p className="text-sm text-foreground">{strike.description}</p>
                                                            {strike.appealNotes && (
                                                                <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                                                    <p className="text-xs font-semibold text-yellow-800 mb-1">Appeal Notes:</p>
                                                                    <p className="text-xs text-yellow-700">{strike.appealNotes}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
                                                        <div>
                                                            Issued: {formatDate(strike.issuedAt)}
                                                            {strike.expiresAt && strike.status === 'active' && (
                                                                <span> • Expires: {formatDate(strike.expiresAt)}</span>
                                                            )}
                                                        </div>
                                                        {strike.status === 'active' && (
                                                            <div className="flex gap-2">
                                                                <Button size="sm" variant="outline" className="text-xs">
                                                                    View Course
                                                                </Button>
                                                                <Button size="sm" variant="outline" className="text-xs">
                                                                    Review Appeal
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-12">
                                                <Award className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                                <p className="text-muted-foreground">No content strikes</p>
                                                <p className="text-sm text-muted-foreground mt-1">This creator has a clean record</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                {/* Contracts Tab */}
                                <TabsContent value="contracts" className="mt-0">
                                    <div className="space-y-4">
                                        {contracts.map((contract) => (
                                            <div key={contract.id} className="border border-border rounded-lg p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-semibold text-foreground mb-1">{getContractTypeLabel(contract.type)}</h4>
                                                        <p className="text-sm text-muted-foreground">Version {contract.version}</p>
                                                    </div>
                                                    <Badge className={contractStatusColors[contract.status]}>
                                                        {contract.status}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div>
                                                        {contract.signedAt && (
                                                            <span>Signed: {formatDate(contract.signedAt)}</span>
                                                        )}
                                                        {contract.expiresAt && (
                                                            <span> • Expires: {formatDate(contract.expiresAt)}</span>
                                                        )}
                                                    </div>
                                                    <Button size="sm" variant="outline" className="text-xs">
                                                        <Download className="w-3 h-3 mr-1" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!creator.contractSigned && (
                                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-yellow-900 mb-1">Contract Signature Required</h4>
                                                    <p className="text-sm text-yellow-800 mb-3">
                                                        This creator needs to sign the platform agreement to start receiving payouts.
                                                    </p>
                                                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-foreground">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        Send Contract Reminder
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border p-4 bg-background flex items-center justify-between">
                        <div className="flex gap-2">
                            {creator.kycStatus !== 'VERIFIED' && (
                                <Button size="sm" variant="outline" className="text-purple-600 hover:text-purple-700">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Review KYC
                                </Button>
                            )}
                            <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-2" />
                                View Courses
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                <Mail className="w-4 h-4 mr-2" />
                                Contact Creator
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
