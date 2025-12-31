'use client'

import React, { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface UserDeleteModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => Promise<void>
    userName: string
    userEmail: string
}

export default function UserDeleteModal({ isOpen, onClose, onConfirm, userName, userEmail }: UserDeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [confirmText, setConfirmText] = useState('')

    const handleDelete = async () => {
        if (confirmText !== 'DELETE') {
            return
        }

        try {
            setIsDeleting(true)
            await onConfirm()
            onClose()
            setConfirmText('')
        } catch (error) {
            // Error handling is done in parent component
        } finally {
            setIsDeleting(false)
        }
    }

    const handleClose = () => {
        if (!isDeleting) {
            onClose()
            setConfirmText('')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <div className="bg-[#0f0f12]/90 backdrop-blur-2xl rounded-3xl max-w-md w-full border border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/20">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                Delete Account
                            </h2>
                            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mt-0.5">Permanent Action</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-400 text-sm mb-4">
                            You are about to permanently delete this user account. All associated data will be purged.
                        </p>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="font-bold text-white text-lg">{userName}</p>
                            <p className="text-sm text-gray-500">{userEmail}</p>
                        </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-red-300 mb-2">
                                    IRREVERSIBLE CONSEQUENCES:
                                </h4>
                                <ul className="text-xs text-red-200/70 space-y-1.5 list-disc pl-4">
                                    <li>Permanent deletion of all user profile data</li>
                                    <li>Loss of all course enrollments and progress</li>
                                    <li>Removal of creator content and earnings history</li>
                                    <li>Deletion of internal payment records</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-semibold text-gray-400 mb-3">
                            Type <span className="font-mono bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/20">DELETE</span> to authorize:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            disabled={isDeleting}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all disabled:opacity-50"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 border border-white/10 text-gray-400 font-bold rounded-xl hover:bg-white/5 transition-all disabled:opacity-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmText !== 'DELETE' || isDeleting}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                        >
                            {isDeleting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                                    Processing...
                                </div>
                            ) : (
                                'Confirm Deletion'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
