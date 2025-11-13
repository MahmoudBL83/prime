/**
 * Creator Application Page
 * Apply to become a content creator on the platform
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import {
    Upload,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
    FileText,
    Briefcase,
    Link as LinkIcon,
    Users,
    MessageSquare
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
    const params = useParams()
    const locale = params.locale as string || 'en'
    const t = useTranslations('creator.application')
    
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
                toast.success(t('submitSuccess'))
                loadApplication()
            } else {
                toast.error(data.error || t('submitError'))
            }
        } catch (error) {
            console.error('Application submission error:', error)
            toast.error(t('submitError'))
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
        switch (status) {
            case 'PENDING':
                return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />{t('status.pending')}</Badge>
            case 'UNDER_REVIEW':
                return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />{t('status.underReview')}</Badge>
            case 'APPROVED':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{t('status.approved')}</Badge>
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />{t('status.rejected')}</Badge>
            case 'RESUBMIT_REQUIRED':
                return <Badge className="bg-orange-100 text-orange-800"><AlertCircle className="w-3 h-3 mr-1" />{t('status.resubmitRequired')}</Badge>
            default:
                return null
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-6"></div>
                    <p className="text-purple-200 text-lg">{t('loading')}</p>
                </div>
            </div>
        )
    }

    // Show existing application status
    if (hasApplication && application && !['REJECTED', 'RESUBMIT_REQUIRED'].includes(application.status)) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                </div>

                <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
                            {t('title')}
                        </h1>
                        <p className="text-purple-200/80 text-lg">
                            {t('subtitle')}
                        </p>
                    </div>

                    <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border-gray-700/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white">{t('applicationStatus')}</CardTitle>
                                {getStatusBadge(application.status)}
                            </div>
                            <CardDescription className="text-gray-400">
                                {t('submittedOn')}: {new Date(application.createdAt).toLocaleDateString(locale)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-gray-300">{t('expertise')}</Label>
                                    <p className="text-white mt-1">{application.expertise}</p>
                                </div>
                                {application.experienceYears && (
                                    <div>
                                        <Label className="text-gray-300">{t('experienceYears')}</Label>
                                        <p className="text-white mt-1">{application.experienceYears} {t('years')}</p>
                                    </div>
                                )}
                            </div>

                            {application.sampleContentUrl && (
                                <div>
                                    <Label className="text-gray-300">{t('sampleContent')}</Label>
                                    <a href={application.sampleContentUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-2 mt-1">
                                        <LinkIcon className="w-4 h-4" />
                                        {application.sampleContentUrl}
                                    </a>
                                </div>
                            )}

                            {application.portfolioUrl && (
                                <div>
                                    <Label className="text-gray-300">{t('portfolio')}</Label>
                                    <a href={application.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-2 mt-1">
                                        <LinkIcon className="w-4 h-4" />
                                        {application.portfolioUrl}
                                    </a>
                                </div>
                            )}

                            <div>
                                <Label className="text-gray-300">{t('motivation')}</Label>
                                <p className="text-white mt-1 whitespace-pre-wrap">{application.motivation}</p>
                            </div>

                            {application.reviewNotes && (
                                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                                    <Label className="text-blue-300 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        {t('reviewNotes')}
                                    </Label>
                                    <p className="text-blue-100 mt-2">{application.reviewNotes}</p>
                                </div>
                            )}

                            {application.status === 'APPROVED' && (
                                <div className="bg-green-900/20 border border-green-700/50 rounded-lg p-4">
                                    <h3 className="text-green-300 font-semibold mb-2">{t('congratulations')}</h3>
                                    <p className="text-green-100">{t('approvedMessage')}</p>
                                    <Button 
                                        onClick={() => router.push(`/${locale}/creator/dashboard`)}
                                        className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                    >
                                        {t('goToDashboard')}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    // Show application form
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-purple-200/80 text-lg">
                        {t('subtitle')}
                    </p>
                </div>

                {application?.rejectionReason && (
                    <Card className="bg-red-900/20 border-red-700/50 mb-6">
                        <CardHeader>
                            <CardTitle className="text-red-300 flex items-center gap-2">
                                <XCircle className="w-5 h-5" />
                                {t('previouslyRejected')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-100">{application.rejectionReason}</p>
                        </CardContent>
                    </Card>
                )}

                <form onSubmit={handleSubmit}>
                    <Card className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border-gray-700/50">
                        <CardHeader>
                            <CardTitle className="text-white">{t('applicationForm')}</CardTitle>
                            <CardDescription className="text-gray-400">
                                {t('formDescription')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="expertise" className="text-gray-300">
                                    {t('expertise')} <span className="text-red-400">*</span>
                                </Label>
                                <Input
                                    id="expertise"
                                    value={formData.expertise}
                                    onChange={(e) => handleChange('expertise', e.target.value)}
                                    placeholder={t('expertisePlaceholder')}
                                    required
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                                />
                            </div>

                            <div>
                                <Label htmlFor="experienceYears" className="text-gray-300">
                                    {t('experienceYears')}
                                </Label>
                                <Input
                                    id="experienceYears"
                                    type="number"
                                    min="0"
                                    value={formData.experienceYears}
                                    onChange={(e) => handleChange('experienceYears', e.target.value)}
                                    placeholder={t('experienceYearsPlaceholder')}
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                                />
                            </div>

                            <div>
                                <Label htmlFor="sampleContentUrl" className="text-gray-300">
                                    {t('sampleContent')}
                                </Label>
                                <Input
                                    id="sampleContentUrl"
                                    type="url"
                                    value={formData.sampleContentUrl}
                                    onChange={(e) => handleChange('sampleContentUrl', e.target.value)}
                                    placeholder={t('sampleContentPlaceholder')}
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                                />
                                <p className="text-gray-500 text-sm mt-1">{t('sampleContentHint')}</p>
                            </div>

                            <div>
                                <Label htmlFor="portfolioUrl" className="text-gray-300">
                                    {t('portfolio')}
                                </Label>
                                <Input
                                    id="portfolioUrl"
                                    type="url"
                                    value={formData.portfolioUrl}
                                    onChange={(e) => handleChange('portfolioUrl', e.target.value)}
                                    placeholder={t('portfolioPlaceholder')}
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                                />
                            </div>

                            <div>
                                <Label htmlFor="socialProof" className="text-gray-300">
                                    {t('socialProof')}
                                </Label>
                                <Textarea
                                    id="socialProof"
                                    value={formData.socialProof}
                                    onChange={(e) => handleChange('socialProof', e.target.value)}
                                    placeholder={t('socialProofPlaceholder')}
                                    rows={3}
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                                />
                                <p className="text-gray-500 text-sm mt-1">{t('socialProofHint')}</p>
                            </div>

                            <div>
                                <Label htmlFor="motivation" className="text-gray-300">
                                    {t('motivation')} <span className="text-red-400">*</span>
                                </Label>
                                <Textarea
                                    id="motivation"
                                    value={formData.motivation}
                                    onChange={(e) => handleChange('motivation', e.target.value)}
                                    placeholder={t('motivationPlaceholder')}
                                    rows={5}
                                    required
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    {submitting ? t('submitting') : t('submit')}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/${locale}/dashboard`)}
                                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                >
                                    {t('cancel')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    )
}
