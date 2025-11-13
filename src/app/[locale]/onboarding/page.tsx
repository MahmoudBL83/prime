'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, ChevronRight, ChevronLeft, User, Phone, Globe, BookOpen, Users, Target, Award, Heart, Brain, Code, Briefcase, Palette, Languages, GraduationCap, TrendingUp, Coffee, Clock, UserCheck, MessageCircle, Video, MapPin, Shuffle } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'

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
    age: z.string().min(1, 'Please select your age range'),
    avatar: z.string().min(1, 'Please select an avatar'),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

interface Step {
    id: number
    title: string
    titleAr: string
    description: string
    descriptionAr: string
    icon: React.ReactNode
}

const STEPS: Step[] = [
    {
        id: 1,
        title: "Welcome to PRIME",
        titleAr: "مرحباً بك في برايم",
        description: "Let's personalize your learning journey",
        descriptionAr: "دعنا نخصص رحلتك التعليمية",
        icon: <Heart className="w-6 h-6" />
    },
    {
        id: 2,
        title: "Your Interests",
        titleAr: "اهتماماتك",
        description: "What subjects excite you most?",
        descriptionAr: "ما هي المجالات التي تثير اهتمامك؟",
        icon: <Brain className="w-6 h-6" />
    },
    {
        id: 3,
        title: "Your Goals",
        titleAr: "أهدافك",
        description: "What do you want to achieve?",
        descriptionAr: "ماذا تريد أن تحقق؟",
        icon: <Target className="w-6 h-6" />
    },
    {
        id: 4,
        title: "Learning Style",
        titleAr: "أسلوب التعلم",
        description: "How do you prefer to learn?",
        descriptionAr: "كيف تفضل أن تتعلم؟",
        icon: <BookOpen className="w-6 h-6" />
    },
    {
        id: 5,
        title: "Study Buddy",
        titleAr: "رفيق الدراسة",
        description: "Connect with like-minded learners",
        descriptionAr: "تواصل مع متعلمين مثلك",
        icon: <Users className="w-6 h-6" />
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
    { value: 'evenings', labelAr: 'المساء (5م - 10م)', labelEn: 'Evenings (5PM - 10PM)', icon: '🌙' },
    { value: 'weekends', labelAr: 'عطلة نهاية الأسبوع', labelEn: 'Weekends', icon: '🏖️' },
]

const COLLABORATION_STYLES = [
    { value: 'Chat only', labelAr: 'المحادثة فقط', labelEn: 'Chat only', icon: <Globe className="w-5 h-5" /> },
    { value: 'Video calls', labelAr: 'مكالمات فيديو', labelEn: 'Video calls', icon: <Phone className="w-5 h-5" /> },
    { value: 'In-person', labelAr: 'شخصياً', labelEn: 'In-person', icon: <User className="w-5 h-5" /> },
    { value: 'Mixed', labelAr: 'مختلط', labelEn: 'Mixed', icon: <Users className="w-5 h-5" /> },
]

const AGE_RANGES = [
    { value: '13-17', labelAr: '13-17 سنة', labelEn: '13-17 years', icon: '🧒' },
    { value: '18-24', labelAr: '18-24 سنة', labelEn: '18-24 years', icon: '👨‍🎓' },
    { value: '25-34', labelAr: '25-34 سنة', labelEn: '25-34 years', icon: '👨‍💼' },
    { value: '35-44', labelAr: '35-44 سنة', labelEn: '35-44 years', icon: '👨‍🏫' },
    { value: '45+', labelAr: '45+ سنة', labelEn: '45+ years', icon: '👴' },
]

const AVATAR_OPTIONS = [
    { id: 'avatar1', name: 'Creative', emoji: '🎨', color: 'bg-purple-500' },
    { id: 'avatar2', name: 'Tech', emoji: '💻', color: 'bg-blue-500' },
    { id: 'avatar3', name: 'Business', emoji: '💼', color: 'bg-green-500' },
    { id: 'avatar4', name: 'Science', emoji: '🔬', color: 'bg-red-500' },
    { id: 'avatar5', name: 'Sports', emoji: '⚽', color: 'bg-yellow-500' },
    { id: 'avatar6', name: 'Music', emoji: '🎵', color: 'bg-pink-500' },
    { id: 'avatar7', name: 'Travel', emoji: '✈️', color: 'bg-indigo-500' },
    { id: 'avatar8', name: 'Reading', emoji: '📚', color: 'bg-orange-500' },
]

export default function OnboardingPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [showCelebration, setShowCelebration] = useState(false)
    const locale = useLocale()
    const [lang, setLang] = useState<'en' | 'ar'>(locale === 'ar' ? 'ar' : 'en')
    const t = useTranslations('onboarding')

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OnboardingForm>({
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
            age: '',
            avatar: '',
        },
    })

    const watchedValues = watch()

    useEffect(() => {
        if (status === 'loading') return
        if (!session) {
            router.push(`/${locale}/auth/login`)
            return
        }

        // Check if user already completed onboarding
        const checkOnboarding = async () => {
            try {
                const response = await fetch('/api/user/profile')
                if (response.ok) {
                    const data = await response.json()
                    if (data.user.onboardingCompleted) {
                        router.push(`/${locale}/dashboard`)
                    }
                }
            } catch (error) {
                console.error('Error checking profile:', error)
            }
        }

        checkOnboarding()
    }, [session, status, router, locale])

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
                toast.success(lang === 'ar' ? 'تم إكمال التسجيل بنجاح!' : 'Onboarding completed successfully!')
                setShowCelebration(true)

                // Wait for celebration animation to complete before redirecting
                setTimeout(() => {
                    router.push(`/${locale}/dashboard`)
                }, 3000)
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
            toast.error(lang === 'ar' ? 'خطأ في الشبكة' : 'Network error')
        } finally {
            setIsLoading(false)
            console.log('🏁 Onboarding submission finished')
        }
    }

    const nextStep = () => {
        if (currentStep < STEPS.length) {
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
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--accent)', opacity: 0.2 }}>
                                <User className="w-10 h-10" style={{ color: 'var(--accent)' }} />
                            </div>
                            <h3 className="text-2xl font-light text-white mb-2">
                                {lang === 'ar' ? 'مرحباً بك في برايم' : 'Welcome to Prime'}
                            </h3>
                            <p className="text-gray-400">
                                {lang === 'ar' ? 'دعنا نعرف المزيد عنك' : "Let's get to know you better"}
                            </p>
                        </div>

                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                                    {(() => {
                                        const avatar = AVATAR_OPTIONS.find(a => a.id === watchedValues.avatar);
                                        return avatar ? (
                                            <span className="text-4xl">{avatar.emoji}</span>
                                        ) : (
                                            <User className="w-10 h-10 text-gray-500" />
                                        );
                                    })()}
                                </div>
                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-900 px-3 py-1 rounded-full text-xs text-gray-400 border border-gray-700">
                                    {lang === 'ar' ? 'معاينة' : 'Preview'}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    {lang === 'ar' ? 'اختر فئة عمرك' : 'Select your age range'}
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {AGE_RANGES.map((ageRange) => (
                                        <motion.button
                                            key={ageRange.value}
                                            type="button"
                                            onClick={() => setValue('age', ageRange.value)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.age === ageRange.value
                                                ? 'bg-blue-600/20 border-blue-600 text-white'
                                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                                }`}
                                        >
                                            <span className="text-2xl">{ageRange.icon}</span>
                                            <span className="text-sm font-medium text-center">
                                                {lang === 'ar' ? ageRange.labelAr : ageRange.labelEn}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                                {errors.age && (
                                    <p className="text-sm mt-2" style={{ color: 'var(--accent)' }}>{errors.age.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    {lang === 'ar' ? 'اختر صورتك الرمزية' : 'Choose your avatar'}
                                </label>
                                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                                    {AVATAR_OPTIONS.map((avatar) => (
                                        <motion.button
                                            key={avatar.id}
                                            type="button"
                                            onClick={() => setValue('avatar', avatar.id)}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.avatar === avatar.id
                                                ? `${avatar.color} border-transparent text-white`
                                                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                                }`}
                                        >
                                            <span className="text-2xl">{avatar.emoji}</span>
                                            <span className="text-xs font-medium text-center">
                                                {lang === 'ar' ? avatar.name : avatar.name}
                                            </span>
                                        </motion.button>
                                    ))}
                                </div>
                                {errors.avatar && (
                                    <p className="text-sm mt-2" style={{ color: 'var(--accent)' }}>{errors.avatar.message}</p>
                                )}
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
                            <h3 className="text-2xl font-light text-white mb-2">
                                {lang === 'ar' ? 'ما هي اهتماماتك وأهدافك؟' : 'What are your interests and goals?'}
                            </h3>
                            <p className="text-gray-400">
                                {lang === 'ar' ? 'اختر ما يناسب شغفك' : 'Choose what matches your passion'}
                            </p>
                        </div>

                        <div>
                            <h4 className="text-lg font-medium text-white mb-4">
                                {lang === 'ar' ? 'اهتماماتك' : 'Your Interests'}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {INTERESTS.map((interest) => (
                                    <motion.button
                                        key={interest.id}
                                        type="button"
                                        onClick={() => toggleInterest(interest.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        animate={{
                                            scale: watchedValues.interests?.includes(interest.id) ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.interests?.includes(interest.id)
                                            ? 'bg-blue-600/20 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        <motion.span
                                            className="text-2xl"
                                            animate={{ rotate: watchedValues.interests?.includes(interest.id) ? [0, 10, -10, 0] : 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {interest.icon}
                                        </motion.span>
                                        <span className="text-sm font-medium text-center">
                                            {lang === 'ar' ? interest.nameAr : interest.nameEn}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                            {errors.interests && (
                                <p className="text-sm mt-2" style={{ color: 'var(--accent)' }}>{errors.interests.message}</p>
                            )}
                        </div>

                        <div>
                            <h4 className="text-lg font-medium text-white mb-4">
                                {lang === 'ar' ? 'أهدافك التعليمية' : 'Your Learning Goals'}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {LEARNING_GOALS.map((goal) => (
                                    <motion.button
                                        key={goal.id}
                                        type="button"
                                        onClick={() => toggleGoal(goal.id)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        animate={{
                                            scale: watchedValues.goals?.includes(goal.id) ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${watchedValues.goals?.includes(goal.id)
                                            ? 'bg-green-600/20 border-green-600 text-white shadow-lg shadow-green-600/20'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        <motion.span
                                            className="text-2xl"
                                            animate={{ rotate: watchedValues.goals?.includes(goal.id) ? [0, 10, -10, 0] : 0 }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {goal.icon}
                                        </motion.span>
                                        <span className="text-sm font-medium text-center">
                                            {lang === 'ar' ? goal.nameAr : goal.nameEn}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>
                            {errors.goals && (
                                <p className="text-sm mt-2" style={{ color: 'var(--accent)' }}>{errors.goals.message}</p>
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
                            <h3 className="text-2xl font-light text-white mb-2">
                                {lang === 'ar' ? 'كيف تفضل أن تتعلم؟' : 'How do you prefer to learn?'}
                            </h3>
                            <p className="text-gray-400">
                                {lang === 'ar' ? 'اختر أسلوب التعلم المثالي لك' : 'Choose your ideal learning style'}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-4">
                                {lang === 'ar' ? 'ما هو مستوى مهاراتك الحالي؟' : 'What is your current skill level?'}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                                    <motion.button
                                        key={level}
                                        type="button"
                                        onClick={() => setValue('skillLevel', level as any)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        animate={{
                                            scale: watchedValues.skillLevel === level ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${watchedValues.skillLevel === level
                                            ? 'bg-purple-600/20 border-purple-600 text-white shadow-lg shadow-purple-600/20'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        <motion.div
                                            className="text-3xl mb-2"
                                            animate={{
                                                y: watchedValues.skillLevel === level ? [0, -5, 0] : 0,
                                                scale: watchedValues.skillLevel === level ? [1, 1.2, 1] : 1
                                            }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {level === 'Beginner' ? '🌱' : level === 'Intermediate' ? '🌿' : '🌳'}
                                        </motion.div>
                                        <div className="font-medium">
                                            {lang === 'ar' ?
                                                level === 'Beginner' ? 'مبتدئ' :
                                                    level === 'Intermediate' ? 'متوسط' : 'متقدم'
                                                : level}
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-4">
                                {lang === 'ar' ? 'ما هو نمط التعلم المفضل لديك؟' : 'What is your preferred learning mode?'}
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {['Self-paced', 'Interactive with group', 'Mixed'].map((mode) => (
                                    <motion.button
                                        key={mode}
                                        type="button"
                                        onClick={() => setValue('learningMode', mode as any)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        animate={{
                                            scale: watchedValues.learningMode === mode ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{ duration: 0.3 }}
                                        className={`p-6 rounded-xl border-2 transition-all duration-200 text-center ${watchedValues.learningMode === mode
                                            ? 'bg-purple-600/20 border-purple-600 text-white shadow-lg shadow-purple-600/20'
                                            : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                            }`}
                                    >
                                        <motion.div
                                            className="text-3xl mb-2"
                                            animate={{
                                                y: watchedValues.learningMode === mode ? [0, -5, 0] : 0,
                                                scale: watchedValues.learningMode === mode ? [1, 1.2, 1] : 1
                                            }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {mode === 'Self-paced' ? '🎧' : mode === 'Interactive with group' ? '👥' : '🔄'}
                                        </motion.div>
                                        <div className="font-medium">
                                            {lang === 'ar' ?
                                                mode === 'Self-paced' ? 'التعلم الذاتي' :
                                                    mode === 'Interactive with group' ? 'تفاعلي مع مجموعة' : 'مختلط'
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
                            <h3 className="text-2xl font-light text-white mb-2">
                                {lang === 'ar' ? 'رفيق الدراسة' : 'Study Buddy'}
                            </h3>
                            <p className="text-gray-400">
                                {lang === 'ar' ? 'تواصل مع متعلمين آخرين وادرسوا معاً' : 'Connect with other learners and study together'}
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
                                <label htmlFor="studyBuddyOptIn" className="text-white font-medium cursor-pointer">
                                    {lang === 'ar' ? 'أريد العثور على رفيق دراسة' : 'I want to find a study buddy'}
                                </label>
                            </div>
                            <p className="text-gray-400 text-sm mt-2 ml-9">
                                {lang === 'ar' ? 'تواصل مع متعلمين يشاركونك نفس الاهتمامات والأهداف' : 'Connect with learners who share your interests and goals'}
                            </p>
                        </div>

                        {/* Study Buddy Preferences - Only show if opted in */}
                        {watchedValues.studyBuddyOptIn && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        {lang === 'ar' ? 'متى تكون متاحًا للدراسة؟' : 'When are you available for studying?'}
                                    </label>
                                    <select
                                        {...register('studyBuddyPreferences.availability')}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all"
                                    >
                                        <option value="mornings">{lang === 'ar' ? 'الصباح' : 'Mornings'}</option>
                                        <option value="afternoons">{lang === 'ar' ? 'بعد الظهر' : 'Afternoons'}</option>
                                        <option value="evenings">{lang === 'ar' ? 'المساء' : 'Evenings'}</option>
                                        <option value="weekends">{lang === 'ar' ? 'عطلات نهاية الأسبوع' : 'Weekends'}</option>
                                        <option value="flexible">{lang === 'ar' ? 'مرن' : 'Flexible'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        {lang === 'ar' ? 'ما المواد التي تفضل الدراسة فيها؟' : 'What subjects do you prefer to study?'}
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
                                                        ? 'bg-green-600/20 border-green-600 text-white'
                                                        : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                                        }`}
                                                >
                                                    <span className="text-xl">{interestData?.icon}</span>
                                                    <span className="text-xs font-medium text-center">
                                                        {lang === 'ar' ? interestData?.nameAr : interestData?.nameEn}
                                                    </span>
                                                </motion.button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        {lang === 'ar' ? 'كيف تفضل التواصل؟' : 'How do you prefer to collaborate?'}
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
                                                    ? 'bg-green-600/20 border-green-600 text-white'
                                                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                                    }`}
                                            >
                                                <div className="text-2xl">
                                                    {style === 'Chat only' ? '💬' : style === 'Video calls' ? '📹' : style === 'In-person' ? '🤝' : '🔄'}
                                                </div>
                                                <div className="text-sm font-medium text-center">
                                                    {lang === 'ar' ?
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
                            <h3 className="text-2xl font-light text-white mb-2">
                                {lang === 'ar' ? 'راجع ملفك الشخصي' : 'Review your profile'}
                            </h3>
                            <p className="text-gray-400">
                                {lang === 'ar' ? 'تأكد من أن كل شيء صحيح' : 'Make sure everything looks correct'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                                <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-400" />
                                    {lang === 'ar' ? 'المعلومات الأساسية' : 'Basic Info'}
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{lang === 'ar' ? 'الاسم:' : 'Name:'}</span>
                                        <span className="text-white">{session?.user?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{lang === 'ar' ? 'البريد:' : 'Email:'}</span>
                                        <span className="text-white">{session?.user?.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{lang === 'ar' ? 'العمر:' : 'Age:'}</span>
                                        <span className="text-white">{watchedValues.age}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{lang === 'ar' ? 'الصورة الرمزية:' : 'Avatar:'}</span>
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const avatar = AVATAR_OPTIONS.find(a => a.id === watchedValues.avatar);
                                                return avatar ? (
                                                    <>
                                                        <span className="text-xl">{avatar.emoji}</span>
                                                        <span className="text-white">{avatar.name}</span>
                                                    </>
                                                ) : null;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                                <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-green-400" />
                                    {lang === 'ar' ? 'الاهتمامات والأهداف' : 'Interests & Goals'}
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-gray-400 text-sm mb-2">{lang === 'ar' ? 'الاهتمامات:' : 'Interests:'}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {watchedValues.interests?.map((interest) => {
                                                const interestData = INTERESTS.find(i => i.id === interest)
                                                return (
                                                    <span key={interest} className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                                                        {lang === 'ar' ? interestData?.nameAr : interestData?.nameEn}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400 text-sm mb-2">{lang === 'ar' ? 'الأهداف:' : 'Goals:'}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {watchedValues.goals?.map((goal) => {
                                                const goalData = LEARNING_GOALS.find(g => g.id === goal)
                                                return (
                                                    <span key={goal} className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium">
                                                        {lang === 'ar' ? goalData?.nameAr : goalData?.nameEn}
                                                    </span>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                                <h4 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    {lang === 'ar' ? 'تفضيلات الدراسة' : 'Study Preferences'}
                                </h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{lang === 'ar' ? 'المستوى:' : 'Level:'}</span>
                                        <span className="text-white">{watchedValues.skillLevel}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{lang === 'ar' ? 'الأسلوب:' : 'Mode:'}</span>
                                        <span className="text-white">{watchedValues.learningMode}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{lang === 'ar' ? 'رفيق الدراسة:' : 'Study Buddy:'}</span>
                                        <span className="text-white">
                                            {watchedValues.studyBuddyOptIn
                                                ? (lang === 'ar' ? 'نعم' : 'Yes')
                                                : (lang === 'ar' ? 'لا' : 'No')
                                            }
                                        </span>
                                    </div>
                                    {watchedValues.studyBuddyOptIn && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{lang === 'ar' ? 'المتوفرية:' : 'Availability:'}</span>
                                                <span className="text-white">{watchedValues.studyBuddyPreferences?.availability}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">{lang === 'ar' ? 'التعاون:' : 'Collaboration:'}</span>
                                                <span className="text-white">{watchedValues.studyBuddyPreferences?.collaborationStyle}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        )
    }

    if (!session) {
        return null
    }

    // Celebration animation component
    const Celebration = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
            >
                <motion.div
                    className="text-6xl mb-6"
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                >
                    🎉
                </motion.div>
                <motion.h2
                    className="text-3xl font-bold text-white mb-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {lang === 'ar' ? 'تهانينا!' : 'Congratulations!'}
                </motion.h2>
                <motion.p
                    className="text-xl text-gray-300 mb-8"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    {lang === 'ar' ? 'لقد أكملت التسجيل بنجاح' : 'You have successfully completed your profile'}
                </motion.p>

                {/* Floating emojis */}
                {[...Array(20)].map((_, i) => {
                    // Static positions to avoid hydration mismatch
                    const positions = [
                        { left: 10, top: 15, emoji: '🎊', y: -120, x: -30, rotate: 180, duration: 3, delay: 0 },
                        { left: 85, top: 20, emoji: '🎈', y: -150, x: 20, rotate: 270, duration: 4, delay: 0.5 },
                        { left: 45, top: 80, emoji: '✨', y: -180, x: -10, rotate: 90, duration: 2.5, delay: 1 },
                        { left: 75, top: 45, emoji: '🌟', y: -200, x: 40, rotate: 360, duration: 3.5, delay: 1.5 },
                        { left: 25, top: 70, emoji: '💫', y: -160, x: -25, rotate: 180, duration: 4.5, delay: 0.2 },
                        { left: 90, top: 85, emoji: '🎁', y: -140, x: 15, rotate: 270, duration: 3, delay: 0.8 },
                        { left: 15, top: 35, emoji: '🏆', y: -170, x: -35, rotate: 90, duration: 5, delay: 1.2 },
                        { left: 65, top: 25, emoji: '🥳', y: -190, x: 30, rotate: 360, duration: 2.5, delay: 0.3 },
                        { left: 35, top: 90, emoji: '🎊', y: -130, x: -20, rotate: 180, duration: 4, delay: 1.8 },
                        { left: 95, top: 55, emoji: '🎈', y: -210, x: 45, rotate: 270, duration: 3.5, delay: 0.7 },
                        { left: 5, top: 65, emoji: '✨', y: -155, x: -40, rotate: 90, duration: 4.5, delay: 1.3 },
                        { left: 55, top: 10, emoji: '🌟', y: -175, x: 25, rotate: 360, duration: 3, delay: 0.9 },
                        { left: 80, top: 75, emoji: '💫', y: -165, x: 35, rotate: 180, delay: 1.6 },
                        { left: 40, top: 40, emoji: '🎁', y: -185, x: -15, rotate: 270, duration: 2.5, delay: 0.4 },
                        { left: 70, top: 60, emoji: '🏆', y: -145, x: 20, rotate: 90, duration: 4.5, delay: 1.1 },
                        { left: 20, top: 30, emoji: '🥳', y: -195, x: -30, rotate: 360, duration: 3.5, delay: 1.7 },
                        { left: 85, top: 15, emoji: '🎊', y: -125, x: 40, rotate: 180, duration: 4, delay: 0.6 },
                        { left: 30, top: 85, emoji: '🎈', y: -205, x: -25, rotate: 270, duration: 3, delay: 1.4 },
                        { left: 60, top: 50, emoji: '✨', y: -135, x: 30, rotate: 90, duration: 5, delay: 0.1 },
                        { left: 12, top: 20, emoji: '🌟', y: -160, x: -35, rotate: 360, duration: 2.5, delay: 1.9 }
                    ];
                    const pos = positions[i] || positions[0];
                    
                    return (
                        <motion.div
                            key={i}
                            className="absolute text-2xl"
                            style={{
                                left: `${pos.left}%`,
                                top: `${pos.top}%`,
                            }}
                            animate={{
                                y: [0, pos.y],
                                x: [0, pos.x],
                                rotate: [0, pos.rotate],
                                opacity: [1, 0],
                            }}
                            transition={{
                                duration: pos.duration,
                                repeat: Infinity,
                                delay: pos.delay,
                            }}
                        >
                            {pos.emoji}
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    )

    return (
        <div className="min-h-screen bg-black">
            {showCelebration && <Celebration />}
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
                <div className="absolute inset-0 opacity-30">
                    <div className="w-full h-full bg-gradient-to-r from-red-900/10 via-emerald-900/10 to-blue-900/10" />
                </div>
                {[...Array(20)].map((_, i) => {
                    // Static positions for particles to avoid hydration mismatch
                    const particlePositions = [
                        { left: 8, top: 12, duration: 6, delay: 0 }, { left: 92, top: 18, duration: 8, delay: 0.3 },
                        { left: 23, top: 85, duration: 7, delay: 0.6 }, { left: 77, top: 42, duration: 9, delay: 0.9 },
                        { left: 45, top: 73, duration: 6.5, delay: 1.2 }, { left: 88, top: 88, duration: 7.5, delay: 1.5 },
                        { left: 12, top: 38, duration: 8.5, delay: 1.8 }, { left: 67, top: 22, duration: 6, delay: 2.1 },
                        { left: 34, top: 92, duration: 9.5, delay: 2.4 }, { left: 96, top: 58, duration: 7, delay: 2.7 },
                        { left: 3, top: 67, duration: 8, delay: 0.1 }, { left: 58, top: 8, duration: 6.5, delay: 0.4 },
                        { left: 82, top: 78, duration: 9, delay: 0.7 }, { left: 41, top: 43, duration: 7.5, delay: 1.0 },
                        { left: 71, top: 63, duration: 8.5, delay: 1.3 }, { left: 18, top: 28, duration: 6, delay: 1.6 },
                        { left: 87, top: 13, duration: 9.5, delay: 1.9 }, { left: 29, top: 83, duration: 7, delay: 2.2 },
                        { left: 62, top: 53, duration: 8, delay: 2.5 }, { left: 14, top: 18, duration: 6.5, delay: 2.8 }
                    ];
                    const pos = particlePositions[i] || particlePositions[0];
                    
                    return (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
                            style={{
                                left: `${pos.left}%`,
                                top: `${pos.top}%`,
                            }}
                            animate={{
                                y: [0, -100, 0],
                                opacity: [0.2, 0.6, 0.2],
                            }}
                            transition={{
                                duration: pos.duration,
                                repeat: Infinity,
                                delay: pos.delay,
                            }}
                        />
                    );
                })}
            </div>

            {/* Header */}
            <div className="relative z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--accent)' }}>
                                <span className="text-white font-bold text-lg">ب</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white">
                                {lang === 'ar' ? 'إكمال التسجيل' : 'Complete Your Profile'}
                            </h1>
                        </div>
                        <div className="text-sm text-gray-400">
                            {lang === 'ar' ? 'خطوة' : 'Step'} {currentStep} {lang === 'ar' ? 'من' : 'of'} {STEPS.length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 bg-black/60 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center flex-1">
                                <motion.div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${step.id <= currentStep
                                        ? 'text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-500'
                                        }`}
                                    style={step.id <= currentStep ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)' } : undefined}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <span className="font-medium">{step.id}</span>
                                </motion.div>
                                {index < STEPS.length - 1 && (
                                    <div className="flex-1 h-0.5 mx-4">
                                        <motion.div
                                            className={`h-full transition-all duration-300 ${step.id < currentStep ? '' : 'bg-gray-700'}`}
                                            style={step.id < currentStep ? { backgroundColor: 'var(--accent)' } : undefined}
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
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -30 }}
                                transition={{ duration: 0.4, ease: "easeInOut" }}
                                className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 mb-8"
                            >
                                <div className="mb-8 text-center">
                                    <div className="flex items-center justify-center gap-3 mb-4">
                                        <div className="" style={{ color: 'var(--accent)' }}>
                                            {STEPS[currentStep - 1].icon}
                                        </div>
                                        <h2 className="text-3xl font-light text-white">
                                            {lang === 'ar' ? STEPS[currentStep - 1].titleAr : STEPS[currentStep - 1].title}
                                        </h2>
                                    </div>
                                    <p className="text-gray-400 text-lg">
                                        {lang === 'ar' ? STEPS[currentStep - 1].descriptionAr : STEPS[currentStep - 1].description}
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
                                className="flex items-center gap-2 px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <ChevronLeft className="w-5 h-5" />
                                {lang === 'ar' ? 'السابق' : 'Previous'}
                            </motion.button>

                            <div className="flex gap-3">
                                {currentStep < STEPS.length ? (
                                    <motion.button
                                        type="button"
                                        onClick={nextStep}
                                        className="flex items-center gap-2 px-8 py-3 text-white rounded-xl hover:opacity-90 transition-all"
                                        style={{ backgroundColor: 'var(--accent)' }}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {lang === 'ar' ? 'التالي' : 'Next'}
                                        <ChevronRight className="w-5 h-5" />
                                    </motion.button>
                                ) : (
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                {lang === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {lang === 'ar' ? 'إكمال التسجيل' : 'Complete Onboarding'}
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