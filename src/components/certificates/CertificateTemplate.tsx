'use client'

import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Download, Share2, Award, CheckCircle2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface CertificateTemplateProps {
    certificateNumber: string
    studentName: string
    courseName: string
    completionDate: Date
    issueDate: Date
    instructorName: string
    grade?: string
    verificationUrl: string
    thumbnail?: string
    isArabic?: boolean
}

export default function CertificateTemplate({
    certificateNumber,
    studentName,
    courseName,
    completionDate,
    issueDate,
    instructorName,
    grade,
    verificationUrl,
    thumbnail,
    isArabic = false
}: CertificateTemplateProps) {
    const certificateRef = useRef<HTMLDivElement>(null)

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const handleDownload = async () => {
        try {
            // For now, we'll use html2canvas approach
            // In production, you might want to use a server-side PDF generation service
            const html2canvas = (await import('html2canvas')).default
            
            if (!certificateRef.current) return

            const canvas = await html2canvas(certificateRef.current, {
                background: '#ffffff',
                logging: false
            })

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) return
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = `Certificate-${certificateNumber}.png`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
                toast.success('Certificate downloaded successfully!')
            })
        } catch (error) {
            console.error('Download error:', error)
            toast.error('Failed to download certificate')
        }
    }

    const handleShare = (platform: 'linkedin' | 'twitter') => {
        const text = `I've completed "${courseName}" and earned my certificate! 🎓`
        const url = verificationUrl

        if (platform === 'linkedin') {
            window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                '_blank'
            )
        } else if (platform === 'twitter') {
            window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                '_blank'
            )
        }
    }

    return (
        <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4">
                <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-foreground rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span>{isArabic ? 'تحميل' : 'Download'}</span>
                </button>
                <div className="relative group">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-card hover:bg-gray-700 text-foreground rounded-lg transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span>{isArabic ? 'مشاركة' : 'Share'}</span>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                            onClick={() => handleShare('linkedin')}
                            className="w-full text-left px-4 py-2 hover:bg-card text-foreground rounded-t-lg transition-colors"
                        >
                            Share on LinkedIn
                        </button>
                        <button
                            onClick={() => handleShare('twitter')}
                            className="w-full text-left px-4 py-2 hover:bg-card text-foreground rounded-b-lg transition-colors"
                        >
                            Share on Twitter
                        </button>
                    </div>
                </div>
            </div>

            {/* Certificate */}
            <div
                ref={certificateRef}
                className="relative bg-background p-16 rounded-2xl shadow-2xl aspect-[1.414/1] max-w-4xl mx-auto"
                style={{
                    backgroundImage: `
                        linear-gradient(to bottom right, #faf5ff, #ffffff, #f3e8ff),
                        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v6h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
                    `
                }}
            >
                {/* Decorative Border */}
                <div className="absolute inset-4 border-4 border-purple-200 rounded-xl" />
                <div className="absolute inset-6 border border-purple-300 rounded-lg" />

                {/* Corner Ornaments */}
                <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-purple-400 rounded-tl-lg" />
                <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-purple-400 rounded-tr-lg" />
                <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-purple-400 rounded-bl-lg" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-purple-400 rounded-br-lg" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8">
                    {/* Logo/Badge */}
                    <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg">
                        <Award className="w-12 h-12 text-foreground" />
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-2">
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {isArabic ? 'شهادة إتمام' : 'Certificate of Completion'}
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            {isArabic ? 'تُمنح هذه الشهادة إلى' : 'This certifies that'}
                        </p>
                    </div>

                    {/* Student Name */}
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-foreground border-b-4 border-purple-300 pb-2 px-8">
                            {studentName}
                        </h2>
                    </div>

                    {/* Course Info */}
                    <div className="text-center space-y-2 max-w-2xl">
                        <p className="text-foreground text-lg">
                            {isArabic ? 'لإتمام دورة' : 'has successfully completed the course'}
                        </p>
                        <h3 className="text-2xl font-semibold text-purple-900">
                            {courseName}
                        </h3>
                        {grade && (
                            <div className="flex items-center justify-center space-x-2 mt-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="text-lg font-medium text-green-700">
                                    {isArabic ? 'التقدير' : 'Grade'}: {grade}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Date and Certificate Number */}
                    <div className="flex items-center justify-between w-full max-w-2xl pt-6 border-t border-border">
                        <div className="text-left">
                            <p className="text-sm text-muted-foreground">
                                {isArabic ? 'تاريخ الإكمال' : 'Completion Date'}
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                                {formatDate(completionDate)}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                {isArabic ? 'رقم الشهادة' : 'Certificate Number'}
                            </p>
                            <p className="text-lg font-mono font-semibold text-purple-700">
                                {certificateNumber}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                                {isArabic ? 'المعلم' : 'Instructor'}
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                                {instructorName}
                            </p>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="absolute bottom-12 left-12 bg-background p-3 rounded-lg shadow-md">
                        <QRCodeSVG
                            value={verificationUrl}
                            size={80}
                            level="H"
                            includeMargin={false}
                        />
                        <p className="text-xs text-center text-muted-foreground mt-2">
                            {isArabic ? 'تحقق من الصحة' : 'Verify'}
                        </p>
                    </div>

                    {/* Platform Name */}
                    <div className="absolute bottom-12 right-12 text-right">
                        <p className="text-xl font-bold text-purple-700">EduPlatform</p>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'منصة التعليم المصرية' : 'Egyptian EdTech Platform'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Verification Link */}
            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    {isArabic ? 'تحقق من صحة هذه الشهادة على' : 'Verify this certificate at'}:{' '}
                    <a
                        href={verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 underline"
                    >
                        {verificationUrl}
                    </a>
                </p>
            </div>
        </div>
    )
}
