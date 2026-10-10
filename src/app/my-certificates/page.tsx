'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
    Award, 
    Download, 
    Share2, 
    Eye, 
    Calendar,
    Trophy,
    BookOpen,
    ExternalLink
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import CertificateTemplate from '@/components/certificates/CertificateTemplate'

interface Certificate {
    id: string
    certificateNumber: string
    issueDate: string
    completionDate: string
    grade: string | null
    credentialUrl: string
    course: {
        id: string
        title: string
        titleAr: string
        thumbnail: string | null
        category: string
        level: string
        creator: {
            user: {
                name: string
                arabicName: string | null
            }
        }
    }
}

export default function MyCertificatesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [certificates, setCertificates] = useState<Certificate[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
    const [isArabic, setIsArabic] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
            return
        }

        if (status === 'authenticated') {
            fetchCertificates()
        }
    }, [status, router])

    const fetchCertificates = async () => {
        try {
            const response = await fetch('/api/certificates/my-certificates')
            if (response.ok) {
                const data = await response.json()
                setCertificates(data.certificates)
            } else {
                toast.error('Failed to load certificates')
            }
        } catch (error) {
            toast.error('Error loading certificates')
        } finally {
            setLoading(false)
        }
    }

    const handleView = (certificate: Certificate) => {
        setSelectedCertificate(certificate)
    }

    const handleVerify = (verificationUrl: string) => {
        window.open(verificationUrl, '_blank')
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a84ff] mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading your certificates...</p>
                </div>
            </div>
        )
    }

    // Show Certificate Modal
    if (selectedCertificate) {
        return (
            <div className="min-h-screen bg-background py-12 px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => setSelectedCertificate(null)}
                        className="mb-6 flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <span>Back to Gallery</span>
                    </button>

                    {/* Certificate Display */}
                    <CertificateTemplate
                        certificateNumber={selectedCertificate.certificateNumber}
                        studentName={session?.user?.name || 'Student'}
                        courseName={isArabic ? selectedCertificate.course.titleAr : selectedCertificate.course.title}
                        completionDate={new Date(selectedCertificate.completionDate)}
                        issueDate={new Date(selectedCertificate.issueDate)}
                        instructorName={selectedCertificate.course.creator.user.name}
                        grade={selectedCertificate.grade || undefined}
                        verificationUrl={selectedCertificate.credentialUrl}
                        thumbnail={selectedCertificate.course.thumbnail || undefined}
                        isArabic={isArabic}
                    />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-gray-900/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
                                <Trophy className="w-8 h-8 text-purple-500" />
                                <span>My Certificates</span>
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
                            </p>
                        </div>
                        <button
                            onClick={() => setIsArabic(!isArabic)}
                            className="px-4 py-2 bg-card hover:bg-gray-700 text-foreground rounded-lg transition-colors"
                        >
                            {isArabic ? 'English' : 'العربية'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {certificates.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-20">
                        <div className="flex justify-center mb-6">
                            <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center">
                                <Award className="w-16 h-16 text-muted-foreground" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-3">
                            No Certificates Yet
                        </h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Complete courses to earn certificates that you can share on your professional profiles.
                        </p>
                        <button
                            onClick={() => router.push('/my-learning')}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-foreground rounded-lg transition-all"
                        >
                            Continue Learning
                        </button>
                    </div>
                ) : (
                    /* Certificates Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((certificate, index) => (
                            <motion.div
                                key={certificate.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group"
                            >
                                {/* Course Thumbnail */}
                                <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden">
                                    {certificate.course.thumbnail ? (
                                        <img
                                            src={certificate.course.thumbnail}
                                            alt={certificate.course.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <BookOpen className="w-16 h-16 text-purple-500/30" />
                                        </div>
                                    )}
                                    {/* Award Badge Overlay */}
                                    <div className="absolute top-4 right-4 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                                        <Award className="w-6 h-6 text-foreground" />
                                    </div>
                                </div>

                                {/* Certificate Info */}
                                <div className="p-6 space-y-4">
                                    {/* Course Title */}
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-2">
                                            {certificate.course.title}
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                                                {certificate.course.category}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-card text-muted-foreground rounded">
                                                {certificate.course.level}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center space-x-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>Completed {formatDate(certificate.completionDate)}</span>
                                        </div>
                                        {certificate.grade && (
                                            <div className="flex items-center space-x-2 text-green-400">
                                                <Trophy className="w-4 h-4" />
                                                <span>Grade: {certificate.grade}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Certificate Number */}
                                    <div className="pt-3 border-t border-border">
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {certificate.certificateNumber}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleView(certificate)}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-foreground rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>View</span>
                                        </button>
                                        <button
                                            onClick={() => handleVerify(certificate.credentialUrl)}
                                            className="flex items-center justify-center px-4 py-2 bg-card hover:bg-gray-700 text-foreground rounded-lg transition-colors"
                                            title="Verify Certificate"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'

export const runtime = 'edge'
