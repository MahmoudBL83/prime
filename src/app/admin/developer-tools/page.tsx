'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Code,
    Database,
    Webhook,
    Key,
    Server,
    AlertTriangle,
    CheckCircle,
    RefreshCw,
    Download,
    Upload,
    Settings
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function DeveloperToolsPage() {
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const router = useRouter()

    const handleExportLogs = async () => {
        setIsExporting(true)
        try {
            const response = await fetch('/api/admin/developer-tools/export-logs', {
                method: 'POST'
            })
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            } else {
                throw new Error('Failed to export logs')
            }
        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to export system logs')
        } finally {
            setIsExporting(false)
        }
    }

    const handleImportConfig = async () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json,.yaml,.yml'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return

            setIsImporting(true)
            try {
                const formData = new FormData()
                formData.append('config', file)

                const response = await fetch('/api/admin/developer-tools/import-config', {
                    method: 'POST',
                    body: formData
                })

                if (response.ok) {
                    alert('Configuration imported successfully')
                } else {
                    throw new Error('Failed to import configuration')
                }
            } catch (error) {
                console.error('Import failed:', error)
                alert('Failed to import configuration')
            } finally {
                setIsImporting(false)
            }
        }
        input.click()
    }

    const handleSystemSettings = () => {
        router.push('/admin/settings')
    }

    const tools = [
        {
            title: 'API Keys Management',
            description: 'Manage API keys for external integrations',
            icon: Key,
            href: '/admin/developer-tools/api-keys',
            status: 'available'
        },
        {
            title: 'Webhook Configuration',
            description: 'Configure webhooks for real-time notifications',
            icon: Webhook,
            href: '/admin/developer-tools/webhooks',
            status: 'available'
        },
        {
            title: 'System Health Monitor',
            description: 'Monitor system performance and health metrics',
            icon: Server,
            href: '/admin/developer-tools/health',
            status: 'available'
        },
        {
            title: 'Database Tools',
            description: 'Database maintenance and query tools',
            icon: Database,
            href: '/admin/developer-tools/database',
            status: 'coming_soon'
        },
        {
            title: 'Cache Management',
            description: 'Manage Redis cache and clear cache entries',
            icon: RefreshCw,
            href: '/admin/developer-tools/cache',
            status: 'coming_soon'
        },
        {
            title: 'Error Tracking',
            description: 'View and manage application errors',
            icon: AlertTriangle,
            href: '/admin/developer-tools/errors',
            status: 'coming_soon'
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
                        Developer Tools
                    </h1>
                    <p className="text-muted-foreground">
                        Advanced tools for system administration and development
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
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                tool.status === 'available'
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                                <tool.icon className="w-6 h-6" />
                            </div>
                            <Badge variant={tool.status === 'available' ? 'default' : 'secondary'}>
                                {tool.status === 'available' ? 'Available' : 'Coming Soon'}
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

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6"
            >
                <h3 className="text-xl font-bold text-foreground mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                        onClick={handleExportLogs}
                        disabled={isExporting}
                        className="bg-white/10 hover:bg-white/20 text-foreground justify-start"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {isExporting ? 'Exporting...' : 'Export System Logs'}
                    </Button>
                    <Button 
                        onClick={handleImportConfig}
                        disabled={isImporting}
                        className="bg-white/10 hover:bg-white/20 text-foreground justify-start"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        {isImporting ? 'Importing...' : 'Import Configuration'}
                    </Button>
                    <Button 
                        onClick={handleSystemSettings}
                        className="bg-white/10 hover:bg-white/20 text-foreground justify-start"
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        System Settings
                    </Button>
                </div>
            </motion.div>
        </div>
    )
}