'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useLocaleSafe } from '@/hooks/useTranslationsSafe'
import Image from 'next/image'
import { Footer } from '@/components/landing/Footer'
import {
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    Link as LinkIcon,
    MessageSquare,
    Play
} from 'lucide-react'

interface Application {
    id: string
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESUBMIT_REQUIRED'
    expertise: string
    experienceYears?: number
    sampleContentUrl?: string
    portfolioUrl?: string
    socialProof?: string
    motivation: string
    reviewNotes?: string
    rejectionReason?: string
    reviewedAt?: string
    createdAt: string
    updatedAt: string
}

export default function CreatorApplicationPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const locale = useLocaleSafe()
    const isArabic = locale === 'ar'
    const direction: 'ltr' | 'rtl' = isArabic ? 'rtl' : 'ltr'
    
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [application, setApplication] = useState<Application | null>(null)
    const [hasApplication, setHasApplication] = useState(false)
    
    const [formData, setFormData] = useState({
        expertise: '',
        experienceYears: '',
        sampleContentUrl: '',
        portfolioUrl: '',
        socialProof: '',
        motivation: ''
    })

    useEffect(() => {
        if (session?.user) {
            loadApplication()
        } else {
            setLoading(false)
        }
    }, [session])

    const loadApplication = async () => {
        try {
            const response = await fetch('/api/creator/apply')
            if (response.ok) {
                const data = await response.json()
                setHasApplication(data.hasApplication)
                setApplication(data.application)
            }
        } catch (error) {
            console.error('Failed to load application:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!session?.user) {
            toast.error('Please sign in to submit your application')
            return
        }
        
        setSubmitting(true)

        try {
            const response = await fetch('/api/creator/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Application submitted successfully! We\'ll review it and get back to you soon.')
                loadApplication()
            } else {
                toast.error(data.error || 'Failed to submit application')
            }
        } catch (error) {
            console.error('Application submission error:', error)
            toast.error('Failed to submit application')
        } finally {
            setSubmitting(false)
        }
    }

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const getStatusBadge = (status: Application['status']) => {
        const statusConfig = {
            'PENDING': {
                icon: Clock,
                label: 'Pending Review',
                className: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            },
            'UNDER_REVIEW': {
                icon: AlertCircle,
                label: 'Under Review',
                className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
            },
            'APPROVED': {
                icon: CheckCircle,
                label: 'Approved',
                className: 'bg-green-500/10 text-green-400 border border-green-500/20'
            },
            'REJECTED': {
                icon: XCircle,
                label: 'Rejected',
                className: 'bg-red-500/10 text-red-400 border border-red-500/20'
            },
            'RESUBMIT_REQUIRED': {
                icon: AlertCircle,
                label: 'Resubmit Required',
                className: 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
            }
        }

        const config = statusConfig[status]
        if (!config) return null

        const Icon = config.icon

        return (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.className}`}>
                <Icon className="w-4 h-4" />
                {config.label}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-foreground mx-auto mb-6"></div>
                    <p className="text-foreground text-lg">Loading...</p>
                </div>
            </div>
        )
    }

    // Show existing application status
    if (hasApplication && application && !['REJECTED', 'RESUBMIT_REQUIRED'].includes(application.status)) {
        return (
            <div dir={direction} className="min-h-screen bg-background">
                {/* Back Button */}
                <div className="absolute top-8 left-8 z-50">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-sm font-medium">Back</span>
                    </button>
                </div>

                {/* Hero Section */}
                <div className="relative h-[60vh] w-full overflow-hidden mb-12">
                    {/* Background Image */}
                    <div className="absolute inset-0">
                        <Image
                            src="/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 22.43.43_7cec6116.jpg"
                            alt="Creator Application"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                        <div className={`absolute inset-0 ${isArabic ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/80 via-transparent to-transparent`} />
                    </div>

                    {/* Hero Content */}
                    <div className={`relative h-full max-w-screen-2xl mx-auto px-8 flex flex-col justify-end pb-16 ${isArabic ? 'items-end' : ''}`}>
                        <div className={`max-w-xl space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {/* Prime Logo */}
                            <div className="flex items-center gap-2 mb-2">
                                <Image
                                    src="/images/logo.jpg"
                                    alt="Prime"
                                    width={40}
                                    height={40}
                                    className="rounded-lg"
                                />
                                <span className="text-white text-2xl font-semibold">Prime</span>
                            </div>
                            
                            <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                                Creator Application
                            </h1>
                            <p className="text-base text-white/90 leading-relaxed max-w-md">
                                Track your application status and start your journey as a creator
                            </p>
                            {getStatusBadge(application.status)}
                        </div>
                    </div>
                </div>

                {/* Application Details */}
                <div className="max-w-screen-2xl mx-auto px-8 pb-20">
                    <div className="max-w-4xl">
                        {/* Status Card */}
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 mb-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-semibold text-foreground">Application Details</h2>
                                <p className="text-sm text-muted-foreground">
                                    Submitted: {new Date(application.createdAt).toLocaleDateString(locale)}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Expertise</p>
                                    <p className="text-foreground font-medium">{application.expertise}</p>
                                </div>
                                {application.experienceYears && (
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Experience</p>
                                        <p className="text-foreground font-medium">{application.experienceYears} years</p>
                                    </div>
                                )}
                            </div>

                            {application.sampleContentUrl && (
                                <div className="mt-6">
                                    <p className="text-sm text-muted-foreground mb-2">Sample Content</p>
                                    <a 
                                        href={application.sampleContentUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        View Sample
                                    </a>
                                </div>
                            )}

                            {application.portfolioUrl && (
                                <div className="mt-6">
                                    <p className="text-sm text-muted-foreground mb-2">Portfolio</p>
                                    <a 
                                        href={application.portfolioUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        View Portfolio
                                    </a>
                                </div>
                            )}

                            {application.socialProof && (
                                <div className="mt-6">
                                    <p className="text-sm text-muted-foreground mb-2">Social Proof</p>
                                    <p className="text-foreground whitespace-pre-wrap">{application.socialProof}</p>
                                </div>
                            )}

                            <div className="mt-6">
                                <p className="text-sm text-muted-foreground mb-2">Motivation</p>
                                <p className="text-foreground whitespace-pre-wrap">{application.motivation}</p>
                            </div>

                            {application.reviewNotes && (
                                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <MessageSquare className="w-4 h-4 text-blue-400" />
                                        <p className="text-sm font-medium text-blue-400">Review Notes</p>
                                    </div>
                                    <p className="text-blue-100">{application.reviewNotes}</p>
                                </div>
                            )}

                            {application.status === 'APPROVED' && (
                                <div className="mt-6 bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <h3 className="text-lg font-semibold text-green-400">Congratulations!</h3>
                                    </div>
                                    <p className="text-green-100 mb-4">
                                        Your application has been approved! You can now start creating content on our platform.
                                    </p>
                                    <button 
                                        onClick={() => router.push(`/${locale}/creator/dashboard`)}
                                        className="bg-white hover:bg-white/90 text-black font-semibold px-8 py-3 rounded-full transition-all"
                                    >
                                        Go to Creator Dashboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        )
    }

    // Show application form
    return (
        <div dir={direction} className="min-h-screen bg-background">
            {/* Back Button */}
            <div className="absolute top-8 left-8 z-50">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full text-white transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-sm font-medium">Back</span>
                </button>
            </div>

            {/* Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden mb-12">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/courses/German Language Posters/WhatsApp Image 2025-11-23 at 23.38.13_cf3432e6.jpg"
                        alt="Become a Creator"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                    <div className={`absolute inset-0 ${isArabic ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-black/80 via-transparent to-transparent`} />
                </div>

                {/* Hero Content */}
                <div className={`relative h-full max-w-screen-2xl mx-auto px-8 flex flex-col justify-end pb-16 ${isArabic ? 'items-end' : ''}`}>
                    <div className={`max-w-xl space-y-3 ${isArabic ? 'text-right' : 'text-left'}`}>
                        {/* Prime Logo */}
                        <div className="flex items-center gap-2 mb-2">
                            <Image
                                src="/images/logo.jpg"
                                alt="Prime"
                                width={40}
                                height={40}
                                className="rounded-lg"
                            />
                            <span className="text-white text-2xl font-semibold">Prime Creator</span>
                        </div>
                        
                        <h1 className="text-5xl font-bold text-white tracking-tight leading-tight">
                            Become a Creator
                        </h1>
                        <p className="text-base text-white/90 leading-relaxed max-w-md">
                            Join our community of talented creators and share your expertise with thousands of learners worldwide.
                        </p>
                    </div>
                </div>
            </div>

            {/* Application Form */}
            <div className="max-w-screen-2xl mx-auto px-8 pb-20">
                <div className="max-w-4xl">
                    {/* Rejection Notice */}
                    {application?.rejectionReason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <XCircle className="w-5 h-5 text-red-400" />
                                <h3 className="text-lg font-semibold text-red-400">Previous Application Rejected</h3>
                            </div>
                            <p className="text-red-100">{application.rejectionReason}</p>
                            <p className="text-red-100/80 text-sm mt-2">Please address the feedback below and resubmit your application.</p>
                        </div>
                    )}

                    {/* Sign In Notice */}
                    {!session?.user && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-semibold text-blue-400">Sign In Required</h3>
                            </div>
                            <p className="text-blue-100 mb-4">You need to sign in to submit a creator application.</p>
                            <button 
                                onClick={() => router.push(`/${locale}/auth/signin?callbackUrl=/${locale}/creator/apply`)}
                                className="bg-white hover:bg-white/90 text-black font-semibold px-8 py-3 rounded-full transition-all"
                            >
                                Sign In
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
                            <h2 className="text-2xl font-semibold text-foreground mb-6">Application Form</h2>
                            <p className="text-muted-foreground mb-8">
                                Tell us about yourself and why you want to become a creator on our platform.
                            </p>

                            <div className="space-y-6">
                                {/* Expertise */}
                                <div>
                                    <label htmlFor="expertise" className="block text-sm font-medium text-foreground mb-2">
                                        Area of Expertise <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        id="expertise"
                                        type="text"
                                        value={formData.expertise}
                                        onChange={(e) => handleChange('expertise', e.target.value)}
                                        placeholder="e.g., Web Development, Graphic Design, Marketing"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                    />
                                </div>

                                {/* Experience Years */}
                                <div>
                                    <label htmlFor="experienceYears" className="block text-sm font-medium text-foreground mb-2">
                                        Years of Experience
                                    </label>
                                    <input
                                        id="experienceYears"
                                        type="number"
                                        min="0"
                                        value={formData.experienceYears}
                                        onChange={(e) => handleChange('experienceYears', e.target.value)}
                                        placeholder="How many years of experience do you have?"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                    />
                                </div>

                                {/* Sample Content URL */}
                                <div>
                                    <label htmlFor="sampleContentUrl" className="block text-sm font-medium text-foreground mb-2">
                                        Sample Content URL
                                    </label>
                                    <input
                                        id="sampleContentUrl"
                                        type="url"
                                        value={formData.sampleContentUrl}
                                        onChange={(e) => handleChange('sampleContentUrl', e.target.value)}
                                        placeholder="https://youtube.com/watch?v=..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Link to a video, article, or project that showcases your expertise
                                    </p>
                                </div>

                                {/* Portfolio URL */}
                                <div>
                                    <label htmlFor="portfolioUrl" className="block text-sm font-medium text-foreground mb-2">
                                        Portfolio URL
                                    </label>
                                    <input
                                        id="portfolioUrl"
                                        type="url"
                                        value={formData.portfolioUrl}
                                        onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                                        placeholder="https://yourportfolio.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                    />
                                </div>

                                {/* Social Proof */}
                                <div>
                                    <label htmlFor="socialProof" className="block text-sm font-medium text-foreground mb-2">
                                        Social Media & Achievements
                                    </label>
                                    <textarea
                                        id="socialProof"
                                        value={formData.socialProof}
                                        onChange={(e) => handleChange('socialProof', e.target.value)}
                                        placeholder="Share your social media handles, follower counts, certifications, awards, or other achievements"
                                        rows={4}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Help us understand your reach and credibility
                                    </p>
                                </div>

                                {/* Motivation */}
                                <div>
                                    <label htmlFor="motivation" className="block text-sm font-medium text-foreground mb-2">
                                        Why do you want to be a creator? <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        id="motivation"
                                        value={formData.motivation}
                                        onChange={(e) => handleChange('motivation', e.target.value)}
                                        placeholder="Tell us about your passion for teaching, what you want to create, and how you'll help learners..."
                                        rows={6}
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20 resize-none"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting || !session?.user}
                                        className="flex-1 bg-white hover:bg-white/90 text-black font-semibold px-8 py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Application'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => router.push(`/${locale}/`)}
                                        className="px-8 py-3 border border-white/20 text-foreground font-semibold rounded-full hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <Footer />
        </div>
    )
}
