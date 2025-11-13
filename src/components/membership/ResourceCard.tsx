'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    FileText,
    Video,
    Music,
    Image as ImageIcon,
    File,
    Download,
    Edit,
    Trash2,
    MoreVertical,
    ExternalLink
} from 'lucide-react'
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

interface ResourceCardProps {
    resource: Resource
    channelId: string
    tierId: string
    isCreator?: boolean
    onEdit?: (resource: Resource) => void
    onDelete?: () => void
    onDownload?: () => void
}

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    PDF: { icon: FileText, color: 'text-red-400', bg: 'bg-red-500/20' },
    VIDEO: { icon: Video, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    AUDIO: { icon: Music, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    IMAGE: { icon: ImageIcon, color: 'text-green-400', bg: 'bg-green-500/20' },
    WORKBOOK: { icon: File, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    TEMPLATE: { icon: File, color: 'text-pink-400', bg: 'bg-pink-500/20' },
    OTHER: { icon: File, color: 'text-muted-foreground', bg: 'bg-background0/20' }
}

export default function ResourceCard({
    resource,
    channelId,
    tierId,
    isCreator = false,
    onEdit,
    onDelete,
    onDownload
}: ResourceCardProps) {
    const [showMenu, setShowMenu] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const config = typeConfig[resource.type] || typeConfig.OTHER
    const Icon = config.icon

    const formatFileSize = (bytes?: number | null) => {
        if (!bytes) return 'Unknown size'
        const mb = bytes / 1024 / 1024
        if (mb > 1) return `${mb.toFixed(2)} MB`
        const kb = bytes / 1024
        return `${kb.toFixed(2)} KB`
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const handleDownload = async () => {
        try {
            setDownloading(true)

            // Track download
            const response = await fetch(
                `/api/channels/${channelId}/tiers/${tierId}/resources/${resource.id}/download`,
                { method: 'POST' }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to download')
            }

            // Open file in new tab (in production, this would trigger actual download)
            window.open(resource.fileUrl, '_blank')

            toast.success('Download started!')
            onDownload?.()
        } catch (error: any) {
            console.error('Error downloading:', error)
            toast.error(error.message || 'Failed to download')
        } finally {
            setDownloading(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)

            const response = await fetch(
                `/api/channels/${channelId}/tiers/${tierId}/resources/${resource.id}`,
                { method: 'DELETE' }
            )

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete')
            }

            toast.success('Resource deleted successfully!')
            onDelete?.()
        } catch (error: any) {
            console.error('Error deleting:', error)
            toast.error(error.message || 'Failed to delete')
        } finally {
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-purple-900/10 border border-border rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group"
        >
            {/* Type Badge */}
            <div className="absolute top-3 left-3 z-10">
                <div className={`px-3 py-1 ${config.bg} border border-border rounded-full backdrop-blur-sm`}>
                    <span className={`text-xs font-semibold ${config.color}`}>
                        {resource.type}
                    </span>
                </div>
            </div>

            {/* Actions Menu */}
            {isCreator && (
                <div className="absolute top-3 right-3 z-10">
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 bg-gray-900/80 hover:bg-card border border-border rounded-lg backdrop-blur-sm transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>

                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
                            >
                                <button
                                    onClick={() => {
                                        onEdit?.(resource)
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-card transition-colors flex items-center gap-3"
                                >
                                    <Edit className="w-4 h-4 text-blue-400" />
                                    <span className="text-sm text-foreground">Edit Details</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(true)
                                        setShowMenu(false)
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-card transition-colors flex items-center gap-3 border-t border-border"
                                >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-foreground">Delete</span>
                                </button>
                            </motion.div>
                        )}
                    </div>
                </div>
            )}

            {/* Icon Section */}
            <div className={`flex items-center justify-center h-40 ${config.bg} border-b border-border`}>
                <Icon className={`w-16 h-16 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                {/* Title */}
                <div>
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                        {resource.title}
                    </h3>
                    {resource.titleAr && (
                        <p className="text-sm text-muted-foreground line-clamp-1" dir="rtl">
                            {resource.titleAr}
                        </p>
                    )}
                </div>

                {/* Description */}
                {resource.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                    </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <Download className="w-3.5 h-3.5" />
                            <span>{resource.downloadCount}</span>
                        </div>
                        <div>{formatFileSize(resource.fileSize)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {formatDate(resource.createdAt)}
                    </div>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                    {downloading ? (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <Download className="w-4 h-4" />
                            </motion.div>
                            Downloading...
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download
                        </>
                    )}
                </button>
            </div>

            {/* Delete Confirmation Overlay */}
            {showDeleteConfirm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center p-6 z-20"
                >
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground mb-1">Delete Resource?</h4>
                            <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-card hover:bg-gray-700 text-foreground rounded-lg transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-foreground rounded-lg transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
