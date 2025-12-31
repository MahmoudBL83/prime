'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Megaphone,
    Mail,
    Target,
    TrendingUp,
    Users,
    Gift,
    BarChart3,
    Send,
    RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function MarketingToolsPage() {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const router = useRouter()

    const tools = [
        {
            title: 'Email Campaigns',
            description: 'Create and manage email marketing campaigns',
            icon: Mail,
            href: '/admin/marketing-tools/email-campaigns',
            status: 'available'
        },
        {
            title: 'A/B Testing',
            description: 'Run A/B tests on features and content',
            icon: Target,
            href: '/admin/marketing-tools/ab-testing',
            status: 'beta'
        },
        {
            title: 'User Segmentation',
            description: 'Create user segments for targeted marketing',
            icon: Users,
            href: '/admin/marketing-tools/user-segmentation',
            status: 'available'
        },
        {
            title: 'Promotional Codes',
            description: 'Manage discount codes and promotions',
            icon: Gift,
            href: '/admin/marketing-tools/promotional-codes',
            status: 'available'
        },
        {
            title: 'Referral Program',
            description: 'Configure and monitor referral incentives',
            icon: TrendingUp,
            href: '/admin/marketing-tools/referrals',
            status: 'planned'
        },
        {
            title: 'Campaign Analytics',
            description: 'Track performance of marketing campaigns',
            icon: BarChart3,
            href: '/admin/marketing-tools/analytics',
            status: 'available'
        }
    ]

    const handleRefresh = async () => {
        setIsRefreshing(true)
        // Simulate refresh
        setTimeout(() => setIsRefreshing(false), 2000)
    }

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
                        Marketing Tools
                    </h1>
                    <p className="text-muted-foreground">
                        Grow your platform with advanced marketing capabilities
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="bg-white/10 hover:bg-white/20 text-foreground"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </motion.div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                    <motion.div
                        key={tool.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => tool.status === 'available' && router.push(tool.href)}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tool.status === 'available'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                                }`}>
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <Badge variant={tool.status === 'available' ? 'default' : (tool.status === 'beta' ? 'outline' : 'secondary')}>
                                {tool.status === 'available' ? 'Available' : (tool.status === 'beta' ? 'Beta' : 'Planned')}
                            </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            {tool.title}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            {tool.description}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-foreground mb-4">Marketing Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">1,234</div>
                        <div className="text-sm text-muted-foreground">Active Campaigns</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">89%</div>
                        <div className="text-sm text-muted-foreground">Email Open Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">456</div>
                        <div className="text-sm text-muted-foreground">New Signups</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">$12,345</div>
                        <div className="text-sm text-muted-foreground">Revenue Generated</div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}