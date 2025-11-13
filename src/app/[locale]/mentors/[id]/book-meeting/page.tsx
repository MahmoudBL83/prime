'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    Clock,
    DollarSign,
    ArrowLeft,
    User,
    MessageSquare,
    Video,
    Phone,
    CheckCircle,
    AlertCircle,
    Loader2,
    Star,
    Award,
    Shield,
    CreditCard,
    Zap,
    Timer,
    CalendarDays,
    UserCheck,
    MessageCircle,
    BookOpen,
    Sparkles,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslationsSafe, useLocaleSafe } from '@/hooks/useTranslationsSafe'
import { useNavigationLoading } from '@/hooks/useNavigationLoading'
import { LoadingButton } from '@/components/ui/loading-button'
import { toast } from 'react-hot-toast'

interface MentorData {
    id: string
    user: {
        name: string
        arabicName: string
        profileImage: string | null
    }
    hourlyRate: number
    meetingTypes: any
    availability: any
    timezone: string
}

const meetingTypeOptions = [
    { 
        value: 'CONSULTATION', 
        label: 'General Consultation', 
        icon: MessageCircle, 
        description: 'Get expert guidance and mentorship on your learning journey',
        color: 'from-blue-500 to-cyan-500'
    },
    { 
        value: 'COURSE_HELP', 
        label: 'Course Help & Support', 
        icon: BookOpen, 
        description: 'Get help with specific courses, assignments, or concepts',
        color: 'from-green-500 to-emerald-500'
    },
    { 
        value: 'CAREER_ADVICE', 
        label: 'Career Mentoring', 
        icon: Award, 
        description: 'Professional career planning and industry insights from an expert',
        color: 'from-purple-500 to-violet-500'
    },
    { 
        value: 'CODE_REVIEW', 
        label: 'Code Review', 
        icon: CheckCircle, 
        description: 'Get your code reviewed by an experienced mentor',
        color: 'from-orange-500 to-red-500'
    },
    { 
        value: 'MOCK_INTERVIEW', 
        label: 'Mock Interview', 
        icon: UserCheck, 
        description: 'Practice interviews with real-world scenarios and feedback',
        color: 'from-pink-500 to-rose-500'
    },
    { 
        value: 'MENTORSHIP', 
        label: '1-on-1 Mentorship', 
        icon: Star, 
        description: 'Personalized mentorship for personal and professional growth',
        color: 'from-yellow-500 to-amber-500'
    }
]

const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
]

export default function BookMentorSessionPage() {
    const params = useParams()
    const { data: session, status } = useSession()
    const { navigateWithLoading, isLoading } = useNavigationLoading()
    const { t } = useTranslationsSafe('booking')
    const { t: tCommon } = useTranslationsSafe('common')
    const currentLocale = useLocaleSafe()

    const [mentor, setMentor] = useState<MentorData | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    
    // Form state
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState({
        meetingType: '',
        duration: 30,
        scheduledAt: '',
        title: '',
        description: ''
    })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    
    // Date picker state
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string>('')
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [showTimePicker, setShowTimePicker] = useState(false)

    useEffect(() => {
        if (status === 'loading') return
        if (!session?.user) {
            navigateWithLoading('/auth/login', 'login')
            return
        }
        fetchMentor()
    }, [params.id, session, status])

    const fetchMentor = async () => {
        try {
            // Still use the instructors API endpoint since the backend model is still named "Creator"
            const response = await fetch(`/api/instructors/${params.id}/meetings`)
            if (response.ok) {
                const data = await response.json()
                setMentor(data.instructor)
            } else {
                toast.error('Failed to load mentor information')
            }
        } catch (error) {
            console.error('Error fetching mentor:', error)
            toast.error('Failed to load mentor information')
        } finally {
            setLoading(false)
        }
    }

    const calculatePrice = () => {
        if (!mentor) return 0
        return (formData.duration / 60) * mentor.hourlyRate
    }

    const handleSubmit = async () => {
        if (!validateStep(3)) return

        if (!formData.meetingType || !formData.scheduledAt || !formData.title) {
            toast.error('Please fill in all required fields')
            return
        }

        setSubmitting(true)
        try {
            const response = await fetch(`/api/instructors/${params.id}/meetings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    scheduledAt: new Date(formData.scheduledAt).toISOString(),
                }),
            })

            if (response.ok) {
                const data = await response.json()
                
                // Show success animation/message
                toast.success('Mentoring session booked successfully! 🎉')
                
                // Redirect to a success page or back to mentor profile
                setTimeout(() => {
                    navigateWithLoading(`/mentors/${params.id}`, 'success')
                }, 2000)
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Failed to book mentoring session')
            }
        } catch (error) {
            console.error('Error booking session:', error)
            toast.error('Failed to book session. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const getMentorName = (mentor: MentorData) => {
        return currentLocale === 'ar' && mentor.user.arabicName 
            ? mentor.user.arabicName 
            : mentor.user.name
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
                    <p className="text-white">Loading booking information...</p>
                </div>
            </div>
        )
    }

    if (!mentor) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 flex items-center justify-center">
                <div className="text-center text-white">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-bold mb-2">Mentor Not Found</h1>
                    <p className="text-gray-400 mb-6">The mentor you're looking for doesn't exist or is not available for sessions.</p>
                    <LoadingButton
                        onClick={() => navigateWithLoading('/mentors', 'back')}
                        loading={isLoading('back')}
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Mentors
                    </LoadingButton>
                </div>
            </div>
        )
    }

    const validateStep = (step: number) => {
        const errors: Record<string, string> = {}
        
        if (step === 1 && !formData.meetingType) {
            errors.meetingType = 'Please select a session type'
        }
        
        if (step === 2 && !formData.scheduledAt) {
            errors.scheduledAt = 'Please select a date and time'
        }
        
        if (step === 3 && !formData.title.trim()) {
            errors.title = 'Please enter a session title'
        }
        
        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 3))
        }
    }

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const selectedMeetingType = meetingTypeOptions.find(option => option.value === formData.meetingType)

    // Date picker utilities
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const isDateDisabled = (date: Date) => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date < today
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const generateTimeSlots = () => {
        const slots = []
        for (let hour = 9; hour <= 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                slots.push(time)
            }
        }
        return slots
    }

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setShowDatePicker(false)
        setShowTimePicker(true)
        updateFormDateTime(date, selectedTime)
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time)
        setShowTimePicker(false)
        if (selectedDate) {
            updateFormDateTime(selectedDate, time)
        }
    }

    const updateFormDateTime = (date: Date, time: string) => {
        if (!date || !time) return
        
        const [hours, minutes] = time.split(':').map(Number)
        const dateTime = new Date(date)
        dateTime.setHours(hours, minutes, 0, 0)
        
        setFormData(prev => ({ 
            ...prev, 
            scheduledAt: dateTime.toISOString().slice(0, 16)
        }))
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/30 to-purple-900/30 relative overflow-hidden">
            {/* Enhanced Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-cyan-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-600/5 to-purple-600/5 rounded-full blur-3xl"></div>
                
                {/* Floating Elements */}
                <motion.div
                    className="absolute top-32 right-32 w-4 h-4 bg-purple-400/30 rounded-full"
                    animate={{ y: [-20, 20, -20], x: [-10, 10, -10] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-40 left-40 w-6 h-6 bg-blue-400/20 rounded-full"
                    animate={{ y: [20, -20, 20], x: [10, -10, 10] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
                {/* Enhanced Header */}
                <motion.div
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between mb-8">
                        <LoadingButton
                            variant="ghost"
                            className="text-white/80 hover:text-white hover:bg-white/10 rounded-xl px-4 py-2"
                            onClick={() => navigateWithLoading(`/mentors/${params.id}`, 'back')}
                            loading={isLoading('back')}
                            loadingText="Going back..."
                            icon={<ArrowLeft className="w-4 h-4" />}
                        >
                            Back to Profile
                        </LoadingButton>
                        
                        {/* Progress Steps */}
                        <div className="flex items-center gap-4">
                            {[1, 2, 3].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                                        step === currentStep 
                                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                                            : step < currentStep 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-gray-700 text-gray-400'
                                    }`}>
                                        {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                                    </div>
                                    {step < 3 && (
                                        <div className={`w-12 h-1 mx-2 rounded-full transition-all duration-300 ${
                                            step < currentStep ? 'bg-green-500' : 'bg-gray-700'
                                        }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Title */}
                    <div className="text-center mb-8">
                        <motion.h1 
                            className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            Book Mentoring Session
                        </motion.h1>
                        <motion.p 
                            className="text-xl text-purple-100/80 max-w-2xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                        >
                            Schedule a personalized mentoring session with our expert mentor
                        </motion.p>
                    </div>

                    {/* Mentor Card */}
                    <motion.div 
                        className="max-w-md mx-auto bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-xl">
                                    {mentor.user.profileImage ? (
                                        <img src={mentor.user.profileImage} alt={getMentorName(mentor)} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">
                                                {getMentorName(mentor).charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-800">
                                    <Shield className="w-3 h-3 text-white" />
                                </div>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-xl font-bold text-white mb-1">{getMentorName(mentor)}</h2>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="flex items-center gap-1 text-green-400">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="font-semibold">${mentor.hourlyRate}/hour</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-yellow-400">
                                        <Star className="w-4 h-4 fill-current" />
                                        <span className="font-semibold">4.9</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form - Step Wizard */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl"
                        >
                            <AnimatePresence mode="wait">
                                {/* Step 1: Session Type */}
                                {currentStep === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
                                                <MessageCircle className="w-8 h-8 text-purple-400" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-2">Choose Session Type</h2>
                                            <p className="text-gray-300">What kind of mentoring session would you like to book?</p>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {meetingTypeOptions.map((type) => {
                                                const IconComponent = type.icon
                                                return (
                                                    <motion.button
                                                        key={type.value}
                                                        onClick={() => setFormData(prev => ({ ...prev, meetingType: type.value }))}
                                                        className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-105 ${
                                                            formData.meetingType === type.value
                                                                ? `border-purple-400 bg-gradient-to-br ${type.color} shadow-lg shadow-purple-500/25`
                                                                : 'border-gray-600 bg-gray-800/50 hover:border-purple-500/50'
                                                        }`}
                                                        whileHover={{ y: -2 }}
                                                        whileTap={{ scale: 0.98 }}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                                formData.meetingType === type.value 
                                                                    ? 'bg-white/20' 
                                                                    : 'bg-purple-500/20 group-hover:bg-purple-500/30'
                                                            }`}>
                                                                <IconComponent className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className="font-semibold text-white mb-2">{type.label}</h3>
                                                                <p className="text-sm text-gray-300 line-clamp-2">{type.description}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {formData.meetingType === type.value && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                                                            >
                                                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                                            </motion.div>
                                                        )}
                                                    </motion.button>
                                                )
                                            })}
                                        </div>

                                        {formErrors.meetingType && (
                                            <motion.p 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-400 text-sm flex items-center gap-2"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                {formErrors.meetingType}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Step 2: Date & Duration */}
                                {currentStep === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center">
                                                <CalendarDays className="w-8 h-8 text-blue-400" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-2">Schedule Your Session</h2>
                                            <p className="text-gray-300">Choose a convenient time for your mentoring session</p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Duration Selection */}
                                            <div>
                                                <Label className="text-white mb-4 block text-lg font-semibold">Session Duration</Label>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {durationOptions.map((duration) => (
                                                        <button
                                                            key={duration.value}
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, duration: duration.value }))}
                                                            className={`p-4 rounded-xl border-2 transition-all duration-200 text-center hover:scale-105 ${
                                                                formData.duration === duration.value
                                                                    ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                                                                    : 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-blue-500/50'
                                                            }`}
                                                        >
                                                            <Timer className="w-5 h-5 mx-auto mb-2" />
                                                            <div className="font-semibold">{duration.label}</div>
                                                            <div className="text-sm text-gray-400">
                                                                ${((duration.value / 60) * mentor.hourlyRate).toFixed(2)}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Custom Date & Time Picker */}
                                            <div>
                                                <Label className="text-white mb-4 block text-lg font-semibold">Date & Time</Label>
                                                
                                                {/* Date Selection */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-gray-300 mb-2 block text-sm">Select Date</Label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowDatePicker(!showDatePicker)}
                                                            className="w-full p-4 bg-gray-800/80 border border-gray-600 rounded-xl text-left text-white hover:border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <CalendarDays className="w-5 h-5 text-blue-400" />
                                                                    <span className="text-lg">
                                                                        {selectedDate ? formatDate(selectedDate).split(',')[1].trim() : 'Choose date'}
                                                                    </span>
                                                                </div>
                                                                <ChevronRight className={`w-4 h-4 transition-transform ${showDatePicker ? 'rotate-90' : ''}`} />
                                                            </div>
                                                        </button>
                                                        
                                                        {/* Custom Date Picker */}
                                                        <AnimatePresence>
                                                            {showDatePicker && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    className="absolute z-50 mt-2 p-4 bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl backdrop-blur-xl"
                                                                >
                                                                    {/* Month Navigation */}
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                                                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                                                        >
                                                                            <ChevronLeft className="w-5 h-5 text-gray-400" />
                                                                        </button>
                                                                        <h3 className="text-white font-semibold">
                                                                            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                                        </h3>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                                                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                                                                        >
                                                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    {/* Weekday Headers */}
                                                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                                            <div key={day} className="text-center text-xs text-gray-400 py-2">
                                                                                {day}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    
                                                                    {/* Calendar Days */}
                                                                    <div className="grid grid-cols-7 gap-1">
                                                                        {/* Empty cells for days before the first day of the month */}
                                                                        {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, index) => (
                                                                            <div key={`empty-${index}`} className="p-2" />
                                                                        ))}
                                                                        
                                                                        {/* Days of the month */}
                                                                        {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, index) => {
                                                                            const day = index + 1
                                                                            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                                                                            const isDisabled = isDateDisabled(date)
                                                                            const isSelected = selectedDate && 
                                                                                date.getFullYear() === selectedDate.getFullYear() && 
                                                                                date.getMonth() === selectedDate.getMonth() && 
                                                                                date.getDate() === selectedDate.getDate()
                                                                            
                                                                            return (
                                                                                <button
                                                                                    key={day}
                                                                                    type="button"
                                                                                    onClick={() => !isDisabled && handleDateSelect(date)}
                                                                                    disabled={isDisabled}
                                                                                    className={`p-2 text-sm rounded-lg transition-all duration-200 ${
                                                                                        isSelected 
                                                                                            ? 'bg-blue-600 text-white font-semibold' 
                                                                                            : isDisabled 
                                                                                                ? 'text-gray-600 cursor-not-allowed' 
                                                                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                                                                    }`}
                                                                                >
                                                                                    {day}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    
                                                    {/* Time Selection */}
                                                    <div>
                                                        <Label className="text-gray-300 mb-2 block text-sm">Select Time</Label>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowTimePicker(!showTimePicker)}
                                                            disabled={!selectedDate}
                                                            className="w-full p-4 bg-gray-800/80 border border-gray-600 rounded-xl text-left text-white hover:border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <Clock className="w-5 h-5 text-blue-400" />
                                                                    <span className="text-lg">
                                                                        {selectedTime || 'Choose time'}
                                                                    </span>
                                                                </div>
                                                                <ChevronRight className={`w-4 h-4 transition-transform ${showTimePicker ? 'rotate-90' : ''}`} />
                                                            </div>
                                                        </button>
                                                        
                                                        {/* Time Picker */}
                                                        <AnimatePresence>
                                                            {showTimePicker && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: -10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: -10 }}
                                                                    className="absolute z-50 mt-2 p-4 bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl backdrop-blur-xl max-h-64 overflow-y-auto"
                                                                >
                                                                    <div className="text-white font-semibold mb-3">Available Times</div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {generateTimeSlots().map(time => {
                                                                            const isSelected = selectedTime === time
                                                                            return (
                                                                                <button
                                                                                    key={time}
                                                                                    type="button"
                                                                                    onClick={() => handleTimeSelect(time)}
                                                                                    className={`p-3 rounded-lg text-sm transition-all duration-200 ${
                                                                                        isSelected 
                                                                                            ? 'bg-blue-600 text-white font-semibold' 
                                                                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                                                                                    }`}
                                                                                >
                                                                                    {time}
                                                                                </button>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                                
                                                {/* Selected Date & Time Display */}
                                                {selectedDate && selectedTime && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="mt-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl"
                                                    >
                                                        <div className="flex items-center gap-3 text-blue-300">
                                                            <CheckCircle className="w-5 h-5" />
                                                            <div>
                                                                <div className="font-semibold">{formatDate(selectedDate)}</div>
                                                                <div className="text-sm">at {selectedTime}</div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {formErrors.scheduledAt && (
                                            <motion.p 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-red-400 text-sm flex items-center gap-2"
                                            >
                                                <AlertCircle className="w-4 h-4" />
                                                {formErrors.scheduledAt}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Step 3: Session Details */}
                                {currentStep === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-6"
                                    >
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center">
                                                <Sparkles className="w-8 h-8 text-green-400" />
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-2">Session Details</h2>
                                            <p className="text-gray-300">Tell us what you'd like to discuss with your mentor</p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* Session Title */}
                                            <div>
                                                <Label className="text-white mb-3 block text-lg font-semibold">Session Title *</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Brief description of what you'd like to discuss"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                    className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 text-lg p-4 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400/20"
                                                    maxLength={100}
                                                />
                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-sm text-gray-400">{formData.title.length}/100 characters</span>
                                                </div>
                                                {formErrors.title && (
                                                    <motion.p 
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-red-400 text-sm flex items-center gap-2 mt-2"
                                                    >
                                                        <AlertCircle className="w-4 h-4" />
                                                        {formErrors.title}
                                                    </motion.p>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <Label className="text-white mb-3 block text-lg font-semibold">Additional Notes (Optional)</Label>
                                                <Textarea
                                                    placeholder="Any specific topics, questions, or goals you'd like to cover in this mentoring session..."
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                    className="bg-gray-800/80 border-gray-600 text-white placeholder-gray-400 p-4 rounded-xl focus:border-green-400 focus:ring-2 focus:ring-green-400/20 min-h-[120px]"
                                                    rows={5}
                                                />
                                                <div className="text-sm text-gray-400 mt-2">
                                                    Help your mentor prepare by sharing your learning goals and specific areas you'd like guidance on.
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-700/50">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={prevStep}
                                    disabled={currentStep === 1}
                                    className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Previous
                                </Button>

                                {currentStep < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8"
                                    >
                                        Continue
                                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-8"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Booking...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                Book Session (${calculatePrice().toFixed(2)})
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Enhanced Booking Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="space-y-6"
                    >
                        {/* Booking Summary Card */}
                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <CreditCard className="w-5 h-5 text-green-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Booking Summary</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Session Type */}
                                {selectedMeetingType && (
                                    <motion.div 
                                        className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <selectedMeetingType.icon className="w-5 h-5 text-purple-400" />
                                            <div>
                                                <div className="text-white font-semibold">{selectedMeetingType.label}</div>
                                                <div className="text-xs text-gray-400">Session Type</div>
                                            </div>
                                        </div>
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                    </motion.div>
                                )}

                                {/* Duration & Price */}
                                <div className="flex justify-between items-center text-gray-300 p-3 bg-gray-800/30 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Timer className="w-4 h-4 text-blue-400" />
                                        <span>Duration:</span>
                                    </div>
                                    <span className="font-semibold text-white">{formData.duration} minutes</span>
                                </div>

                                <div className="flex justify-between items-center text-gray-300 p-3 bg-gray-800/30 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-400" />
                                        <span>Hourly Rate:</span>
                                    </div>
                                    <span className="font-semibold text-white">${mentor.hourlyRate}/hour</span>
                                </div>

                                {/* Scheduled Time */}
                                {formData.scheduledAt && (
                                    <motion.div 
                                        className="flex justify-between items-center text-gray-300 p-3 bg-gray-800/30 rounded-xl"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-purple-400" />
                                            <span>Scheduled:</span>
                                        </div>
                                        <span className="font-semibold text-white text-sm">
                                            {new Date(formData.scheduledAt).toLocaleDateString()} at {' '}
                                            {new Date(formData.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </motion.div>
                                )}

                                {/* Total Price */}
                                <div className="border-t border-gray-700/50 pt-4 mt-6">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-white">Total Cost:</span>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-400">${calculatePrice().toFixed(2)}</div>
                                            <div className="text-xs text-gray-400">USD</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* What's Included */}
                        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">What's Included</h3>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { icon: Video, text: "HD Video Call", desc: "Crystal clear video quality" },
                                    { icon: Shield, text: "Secure & Private", desc: "End-to-end encrypted session" },
                                    { icon: BookOpen, text: "Screen Sharing", desc: "Share code, documents & resources" },
                                    { icon: MessageCircle, text: "Session Recording", desc: "Access recording for 30 days" },
                                    { icon: Zap, text: "Follow-up Notes", desc: "Summary and action items" }
                                ].map((item, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <item.icon className="w-4 h-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium text-sm">{item.text}</div>
                                            <div className="text-gray-400 text-xs">{item.desc}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Security Badge */}
                        <motion.div 
                            className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-4 text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                            <div className="text-green-400 font-semibold mb-1">Secure Booking</div>
                            <div className="text-green-300 text-xs">Your payment and data are protected with enterprise-grade security</div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}