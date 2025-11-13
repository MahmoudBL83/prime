'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface BarChartProps {
    data: number[]
    labels: string[]
    colors?: string[]
    height?: number
    showValues?: boolean
}

export default function BarChart({
    data,
    labels,
    colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'],
    height = 200,
    showValues = true
}: BarChartProps) {
    const chartData = useMemo(() => {
        if (data.length === 0) return null

        const maxValue = Math.max(...data, 1)

        const bars = data.map((value, index) => {
            const heightPercent = (value / maxValue) * 100
            const color = colors[index % colors.length]
            return {
                value,
                heightPercent,
                color,
                label: labels[index] || `Bar ${index + 1}`
            }
        })

        return { bars, maxValue }
    }, [data, labels, colors])

    if (!chartData || data.length === 0) {
        return (
            <div
                className="flex items-center justify-center bg-gray-800/30 rounded-xl border border-border"
                style={{ height }}
            >
                <p className="text-muted-foreground text-sm">No data available</p>
            </div>
        )
    }

    const { bars, maxValue } = chartData

    return (
        <div className="space-y-3" style={{ minHeight: height }}>
            {/* Bars */}
            <div className="flex items-end justify-between gap-4" style={{ height }}>
                {bars.map((bar, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        {/* Value Label */}
                        {showValues && bar.value > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="text-xs font-semibold text-foreground"
                            >
                                {bar.value.toLocaleString()}
                            </motion.div>
                        )}

                        {/* Bar */}
                        <div className="w-full relative group">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${bar.heightPercent}%` }}
                                transition={{
                                    duration: 0.8,
                                    delay: index * 0.1,
                                    ease: [0.4, 0, 0.2, 1]
                                }}
                                className="w-full rounded-t-lg relative overflow-hidden"
                                style={{
                                    backgroundColor: bar.color,
                                    minHeight: bar.value > 0 ? '8px' : '0'
                                }}
                            >
                                {/* Shimmer effect */}
                                <motion.div
                                    initial={{ x: '-100%' }}
                                    animate={{ x: '100%' }}
                                    transition={{
                                        duration: 1.5,
                                        delay: 0.5 + index * 0.1,
                                        ease: 'easeInOut'
                                    }}
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                            </motion.div>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <div className="bg-background text-foreground text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl border border-border">
                                    <div className="font-semibold">{bar.label}</div>
                                    <div className="text-muted-foreground">{bar.value.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Labels */}
            <div className="flex justify-between gap-4">
                {bars.map((bar, index) => (
                    <div
                        key={index}
                        className="flex-1 text-center"
                    >
                        <div className="text-xs text-muted-foreground truncate">
                            {bar.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Max Value Reference */}
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Max: {maxValue.toLocaleString()}</span>
            </div>
        </div>
    )
}
