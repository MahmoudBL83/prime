'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    FileText,
    Upload,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
    Award,
    Globe,
    DollarSign,
    BookOpen,
    Video,
    Users,
    Shield,
    Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const steps = [
    {
        id: 1,
        title: 'Personal Information',
        description: 'Tell us about yourself',
        icon: User
    },
    {
        id: 2,
        title: 'Expertise & Experience',
        description: 'Share your knowledge areas',
        icon: Award
    },
    {
        id: 3,
        title: 'Verification Documents',
        description: 'Upload required documents',
        icon: Shield
    },
    {
        id: 4,
        title: 'Platform Guidelines',
        description: 'Review and accept terms',
        icon: FileText
    }
]

export default function CreatorOnboardingPage() {
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const { data: session } = useSession()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Form data
    const [formData, setFormData] = useState({
        // Step 1
        fullName: '',
        arabicName: '',
        email: session?.user?.email || '',
        phone: '',
        country: '',
        city: '',
        bio: '',
        bioAr: '',

        // Step 2
        expertise: '',
        yearsOfExperience: '',
        education: '',
        languages: [] as string[],
        socialLinks: {
            linkedin: '',
            twitter: '',
            youtube: '',
            website: ''
        },

        // Step 3
        idDocument: null as File | null,
        certificate: null as File | null,
        taxForm: null as File | null,

        // Step 4
        acceptedTerms: false,
        acceptedGuidelines: false,
        acceptedPrivacy: false
    })

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleFileUpload = (field: string, file: File | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: file
        }))
    }

    const handleNext = () => {
        // Validate current step
        if (currentStep === 1) {
            if (!formData.fullName || !formData.email || !formData.phone) {
                toast.error('Please fill in all required fields')
                return
            }
        } else if (currentStep === 2) {
            if (!formData.expertise || !formData.yearsOfExperience) {
                toast.error('Please fill in your expertise and experience')
                return
            }
        } else if (currentStep === 3) {
            if (!formData.idDocument) {
                toast.error('Please upload your ID document')
                return
            }
        } else if (currentStep === 4) {
            if (!formData.acceptedTerms || !formData.acceptedGuidelines || !formData.acceptedPrivacy) {
                toast.error('Please accept all terms and guidelines')
                return
            }
        }

        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            // Create FormData for file uploads
            const submitData = new FormData()
            
            // Add all form fields
            Object.entries(formData).forEach(([key, value]) => {
                if (value instanceof File) {
                    submitData.append(key, value)
                } else if (typeof value === 'object' && value !== null) {
                    submitData.append(key, JSON.stringify(value))
                } else {
                    submitData.append(key, String(value))
                }
            })

            const response = await fetch('/api/creator/onboarding', {
                method: 'POST',
                body: submitData
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Application submitted successfully! Redirecting to dashboard...')
                // Redirect immediately without delay
                router.push(`/${locale}/creator/dashboard`)
                router.refresh() // Force refresh to update session
            } else {
                toast.error(data.error || 'Failed to submit application')
            }
        } catch (error) {
            console.error('Error submitting application:', error)
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="text-white mb-2 block">Full Name (English) *</Label>
                                <Input
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <Label className="text-white mb-2 block">Full Name (Arabic)</Label>
                                <Input
                                    value={formData.arabicName}
                                    onChange={(e) => handleInputChange('arabicName', e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="جون دو"
                                    dir="rtl"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="text-white mb-2 block">Email *</Label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <Label className="text-white mb-2 block">Phone Number *</Label>
                                <Input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="+20 123 456 7890"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="text-white mb-2 block">Country</Label>
                                <Input
                                    value={formData.country}
                                    onChange={(e) => handleInputChange('country', e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="Egypt"
                                />
                            </div>
                            <div>
                                <Label className="text-white mb-2 block">City</Label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="Cairo"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">Bio (English)</Label>
                            <Textarea
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                placeholder="Tell us about yourself..."
                            />
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">Bio (Arabic)</Label>
                            <Textarea
                                value={formData.bioAr}
                                onChange={(e) => handleInputChange('bioAr', e.target.value)}
                                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                                placeholder="أخبرنا عن نفسك..."
                                dir="rtl"
                            />
                        </div>
                    </motion.div>
                )

            case 2:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div>
                            <Label className="text-white mb-2 block">Area of Expertise *</Label>
                            <Input
                                value={formData.expertise}
                                onChange={(e) => handleInputChange('expertise', e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g., Web Development, Data Science, Business"
                            />
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">Years of Experience *</Label>
                            <Select
                                value={formData.yearsOfExperience}
                                onValueChange={(value) => handleInputChange('yearsOfExperience', value)}
                            >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select years of experience" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-800 border-gray-700">
                                    <SelectItem value="1-2">1-2 years</SelectItem>
                                    <SelectItem value="3-5">3-5 years</SelectItem>
                                    <SelectItem value="5-10">5-10 years</SelectItem>
                                    <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">Education</Label>
                            <Input
                                value={formData.education}
                                onChange={(e) => handleInputChange('education', e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g., Bachelor's in Computer Science"
                            />
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">Languages You Teach In</Label>
                            <Input
                                value={formData.languages.join(', ')}
                                onChange={(e) => handleInputChange('languages', e.target.value.split(',').map(l => l.trim()))}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g., English, Arabic, German"
                            />
                        </div>

                        <div className="space-y-4">
                            <Label className="text-white mb-2 block">Social Links (Optional)</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    value={formData.socialLinks.linkedin}
                                    onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, linkedin: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="LinkedIn URL"
                                />
                                <Input
                                    value={formData.socialLinks.twitter}
                                    onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, twitter: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="Twitter URL"
                                />
                                <Input
                                    value={formData.socialLinks.youtube}
                                    onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, youtube: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="YouTube URL"
                                />
                                <Input
                                    value={formData.socialLinks.website}
                                    onChange={(e) => handleInputChange('socialLinks', { ...formData.socialLinks, website: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="Website URL"
                                />
                            </div>
                        </div>
                    </motion.div>
                )

            case 3:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-white font-semibold mb-1">Document Verification</h3>
                                    <p className="text-blue-200 text-sm">
                                        We need to verify your identity to ensure platform security. All documents are encrypted and kept confidential.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">ID Document (Passport or National ID) *</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileUpload('idDocument', e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="id-upload"
                                />
                                <label
                                    htmlFor="id-upload"
                                    className="flex items-center justify-center gap-3 bg-white/5 border-2 border-dashed border-white/20 hover:border-purple-500/50 rounded-xl p-8 cursor-pointer transition-all group"
                                >
                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-purple-400 transition-colors" />
                                    <div className="text-center">
                                        <p className="text-white font-medium mb-1">
                                            {formData.idDocument ? formData.idDocument.name : 'Click to upload ID document'}
                                        </p>
                                        <p className="text-gray-400 text-sm">PDF, PNG, JPG (max 5MB)</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">Professional Certificate (Optional)</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileUpload('certificate', e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="cert-upload"
                                />
                                <label
                                    htmlFor="cert-upload"
                                    className="flex items-center justify-center gap-3 bg-white/5 border-2 border-dashed border-white/20 hover:border-blue-500/50 rounded-xl p-8 cursor-pointer transition-all group"
                                >
                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                    <div className="text-center">
                                        <p className="text-white font-medium mb-1">
                                            {formData.certificate ? formData.certificate.name : 'Click to upload certificate'}
                                        </p>
                                        <p className="text-gray-400 text-sm">Degree, certification, or credentials</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <Label className="text-white mb-2 block">Tax Form (Optional)</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => handleFileUpload('taxForm', e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="tax-upload"
                                />
                                <label
                                    htmlFor="tax-upload"
                                    className="flex items-center justify-center gap-3 bg-white/5 border-2 border-dashed border-white/20 hover:border-green-500/50 rounded-xl p-8 cursor-pointer transition-all group"
                                >
                                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-green-400 transition-colors" />
                                    <div className="text-center">
                                        <p className="text-white font-medium mb-1">
                                            {formData.taxForm ? formData.taxForm.name : 'Click to upload tax form'}
                                        </p>
                                        <p className="text-gray-400 text-sm">W-9, W-8BEN, or equivalent</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </motion.div>
                )

            case 4:
                return (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                Welcome to Our Creator Community!
                            </h3>
                            <p className="text-gray-300 mb-4">
                                You're about to join a vibrant community of educators, mentors, and content creators who are passionate about sharing knowledge and transforming lives.
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-purple-300">
                                    <Users className="w-4 h-4" />
                                    <span>50k+ Active Students</span>
                                </div>
                                <div className="flex items-center gap-2 text-blue-300">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Competitive Revenue Share</span>
                                </div>
                                <div className="flex items-center gap-2 text-green-300">
                                    <BookOpen className="w-4 h-4" />
                                    <span>Multiple Content Formats</span>
                                </div>
                                <div className="flex items-center gap-2 text-orange-300">
                                    <Video className="w-4 h-4" />
                                    <span>Live Streaming Support</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.acceptedTerms}
                                        onChange={(e) => handleInputChange('acceptedTerms', e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                                    />
                                    <div>
                                        <p className="text-white font-medium mb-1">Terms of Service</p>
                                        <p className="text-gray-400 text-sm">
                                            I agree to the platform's{' '}
                                            <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                                                Terms of Service
                                            </a>{' '}
                                            and understand my responsibilities as a creator.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.acceptedGuidelines}
                                        onChange={(e) => handleInputChange('acceptedGuidelines', e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                                    />
                                    <div>
                                        <p className="text-white font-medium mb-1">Content Guidelines</p>
                                        <p className="text-gray-400 text-sm">
                                            I agree to follow the{' '}
                                            <a href="#" className="text-blue-400 hover:text-blue-300 underline">
                                                Content Creation Guidelines
                                            </a>{' '}
                                            and maintain quality standards.
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.acceptedPrivacy}
                                        onChange={(e) => handleInputChange('acceptedPrivacy', e.target.checked)}
                                        className="mt-1 w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
                                    />
                                    <div>
                                        <p className="text-white font-medium mb-1">Privacy Policy</p>
                                        <p className="text-gray-400 text-sm">
                                            I have read and agree to the{' '}
                                            <a href="#" className="text-green-400 hover:text-green-300 underline">
                                                Privacy Policy
                                            </a>{' '}
                                            regarding data handling and student privacy.
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </motion.div>
                )

            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-2 mb-4">
                        <Award className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-200 font-medium">Creator Application</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">
                        Become a Creator
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Join thousands of educators sharing their knowledge worldwide
                    </p>
                </motion.div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                                        currentStep >= step.id
                                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                                            : 'bg-white/5 text-gray-500 border border-white/10'
                                    }`}>
                                        {currentStep > step.id ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            <step.icon className="w-6 h-6" />
                                        )}
                                    </div>
                                    <p className={`text-sm font-medium text-center ${
                                        currentStep >= step.id ? 'text-white' : 'text-gray-500'
                                    }`}>
                                        {step.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`h-1 flex-1 mx-2 mt-[-20px] rounded transition-all ${
                                        currentStep > step.id
                                            ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                                            : 'bg-white/10'
                                    }`}></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8"
                >
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {steps[currentStep - 1].title}
                        </h2>
                        <p className="text-gray-400">
                            {steps[currentStep - 1].description}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {renderStepContent()}
                    </AnimatePresence>
                </motion.div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-4">
                    <Button
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="text-gray-400 text-sm">
                        Step {currentStep} of {steps.length}
                    </div>

                    <Button
                        onClick={handleNext}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Submitting...
                            </>
                        ) : currentStep === steps.length ? (
                            <>
                                Submit Application
                                <CheckCircle className="w-4 h-4 ml-2" />
                            </>
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
