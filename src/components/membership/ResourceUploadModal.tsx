'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, File, FileText, Music, Video, Image as ImageIcon, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ResourceUploadModalProps {
    isOpen: boolean
    onClose: () => void
    channelId: string
    tierId: string
    onSuccess?: () => void
}

const resourceTypes = [
    { value: 'PDF', label: 'PDF Document', icon: FileText, accept: '.pdf' },
    { value: 'VIDEO', label: 'Video', icon: Video, accept: 'video/*' },
    { value: 'AUDIO', label: 'Audio', icon: Music, accept: 'audio/*' },
    { value: 'IMAGE', label: 'Image', icon: ImageIcon, accept: 'image/*' },
    { value: 'WORKBOOK', label: 'Workbook', icon: File, accept: '.pdf,.doc,.docx,.xls,.xlsx' },
    { value: 'TEMPLATE', label: 'Template', icon: File, accept: '*' },
    { value: 'OTHER', label: 'Other', icon: File, accept: '*' }
]

export default function ResourceUploadModal({
    isOpen,
    onClose,
    channelId,
    tierId,
    onSuccess
}: ResourceUploadModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [type, setType] = useState('PDF')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (selectedFile) {
            // Validate file size (max 100MB)
            if (selectedFile.size > 100 * 1024 * 1024) {
                toast.error('File size must be less than 100MB')
                return
            }
            setFile(selectedFile)
            // Auto-fill title if empty
            if (!title) {
                setTitle(selectedFile.name.split('.')[0])
            }
        }
    }

    const handleUpload = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title')
            return
        }

        if (!file) {
            toast.error('Please select a file')
            return
        }

        try {
            setLoading(true)
            setUploading(true)
            setUploadProgress(0)

            // Simulate file upload progress
            // TODO: Replace with actual upload to cloud storage (S3, Cloudinary, etc.)
            const uploadSimulation = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(uploadSimulation)
                        return 90
                    }
                    return prev + 10
                })
            }, 200)

            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 2000))
            clearInterval(uploadSimulation)
            setUploadProgress(100)

            // In production, this would be the actual file URL from cloud storage
            const fileUrl = `/uploads/${Date.now()}-${file.name}`

            // Create resource record
            const response = await fetch(`/api/channels/${channelId}/tiers/${tierId}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    description: description || null,
                    type,
                    fileUrl,
                    fileName: file.name,
                    fileSize: file.size
                })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Failed to upload resource')
            }

            toast.success('Resource uploaded successfully!')
            onSuccess?.()
            handleClose()
        } catch (error: any) {
            console.error('Error uploading resource:', error)
            toast.error(error.message || 'Failed to upload resource')
        } finally {
            setLoading(false)
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const handleClose = () => {
        setTitle('')
        setDescription('')
        setType('PDF')
        setFile(null)
        setUploadProgress(0)
        onClose()
    }

    if (!isOpen) return null

    const selectedType = resourceTypes.find(t => t.value === type)
    const Icon = selectedType?.icon || File

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/20 border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Upload className="w-6 h-6 text-purple-400" />
                                </div>
                                Upload Resource
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Add exclusive content for this tier
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="p-2 hover:bg-card rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
                        {/* Resource Type */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-3">
                                Resource Type <span className="text-red-400">*</span>
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {resourceTypes.map(resType => {
                                    const TypeIcon = resType.icon
                                    return (
                                        <button
                                            key={resType.value}
                                            onClick={() => setType(resType.value)}
                                            disabled={loading}
                                            className={`p-4 rounded-xl border-2 transition-all ${type === resType.value
                                                    ? 'border-purple-500 bg-purple-500/10'
                                                    : 'border-border hover:border-gray-600 bg-gray-800/50'
                                                }`}
                                        >
                                            <TypeIcon className={`w-6 h-6 mx-auto mb-2 ${type === resType.value ? 'text-purple-400' : 'text-muted-foreground'
                                                }`} />
                                            <span className={`text-xs font-medium ${type === resType.value ? 'text-foreground' : 'text-muted-foreground'
                                                }`}>
                                                {resType.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                File <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    onChange={handleFileSelect}
                                    accept={selectedType?.accept}
                                    disabled={loading}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className={`flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file
                                            ? 'border-green-500 bg-green-500/10'
                                            : 'border-border hover:border-gray-600 bg-gray-800/50'
                                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {file ? (
                                        <>
                                            <Icon className="w-8 h-8 text-green-400" />
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-foreground">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-8 h-8 text-muted-foreground" />
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-foreground">Click to upload file</p>
                                                <p className="text-xs text-muted-foreground">Max size: 100MB</p>
                                            </div>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Upload Progress */}
                        {uploading && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">Uploading...</span>
                                    <span className="text-sm font-bold text-purple-400">{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${uploadProgress}%` }}
                                        className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Title <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Resource title..."
                                disabled={loading}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                maxLength={200}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Description (Optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of the resource..."
                                disabled={loading}
                                rows={3}
                                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                maxLength={500}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-gray-900/50">
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="px-6 py-2.5 bg-card hover:bg-gray-700 text-foreground rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={loading || !title || !file}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-foreground rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4" />
                                    Upload Resource
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
