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
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-foreground">
                            Delete User
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isDeleting}
                        className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-card-hover rounded-lg disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4">
                        <p className="text-foreground mb-2">
                            You are about to permanently delete the following user:
                        </p>
                        <div className="bg-background rounded-lg p-3">
                            <p className="font-medium text-foreground">{userName}</p>
                            <p className="text-sm text-muted-foreground">{userEmail}</p>
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="text-sm font-medium text-red-800 mb-1">
                                    Warning: This action cannot be undone
                                </h4>
                                <ul className="text-sm text-red-700 space-y-1">
                                    <li>• All user data will be permanently deleted</li>
                                    <li>• Course enrollments and progress will be lost</li>
                                    <li>• Creator content and earnings data will be removed</li>
                                    <li>• Payment history will be deleted</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            To confirm deletion, type <span className="font-mono bg-muted px-1 rounded">DELETE</span> in the field below:
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            disabled={isDeleting}
                            className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-background disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={confirmText !== 'DELETE' || isDeleting}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Deleting...
                                </div>
                            ) : (
                                'Delete User'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
