'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'
import { DollarSign, TrendingUp } from 'lucide-react'

interface RevenueChartProps {
    data: Array<{
        period: string
        revenue: number
        enrollments: number
    }>
    period: '30d' | '90d' | '1y' | 'all'
    onPeriodChange: (period: '30d' | '90d' | '1y' | 'all') => void
    totalRevenue: number
    trend: number
    loading?: boolean
}

export default function RevenueChart({
    data,
    period,
    onPeriodChange,
    totalRevenue,
    trend,
    loading = false
}: RevenueChartProps) {
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value)
    }

    const periods: Array<{ value: '30d' | '90d' | '1y' | 'all', label: string }> = [
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
        { value: '1y', label: '1 Year' },
        { value: 'all', label: 'All Time' }
    ]

    if (loading) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-32 bg-card rounded" />
                    <div className="h-64 bg-card rounded" />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground flex items-center space-x-2 mb-2">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <span>Revenue Overview</span>
                    </h3>
                    <div className="flex items-center space-x-3">
                        <p className="text-3xl font-bold text-foreground">
                            {formatCurrency(totalRevenue)}
                        </p>
                        {trend !== 0 && (
                            <div className={`flex items-center space-x-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                    {trend > 0 ? '+' : ''}{trend}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Period Selector */}
                <div className="flex items-center space-x-2 bg-gray-800/50 rounded-lg p-1">
                    {periods.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => onPeriodChange(p.value)}
                            className={`
                                px-4 py-2 rounded-md text-sm font-medium transition-all
                                ${period === p.value
                                    ? 'bg-purple-600 text-foreground shadow-lg'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-gray-700'
                                }
                            `}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-80">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#374151"
                                opacity={0.3}
                            />
                            <XAxis
                                dataKey="period"
                                stroke="#9CA3AF"
                                style={{ fontSize: '12px' }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                style={{ fontSize: '12px' }}
                                tickLine={false}
                                tickFormatter={(value) => `$${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F2937',
                                    border: '1px solid #374151',
                                    borderRadius: '0.5rem',
                                    color: '#fff'
                                }}
                                formatter={(value: number, name: string) => [
                                    name === 'revenue'
                                        ? formatCurrency(value)
                                        : value,
                                    name === 'revenue' ? 'Revenue' : 'Enrollments'
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <p>No revenue data available for this period</p>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
