'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { 
    Trophy, 
    Award, 
    Gift,
    Users,
    MessageSquare,
    Play,
    ArrowRight,
    Sparkles,
    Zap,
    Heart,
    Rocket,
    Target
} from 'lucide-react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

export default function SimpleDashboard() {
    const { data: session } = useSession()
    const router = useRouter()
    const locale = useLocale()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session?.user) {
            fetchDashboardData()
        }
    }, [session])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const [statsRes, leaderboardRes, achievementsRes] = await Promise.all([
                fetch('/api/user/learning-stats'),
                fetch(`/api/leaderboard?userId=${session?.user?.id}&limit=5`),
                fetch(`/api/achievements?userId=${session?.user?.id}`)
            ])

            const statsData = await statsRes.json()
            const leaderboardData = await leaderboardRes.json()
            const achievementsData = await achievementsRes.json()

            setStats({
                ...statsData,
                leaderboard: leaderboardData,
                achievements: achievementsData
            })
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 mx-auto mb-4"
                    >
                        <Sparkles className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                    </motion.div>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                        {locale === 'ar' ? 'جاري التحميل...' : 'Loading your dashboard...'}
                    </p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex items-center gap-3 mb-2">
                        <Rocket className="w-8 h-8" />
                        <h1 className="text-4xl font-bold">
                            {locale === 'ar' ? 'مرحباً' : 'Hey'}, {session?.user?.name}! 👋
                        </h1>
                    </div>
                    <p className="text-blue-100 text-lg">
                        {locale === 'ar' ? 'جاهز للتعلم؟' : 'Ready to learn something new?'}
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 🎯 ONE-CLICK QUICK ACTIONS */}
                <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Zap className="w-6 h-6 text-yellow-500" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {locale === 'ar' ? 'ابدأ بنقرة واحدة' : 'Quick Actions'}
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Continue Learning - BIG Button */}
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (stats?.continueLearning?.[0]) {
                                    router.push(`/${locale}/courses/${stats.continueLearning[0].id}/learn`)
                                } else {
                                    router.push(`/${locale}/courses`)
                                }
                            }}
                            className="lg:col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all text-left group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                    <Play className="w-7 h-7" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm opacity-90 mb-1">{locale === 'ar' ? 'واصل التعلم' : 'Continue Learning'}</div>
                                    <div className="font-bold text-lg truncate">
                                        {stats?.continueLearning?.[0] 
                                            ? (locale === 'ar' ? stats.continueLearning[0].titleAr : stats.continueLearning[0].title)
                                            : (locale === 'ar' ? 'ابدأ كورس' : 'Start Course')
                                        }
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 opacity-70 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.button>

                        {/* Book Meeting - ONE CLICK */}
                        <OneClickButton
                            icon={<Users className="w-5 h-5" />}
                            label={locale === 'ar' ? 'احجز جلسة' : 'Book Meeting'}
                            onClick={() => router.push(`/${locale}/mentors`)}
                            gradient="from-green-500 to-teal-600"
                        />

                        {/* Study Buddy - ONE CLICK */}
                        <OneClickButton
                            icon={<Heart className="w-5 h-5" />}
                            label={locale === 'ar' ? 'رفيق دراسة' : 'Study Buddy'}
                            onClick={() => router.push(`/${locale}/study-buddy`)}
                            gradient="from-pink-500 to-rose-600"
                        />

                        {/* Messages - ONE CLICK */}
                        <OneClickButton
                            icon={<MessageSquare className="w-5 h-5" />}
                            label={locale === 'ar' ? 'رسائل' : 'Messages'}
                            badge={stats?.unreadMessagesCount}
                            onClick={() => router.push(`/${locale}/messaging`)}
                            gradient="from-blue-500 to-indigo-600"
                        />
                    </div>
                </motion.div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left - My Courses (Simplified Grid) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {locale === 'ar' ? 'كورساتي' : 'My Courses'}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => router.push(`/${locale}/learning`)}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center gap-1"
                                >
                                    {locale === 'ar' ? 'عرض الكل' : 'View All'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-5">
                                {stats?.continueLearning && stats.continueLearning.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stats.continueLearning.slice(0, 4).map((course: any) => (
                                            <SimpleCourseCard
                                                key={course.id}
                                                course={course}
                                                locale={locale}
                                                onClick={() => router.push(`/${locale}/courses/${course.id}/learn`)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16">
                                        <motion.div
                                            animate={{ y: [0, -10, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            <Rocket className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                        </motion.div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            {locale === 'ar' ? 'ابدأ رحلة التعلم!' : 'Start Your Learning Journey!'}
                                        </h3>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                                            {locale === 'ar' ? 'اكتشف كورسات جديدة وابدأ التعلم اليوم' : 'Discover new courses and start learning today'}
                                        </p>
                                        <button
                                            onClick={() => router.push(`/${locale}/courses`)}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-2 gap-4">
                            {stats?.leaderboard?.userPosition && (
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => router.push(`/${locale}/leaderboard`)}
                                    className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl shadow-lg hover:shadow-xl text-white p-6 text-left transition-all"
                                >
                                    <Trophy className="w-10 h-10 mb-3 opacity-90" />
                                    <div className="text-sm opacity-90 mb-1">{locale === 'ar' ? 'ترتيبك' : 'Your Rank'}</div>
                                    <div className="text-4xl font-bold mb-1">#{stats.leaderboard.userPosition.rank}</div>
                                    <div className="text-xs opacity-75">
                                        {locale === 'ar' ? 'انقر للمنافسة' : 'Click to compete'}
                                    </div>
                                </motion.button>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => router.push(`/${locale}/achievements`)}
                                className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg hover:shadow-xl text-white p-6 text-left transition-all"
                            >
                                <Award className="w-10 h-10 mb-3 opacity-90" />
                                <div className="text-sm opacity-90 mb-1">{locale === 'ar' ? 'إنجازاتك' : 'Achievements'}</div>
                                <div className="text-4xl font-bold mb-1">{stats?.achievements?.totalAchievements || 0}</div>
                                <div className="text-xs opacity-75">
                                    {locale === 'ar' ? 'افتح المزيد' : 'Unlock more'}
                                </div>
                            </motion.button>
                        </div>
                    </div>

                    {/* Right Sidebar - Compact */}
                    <div className="space-y-6">
                        {/* Achievements Hub */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-6 text-white">
                                <div className="flex items-center gap-3">
                                    <Sparkles className="w-6 h-6" />
                                    <h2 className="text-xl font-bold">{locale === 'ar' ? 'الإنجازات' : 'Achievements'}</h2>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {stats?.achievements?.achievements?.slice(0, 2).map((achievement: any) => (
                                    <CompactAchievement
                                        key={achievement.id}
                                        achievement={achievement}
                                        locale={locale}
                                    />
                                ))}

                                <button
                                    onClick={() => router.push(`/${locale}/achievements`)}
                                    className="w-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 py-3 rounded-lg font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {locale === 'ar' ? 'عرض الكل' : 'View All'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={() => router.push(`/${locale}/rewards`)}
                                    className="w-full bg-yellow-50 dark:bg-yellow-900/30 text-orange-700 dark:text-orange-300 py-3 rounded-lg font-semibold hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Gift className="w-5 h-5" />
                                    {locale === 'ar' ? 'المكافآت' : 'Rewards'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Connect */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
                            <h2 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                                {locale === 'ar' ? 'تواصل' : 'Connect'}
                            </h2>
                            
                            <div className="space-y-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => router.push(`/${locale}/study-buddy`)}
                                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white p-4 rounded-xl flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5" />
                                        <div className="text-left text-sm">
                                            <div className="font-bold">{locale === 'ar' ? 'رفيق دراسة' : 'Study Buddies'}</div>
                                            <div className="text-xs opacity-90">{stats?.studyBuddyMatches || 0} {locale === 'ar' ? 'متطابقات' : 'matches'}</div>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    onClick={() => router.push(`/${locale}/messaging`)}
                                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 rounded-xl flex items-center justify-between relative"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <MessageSquare className="w-5 h-5" />
                                            {stats?.unreadMessagesCount > 0 && (
                                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                    {stats.unreadMessagesCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-left text-sm">
                                            <div className="font-bold">{locale === 'ar' ? 'الرسائل' : 'Messages'}</div>
                                            <div className="text-xs opacity-90">
                                                {stats?.unreadMessagesCount > 0 
                                                    ? `${stats.unreadMessagesCount} ${locale === 'ar' ? 'جديدة' : 'new'}`
                                                    : (locale === 'ar' ? 'لا توجد رسائل' : 'No messages')
                                                }
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// 🎯 ONE-CLICK BUTTON COMPONENT
function OneClickButton({ icon, label, badge, onClick, gradient }: any) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`bg-gradient-to-br ${gradient} text-white rounded-2xl p-4 hover:shadow-lg transition-all text-center relative overflow-hidden group`}
        >
            <div className="relative z-10">
                <div className="mb-2 flex items-center justify-center">{icon}</div>
                <div className="font-semibold text-sm">{label}</div>
                {badge > 0 && (
                    <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                    >
                        {badge}
                    </motion.span>
                )}
            </div>
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 group-hover:translate-x-full transition-all duration-700" />
        </motion.button>
    )
}

// 📚 SIMPLE COURSE CARD
function SimpleCourseCard({ course, locale, onClick }: any) {
    return (
        <motion.button
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 text-left hover:shadow-md transition-all border border-purple-100 dark:border-gray-600"
        >
            <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Play className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate mb-1">
                        {locale === 'ar' ? course.titleAr : course.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{course.instructor?.name}</p>
                </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {course.progress}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1 }}
                        className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full"
                    />
                </div>
            </div>
        </motion.button>
    )
}

// 🏆 COMPACT ACHIEVEMENT
function CompactAchievement({ achievement, locale }: any) {
    const colors: any = {
        PERFECT_SCORE: 'from-yellow-400 to-orange-500',
        QUIZ_MASTER: 'from-purple-400 to-purple-600',
        FIRST_COURSE_COMPLETED: 'from-green-400 to-green-600',
        TOP_PERFORMER: 'from-pink-400 to-pink-600',
    }

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 }
                })
            }}
            className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl hover:shadow-sm transition-all"
        >
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colors[achievement.type] || 'from-blue-400 to-blue-600'} flex items-center justify-center text-xl shadow-md`}>
                {achievement.icon || '🏆'}
            </div>
            <div className="flex-1 min-w-0 text-left">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                    {locale === 'ar' ? achievement.titleAr : achievement.title}
                </h4>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    +{achievement.points} pts
                </p>
            </div>
        </motion.button>
    )
}