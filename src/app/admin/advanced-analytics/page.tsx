'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart3,
    TrendingUp,
    Users,
    DollarSign,
    Calendar,
    Download,
    RefreshCw,
    Filter,
    PieChart,
    Activity
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function AdvancedAnalyticsPage() {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [timeRange, setTimeRange] = useState('30d')

    const handleRefresh = async () => {
        setIsRefreshing(true)
        // Simulate refresh
        setTimeout(() => setIsRefreshing(false), 2000)
    }

    const handleExport = () => {
        // Simulate export
        console.log('Exporting advanced analytics...')
    }

    const analytics = [
        {
            title: 'User Behavior Analysis',
            description: 'Deep dive into user engagement patterns',
            icon: Users,
            metrics: ['Session Duration', 'Feature Usage', 'Drop-off Points']
        },
        {
            title: 'Revenue Forecasting',
            description: 'Predict future revenue based on trends',
            icon: DollarSign,
            metrics: ['MRR Growth', 'Churn Prediction', 'LTV Analysis']
        },
        {
            title: 'Cohort Analysis',
            description: 'Track user groups over time',
            icon: PieChart,
            metrics: ['Retention Rates', 'Cohort Performance', 'Lifetime Value']
        },
        {
            title: 'Conversion Funnels',
            description: 'Analyze conversion rates across user journeys',
            icon: TrendingUp,
            metrics: ['Signup Flow', 'Purchase Flow', 'Onboarding Completion']
        },
        {
            title: 'Custom Reports',
            description: 'Build custom analytics reports',
            icon: BarChart3,
            metrics: ['Report Builder', 'Scheduled Reports', 'Data Export']
        },
        {
            title: 'Real-time Monitoring',
            description: 'Live system and user activity monitoring',
            icon: Activity,
            metrics: ['Active Users', 'System Performance', 'Error Rates']
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
                        Advanced Analytics
                    </h1>
                    <p className="text-muted-foreground">
                        Deep insights and predictive analytics for data-driven decisions
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleExport}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </motion.div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics.map((item, index) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center">
                                <item.icon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {item.metrics.map((metric, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span className="text-sm text-muted-foreground">{metric}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Key Metrics */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-foreground mb-6">Key Performance Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-2">94.2%</div>
                        <div className="text-sm text-muted-foreground">User Retention Rate</div>
                        <div className="text-xs text-green-400 mt-1">+2.1% from last month</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-2">$127</div>
                        <div className="text-sm text-muted-foreground">Average Revenue Per User</div>
                        <div className="text-xs text-green-400 mt-1">+8.5% from last month</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-2">23.4%</div>
                        <div className="text-sm text-muted-foreground">Churn Rate</div>
                        <div className="text-xs text-red-400 mt-1">-1.2% from last month</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-2">4.7</div>
                        <div className="text-sm text-muted-foreground">Average Session Duration</div>
                        <div className="text-xs text-green-400 mt-1">+0.3 from last month</div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}