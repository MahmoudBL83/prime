'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Users,
    Download,
    RefreshCw,
    AlertCircle,
    Clock,
    CheckCircle,
    XCircle,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    FileText,
    Wallet
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FinancialStats {
    overview: {
        totalRevenue: number
        monthlyRevenue: number
        revenueGrowth: number
        totalPayouts: number
        pendingPayouts: number
        activeSubscriptions: number
        churnRate: number
        averageRevenuePerUser: number
    }
    breakdown: {
        categoryA: number
        categoryB: number
        categoryC: number
        subscriptions: number
        addOns: number
    }
    recentTransactions: Array<{
        id: string
        type: 'subscription' | 'payout' | 'refund' | 'chargeback'
        amount: number
        status: 'completed' | 'pending' | 'failed'
        user: string
        date: string
    }>
    topCreatorEarnings: Array<{
        id: string
        name: string
        earnings: number
        category: string
        growth: number
    }>
}

export default function FinancialManagementPage() {
    const [stats, setStats] = useState<FinancialStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

    useEffect(() => {
        fetchFinancialStats()
    }, [timeRange])

    const fetchFinancialStats = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/financial?range=${timeRange}`)
            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch financial stats:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-12 bg-white/5 rounded-lg w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!stats) return null

    const metricCards = [
        {
            title: 'Total Revenue',
            value: formatPrice(stats.overview.totalRevenue),
            change: stats.overview.revenueGrowth,
            icon: DollarSign,
            color: 'from-green-600 to-emerald-600',
            iconBg: 'bg-green-600/20',
            iconColor: 'text-green-400'
        },
        {
            title: 'Monthly Revenue',
            value: formatPrice(stats.overview.monthlyRevenue),
            subtitle: 'Current month',
            icon: TrendingUp,
            color: 'from-blue-600 to-cyan-600',
            iconBg: 'bg-blue-600/20',
            iconColor: 'text-blue-400'
        },
        {
            title: 'Creator Payouts',
            value: formatPrice(stats.overview.totalPayouts),
            subtitle: `${stats.overview.pendingPayouts} pending`,
            icon: Wallet,
            color: 'from-purple-600 to-pink-600',
            iconBg: 'bg-purple-600/20',
            iconColor: 'text-purple-400'
        },
        {
            title: 'Active Subscriptions',
            value: stats.overview.activeSubscriptions.toLocaleString(),
            subtitle: `${stats.overview.churnRate}% churn rate`,
            icon: CreditCard,
            color: 'from-orange-600 to-red-600',
            iconBg: 'bg-orange-600/20',
            iconColor: 'text-orange-400'
        },
        {
            title: 'ARPU',
            value: formatPrice(stats.overview.averageRevenuePerUser),
            subtitle: 'Average per user',
            icon: Users,
            color: 'from-indigo-600 to-purple-600',
            iconBg: 'bg-indigo-600/20',
            iconColor: 'text-indigo-400'
        },
        {
            title: 'Category A Revenue',
            value: formatPrice(stats.breakdown.categoryA),
            subtitle: 'All-Access Library',
            icon: FileText,
            color: 'from-teal-600 to-green-600',
            iconBg: 'bg-teal-600/20',
            iconColor: 'text-teal-400'
        },
        {
            title: 'Category B Revenue',
            value: formatPrice(stats.breakdown.categoryB),
            subtitle: 'Signature Courses',
            icon: FileText,
            color: 'from-yellow-600 to-orange-600',
            iconBg: 'bg-yellow-600/20',
            iconColor: 'text-yellow-400'
        },
        {
            title: 'Category C Revenue',
            value: formatPrice(stats.breakdown.categoryC),
            subtitle: 'Membership Channels',
            icon: FileText,
            color: 'from-pink-600 to-red-600',
            iconBg: 'bg-pink-600/20',
            iconColor: 'text-pink-400'
        }
    ]

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
                        Financial Management
                    </h1>
                    <p className="text-muted-foreground">
                        Revenue tracking, payouts, and financial analytics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <Button className="bg-white/10 hover:bg-white/20 text-foreground">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-foreground">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metricCards.map((metric, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-gradient-to-br ${metric.color}/20 backdrop-blur-xl border border-border rounded-2xl p-6 hover:scale-105 transition-transform`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${metric.iconBg} rounded-xl p-3`}>
                                <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
                            </div>
                            {metric.change !== undefined && (
                                <div className={`flex items-center gap-1 text-sm font-semibold ${
                                    metric.change >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {metric.change >= 0 ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4" />
                                    )}
                                    {Math.abs(metric.change)}%
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-foreground mb-1">
                                {metric.value}
                            </div>
                            <div className="text-sm text-muted-foreground">{metric.title}</div>
                            {metric.subtitle && (
                                <div className="text-xs text-muted-foreground mt-2">
                                    {metric.subtitle}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-foreground">Recent Transactions</h3>
                        <Button className="bg-white/10 hover:bg-white/20 text-foreground text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refresh
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {stats.recentTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                        transaction.type === 'subscription' ? 'bg-green-600/20' :
                                        transaction.type === 'payout' ? 'bg-purple-600/20' :
                                        transaction.type === 'refund' ? 'bg-orange-600/20' :
                                        'bg-red-600/20'
                                    }`}>
                                        {transaction.type === 'subscription' && <CreditCard className="w-5 h-5 text-green-400" />}
                                        {transaction.type === 'payout' && <Wallet className="w-5 h-5 text-purple-400" />}
                                        {transaction.type === 'refund' && <RefreshCw className="w-5 h-5 text-orange-400" />}
                                        {transaction.type === 'chargeback' && <XCircle className="w-5 h-5 text-red-400" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground capitalize">
                                            {transaction.type}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{transaction.user}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${
                                        transaction.type === 'refund' || transaction.type === 'chargeback' 
                                            ? 'text-red-400' 
                                            : 'text-green-400'
                                    }`}>
                                        {transaction.type === 'refund' || transaction.type === 'chargeback' ? '-' : '+'}{formatPrice(transaction.amount)}
                                    </p>
                                    <Badge className={`${
                                        transaction.status === 'completed' ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                                        transaction.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' :
                                        'bg-red-600/20 text-red-400 border-red-600/30'
                                    } text-xs mt-1`}>
                                        {transaction.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Top Creator Earnings */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-foreground">Top Creator Earnings</h3>
                        <Button className="bg-white/10 hover:bg-white/20 text-foreground text-xs">
                            View All
                        </Button>
                    </div>
                    <div className="space-y-3">
                        {stats.topCreatorEarnings.map((creator, index) => (
                            <div
                                key={creator.id}
                                className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-foreground font-bold">
                                            {creator.name[0].toUpperCase()}
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-foreground border-2 border-gray-900">
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                                            {creator.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Category {creator.category}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-400">
                                        {formatPrice(creator.earnings)}
                                    </p>
                                    <div className={`flex items-center justify-end gap-1 text-xs font-semibold mt-1 ${
                                        creator.growth >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {creator.growth >= 0 ? (
                                            <TrendingUp className="w-3 h-3" />
                                        ) : (
                                            <TrendingDown className="w-3 h-3" />
                                        )}
                                        {Math.abs(creator.growth)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6"
                >
                    <Clock className="w-8 h-8 text-purple-400 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">Pending Payouts</h3>
                    <p className="text-3xl font-bold text-foreground mb-2">
                        {stats.overview.pendingPayouts}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Awaiting processing
                    </p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-foreground">
                        Process Payouts
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6"
                >
                    <AlertCircle className="w-8 h-8 text-orange-400 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">Churn Rate</h3>
                    <p className="text-3xl font-bold text-foreground mb-2">
                        {stats.overview.churnRate}%
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Monthly subscription cancellations
                    </p>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-foreground">
                        View Analytics
                    </Button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-green-500/30 rounded-2xl p-6"
                >
                    <FileText className="w-8 h-8 text-green-400 mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">Tax Reports</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Generate comprehensive tax and financial reports
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-foreground mt-4">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Report
                    </Button>
                </motion.div>
            </div>
        </div>
    )
}
