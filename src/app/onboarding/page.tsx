'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronRight, ChevronLeft, User, Phone, Globe, BookOpen, Users, Target, Award, Heart, Brain, Code, Briefcase, Palette, Languages, GraduationCap, TrendingUp, Coffee, Clock, UserCheck, MessageCircle, Video, MapPin, Shuffle, Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress'

export const dynamic = 'force-dynamic'

const onboardingSchema = z.object({
    interests: z.array(z.string()).min(1, 'اختر مجال واحد على الأقل'),
    goals: z.array(z.string()).min(1, 'اختر هدف واحد على الأقل'),
    skillLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']),
    learningMode: z.enum(['Self-paced', 'Interactive with group', 'Mixed']),
    studyBuddyOptIn: z.boolean(),
    studyBuddyPreferences: z.object({
        availability: z.string(),
        preferredSubjects: z.array(z.string()),
        collaborationStyle: z.enum(['Chat only', 'Video calls', 'In-person', 'Mixed']),
    }).optional(),
    arabicName: z.string().optional(),
    phone: z.string().optional(),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

const guardianSchema = z.object({
    name: z.string().min(3, 'ادخل اسم الوصي'),
    email: z.string().email('بريد إلكتروني غير صالح'),
    phone: z.string().optional(),
    relationship: z.string().optional(),
})

type GuardianForm = z.infer<typeof guardianSchema>

interface Step {
    id: number
    key: string
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    icon: React.ReactNode
}

const STEPS: Step[] = [
    {
        id: 1,
        key: 'profile',
        title: "Welcome to PRIME",
        titleAr: "مرحباً بك في برايم",
        description: "Let's personalize your learning journey",
        descriptionAr: "دعنا نخصص رحلتك التعليمية",
        icon: <Heart className="w-6 h-6" />
    },
    {
        id: 2,
        key: 'interests',
        title: "Your Interests",
        titleAr: "اهتماماتك",
        description: "What subjects excite you most?",
        descriptionAr: "ما هي المجالات التي تثير اهتمامك؟",
        icon: <Brain className="w-6 h-6" />
    },
    {
        id: 3,
        key: 'goals',
        title: "Your Goals",
        titleAr: "أهدافك",
        description: "What do you want to achieve?",
        descriptionAr: "ماذا تريد أن تحقق؟",
        icon: <Target className="w-6 h-6" />
    },
    {
        id: 4,
        key: 'learning',
        title: "Learning Style",
        titleAr: "أسلوب التعلم",
        description: "How do you prefer to learn?",
        descriptionAr: "كيف تفضل أن تتعلم؟",
        icon: <BookOpen className="w-6 h-6" />
    },
    {
        id: 5,
        key: 'study-buddy',
        title: "Study Buddy",
        titleAr: "رفيق الدراسة",
        description: "Connect with like-minded learners",
        descriptionAr: "تواصل مع متعلمين مثلك",
        icon: <Users className="w-6 h-6" />
    },
    {
        id: 6,
        key: 'safety',
        title: "Safety & Guardian",
        titleAr: "السلامة والوصي",
        description: "Verify guardian approval for minors",
        descriptionAr: "تأكيد موافقة الوصي للطلاب القُصر",
        icon: <Shield className="w-6 h-6" />
    }
]

// Egyptian-specific interests with icons
const INTERESTS = [
    { id: 'technology', nameAr: 'التكنولوجيا والبرمجة', nameEn: 'Technology & Programming', icon: <Code className="w-5 h-5" />, color: 'bg-blue-500' },
    { id: 'business', nameAr: 'الأعمال والتسويق', nameEn: 'Business & Marketing', icon: <Briefcase className="w-5 h-5" />, color: 'bg-green-500' },
    { id: 'design', nameAr: 'التصميم والإبداع', nameEn: 'Design & Creativity', icon: <Palette className="w-5 h-5" />, color: 'bg-purple-500' },
    { id: 'languages', nameAr: 'اللغات والتواصل', nameEn: 'Languages & Communication', icon: <Languages className="w-5 h-5" />, color: 'bg-orange-500' },
    { id: 'health', nameAr: 'الصحة واللياقة', nameEn: 'Health & Fitness', icon: <Heart className="w-5 h-5" />, color: 'bg-red-500' },
    { id: 'education', nameAr: 'التعليم والتطوير', nameEn: 'Education & Development', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-indigo-500' },
]

// Egyptian-specific learning goals
const LEARNING_GOALS = [
    { id: 'thanaweya', nameAr: 'التحضير للثانوية العامة', nameEn: 'Thanaweya Amma Preparation', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'university', nameAr: 'التحضير لامتحانات الجامعة', nameEn: 'University Entrance Prep', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'career-change', nameAr: 'تغيير المسار المهني للتكنولوجيا', nameEn: 'Career Change into Tech', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'english-tourism', nameAr: 'تعلم الإنجليزية لقطاع السياحة', nameEn: 'English for Tourism Sector', icon: <Globe className="w-5 h-5" /> },
    { id: 'skill-development', nameAr: 'تطوير المهارات المهنية', nameEn: 'Professional Skill Development', icon: <Award className="w-5 h-5" /> },
    { id: 'entrepreneurship', nameAr: 'ريادة الأعمال والمشاريع', nameEn: 'Entrepreneurship & Startups', icon: <Briefcase className="w-5 h-5" /> },
    { id: 'freelancing', nameAr: 'العمل الحر والمستقل', nameEn: 'Freelancing & Remote Work', icon: <Coffee className="w-5 h-5" /> },
]

const SKILL_LEVELS = [
    { value: 'Beginner', labelAr: 'مبتدئ', labelEn: 'Beginner', description: 'بداية الطريق', icon: '🌱' },
    { value: 'Intermediate', labelAr: 'متوسط', labelEn: 'Intermediate', description: 'لديك بعض الخبرة', icon: '🌿' },
    { value: 'Advanced', labelAr: 'متقدم', labelEn: 'Advanced', description: 'خبرة جيدة', icon: '🌳' },
]

const LEARNING_MODES = [
    { value: 'Self-paced', labelAr: 'التعلم الذاتي', labelEn: 'Self-paced', description: 'بوقتك الخاص', icon: <User className="w-5 h-5" /> },
    { value: 'Interactive with group', labelAr: 'تفاعلي مع مجموعة', labelEn: 'Interactive with group', description: 'مع الآخرين', icon: <Users className="w-5 h-5" /> },
    { value: 'Mixed', labelAr: 'مختلط', labelEn: 'Mixed', description: 'مزيج من الاثنين', icon: <Users className="w-5 h-5" /> },
]

const AVAILABILITY_OPTIONS = [
    { value: 'mornings', labelAr: 'الصباح (8ص - 12م)', labelEn: 'Mornings (8AM - 12PM)', icon: '🌅' },
    { value: 'afternoons', labelAr: 'بعد الظهر (12م - 5م)', labelEn: 'Afternoons (12PM - 5PM)', icon: '☀️' },
    { value: 'evenings', labelAr: 'المساء (5م - 10م)', labelEn: 'Evenings (5PM - 10PM)', icon: '�' },
    { value: 'weekends', labelAr: 'عطلة نهاية الأسبوع', labelEn: 'Weekends', icon: '🏖️' },
]

const COLLABORATION_STYLES = [
    { value: 'Chat only', labelAr: 'المحادثة فقط', labelEn: 'Chat only', icon: <Globe className="w-5 h-5" /> },
    { value: 'Video calls', labelAr: 'مكالمات فيديو', labelEn: 'Video calls', icon: <Phone className="w-5 h-5" /> },
    { value: 'In-person', labelAr: 'شخصياً', labelEn: 'In-person', icon: <User className="w-5 h-5" /> },
    { value: 'Mixed', labelAr: 'مختلط', labelEn: 'Mixed', icon: <Users className="w-5 h-5" /> },
]

export default function OnboardingPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [lang, setLang] = useState<'en' | 'de'>('en')

    const { register, handleSubmit: handleOnboardingSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingForm>({
        resolver: zodResolver(onboardingSchema),
        defaultValues: {
            interests: [],
            goals: [],
            skillLevel: 'Beginner',
            learningMode: 'Self-paced',
            studyBuddyOptIn: false,
            studyBuddyPreferences: {
                availability: 'evenings',
                preferredSubjects: [],
                collaborationStyle: 'Chat only',
            },
        },
    })

    const watchedValues = watch()

    const { register: guardianRegister, handleSubmit: handleGuardianSubmit, reset: resetGuardian, formState: { errors: guardianErrors } } = useForm<GuardianForm>({
        resolver: zodResolver(guardianSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            relationship: '',
        },
    })

    const [guardianVerificationCode, setGuardianVerificationCode] = useState('')
    const [guardianSubmitting, setGuardianSubmitting] = useState(false)
    const [guardianVerifying, setGuardianVerifying] = useState(false)

    const { status: onboardingStatus, loading: statusLoading, error: statusError, updateStep, initiateGuardian, verifyGuardian } = useOnboardingProgress()

    const guardianRequired = Boolean(onboardingStatus?.guardianRequired && onboardingStatus?.guardianLink?.status !== 'VERIFIED')
    const guardianVerified = onboardingStatus?.guardianLink?.status === 'VERIFIED'

    const handleStepComplete = useCallback(async (stepId: number) => {
        const step = STEPS.find((s) => s.id === stepId)
        if (!step) return

        const payloadMap: Record<string, any> = {
            profile: {
                arabicName: watchedValues.arabicName,
                phone: watchedValues.phone,
            },
            interests: {
                interests: watchedValues.interests,
            },
            goals: {
                goals: watchedValues.goals,
            },
            learning: {
                skillLevel: watchedValues.skillLevel,
                learningMode: watchedValues.learningMode,
            },
            'study-buddy': {
                studyBuddyOptIn: watchedValues.studyBuddyOptIn,
                studyBuddyPreferences: watchedValues.studyBuddyPreferences,
            },
        }

        const data = payloadMap[step.key]
        if (!data) return

        try {
            await updateStep({
                stepKey: step.key,
                data,
                completed: true,
                locale: lang,
            })
        } catch (error) {
            console.error('Failed to update onboarding progress step:', error)
        }
    }, [lang, updateStep, watchedValues])

    const submitGuardianDetails = handleGuardianSubmit(async (formValues) => {
        setGuardianSubmitting(true)
        try {
            await initiateGuardian({
                name: formValues.name,
                email: formValues.email,
                phone: formValues.phone,
                relationship: formValues.relationship,
                locale: lang,
            })
            toast.success(lang === 'de' ? 'Erziehungsberechtigten-Einladung gesendet' : 'Guardian invitation sent')
            resetGuardian()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : (lang === 'de' ? 'Etwas ist schiefgelaufen' : 'Something went wrong'))
        } finally {
            setGuardianSubmitting(false)
        }
    })

    const handleGuardianVerification = async () => {
        if (!guardianVerificationCode) {
            toast.error(lang === 'de' ? 'Verifizierungscode eingeben' : 'Enter the verification code')
            return
        }

        setGuardianVerifying(true)
        try {
            await verifyGuardian(guardianVerificationCode.trim())
            toast.success(lang === 'de' ? 'Erziehungsberechtigter verifiziert' : 'Guardian verified successfully')
            setGuardianVerificationCode('')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : (lang === 'de' ? 'Verifizierung fehlgeschlagen' : 'Verification failed'))
        } finally {
            setGuardianVerifying(false)
        }
    }

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push('/auth/login')
            return
        }

        // Check if user already completed onboarding
        const checkOnboarding = async () => {
            try {
                const response = await fetch('/api/user/profile')
                if (response.ok) {
                    const data = await response.json()
                    if (data.user.onboardingCompleted) {
                        router.push('/dashboard')
                    }
                }
            } catch (error) {
                console.error('Error checking profile:', error)
            }
        }

        checkOnboarding()
    }, [session, status, router])

    const toggleInterest = (interestId: string) => {
        const currentInterests = watchedValues.interests || []
        const newInterests = currentInterests.includes(interestId)
            ? currentInterests.filter(id => id !== interestId)
            : [...currentInterests, interestId]
        setValue('interests', newInterests)
    }

    const toggleGoal = (goalId: string) => {
        const currentGoals = watchedValues.goals || []
        const newGoals = currentGoals.includes(goalId)
            ? currentGoals.filter(id => id !== goalId)
            : [...currentGoals, goalId]
        setValue('goals', newGoals)
    }

    const toggleSubject = (subject: string) => {
        const currentSubjects = watchedValues.studyBuddyPreferences?.preferredSubjects || []
        const newSubjects = currentSubjects.includes(subject)
            ? currentSubjects.filter(s => s !== subject)
            : [...currentSubjects, subject]
        setValue('studyBuddyPreferences.preferredSubjects', newSubjects)
    }

    const onSubmit = async (data: OnboardingForm) => {
        setIsLoading(true)
        console.log('🚀 Starting onboarding submission...')
        console.log('📋 Form data:', data)

        try {
            console.log('📡 Making API request to /api/user/onboarding')
            const response = await fetch('/api/user/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data),
            })

            console.log('📊 Response status:', response.status)
            console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))

            if (response.ok) {
                const result = await response.json()
                console.log('✅ Success response:', result)
                toast.success(lang === 'de' ? 'Registrierung erfolgreich abgeschlossen!' : 'Onboarding completed successfully!')
                router.push('/dashboard')
            } else {
                let errorMessage = 'Unknown error'
                try {
                    const error = await response.json()
                    console.log('❌ Error response body:', error)
                    errorMessage = error.error || error.message || 'Failed to complete onboarding'
                } catch (parseError) {
                    console.log('❌ Could not parse error response:', parseError)
                    const text = await response.text()
                    console.log('❌ Raw response text:', text)
                    errorMessage = text || `HTTP ${response.status} Error`
                }
                toast.error(errorMessage)
            }
        } catch (error) {
            console.log('💥 Network/Fetch error:', error)
            console.log('💥 Error type:', typeof error)
            console.log('💥 Error name:', error instanceof Error ? error.name : 'Unknown')
            console.log('💥 Error message:', error instanceof Error ? error.message : 'Unknown error')
            toast.error(lang === 'de' ? 'Netzwerkfehler' : 'Network error')
        } finally {
            setIsLoading(false)
            console.log('🏁 Onboarding submission finished')
        }
    }

    const nextStep = async () => {
        if (currentStep < STEPS.length) {
            await handleStepComplete(currentStep)
            setCurrentStep(currentStep + 1)
        }
    }

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const getStepContent = () => {
        const currentStepData = STEPS.find(step => step.id === currentStep)

        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'hsl(var(--accent))', opacity: 0.2 }}>
                                <User className="w-10 h-10" style={{ color: 'hsl(var(--accent))' }} />
                            </div>
                            <h3 className="text-2xl font-light text-foreground mb-2">
                                {lang === 'de' ? 'Willkommen bei Prime' : 'Welcome to Prime'}
                            </h3>
                            <p className="text-muted-foreground">
                                {lang === 'de' ? 'Lassen Sie uns Sie besser kennenlernen' : "Let's get to know you better"}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-3">
                                    {lang === 'de' ? 'Arabischer Name (Optional)' : 'Arabic Name (Optional)'}
                                </label>
                                <div className="relative">
                                    <input
                                        {...register('arabicName')}
                                        type="text"
                                        placeholder={lang === 'de' ? 'أحمد محمد' : 'Ahmed Mohamed'}
                                        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': 'hsl(var(--accent))' } as React.CSSProperties}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-3">
                                    {lang === 'de' ? 'Telefonnummer (Optional)' : 'Phone Number (Optional)'}
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        {...register('phone')}
                                        type="tel"
                                        placeholder={lang === 'de' ? '+20 1XX XXX XXXX' : '+20 1XX XXX XXXX'}
                                        className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                                        style={{ '--tw-ring-color': 'hsl(var(--accent))' } as React.CSSProperties}
                                        dir="ltr"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
                                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:bg-gray-700 transition-colors"
                                >
                                    <Globe className="w-4 h-4" />
                                    {lang === 'en' ? 'Deutsch' : 'English'}
                                </button>
                            </div>
                        </div>
                    </div>
                )

            case 2:
                return (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-light text-foreground mb-2">
                                {lang === 'de' ? 'Was sind Ihre Interessen und Ziele?' : 'What are your interests and goals?'}
                            </h3>
                            <p className="text-muted-foreground">
                                {lang === 'de' ? 'Wählen Sie, was zu Ihrer Leidenschaft passt' : 'Choose what matches your passion'}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-lg font-medium text-foreground mb-4">
                                {lang === 'de' ? 'Ihre Interessen' : 'Your Interests'}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {INTERESTS.map((interest) => (
                                    <motion.button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.interests?.includes(interest.id)
                                            ? 'bg-blue-600/20 border-blue-600 text-foreground'
                                            : 'bg-card border-border text-muted-foreground hover:border-gray-600'
                                            }`}
                                    >
                                        <span className="text-2xl">{interest.icon}</span>
                                        <span className="text-sm font-medium text-center">
                                            {lang === 'de' ? interest.nameAr : interest.nameEn}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                            {errors.interests && (
                                <p className="text-sm mt-2" style={{ color: 'hsl(var(--accent))' }}>{errors.interests.message}</p>
                            )}
                        </div>

                        <div>
                            <h4 className="text-lg font-medium text-foreground mb-4">
                                {lang === 'de' ? 'Ihre Lernziele' : 'Your Learning Goals'}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {LEARNING_GOALS.map((goal) => (
                                    <motion.button
                                        key={goal.id}
                                        type="button"
                                        onClick={() => toggleGoal(goal.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.goals?.includes(goal.id)
                                            ? 'bg-green-600/20 border-green-600 text-foreground'
                                            : 'bg-card border-border text-muted-foreground hover:border-gray-600'
                                            }`}
                                    >
                                        <span className="text-2xl">{goal.icon}</span>
                                        <span className="text-sm font-medium text-center">
                                            {lang === 'de' ? goal.nameAr : goal.nameEn}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                            {errors.goals && (
                                <p className="text-sm mt-2" style={{ color: 'hsl(var(--accent))' }}>{errors.goals.message}</p>
                            )}
                        </div>
                    </div>
                )

            case 3:
                return (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-10 h-10 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-light text-foreground mb-2">
                                {lang === 'de' ? 'Wie lernen Sie am liebsten?' : 'How do you prefer to learn?'}
                            </h3>
                            <p className="text-muted-foreground">
                                {lang === 'de' ? 'Wählen Sie Ihren idealen Lernstil' : 'Choose your ideal learning style'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-4">
                                {lang === 'de' ? 'Was ist Ihr aktuelles Kompetenzniveau?' : 'What is your current skill level?'}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                                    <motion.button
                                        key={level}
                                        type="button"
                                        onClick={() => setValue('skillLevel', level as any)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${watchedValues.skillLevel === level
                                            ? 'bg-purple-600/20 border-purple-600 text-foreground'
                                            : 'bg-card border-border text-muted-foreground hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">
                                            {level === 'Beginner' ? '🌱' : level === 'Intermediate' ? '🌿' : '🌳'}
                                        </div>
                                        <div className="font-medium">
                                            {lang === 'de' ?
                                                level === 'Beginner' ? 'مبتدئ' :
                                                    level === 'Intermediate' ? 'متوسط' : 'متقدم'
                                                : level}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-4">
                                {lang === 'de' ? 'Was ist Ihr bevorzugter Lernmodus?' : 'What is your preferred learning mode?'}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['Self-paced', 'Interactive with group', 'Mixed'].map((mode) => (
                                    <motion.button
                                        key={mode}
                                        type="button"
                                        onClick={() => setValue('learningMode', mode as any)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${watchedValues.learningMode === mode
                                            ? 'bg-purple-600/20 border-purple-600 text-foreground'
                                            : 'bg-card border-border text-muted-foreground hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">
                                            {mode === 'Self-paced' ? '🎧' : mode === 'Interactive with group' ? '👥' : '🔄'}
                                        </div>
                                        <div className="font-medium">
                                            {lang === 'de' ?
                                                mode === 'Self-paced' ? 'Selbstgesteuert' :
                                                    mode === 'Interactive with group' ? 'Interaktiv mit Gruppe' : 'Gemischt'
                                                : mode}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                )

            case 4:
                return (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-light text-foreground mb-2">
                                {lang === 'de' ? 'Lernpartner' : 'Study Buddy'}
                            </h3>
                            <p className="text-muted-foreground">
                                {lang === 'de' ? 'Verbinden Sie sich mit anderen Lernenden und lernen Sie gemeinsam' : 'Connect with other learners and study together'}
                            </p>
                        </div>

                        {/* Study Buddy Opt-in */}
                        <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
                            <div className="flex items-center space-x-4">
                                <input
                                    type="checkbox"
                                    id="studyBuddyOptIn"
                                    {...register('studyBuddyOptIn')}
                                    className="w-5 h-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                                />
                                <label htmlFor="studyBuddyOptIn" className="text-foreground font-medium cursor-pointer">
                                    {lang === 'de' ? 'Ich möchte einen Lernpartner finden' : 'I want to find a study buddy'}
                                </label>
                            </div>
                            <p className="text-muted-foreground text-sm mt-2 ml-9">
                                {lang === 'de' ? 'Verbinden Sie sich mit Lernenden, die Ihre Interessen und Ziele teilen' : 'Connect with learners who share your interests and goals'}
                            </p>
                        </div>

                        {/* Study Buddy Preferences - Only show if opted in */}
                        {watchedValues.studyBuddyOptIn && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-3">
                                        {lang === 'de' ? 'Wann sind Sie zum Lernen verfügbar?' : 'When are you available for studying?'}
                                    </label>
                                    <select
                                        {...register('studyBuddyPreferences.availability')}
                                        className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                                    >
                                        <option value="mornings">{lang === 'de' ? 'Morgens' : 'Mornings'}</option>
                                        <option value="afternoons">{lang === 'de' ? 'Nachmittags' : 'Afternoons'}</option>
                                        <option value="evenings">{lang === 'de' ? 'Abends' : 'Evenings'}</option>
                                        <option value="weekends">{lang === 'de' ? 'Wochenenden' : 'Weekends'}</option>
                                        <option value="flexible">{lang === 'de' ? 'Flexibel' : 'Flexible'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-3">
                                        {lang === 'de' ? 'Welche Fächer lernen Sie am liebsten?' : 'What subjects do you prefer to study?'}
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {watchedValues.interests?.map((interest) => {
                                            const interestData = INTERESTS.find(i => i.id === interest)
                                            return (
                                                <motion.button
                                                    key={interest}
                                                    type="button"
                                                    onClick={() => toggleSubject(interest)}
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.studyBuddyPreferences?.preferredSubjects?.includes(interest)
                                                        ? 'bg-green-600/20 border-green-600 text-foreground'
                                                        : 'bg-card border-border text-muted-foreground hover:border-gray-600'
                                                        }`}
                                                >
                                                    <span className="text-xl">{interestData?.icon}</span>
                                                    <span className="text-xs font-medium text-center">
                                                        {lang === 'de' ? interestData?.nameAr : interestData?.nameEn}
                                                    </span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-3">
                                        {lang === 'de' ? 'Wie arbeiten Sie bevorzugt zusammen?' : 'How do you prefer to collaborate?'}
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['Chat only', 'Video calls', 'In-person', 'Mixed'].map((style) => (
                                            <motion.button
                                                key={style}
                                                type="button"
                                                onClick={() => setValue('studyBuddyPreferences.collaborationStyle', style as any)}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.studyBuddyPreferences?.collaborationStyle === style
                                                    ? 'bg-green-600/20 border-green-600 text-foreground'
                                                    : 'bg-card border-border text-muted-foreground hover:border-gray-600'
                                                    }`}
                                            >
                                                <div className="text-2xl">
                                                    {style === 'Chat only' ? '💬' : style === 'Video calls' ? '📹' : style === 'In-person' ? '🤝' : '🔄'}
                                                </div>
                                                <div className="text-sm font-medium text-center">
                                                    {lang === 'de' ?
                                                        style === 'Chat only' ? 'دردشة فقط' :
                                                            style === 'Video calls' ? 'مكالمات فيديو' :
                                                                style === 'In-person' ? 'لقاء شخصي' : 'مختلط'
                                                        : style}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 5:
                return (
                    <div className="space-y-8">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="w-10 h-10 text-yellow-600" />
                            </div>
                            <h3 className="text-2xl font-light text-foreground mb-2">
                                {lang === 'de' ? 'Überprüfen Sie Ihr Profil' : 'Review your profile'}
                            </h3>
                            <p className="text-muted-foreground">
                                {lang === 'de' ? 'Stellen Sie sicher, dass alles korrekt ist' : 'Make sure everything looks correct'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-border rounded-xl p-6">
                                <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-400" />
                                    {lang === 'de' ? 'Grundlegende Informationen' : 'Basic Info'}
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{lang === 'de' ? 'Name:' : 'Name:'}</span>
                                        <span className="text-foreground">{session?.user?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{lang === 'de' ? 'E-Mail:' : 'Email:'}</span>
                                        <span className="text-foreground">{session?.user?.email}</span>
                                    </div>
                                    {watchedValues.arabicName && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{lang === 'de' ? 'Arabischer Name:' : 'Arabic Name:'}</span>
                                            <span className="text-foreground">{watchedValues.arabicName}</span>
                                        </div>
                                    )}
                                    {watchedValues.phone && (
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{lang === 'de' ? 'Telefon:' : 'Phone:'}</span>
                                            <span className="text-foreground">{watchedValues.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-800/50 backdrop-blur-sm border border-border rounded-xl p-6">
                                <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-green-400" />
                                    {lang === 'de' ? 'Interessen & Ziele' : 'Interests & Goals'}
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-muted-foreground text-sm mb-2">{lang === 'de' ? 'Interessen:' : 'Interests:'}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {watchedValues.interests?.map((interest) => {
                                                const interestData = INTERESTS.find(i => i.id === interest)
                                                return (
                                                    <span key={interest} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                                                        {lang === 'de' ? interestData?.nameAr : interestData?.nameEn}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground text-sm mb-2">{lang === 'de' ? 'Ziele:' : 'Goals:'}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {watchedValues.goals?.map((goal) => {
                                                const goalData = LEARNING_GOALS.find(g => g.id === goal)
                                                return (
                                                    <span key={goal} className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                                                        {lang === 'de' ? goalData?.nameAr : goalData?.nameEn}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 backdrop-blur-sm border border-border rounded-xl p-6">
                                <h4 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    {lang === 'de' ? 'Lernpräferenzen' : 'Study Preferences'}
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{lang === 'de' ? 'Niveau:' : 'Level:'}</span>
                                        <span className="text-foreground">{watchedValues.skillLevel}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{lang === 'de' ? 'Modus:' : 'Mode:'}</span>
                                        <span className="text-foreground">{watchedValues.learningMode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{lang === 'de' ? 'Lernpartner:' : 'Study Buddy:'}</span>
                                        <span className="text-foreground">
                                            {watchedValues.studyBuddyOptIn
                                                ? (lang === 'de' ? 'Ja' : 'Yes')
                                                : (lang === 'de' ? 'Nein' : 'No')
                                            }
                                        </span>
                                    </div>
                                    {watchedValues.studyBuddyOptIn && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{lang === 'de' ? 'Verfügbarkeit:' : 'Availability:'}</span>
                                                <span className="text-foreground">{watchedValues.studyBuddyPreferences?.availability}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{lang === 'de' ? 'Zusammenarbeit:' : 'Collaboration:'}</span>
                                                <span className="text-foreground">{watchedValues.studyBuddyPreferences?.collaborationStyle}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )

            case 6:
                return (
                    <div className="space-y-8">
                        {statusLoading ? (
                            <div className="animate-pulse space-y-4">
                                <div className="h-24 bg-card rounded-2xl" />
                                <div className="h-48 bg-card rounded-2xl" />
                            </div>
                        ) : (
                            <>
                                <div className={`border rounded-2xl p-6 flex items-start gap-4 ${guardianVerified ? 'border-green-500/40 bg-green-500/5' : guardianRequired ? 'border-yellow-500/40 bg-yellow-500/5' : 'border-border bg-card'}`}>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: guardianVerified ? 'rgba(34,197,94,0.2)' : 'rgba(234,179,8,0.2)' }}>
                                        {guardianVerified ? (
                                            <ShieldCheck className="w-6 h-6 text-green-400" />
                                        ) : (
                                            <ShieldAlert className="w-6 h-6 text-yellow-400" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-xl font-semibold text-foreground">
                                            {guardianVerified
                                                ? (lang === 'de' ? 'تم التحقق من الوصي' : 'Guardian Verified')
                                                : guardianRequired
                                                    ? (lang === 'de' ? 'مطلوب موافقة الوصي' : 'Guardian approval required')
                                                    : (lang === 'de' ? 'لا حاجة لوصي' : 'No guardian required')}
                                        </h4>
                                        <p className="text-muted-foreground">
                                            {guardianVerified
                                                ? (lang === 'de' ? 'يمكنك الآن الوصول الكامل لجميع الميزات.' : 'Full access unlocked for your account.')
                                                : guardianRequired
                                                    ? (lang === 'de'
                                                        ? 'لأن عمرك أقل من 18 سنة، نحتاج إلى موافقة الوصي لإكمال الحساب.'
                                                        : 'Because you are under 18, we need a guardian to approve your account.')
                                                    : (lang === 'de' ? 'يمكنك إكمال التسجيل بدون خطوات إضافية.' : 'You can complete onboarding without extra steps.')}
                                        </p>
                                        {statusError && (
                                            <p className="text-sm text-red-400">
                                                {statusError}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {guardianRequired ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="border border-border rounded-2xl p-6 bg-card">
                                            <h5 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                                <UserCheck className="w-5 h-5" />
                                                {lang === 'de' ? 'تفاصيل الوصي' : 'Guardian details'}
                                            </h5>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm text-muted-foreground mb-1">
                                                        {lang === 'de' ? 'اسم الوصي' : 'Guardian Name'}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        {...guardianRegister('name')}
                                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                                                    />
                                                    {guardianErrors.name && (
                                                        <p className="text-sm text-red-400 mt-1">{guardianErrors.name.message}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-muted-foreground mb-1">
                                                        {lang === 'de' ? 'البريد الإلكتروني للوصي' : 'Guardian Email'}
                                                    </label>
                                                    <input
                                                        type="email"
                                                        {...guardianRegister('email')}
                                                        className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                                                        dir="ltr"
                                                    />
                                                    {guardianErrors.email && (
                                                        <p className="text-sm text-red-400 mt-1">{guardianErrors.email.message}</p>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm text-muted-foreground mb-1">
                                                            {lang === 'de' ? 'رقم الهاتف' : 'Phone'}
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            {...guardianRegister('phone')}
                                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-muted-foreground mb-1">
                                                            {lang === 'de' ? 'صلة القرابة' : 'Relationship'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            {...guardianRegister('relationship')}
                                                            className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={submitGuardianDetails}
                                                    disabled={guardianSubmitting}
                                                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-3 transition disabled:opacity-50"
                                                >
                                                    {guardianSubmitting ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <ShieldCheck className="w-5 h-5" />
                                                    )}
                                                    {guardianSubmitting
                                                        ? (lang === 'de' ? 'جاري الإرسال...' : 'Sending...')
                                                        : (lang === 'de' ? 'إرسال دعوة للوصي' : 'Send guardian invitation')}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="border border-border rounded-2xl p-6 bg-card flex flex-col gap-4">
                                            <h5 className="text-lg font-semibold text-foreground">
                                                {lang === 'de' ? 'رمز التحقق من الوصي' : 'Guardian verification code'}
                                            </h5>
                                            <p className="text-sm text-muted-foreground">
                                                {lang === 'de'
                                                    ? 'اطلب من الوصي إدخال الرمز الذي وصله عبر البريد الإلكتروني.'
                                                    : 'Ask your guardian to share the code they received by email.'}
                                            </p>
                                            <input
                                                type="text"
                                                value={guardianVerificationCode}
                                                onChange={(e) => setGuardianVerificationCode(e.target.value.toUpperCase())}
                                                className="w-full bg-background border border-border rounded-xl px-4 py-3 tracking-widest text-center text-lg"
                                                placeholder="A1B2C3"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleGuardianVerification}
                                                disabled={guardianVerifying}
                                                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-3 transition disabled:opacity-50"
                                            >
                                                {guardianVerifying ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <CheckCircle className="w-5 h-5" />
                                                )}
                                                {guardianVerifying
                                                    ? (lang === 'de' ? 'يتم التحقق...' : 'Verifying...')
                                                    : (lang === 'de' ? 'تأكيد الرمز' : 'Verify code')}
                                            </button>
                                            {onboardingStatus?.guardianLink?.expiresAt && (
                                                <div className="text-xs text-muted-foreground text-center">
                                                    {lang === 'de' ? 'تنتهي صلاحية الرمز في' : 'Code expires on'}{' '}
                                                    {new Date(onboardingStatus.guardianLink.expiresAt).toLocaleDateString(lang === 'de' ? 'ar-EG' : 'en-EG')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <p>
                                            {lang === 'de'
                                                ? 'لا حاجة لخطوات إضافية. اضغط إكمال لإنهاء التسجيل.'
                                                : 'No additional verification required. Click complete to finish onboarding.'}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )

            default:
                return null
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-foreground text-lg">Loading...</div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
                <div className="absolute inset-0 opacity-30">
                    <div className="w-full h-full bg-gradient-to-r from-red-900/10 via-emerald-900/10 to-blue-900/10" />
                </div>
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-background rounded-full opacity-20"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -100, 0],
                            opacity: [0.2, 0.6, 0.2],
                        }}
                        transition={{
                            duration: 6 + Math.random() * 4,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                        }}
                    />
                ))}
            </div>

            {/* Header */}
            <div className="relative z-10 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--accent))' }}>
                                <span className="text-foreground font-bold text-lg">ب</span>
                            </div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {lang === 'de' ? 'إكمال التسجيل' : 'Complete Your Profile'}
                            </h1>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {lang === 'de' ? 'خطوة' : 'Step'} {currentStep} {lang === 'de' ? 'من' : 'of'} {STEPS.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 bg-background/60 backdrop-blur-sm border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <motion.div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${step.id <= currentStep
                                        ? 'text-foreground'
                                        : 'bg-card border-border text-muted-foreground'
                                        }`}
                                    style={step.id <= currentStep ? { backgroundColor: 'hsl(var(--accent))', borderColor: 'hsl(var(--accent))' } : undefined}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <span className="font-medium">{step.id}</span>
                                </motion.div>
                                {index < STEPS.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-4">
                                        <motion.div
                                            className={`h-full transition-all duration-300 ${step.id < currentStep ? '' : 'bg-gray-700'}`}
                                            style={step.id < currentStep ? { backgroundColor: 'hsl(var(--accent))' } : undefined}
                                            initial={{ width: 0 }}
                                            animate={{ width: step.id < currentStep ? '100%' : '0%' }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <form onSubmit={handleOnboardingSubmit(onSubmit)}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="bg-gray-900/80 backdrop-blur-sm border border-border rounded-2xl p-8 mb-8"
                            >
                                <div className="mb-8 text-center">
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <div className="" style={{ color: 'hsl(var(--accent))' }}>
                                            {STEPS[currentStep - 1].icon}
                                        </div>
                                        <h2 className="text-3xl font-light text-foreground">
                                            {lang === 'de' ? STEPS[currentStep - 1].titleAr : STEPS[currentStep - 1].title}
                                        </h2>
                                    </div>
                                    <p className="text-muted-foreground text-lg">
                                        {lang === 'de' ? STEPS[currentStep - 1].descriptionAr : STEPS[currentStep - 1].description}
                                    </p>
                                </div>

                                {getStepContent()}
                            </motion.div>
                        </AnimatePresence>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center">
                            <motion.button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-muted-foreground hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                {lang === 'de' ? 'السابق' : 'Previous'}
                            </motion.button>

                            <div className="flex gap-3">
                                {currentStep < STEPS.length ? (
                                    <motion.button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex items-center gap-2 px-8 py-3 text-foreground rounded-xl hover:opacity-90 transition-all"
                                        style={{ backgroundColor: 'hsl(var(--accent))' }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {lang === 'de' ? 'التالي' : 'Next'}
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-foreground rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                {lang === 'de' ? 'جاري الحفظ...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {lang === 'de' ? 'إكمال التسجيل' : 'Complete Onboarding'}
                                            </>
                                        )}
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    )
}
