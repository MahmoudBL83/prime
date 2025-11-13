'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    CheckCircle2,
    XCircle,
    Award,
    Calendar,
    BookOpen,
    User,
    GraduationCap,
    Shield,
    ExternalLink
} from 'lucide-react'

interface CertificateData {
    valid: boolean
    certificate?: {
        certificateNumber: string
        studentName: string
        studentNameAr: string | null
        courseName: string
        courseNameAr: string | null
        courseCategory: string
        courseLevel: string
        instructorName: string
        instructorNameAr: string | null
        completionDate: string
        issueDate: string
        grade: string | null
        verificationUrl: string
        thumbnail: string | null
    }
    error?: string
    message?: string
}

export default function VerifyCertificatePage() {
    const params = useParams()
    const [data, setData] = useState<CertificateData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isArabic, setIsArabic] = useState(false)

    useEffect(() => {
        if (params.code) {
            verifyCertificate(params.code as string)
        }
    }, [params.code])

    const verifyCertificate = async (code: string) => {
        try {
            const response = await fetch(`/api/certificates/verify/${code}`)
            const result = await response.json()
            setData(result)
        } catch (error) {
            setData({
                valid: false,
                error: 'Failed to verify certificate'
            })
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4" />
                    <p className="text-xl text-gray-400">Verifying certificate...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Shield className="w-8 h-8 text-purple-500" />
                            <h1 className="text-3xl font-bold text-white">
                                Certificate Verification
                            </h1>
                        </div>
                        <button
                            onClick={() => setIsArabic(!isArabic)}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            {isArabic ? 'English' : 'العربية'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">
                {data?.valid ? (
                    /* Valid Certificate */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Verification Status */}
                        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-xl p-6">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">
                                        ✓ Certificate Verified
                                    </h2>
                                    <p className="text-gray-300">
                                        This is an authentic certificate issued by EduPlatform
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Certificate Details */}
                        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden">
                            {/* Course Thumbnail */}
                            {data.certificate?.thumbnail && (
                                <div className="h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden">
                                    <img
                                        src={data.certificate.thumbnail}
                                        alt={data.certificate.courseName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            <div className="p-8 space-y-6">
                                {/* Certificate Number */}
                                <div className="flex items-center justify-between pb-6 border-b border-gray-800">
                                    <div className="flex items-center space-x-3">
                                        <Award className="w-6 h-6 text-purple-500" />
                                        <span className="text-gray-400">Certificate Number</span>
                                    </div>
                                    <span className="text-xl font-mono font-bold text-purple-400">
                                        {data.certificate?.certificateNumber}
                                    </span>
                                </div>

                                {/* Student Info */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                        <User className="w-5 h-5 text-purple-500" />
                                        <span>Student Information</span>
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800/50 rounded-lg p-4">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Name</p>
                                            <p className="text-white font-semibold">
                                                {data.certificate?.studentName}
                                            </p>
                                        </div>
                                        {data.certificate?.studentNameAr && (
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">Arabic Name</p>
                                                <p className="text-white font-semibold">
                                                    {data.certificate.studentNameAr}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Course Info */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                        <BookOpen className="w-5 h-5 text-purple-500" />
                                        <span>Course Information</span>
                                    </h3>
                                    <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-400 mb-1">Course Title</p>
                                            <p className="text-white font-semibold text-lg">
                                                {isArabic && data.certificate?.courseNameAr
                                                    ? data.certificate.courseNameAr
                                                    : data.certificate?.courseName}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">Category</p>
                                                <span className="inline-block px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                                                    {data.certificate?.courseCategory}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-400 mb-1">Level</p>
                                                <span className="inline-block px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                                                    {data.certificate?.courseLevel}
                                                </span>
                                            </div>
                                            {data.certificate?.grade && (
                                                <div>
                                                    <p className="text-sm text-gray-400 mb-1">Grade</p>
                                                    <span className="inline-block px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-semibold">
                                                        {data.certificate.grade}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Instructor Info */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                        <GraduationCap className="w-5 h-5 text-purple-500" />
                                        <span>Instructor</span>
                                    </h3>
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <p className="text-white font-semibold">
                                            {isArabic && data.certificate?.instructorNameAr
                                                ? data.certificate.instructorNameAr
                                                : data.certificate?.instructorName}
                                        </p>
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="flex items-center space-x-2 text-gray-400 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Completion Date</span>
                                        </div>
                                        <p className="text-white font-semibold">
                                            {data.certificate?.completionDate && formatDate(data.certificate.completionDate)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-800/50 rounded-lg p-4">
                                        <div className="flex items-center space-x-2 text-gray-400 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">Issue Date</span>
                                        </div>
                                        <p className="text-white font-semibold">
                                            {data.certificate?.issueDate && formatDate(data.certificate.issueDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Verification URL */}
                                <div className="pt-6 border-t border-gray-800">
                                    <p className="text-sm text-gray-400 mb-2">Verification URL</p>
                                    <a
                                        href={data.certificate?.verificationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                                    >
                                        <span className="break-all">{data.certificate?.verificationUrl}</span>
                                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Platform Info */}
                        <div className="text-center text-gray-500 text-sm">
                            <p>This certificate was issued by <strong className="text-purple-400">EduPlatform</strong></p>
                            <p className="mt-1">Egyptian EdTech Platform for Professional Learning</p>
                        </div>
                    </motion.div>
                ) : (
                    /* Invalid Certificate */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 bg-red-500/10 rounded-full flex items-center justify-center">
                                <XCircle className="w-16 h-16 text-red-500" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Certificate Not Found
                        </h2>
                        <p className="text-gray-400 text-lg max-w-md mx-auto mb-4">
                            {data?.error || 'The certificate you are trying to verify could not be found.'}
                        </p>
                        <p className="text-gray-500 text-sm">
                            Certificate Code: <span className="font-mono">{params.code}</span>
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
