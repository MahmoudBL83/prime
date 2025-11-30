'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
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
    Play,
    Mail,
    Lock,
    User,
    Eye,
    EyeOff,
    Upload,
    X,
    FileText,
    Shield,
    Sparkles
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
    
    // Auth state
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
    const [showPassword, setShowPassword] = useState(false)
    const [authLoading, setAuthLoading] = useState(false)
    const [authData, setAuthData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    })
    
    const [formData, setFormData] = useState({
        expertise: '',
        experienceYears: '',
        sampleContentUrl: '',
        portfolioUrl: '',
        socialProof: '',
        motivation: ''
    })

    // ID Card upload state
    const [idCardFile, setIdCardFile] = useState<File | null>(null)
    const [idCardPreview, setIdCardPreview] = useState<string | null>(null)
    const [uploadingIdCard, setUploadingIdCard] = useState(false)

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
            let nationalIdImageUrl = ''

            // Upload ID card if provided
            if (idCardFile) {
                setUploadingIdCard(true)
                const uploadFormData = new FormData()
                uploadFormData.append('file', idCardFile)
                uploadFormData.append('type', 'national-id')

                const uploadResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                })

                if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json()
                    nationalIdImageUrl = uploadData.url
                } else {
                    toast.error('Failed to upload ID card')
                    setSubmitting(false)
                    setUploadingIdCard(false)
                    return
                }
                setUploadingIdCard(false)
            }

            const response = await fetch('/api/creator/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    nationalIdImage: nationalIdImageUrl || undefined
                })
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

    const handleAuthChange = (field: string, value: string) => {
        setAuthData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleIdCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            toast.error('Please upload a valid image file (JPEG, PNG, or WebP)')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB')
            return
        }

        setIdCardFile(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setIdCardPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const removeIdCard = () => {
        setIdCardFile(null)
        setIdCardPreview(null)
    }

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthLoading(true)

        try {
            const result = await signIn('credentials', {
                email: authData.email,
                password: authData.password,
                redirect: false
            })

            if (result?.error) {
                toast.error('Invalid email or password')
            } else {
                toast.success('Signed in successfully!')
                loadApplication()
            }
        } catch (error) {
            console.error('Sign in error:', error)
            toast.error('Failed to sign in')
        } finally {
            setAuthLoading(false)
        }
    }

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (authData.password !== authData.confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        if (authData.password.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }

        setAuthLoading(true)

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: authData.name,
                    email: authData.email,
                    password: authData.password
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Account created successfully!')
                // Auto sign in after signup
                const result = await signIn('credentials', {
                    email: authData.email,
                    password: authData.password,
                    redirect: false
                })

                if (!result?.error) {
                    loadApplication()
                }
            } else {
                toast.error(data.error || 'Failed to create account')
            }
        } catch (error) {
            console.error('Sign up error:', error)
            toast.error('Failed to create account')
        } finally {
            setAuthLoading(false)
        }
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

                    {/* Authentication Section - Only show if not signed in */}
                    {!session?.user ? (
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 mb-6">
                            <div className="max-w-md mx-auto">
                                <div className="text-center mb-8">
                                    <div className="inline-flex items-center gap-2 mb-4">
                                        <Image
                                            src="/images/logo.jpg"
                                            alt="Prime"
                                            width={48}
                                            height={48}
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">
                                        {authMode === 'signin' ? 'Sign In to Continue' : 'Create Your Account'}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {authMode === 'signin' 
                                            ? 'Sign in to submit your creator application' 
                                            : 'Join Prime and start your creator journey'}
                                    </p>
                                </div>

                                {/* Auth Mode Tabs */}
                                <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('signin')}
                                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                                            authMode === 'signin'
                                                ? 'bg-white text-black'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthMode('signup')}
                                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                                            authMode === 'signup'
                                                ? 'bg-white text-black'
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        Sign Up
                                    </button>
                                </div>

                                {/* Sign In Form */}
                                {authMode === 'signin' && (
                                    <form onSubmit={handleSignIn} className="space-y-4">
                                        <div>
                                            <label htmlFor="signin-email" className="block text-sm font-medium text-foreground mb-2">
                                                Email
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    id="signin-email"
                                                    type="email"
                                                    value={authData.email}
                                                    onChange={(e) => handleAuthChange('email', e.target.value)}
                                                    placeholder="your@email.com"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="signin-password" className="block text-sm font-medium text-foreground mb-2">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    id="signin-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={authData.password}
                                                    onChange={(e) => handleAuthChange('password', e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full bg-white hover:bg-white/90 text-black font-semibold px-8 py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {authLoading ? 'Signing in...' : 'Sign In'}
                                        </button>
                                    </form>
                                )}

                                {/* Sign Up Form */}
                                {authMode === 'signup' && (
                                    <form onSubmit={handleSignUp} className="space-y-4">
                                        <div>
                                            <label htmlFor="signup-name" className="block text-sm font-medium text-foreground mb-2">
                                                Full Name
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    id="signup-name"
                                                    type="text"
                                                    value={authData.name}
                                                    onChange={(e) => handleAuthChange('name', e.target.value)}
                                                    placeholder="John Doe"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-2">
                                                Email
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    id="signup-email"
                                                    type="email"
                                                    value={authData.email}
                                                    onChange={(e) => handleAuthChange('email', e.target.value)}
                                                    placeholder="your@email.com"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-2">
                                                Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    id="signup-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={authData.password}
                                                    onChange={(e) => handleAuthChange('password', e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    minLength={6}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-11 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
                                        </div>

                                        <div>
                                            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-foreground mb-2">
                                                Confirm Password
                                            </label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <input
                                                    id="signup-confirm-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={authData.confirmPassword}
                                                    onChange={(e) => handleAuthChange('confirmPassword', e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={authLoading}
                                            className="w-full bg-white hover:bg-white/90 text-black font-semibold px-8 py-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {authLoading ? 'Creating account...' : 'Create Account'}
                                        </button>

                                        <p className="text-xs text-center text-muted-foreground mt-4">
                                            By creating an account, you agree to our Terms of Service and Privacy Policy
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Application Form - Only show when authenticated */
                        <form onSubmit={handleSubmit}>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8">
                            <div className="flex items-start gap-4 mb-8">
                                <div className="p-3 bg-purple-500/20 rounded-full">
                                    <Sparkles className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground mb-2">Application Form</h2>
                                    <p className="text-muted-foreground">
                                        Tell us about yourself and why you want to become a creator on our platform.
                                    </p>
                                </div>
                            </div>

                            {/* Progress Indicator */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-foreground">
                                        {isArabic ? 'التقدم' : 'Progress'}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {formData.expertise && formData.motivation ? '100%' : 
                                         formData.expertise || formData.motivation ? '50%' : '0%'}
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                                        style={{ 
                                            width: formData.expertise && formData.motivation ? '100%' : 
                                                   formData.expertise || formData.motivation ? '50%' : '0%'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* Section 1: Professional Information */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {isArabic ? 'المعلومات المهنية' : 'Professional Information'}
                                        </h3>
                                    </div>
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
                                </div>

                                {/* Section 2: Verification Documents */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                                        <Shield className="w-5 h-5 text-green-400" />
                                        <h3 className="text-lg font-semibold text-foreground">
                                            {isArabic ? 'التحقق من الهوية' : 'Identity Verification'}
                                        </h3>
                                        <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                                            {isArabic ? 'اختياري' : 'Optional'}
                                        </span>
                                    </div>

                                    {/* ID Card Upload */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {isArabic ? 'بطاقة الهوية الوطنية' : 'National ID Card'}
                                        </label>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            {isArabic 
                                                ? 'رفع بطاقة هويتك يساعدنا في التحقق من حسابك بشكل أسرع ويزيد من مصداقيتك كمنشئ محتوى.'
                                                : 'Uploading your ID helps us verify your account faster and increases your credibility as a creator.'}
                                        </p>

                                        {!idCardPreview ? (
                                            <label className="block cursor-pointer">
                                                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-purple-500/50 hover:bg-white/5 transition-all">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="p-4 bg-purple-500/20 rounded-full">
                                                            <Upload className="w-8 h-8 text-purple-400" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-foreground font-medium mb-1">
                                                                {isArabic ? 'انقر للرفع أو اسحب وأفلت' : 'Click to upload or drag and drop'}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {isArabic ? 'PNG، JPG، WEBP حتى 5MB' : 'PNG, JPG, WEBP up to 5MB'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                                    onChange={handleIdCardUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                        ) : (
                                            <div className="relative border border-white/10 rounded-xl overflow-hidden">
                                                <img
                                                    src={idCardPreview}
                                                    alt="ID Card Preview"
                                                    className="w-full h-64 object-contain bg-black/20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeIdCard}
                                                    className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                                                >
                                                    <X className="w-4 h-4 text-white" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                                    <div className="flex items-center gap-2 text-white">
                                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                                        <span className="text-sm font-medium">
                                                            {isArabic ? 'تم رفع بطاقة الهوية' : 'ID Card Uploaded'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <p>
                                                {isArabic
                                                    ? 'معلوماتك الشخصية آمنة ومحمية. نحن نستخدمها فقط للتحقق من الهوية.'
                                                    : 'Your personal information is secure and protected. We only use it for identity verification.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col gap-4 pt-6">
                                    {uploadingIdCard && (
                                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent" />
                                            <span className="text-sm text-blue-400">
                                                {isArabic ? 'جارٍ رفع بطاقة الهوية...' : 'Uploading ID card...'}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className="flex gap-4">
                                        <button
                                            type="submit"
                                            disabled={submitting || uploadingIdCard}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                                    {isArabic ? 'جارٍ الإرسال...' : 'Submitting...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    {isArabic ? 'إرسال الطلب' : 'Submit Application'}
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/${locale}/`)}
                                            disabled={submitting || uploadingIdCard}
                                            className="px-8 py-4 border border-white/20 text-foreground font-semibold rounded-full hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isArabic ? 'إلغاء' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    )
}
