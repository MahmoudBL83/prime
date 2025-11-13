'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface LineChartProps {
    data: number[]
    labels: string[]
    label?: string
    color?: string
    height?: number
    showGrid?: boolean
    showDots?: boolean
}

export default function LineChart({
    data,
    labels,
    label = 'Data',
    color = '#8b5cf6',
    height = 200,
    showGrid = true,
    showDots = true
}: LineChartProps) {
    const chartData = useMemo(() => {
        if (data.length === 0) return null

        const maxValue = Math.max(...data, 1)
        const minValue = Math.min(...data, 0)
        const range = maxValue - minValue || 1

        const points = data.map((value, index) => {
            const x = (index / (data.length - 1 || 1)) * 100
            const y = 100 - ((value - minValue) / range) * 100
            return { x, y, value, label: labels[index] || `Point ${index + 1}` }
        })

        // Create SVG path
        const pathD = points
            .map((point, index) => {
                const command = index === 0 ? 'M' : 'L'
                return `${command} ${point.x} ${point.y}`
            })
            .join(' ')

        // Create area path (for gradient fill)
        const areaPathD = `${pathD} L 100 100 L 0 100 Z`

        return { points, pathD, areaPathD, maxValue, minValue }
    }, [data, labels])

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

    const { points, pathD, areaPathD, maxValue, minValue } = chartData

    return (
        <div className="relative" style={{ height: height + 60 }}>
            {/* Chart Container */}
            <svg
                viewBox="0 0 100 100"
                className="w-full overflow-visible"
                style={{ height }}
                preserveAspectRatio="none"
            >
                {/* Grid Lines */}
                {showGrid && (
                    <g className="opacity-20">
                        {[0, 25, 50, 75, 100].map(y => (
                            <line
                                key={y}
                                x1="0"
                                y1={y}
                                x2="100"
                                y2={y}
                                stroke="currentColor"
                                strokeWidth="0.5"
                                className="text-muted-foreground"
                            />
                        ))}
                    </g>
                )}

                {/* Gradient Fill */}
                <defs>
                    <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area */}
                <motion.path
                    d={areaPathD}
                    fill={`url(#gradient-${label})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                />

                {/* Line */}
                <motion.path
                    d={pathD}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: 'easeInOut' }}
                    vectorEffect="non-scaling-stroke"
                />

                {/* Data Points */}
                {showDots && points.map((point, index) => (
                    <g key={index}>
                        <motion.circle
                            cx={point.x}
                            cy={point.y}
                            r="1.5"
                            fill={color}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.05, duration: 0.3 }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Hover Area */}
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            fill="transparent"
                            className="hover:fill-white/10 cursor-pointer transition-all"
                            vectorEffect="non-scaling-stroke"
                        >
                            <title>{`${point.label}: ${point.value}`}</title>
                        </circle>
                    </g>
                ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-2 px-2">
                {labels.map((label, index) => {
                    // Show only first, middle, and last labels on small screens
                    const showLabel = index === 0 || index === labels.length - 1 || index === Math.floor(labels.length / 2)
                    return (
                        <div
                            key={index}
                            className={`text-xs text-muted-foreground ${showLabel ? '' : 'hidden md:block'}`}
                            style={{ flex: 1, textAlign: index === 0 ? 'left' : index === labels.length - 1 ? 'right' : 'center' }}
                        >
                            {label.split('-').slice(1).join('/')}
                        </div>
                    )
                })}
            </div>

            {/* Y-Axis Reference */}
            <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-muted-foreground pointer-events-none">
                <span>{maxValue.toLocaleString()}</span>
            </div>
            <div className="absolute bottom-12 left-0 right-0 flex justify-between text-xs text-muted-foreground pointer-events-none">
                <span>{minValue.toLocaleString()}</span>
            </div>
        </div>
    )
}
