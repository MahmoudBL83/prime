'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, SwitchCamera, FlipHorizontal, Check, RotateCcw, Loader2 } from 'lucide-react'

interface CameraCaptureProps {
    isOpen: boolean
    onClose: () => void
    onCapture: (imageBlob: Blob, previewUrl: string) => void
    isArabic?: boolean
}

export default function CameraCapture({ isOpen, onClose, onCapture, isArabic = false }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
    const [isMirrored, setIsMirrored] = useState(true)

    const startCamera = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        // Stop existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            })

            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play()
            }

            setIsLoading(false)
        } catch (err) {
            console.error('Camera error:', err)
            setError(isArabic
                ? 'تعذر الوصول إلى الكاميرا. يرجى السماح بالوصول.'
                : 'Could not access camera. Please allow camera access.')
            setIsLoading(false)
        }
    }, [facingMode, isArabic])

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }, [])

    useEffect(() => {
        if (isOpen && !capturedImage) {
            startCamera()
        }

        return () => {
            stopCamera()
        }
    }, [isOpen, startCamera, stopCamera, capturedImage])

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        if (!ctx) return

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Mirror the image if using front camera
        if (isMirrored && facingMode === 'user') {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Reset transformation
        ctx.setTransform(1, 0, 0, 1, 0, 0)

        // Convert to blob
        canvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob)
                setCapturedImage(url)
                setCapturedBlob(blob)
                stopCamera()
            }
        }, 'image/jpeg', 0.9)
    }

    const handleRetake = () => {
        if (capturedImage) {
            URL.revokeObjectURL(capturedImage)
        }
        setCapturedImage(null)
        setCapturedBlob(null)
        startCamera()
    }

    const handleConfirm = () => {
        if (capturedBlob && capturedImage) {
            onCapture(capturedBlob, capturedImage)
            handleClose()
        }
    }

    const handleClose = () => {
        stopCamera()
        if (capturedImage) {
            URL.revokeObjectURL(capturedImage)
        }
        setCapturedImage(null)
        setCapturedBlob(null)
        setError(null)
        onClose()
    }

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
        setCapturedImage(null)
        setCapturedBlob(null)
    }

    const toggleMirror = () => {
        setIsMirrored(prev => !prev)
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-lg mx-4 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-800">
                        <h3 className="text-lg font-semibold text-white">
                            {isArabic ? 'التقاط صورة' : 'Take Photo'}
                        </h3>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Camera View */}
                    <div className="relative aspect-[4/3] bg-black">
                        {isLoading && !capturedImage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                        )}

                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center p-4">
                                <div className="text-center">
                                    <Camera className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                                    <p className="text-gray-400 text-sm">{error}</p>
                                    <button
                                        onClick={startCamera}
                                        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                                    >
                                        {isArabic ? 'إعادة المحاولة' : 'Try Again'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!error && !capturedImage && (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${isMirrored && facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                            />
                        )}

                        {capturedImage && (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Hidden canvas for capture */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Controls */}
                    <div className="p-4 bg-gray-900">
                        {!capturedImage ? (
                            <div className="flex items-center justify-between">
                                {/* Mirror toggle */}
                                <button
                                    onClick={toggleMirror}
                                    className={`p-3 rounded-full transition-colors ${isMirrored
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    title={isArabic ? 'عكس' : 'Mirror'}
                                >
                                    <FlipHorizontal className="w-5 h-5" />
                                </button>

                                {/* Capture button */}
                                <button
                                    onClick={handleCapture}
                                    disabled={isLoading || !!error}
                                    className="p-4 bg-white rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="w-12 h-12 border-4 border-gray-900 rounded-full" />
                                </button>

                                {/* Switch camera */}
                                <button
                                    onClick={toggleCamera}
                                    className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors text-gray-400"
                                    title={isArabic ? 'تبديل الكاميرا' : 'Switch Camera'}
                                >
                                    <SwitchCamera className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-6">
                                {/* Retake button */}
                                <button
                                    onClick={handleRetake}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-white"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                    <span>{isArabic ? 'إعادة التقاط' : 'Retake'}</span>
                                </button>

                                {/* Confirm button */}
                                <button
                                    onClick={handleConfirm}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors text-white"
                                >
                                    <Check className="w-5 h-5" />
                                    <span>{isArabic ? 'استخدام الصورة' : 'Use Photo'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
