'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Users,
    UserCheck,
    BookOpen,
    CreditCard,
    DollarSign,
    TrendingUp,
    Clock,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    Shield,
    Activity,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AdminStats {
    overview: {
        totalUsers: number
        totalCreators: number
        totalCourses: number
        totalSubscriptions: number
        monthlyRevenue: number
        userGrowthPercentage: number
    }
    pending: {
        kycApplications: number
        contentReviews: number
    }
    recentActivity: {
        users: Array<{
            id: string
            name: string
            email: string
            role: string
            createdAt: string
        }>
        creators: Array<{
            id: string
            user: {
                name: string
                email: string
            }
            kycStatus: string
            createdAt: string
        }>
    }
}

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/overview')

            if (!response.ok) {
                throw new Error('Failed to fetch admin stats')
            }

            const data = await response.json()
            setStats(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl h-32"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-600/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-xl"
                >
                    <div className="flex items-start gap-4">
                        <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Error loading dashboard</h3>
                            <div className="text-sm text-red-300">{error}</div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }

    if (!stats) return null

    const statCards = [
        {
            title: 'Total Users',
            value: stats.overview.totalUsers.toLocaleString(),
            icon: Users,
            change: stats.overview.userGrowthPercentage,
            changeType: stats.overview.userGrowthPercentage >= 0 ? 'positive' : 'negative',
            color: 'from-blue-600 to-blue-800',
            iconBg: 'bg-blue-600/20',
            iconColor: 'text-blue-400',
            href: '/admin/users'
        },
        {
            title: 'Creators',
            value: stats.overview.totalCreators.toLocaleString(),
            icon: UserCheck,
            subtitle: `${stats.pending.kycApplications} pending KYC`,
            color: 'from-purple-600 to-purple-800',
            iconBg: 'bg-purple-600/20',
            iconColor: 'text-purple-400',
            href: '/admin/creators'
        },
        {
            title: 'Courses',
            value: stats.overview.totalCourses.toLocaleString(),
            icon: BookOpen,
            subtitle: `${stats.pending.contentReviews} pending review`,
            color: 'from-green-600 to-green-800',
            iconBg: 'bg-green-600/20',
            iconColor: 'text-green-400',
            href: '/admin/content'
        },
        {
            title: 'Subscriptions',
            value: stats.overview.totalSubscriptions.toLocaleString(),
            icon: CreditCard,
            subtitle: 'Active',
            color: 'from-orange-600 to-orange-800',
            iconBg: 'bg-orange-600/20',
            iconColor: 'text-orange-400',
            href: '/admin/financial'
        },
        {
            title: 'Monthly Revenue',
            value: formatPrice(stats.overview.monthlyRevenue),
            icon: DollarSign,
            subtitle: 'Current month',
            color: 'from-red-600 to-pink-600',
            iconBg: 'bg-red-600/20',
            iconColor: 'text-red-400',
            href: '/admin/financial'
        }
    ]

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        Admin Dashboard
                    </h1>
                    <p className="text-gray-400">
                        Platform overview and key metrics • {new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/10">
                        <Activity className="w-4 h-4 mr-2" />
                        Platform Status
                    </Button>
                    <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white">
                        <Shield className="w-4 h-4 mr-2" />
                        Security Center
                    </Button>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => router.push(stat.href)}
                        className={`bg-gradient-to-br ${stat.color}/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer group`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${stat.iconBg} rounded-xl p-3`}>
                                <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                            </div>
                            {stat.change !== undefined && (
                                <div className={`flex items-center gap-1 text-sm font-semibold ${
                                    stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                                }`}>
                                    {stat.changeType === 'positive' ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4" />
                                    )}
                                    {Math.abs(stat.change)}%
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                                {stat.value}
                            </div>
                            <div className="text-sm text-gray-300">{stat.title}</div>
                            {stat.subtitle && (
                                <div className="text-xs text-gray-400 mt-2">
                                    {stat.subtitle}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Pending Actions Alert */}
            {(stats.pending.kycApplications > 0 || stats.pending.contentReviews > 0) && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-6"
                >
                    <div className="flex items-start gap-4">
                        <Clock className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-2">
                                Action Required
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {stats.pending.kycApplications > 0 && (
                                    <Badge className="bg-orange-600/20 text-orange-300 border-orange-500/30 text-sm px-3 py-1">
                                        {stats.pending.kycApplications} KYC Applications Pending
                                    </Badge>
                                )}
                                {stats.pending.contentReviews > 0 && (
                                    <Badge className="bg-red-600/20 text-red-300 border-red-500/30 text-sm px-3 py-1">
                                        {stats.pending.contentReviews} Content Reviews Pending
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                            Review Now
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">
                            Recent Users
                        </h3>
                        <Button className="bg-white/10 hover:bg-white/20 text-white text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            View All
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {stats.recentActivity.users.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {user.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-400">{user.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={`${
                                        user.role === 'CREATOR' 
                                            ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' 
                                            : user.role === 'ADMIN'
                                            ? 'bg-red-600/20 text-red-400 border-red-600/30'
                                            : 'bg-blue-600/20 text-blue-400 border-blue-600/30'
                                    } text-xs`}>
                                        {user.role}
                                    </Badge>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Recent Creators */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">
                            Recent Creator Applications
                        </h3>
                        <Button className="bg-white/10 hover:bg-white/20 text-white text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            View All
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {stats.recentActivity.creators.map((creator, index) => (
                            <motion.div
                                key={creator.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all group cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                                        {creator.user.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">
                                            {creator.user.name}
                                        </p>
                                        <p className="text-xs text-gray-400">{creator.user.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge className={`${
                                        creator.kycStatus === 'VERIFIED' 
                                            ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                                            : creator.kycStatus === 'PENDING'
                                            ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                                            : 'bg-red-600/20 text-red-400 border-red-600/30'
                                    } text-xs flex items-center gap-1`}>
                                        {creator.kycStatus === 'VERIFIED' ? (
                                            <CheckCircle className="w-3 h-3" />
                                        ) : creator.kycStatus === 'PENDING' ? (
                                            <Clock className="w-3 h-3" />
                                        ) : (
                                            <XCircle className="w-3 h-3" />
                                        )}
                                        {creator.kycStatus}
                                    </Badge>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {new Date(creator.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-white mb-6">
                    Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                        onClick={() => router.push('/admin/creators')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white h-auto py-4 flex-col items-start gap-2"
                    >
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            <span className="font-semibold">Review KYC</span>
                        </div>
                        <span className="text-xs text-purple-200">
                            {stats.pending.kycApplications} pending applications
                        </span>
                    </Button>
                    <Button 
                        onClick={() => router.push('/admin/content/reviews')}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-auto py-4 flex-col items-start gap-2"
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            <span className="font-semibold">Review Content</span>
                        </div>
                        <span className="text-xs text-green-200">
                            {stats.pending.contentReviews} pending reviews
                        </span>
                    </Button>
                    <Button 
                        onClick={() => router.push('/admin/users')}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white h-auto py-4 flex-col items-start gap-2"
                    >
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            <span className="font-semibold">Manage Users</span>
                        </div>
                        <span className="text-xs text-blue-200">
                            {stats.overview.totalUsers.toLocaleString()} total users
                        </span>
                    </Button>
                    <Button 
                        onClick={() => router.push('/admin/financial')}
                        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white h-auto py-4 flex-col items-start gap-2"
                    >
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            <span className="font-semibold">Financial</span>
                        </div>
                        <span className="text-xs text-orange-200">
                            {formatPrice(stats.overview.monthlyRevenue)} this month
                        </span>
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}
