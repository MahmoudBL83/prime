'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Upload,
    FileText,
    Download,
    Loader2,
    Filter,
    Search,
    ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import ResourceUploadModal from '@/components/membership/ResourceUploadModal'
import ResourceCard from '@/components/membership/ResourceCard'
import { toast } from 'react-hot-toast'

interface Resource {
    id: string
    title: string
    titleAr?: string | null
    description?: string | null
    descriptionAr?: string | null
    type: string
    fileUrl: string
    fileName: string
    fileSize?: number | null
    downloadCount: number
    createdAt: string
}

interface Stats {
    totalResources: number
    totalDownloads: number
    typeBreakdown: Record<string, number>
}

interface PageProps {
    params: Promise<{
        channelId: string
        tierId: string
    }>
}

const resourceTypes = ['ALL', 'PDF', 'VIDEO', 'AUDIO', 'IMAGE', 'WORKBOOK', 'TEMPLATE', 'OTHER']

export default function ResourceLibraryPage({ params }: PageProps) {
    const router = useRouter()
    const [channelId, setChannelId] = useState<string>('')
    const [tierId, setTierId] = useState<string>('')
    const [resources, setResources] = useState<Resource[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState('ALL')
    const [showUploadModal, setShowUploadModal] = useState(false)

    useEffect(() => {
        params.then(p => {
            setChannelId(p.channelId)
            setTierId(p.tierId)
        })
    }, [params])

    useEffect(() => {
        if (channelId && tierId) {
            fetchResources()
        }
    }, [channelId, tierId, filterType])

    const fetchResources = async () => {
        try {
            setLoading(true)
            const url = new URL(`/api/channels/${channelId}/tiers/${tierId}/resources`, window.location.origin)
            if (filterType !== 'ALL') {
                url.searchParams.set('type', filterType)
            }

            const response = await fetch(url.toString())
            if (!response.ok) throw new Error('Failed to fetch resources')

            const data = await response.json()
            setResources(data.resources)
            setStats(data.stats)
        } catch (error) {
            console.error('Error fetching resources:', error)
            toast.error('Failed to load resources')
        } finally {
            setLoading(false)
        }
    }

    const filteredResources = resources

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <FileText className="w-8 h-8 text-purple-400" />
                                </div>
                                Resource Library
                            </h1>
                            <p className="text-gray-400 mt-1">
                                Manage exclusive content for your tier members
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all flex items-center gap-2 font-medium shadow-lg shadow-purple-500/25"
                    >
                        <Upload className="w-5 h-5" />
                        Upload Resource
                    </button>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Resources */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-300 font-medium mb-1">Total Resources</p>
                                    <p className="text-3xl font-bold text-white">{stats.totalResources}</p>
                                </div>
                                <div className="p-3 bg-blue-500/20 rounded-xl">
                                    <FileText className="w-8 h-8 text-blue-400" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Total Downloads */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-300 font-medium mb-1">Total Downloads</p>
                                    <p className="text-3xl font-bold text-white">{stats.totalDownloads}</p>
                                </div>
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <Download className="w-8 h-8 text-purple-400" />
                                </div>
                            </div>
                        </motion.div>

                        {/* File Types */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-6"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-sm text-green-300 font-medium">File Types</p>
                                <Filter className="w-5 h-5 text-green-400" />
                            </div>
                            <div className="space-y-2">
                                {Object.entries(stats.typeBreakdown).slice(0, 3).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">{type}</span>
                                        <span className="text-white font-semibold">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                            {resourceTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                        filterType === type
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Resources Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : filteredResources.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-10 h-10 text-gray-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">No Resources Yet</h3>
                        <p className="text-gray-400 mb-6 max-w-md mx-auto">
                            {filterType === 'ALL'
                                ? 'Upload your first exclusive resource for tier members'
                                : `No ${filterType} resources found. Try a different filter.`}
                        </p>
                        {filterType === 'ALL' && (
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all inline-flex items-center gap-2 font-medium"
                            >
                                <Upload className="w-5 h-5" />
                                Upload First Resource
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map(resource => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                channelId={channelId}
                                tierId={tierId}
                                isCreator={true}
                                onDelete={fetchResources}
                                onDownload={fetchResources}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <ResourceUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                channelId={channelId}
                tierId={tierId}
                onSuccess={fetchResources}
            />
        </div>
    )
}
