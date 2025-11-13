'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'

interface AnalyticsCardProps {
    title: string
    value: string | number
    trend?: number // percentage change
    icon: LucideIcon
    iconColor: string
    iconBgColor: string
    subtitle?: string
    loading?: boolean
}

export default function AnalyticsCard({
    title,
    value,
    trend,
    icon: Icon,
    iconColor,
    iconBgColor,
    subtitle,
    loading = false
}: AnalyticsCardProps) {
    
    const getTrendColor = () => {
        if (!trend || trend === 0) return 'text-muted-foreground'
        return trend > 0 ? 'text-green-500' : 'text-red-500'
    }

    const getTrendIcon = () => {
        if (!trend || trend === 0) return Minus
        return trend > 0 ? TrendingUp : TrendingDown
    }

    const TrendIcon = getTrendIcon()

    if (loading) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="w-24 h-4 bg-card rounded" />
                        <div className="w-12 h-12 bg-card rounded-lg" />
                    </div>
                    <div className="w-32 h-8 bg-card rounded" />
                    <div className="w-20 h-4 bg-card rounded" />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6 hover:border-purple-500/50 transition-all group"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{title}</p>
                </div>
                <div
                    className={`flex items-center justify-center w-12 h-12 rounded-lg ${iconBgColor} transition-transform group-hover:scale-110`}
                >
                    <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>
            </div>

            {/* Value */}
            <div className="mb-3">
                <h3 className="text-3xl font-bold text-foreground">
                    {value}
                </h3>
            </div>

            {/* Trend & Subtitle */}
            <div className="flex items-center justify-between">
                {trend !== undefined && (
                    <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                            {trend > 0 ? '+' : ''}{trend}%
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">vs last period</span>
                    </div>
                )}
                {subtitle && !trend && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>
        </motion.div>
    )
}
