'use client'

import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    change?: number
    icon: LucideIcon
    color: string
    gradient: string
    delay?: number
}

export default function StatCard({
    title,
    value,
    change,
    icon: Icon,
    color,
    gradient,
    delay = 0
}: StatCardProps) {
    const getTrendIcon = () => {
        if (change === undefined || change === null) return null
        if (change > 0) return <TrendingUp className="w-4 h-4" />
        if (change < 0) return <TrendingDown className="w-4 h-4" />
        return <Minus className="w-4 h-4" />
    }

    const getTrendColor = () => {
        if (change === undefined || change === null) return 'text-muted-foreground'
        if (change > 0) return 'text-green-400'
        if (change < 0) return 'text-red-400'
        return 'text-muted-foreground'
    }

    const getTrendText = () => {
        if (change === undefined || change === null) return ''
        const sign = change > 0 ? '+' : ''
        return `${sign}${change}%`
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={`relative bg-gradient-to-br ${gradient} border ${color} rounded-xl p-6 overflow-hidden group hover:scale-105 transition-transform`}
        >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>

            {/* Content */}
            <div className="relative flex items-center justify-between">
                <div className="flex-1">
                    <p className={`text-sm font-medium mb-2 ${color.replace('border-', 'text-')}`}>
                        {title}
                    </p>
                    <motion.p
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: delay + 0.2, duration: 0.3 }}
                        className="text-3xl font-bold text-foreground mb-2"
                    >
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </motion.p>
                    {change !== undefined && change !== null && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: delay + 0.4 }}
                            className={`flex items-center gap-1 text-sm font-semibold ${getTrendColor()}`}
                        >
                            {getTrendIcon()}
                            <span>{getTrendText()}</span>
                            <span className="text-xs text-muted-foreground ml-1">vs last period</span>
                        </motion.div>
                    )}
                </div>

                {/* Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: delay + 0.3, type: 'spring', stiffness: 200 }}
                    className={`p-4 bg-white/10 rounded-xl group-hover:scale-110 transition-transform`}
                >
                    <Icon className={`w-8 h-8 ${color.replace('border-', 'text-')}`} />
                </motion.div>
            </div>

            {/* Shine Effect on Hover */}
            <motion.div
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
        </motion.div>
    )
}
