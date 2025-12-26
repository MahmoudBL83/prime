'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { EnhancedCourseCard } from '@/components/course/EnhancedCourseCard'
import { Search, Filter, SlidersHorizontal, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Prevent static generation for auth-required pages
export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    thumbnail?: string
    creatorId: string
    category: string
    skillLevel: string
    duration: number
    totalViews: number
    totalEnrollments: number
    rating: number
    creator: {
        user: {
            name: string
            arabicName?: string
        }
    }
    // Enhanced fields
    hasPreview?: boolean
    previewDuration?: number
    userProgress?: number
    isEnrolled?: boolean
    lastAccessed?: string
}

interface UserProfile {
    subscriptionStatus: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
    enrollments?: Array<{
        courseId: string
        progress: number
        lastAccessed: string
    }>
}

const CATEGORIES = [
    { id: 'CATEGORY_A', name: 'Technology & Programming', nameAr: 'التكنولوجيا والبرمجة', icon: '💻' },
    { id: 'CATEGORY_B', name: 'Business & Marketing', nameAr: 'الأعمال والتسويق', icon: '📈' },
    { id: 'CATEGORY_C', name: 'Languages & Skills', nameAr: 'اللغات والمهارات', icon: '🗣️' },
]

const SKILL_LEVELS = [
    { id: 'Beginner', name: 'Beginner', nameAr: 'مبتدئ', color: 'bg-green-100 text-green-800' },
    { id: 'Intermediate', name: 'Intermediate', nameAr: 'متوسط', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'Advanced', name: 'Advanced', nameAr: 'متقدم', color: 'bg-red-100 text-red-800' },
]

export default function EnhancedCoursesPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')
    const [selectedSkillLevel, setSelectedSkillLevel] = useState('')
    const [sortBy, setSortBy] = useState('newest')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [lang, setLang] = useState<'en' | 'de'>('en')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        if (session) {
            fetchUserProfile()
        }
        fetchCourses()
    }, [session, currentPage, selectedCategory, selectedSkillLevel, searchTerm, sortBy])

    const fetchUserProfile = async () => {
        try {
            const response = await fetch('/api/user/profile')
            if (response.ok) {
                const profile = await response.json()
                setUserProfile(profile)
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error)
        }
    }

    const fetchCourses = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '12',
                sort: sortBy,
            })

            if (selectedCategory) params.append('category', selectedCategory)
            if (selectedSkillLevel) params.append('skillLevel', selectedSkillLevel)
            if (searchTerm) params.append('search', searchTerm)

            const response = await fetch(`/api/courses?${params}`)
            if (response.ok) {
                const data = await response.json()

                // Enhance courses with user enrollment data
                const enhancedCourses = data.courses.map((course: Course) => {
                    const enrollment = userProfile?.enrollments?.find(e => e.courseId === course.id)
                    return {
                        ...course,
                        hasPreview: true, // All courses have previews
                        previewDuration: 3, // 3 minute preview
                        userProgress: enrollment?.progress || 0,
                        isEnrolled: !!enrollment,
                        lastAccessed: enrollment?.lastAccessed
                    }
                })

                setCourses(enhancedCourses)
                setTotalPages(data.pagination.pages)
            } else {
                toast.error('Failed to fetch courses')
            }
        } catch (error) {
            toast.error('Failed to fetch courses')
        } finally {
            setLoading(false)
        }
    }

    const handleCourseClick = (courseId: string) => {
        router.push(`/courses/${courseId}`)
    }

    const handlePreviewClick = (courseId: string) => {
        // Navigate to course with preview parameter
        router.push(`/courses/${courseId}?preview=true`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchCourses()
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedCategory('')
        setSelectedSkillLevel('')
        setSortBy('newest')
        setCurrentPage(1)
    }

    const t = {
        en: {
            title: 'Course Catalog',
            subtitle: 'Discover courses that match your interests',
            search: 'Search courses...',
            category: 'Category',
            skillLevel: 'Skill Level',
            sortBy: 'Sort By',
            clearFilters: 'Clear Filters',
            showFilters: 'Show Filters',
            hideFilters: 'Hide Filters',
            gridView: 'Grid View',
            listView: 'List View',
            noCourses: 'No courses found matching your criteria.',
            tryDifferent: 'Try adjusting your filters or search term.',
            newest: 'Newest',
            popular: 'Most Popular',
            rating: 'Highest Rated',
            duration: 'Duration',
            coursesFound: 'courses found',
            continueLearning: 'Continue Learning',
            myProgress: 'My Progress',
        },
        de: {
            title: 'Kurskatalog',
            subtitle: 'Entdecken Sie Kurse, die Ihren Interessen entsprechen',
            search: 'Kurse suchen...',
            category: 'Kategorie',
            skillLevel: 'Fähigkeitsstufe',
            sortBy: 'Sortieren nach',
            clearFilters: 'Filter löschen',
            showFilters: 'Filter anzeigen',
            hideFilters: 'Filter ausblenden',
            gridView: 'Rasteransicht',
            listView: 'Listenansicht',
            noCourses: 'Keine Kurse gefunden, die Ihren Kriterien entsprechen.',
            tryDifferent: 'Versuchen Sie, Ihre Filter oder Suchbegriffe anzupassen.',
            newest: 'Neueste',
            popular: 'Beliebteste',
            rating: 'Höchste Bewertung',
            duration: 'Dauer',
            coursesFound: 'Kurse gefunden',
            continueLearning: 'Lernen fortsetzen',
            myProgress: 'Mein Fortschritt',
        },
    }

    const currentT = t[lang]

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                        {lang === 'de' ? 'جاري التحميل...' : 'Loading...'}
                    </h2>
                    <p className="text-[var(--muted-foreground)]">
                        {lang === 'de' ? 'يرجى الانتظار' : 'Please wait'}
                    </p>
                </div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                        {lang === 'de' ? 'مطلوب تسجيل الدخول' : 'Sign In Required'}
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        {lang === 'de' ? 'يرجى تسجيل الدخول لعرض الدورات' : 'Please sign in to view courses'}
                    </p>
                    <Button onClick={() => router.push('/auth/login')}>
                        {lang === 'de' ? 'تسجيل الدخول' : 'Sign In'}
                    </Button>
                </div>
            </div>
        )
    }

    // Get my enrolled courses for quick access
    const myCourses = courses.filter(course => course.isEnrolled)
    const inProgressCourses = myCourses.filter(course => course.userProgress && course.userProgress > 0 && course.userProgress < 100)

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <div className="bg-[var(--card)] border-b border-[var(--border)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--foreground)]">
                                {currentT.title}
                            </h1>
                            <p className="text-[var(--muted-foreground)] mt-1">
                                {currentT.subtitle}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* View mode toggle */}
                            <div className="flex items-center bg-[var(--background)] rounded-lg p-1">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('grid')}
                                    className="px-3"
                                >
                                    <Grid className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="px-3"
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>

                            <button
                                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                                className="px-4 py-2 border border-[var(--border)] rounded-md text-sm text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
                            >
                                {lang === 'en' ? 'العربية' : 'English'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Continue Learning Section */}
            {inProgressCourses.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4">
                            {currentT.continueLearning}
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                            {inProgressCourses.slice(0, 3).map((course) => (
                                <div
                                    key={course.id}
                                    className="flex-shrink-0 w-80 bg-[var(--card)] rounded-lg p-4 border border-[var(--border)] cursor-pointer hover:border-blue-500 transition-colors"
                                    onClick={() => handleCourseClick(course.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={course.thumbnail || '/images/placeholder-course.jpg'}
                                            alt={course.titleAr}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-[var(--foreground)] text-sm truncate">
                                                {lang === 'de' ? course.titleAr : course.title}
                                            </h3>
                                            <p className="text-xs text-[var(--muted-foreground)] mb-2">
                                                {course.userProgress}% {currentT.myProgress}
                                            </p>
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${course.userProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="bg-[var(--card)] rounded-xl shadow-sm border border-[var(--border)] p-6 mb-8">
                    {/* Main search bar */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                            <input
                                type="text"
                                placeholder={currentT.search}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full border border-[var(--border)] rounded-lg pl-12 pr-4 py-3 bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </form>

                    {/* Filter toggle */}
                    <div className="flex items-center justify-between mb-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            {showFilters ? currentT.hideFilters : currentT.showFilters}
                        </Button>

                        <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
                            <span>{courses.length} {currentT.coursesFound}</span>
                        </div>
                    </div>

                    {/* Expanded filters */}
                    <motion.div
                        initial={false}
                        animate={{
                            height: showFilters ? 'auto' : 0,
                            opacity: showFilters ? 1 : 0
                        }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-[var(--border)]">
                            {/* Category Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                                    {currentT.category}
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{lang === 'de' ? 'الكل' : 'All'}</option>
                                    {CATEGORIES.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.icon} {lang === 'de' ? category.nameAr : category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Skill Level Filter */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                                    {currentT.skillLevel}
                                </label>
                                <select
                                    value={selectedSkillLevel}
                                    onChange={(e) => setSelectedSkillLevel(e.target.value)}
                                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">{lang === 'de' ? 'الكل' : 'All'}</option>
                                    {SKILL_LEVELS.map((level) => (
                                        <option key={level.id} value={level.id}>
                                            {lang === 'de' ? level.nameAr : level.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sort By */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">
                                    {currentT.sortBy}
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="newest">{currentT.newest}</option>
                                    <option value="popular">{currentT.popular}</option>
                                    <option value="rating">{currentT.rating}</option>
                                    <option value="duration">{currentT.duration}</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="w-full"
                                >
                                    {currentT.clearFilters}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Courses Grid */}
                {loading ? (
                    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <div key={index} className="bg-[var(--card)] rounded-xl shadow border border-[var(--border)] animate-pulse">
                                <div className="aspect-video bg-[var(--muted)] rounded-t-xl"></div>
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                                    <div className="h-3 bg-[var(--muted)] rounded w-full"></div>
                                    <div className="h-3 bg-[var(--muted)] rounded w-2/3"></div>
                                    <div className="h-10 bg-[var(--muted)] rounded w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : courses.length === 0 ? (
                    <div className="bg-[var(--card)] rounded-xl shadow p-12 text-center border border-[var(--border)]">
                        <div className="w-24 h-24 bg-[var(--muted)] rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-12 h-12 text-[var(--muted-foreground)]" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                            {currentT.noCourses}
                        </h3>
                        <p className="text-[var(--muted-foreground)] mb-6">
                            {currentT.tryDifferent}
                        </p>
                        <Button onClick={clearFilters}>
                            {currentT.clearFilters}
                        </Button>
                    </div>
                ) : (
                    <>
                        <motion.div
                            className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 max-w-4xl mx-auto'}`}
                            initial="hidden"
                            animate="visible"
                            variants={{
                                hidden: {},
                                visible: {
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                        >
                            {courses.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        visible: { opacity: 1, y: 0 }
                                    }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <EnhancedCourseCard
                                        course={course}
                                        userSubscriptionStatus={userProfile?.subscriptionStatus}
                                        onCourseClick={handleCourseClick}
                                        onPreviewClick={handlePreviewClick}
                                        lang={lang}
                                        className={viewMode === 'list' ? 'flex flex-row max-w-none' : ''}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-12">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        {lang === 'de' ? 'السابق' : 'Previous'}
                                    </Button>

                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum
                                            if (totalPages <= 5) {
                                                pageNum = i + 1
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i
                                            } else {
                                                pageNum = currentPage - 2 + i
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className="w-10 h-10 p-0"
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        {lang === 'de' ? 'التالي' : 'Next'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
