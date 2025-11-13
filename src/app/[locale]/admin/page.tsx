'use client'

import { useEffect, useState } from 'react'
import {
    Users,
    UserCheck,
    BookOpen,
    CreditCard,
    DollarSign,
    TrendingUp,
    Clock,
    AlertCircle
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/utils'

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
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const locale = useLocale()
    const router = useRouter()
    const t = useTranslations('admin')

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
            <div className="animate-pulse">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white overflow-hidden shadow rounded-lg h-32"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                        <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                </div>
            </div>
        )
    }

    if (!stats) return null

    const statCards = [
        {
            title: 'Total Users',
            value: stats.overview.totalUsers.toLocaleString(),
            icon: Users,
            change: `+${stats.overview.userGrowthPercentage}%`,
            changeType: stats.overview.userGrowthPercentage >= 0 ? 'positive' : 'negative'
        },
        {
            title: 'Creators',
            value: stats.overview.totalCreators.toLocaleString(),
            icon: UserCheck,
            subtitle: `${stats.pending.kycApplications} pending KYC`
        },
        {
            title: 'Courses',
            value: stats.overview.totalCourses.toLocaleString(),
            icon: BookOpen,
            subtitle: `${stats.pending.contentReviews} pending review`
        },
        {
            title: 'Active Subscriptions',
            value: stats.overview.totalSubscriptions.toLocaleString(),
            icon: CreditCard,
        },
        {
            title: 'Monthly Revenue',
            value: formatPrice(stats.overview.monthlyRevenue),
            icon: DollarSign,
            subtitle: 'Current month'
        }
    ]

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Platform overview and key metrics
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                            {stat.title}
                                        </dt>
                                        <dd className="flex items-baseline">
                                            <div className="text-2xl font-semibold text-gray-900">
                                                {stat.value}
                                            </div>
                                            {stat.change && (
                                                <div className={`ml-2 flex items-baseline text-sm font-semibold ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    <TrendingUp className="self-center flex-shrink-0 h-4 w-4" />
                                                    <span className="sr-only">
                                                        {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by
                                                    </span>
                                                    {stat.change}
                                                </div>
                                            )}
                                        </dd>
                                        {stat.subtitle && (
                                            <dd className="text-xs text-gray-500 mt-1">
                                                {stat.subtitle}
                                            </dd>
                                        )}
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Recent Users
                        </h3>
                        <div className="space-y-3">
                            {stats.recentActivity.users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'CREATOR' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Creators */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Recent Creator Applications
                        </h3>
                        <div className="space-y-3">
                            {stats.recentActivity.creators.map((creator) => (
                                <div key={creator.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{creator.user.name}</p>
                                        <p className="text-sm text-gray-500">{creator.user.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${creator.kycStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                            creator.kycStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {creator.kycStatus}
                                        </span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(creator.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Quick Actions
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => router.push(`/${locale}/admin/creators`)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Clock className="h-4 w-4 mr-2" />
                            Review KYC ({stats.pending.kycApplications})
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/admin/courses/review`)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                            <BookOpen className="h-4 w-4 mr-2" />
                            Review Content ({stats.pending.contentReviews})
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/admin/users`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/admin/analytics`)}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <DollarSign className="h-4 w-4 mr-2" />
                            View Financial Reports
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}