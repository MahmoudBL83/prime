'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Suspense, memo } from 'react'
// Icons will be loaded dynamically
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AvatarPlaceholder } from '@/components/ui/avatar-placeholder'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

// Icon Components
const IconComponents = {
  Search: () => import('lucide-react').then(mod => ({ default: mod.Search })),
  Filter: () => import('lucide-react').then(mod => ({ default: mod.Filter })),
  SlidersHorizontal: () => import('lucide-react').then(mod => ({ default: mod.SlidersHorizontal })),
  Grid: () => import('lucide-react').then(mod => ({ default: mod.Grid })),
  List: () => import('lucide-react').then(mod => ({ default: mod.List })),
  Star: () => import('lucide-react').then(mod => ({ default: mod.Star })),
  BookOpen: () => import('lucide-react').then(mod => ({ default: mod.BookOpen })),
  Users: () => import('lucide-react').then(mod => ({ default: mod.Users })),
  CheckCircle: () => import('lucide-react').then(mod => ({ default: mod.CheckCircle })),
  Play: () => import('lucide-react').then(mod => ({ default: mod.Play })),
}

// Dynamic Icon component
const DynamicIcon = memo(({ 
  name, 
  className = "", 
  ...props 
}: { 
  name: string
  className?: string 
  style?: Record<string, any>
  [key: string]: any 
}) => {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null)
  
  useEffect(() => {
    const loadIcon = async () => {
      const iconLoader = IconComponents[name as keyof typeof IconComponents]
      if (iconLoader) {
        try {
          const { default: Icon } = await iconLoader()
          setIconComponent(() => Icon)
        } catch (error) {
          console.error(`Failed to load icon: ${name}`, error)
        }
      }
    }
    
    loadIcon()
  }, [name])
  
  if (!IconComponent) {
    return <div className={`inline-block ${className}`} style={{ width: '1em', height: '1em' }} />
  }
  
  return <IconComponent className={className} {...props} />
})

DynamicIcon.displayName = 'DynamicIcon'

interface Mentor {
    id: string
    user: {
        id: string
        name: string
        arabicName?: string
        email: string
        profileImage?: string
        bio?: string
    }
    totalCourses: number
    totalStudents: number
    averageRating: number
    verified: boolean
    expertise?: string
    createdAt: string
}

const SPECIALTIES = [
    { id: 'CATEGORY_A', name: 'Technology & Programming', nameAr: 'التكنولوجيا والبرمجة', icon: '💻' },
    { id: 'CATEGORY_B', name: 'Business & Marketing', nameAr: 'الأعمال والتسويق', icon: '📈' },
    { id: 'CATEGORY_C', name: 'Languages & Skills', nameAr: 'اللغات والمهارات', icon: '🗣️' },
    { id: 'design', name: 'Design & Creativity', nameAr: 'التصميم والإبداع', icon: '🎨' },
    { id: 'health', name: 'Health & Fitness', nameAr: 'الصحة واللياقة', icon: '💪' },
    { id: 'music', name: 'Music & Arts', nameAr: 'الموسيقى والفنون', icon: '🎵' },
]

export default function MentorsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [mentors, setMentors] = useState<Mentor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSpecialty, setSelectedSpecialty] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [lang, setLang] = useState<'en' | 'ar'>('ar')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [showFilters, setShowFilters] = useState(false)

    useEffect(() => {
        fetchMentors()
    }, [currentPage, selectedSpecialty, searchTerm])

    const fetchMentors = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '12',
            })

            if (searchTerm) params.append('search', searchTerm)
            if (selectedSpecialty) params.append('specialty', selectedSpecialty)

            const response = await fetch(`/api/mentors?${params}`)
            if (response.ok) {
                const data = await response.json()
                setMentors(data.mentors)
                setTotalPages(data.pagination.pages)
            } else {
                toast.error(lang === 'ar' ? 'فشل في جلب المدربين' : 'Failed to fetch mentors')
            }
        } catch (error) {
            toast.error(lang === 'ar' ? 'فشل في جلب المدربين' : 'Failed to fetch mentors')
        } finally {
            setLoading(false)
        }
    }

    const handleMentorClick = (mentorId: string) => {
        router.push(`/mentors/${mentorId}`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchMentors()
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedSpecialty('')
        setCurrentPage(1)
    }

    const t = {
        en: {
            title: 'Expert Mentors',
            subtitle: 'Learn from the best industry experts and professionals',
            search: 'Search mentors...',
            specialty: 'Specialty',
            clearFilters: 'Clear Filters',
            showFilters: 'Show Filters',
            hideFilters: 'Hide Filters',
            gridView: 'Grid View',
            listView: 'List View',
            noMentors: 'No mentors found matching your criteria.',
            tryDifferent: 'Try adjusting your filters or search term.',
            courses: 'courses',
            students: 'students',
            verified: 'Verified Expert',
            mentor: 'Mentor',
            allSpecialties: 'All Specialties',
            viewProfile: 'View Profile',
            yearsExp: 'years experience',
            rating: 'Rating',
        },
        ar: {
            title: 'خبراء متخصصون',
            subtitle: 'تعلم من أفضل خبراء الصناعة والمختصين',
            search: 'ابحث في المدربين...',
            specialty: 'التخصص',
            clearFilters: 'مسح الفلاتر',
            showFilters: 'إظهار الفلاتر',
            hideFilters: 'إخفاء الفلاتر',
            gridView: 'عرض الشبكة',
            listView: 'عرض القائمة',
            noMentors: 'لم يتم العثور على مدربين تطابق معاييرك.',
            tryDifferent: 'حاول تعديل الفلاتر أو مصطلح البحث.',
            courses: 'دورة',
            students: 'طالب',
            verified: 'خبير موثق',
            mentor: 'مدرب',
            allSpecialties: 'جميع التخصصات',
            viewProfile: 'عرض الملف الشخصي',
            yearsExp: 'سنة خبرة',
            rating: 'التقييم',
        },
    }

    const currentT = t[lang]

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4">
                        {lang === 'ar' ? 'مطلوب تسجيل الدخول' : 'Sign In Required'}
                    </h2>
                    <p className="text-[var(--muted-foreground)] mb-6">
                        {lang === 'ar' ? 'يرجى تسجيل الدخول لعرض المدربين' : 'Please sign in to view mentors'}
                    </p>
                    <Button onClick={() => router.push('/auth/login')}>
                        {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[var(--background)]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
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
                                    className="p-2"
                                >
                                    <DynamicIcon name="Grid" className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('list')}
                                    className="p-2"
                                >
                                    <DynamicIcon name="List" className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Language toggle */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                            >
                                {lang === 'en' ? 'العربية' : 'English'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-6 mb-8">
                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <DynamicIcon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted-foreground)] w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder={currentT.search}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]"
                                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                />
                            </div>
                            <Button type="submit" size="lg" className="px-8">
                                <DynamicIcon name="Search" className="w-4 h-4 mr-2" />
                                {lang === 'ar' ? 'بحث' : 'Search'}
                            </Button>
                        </div>
                    </form>

                    {/* Filters Toggle */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="mb-4"
                        >
                            <DynamicIcon name="SlidersHorizontal" className="w-4 h-4 mr-2" />
                            {showFilters ? currentT.hideFilters : currentT.showFilters}
                        </Button>

                        {(selectedSpecialty || searchTerm) && (
                            <Button variant="ghost" onClick={clearFilters} className="mb-4">
                                {currentT.clearFilters}
                            </Button>
                        )}
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-[var(--border)] pt-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                                        {currentT.specialty}
                                    </label>
                                    <select
                                        value={selectedSpecialty}
                                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                                        className="w-full px-3 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-[var(--foreground)]"
                                    >
                                        <option value="">{currentT.allSpecialties}</option>
                                        {SPECIALTIES.map((specialty) => (
                                            <option key={specialty.id} value={specialty.id}>
                                                {specialty.icon} {lang === 'ar' ? specialty.nameAr : specialty.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Mentors Grid/List */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg text-[var(--muted-foreground)]">
                            {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                        </div>
                    </div>
                ) : mentors.length === 0 ? (
                    <div className="bg-[var(--card)] rounded-lg border border-[var(--border)] p-8 text-center">
                        <DynamicIcon name="Users" className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                            {currentT.noMentors}
                        </h3>
                        <p className="text-[var(--muted-foreground)] mb-4">
                            {currentT.tryDifferent}
                        </p>
                        <Button onClick={clearFilters}>
                            {currentT.clearFilters}
                        </Button>
                    </div>
                ) : (
                    <>
                        <motion.div
                            className={viewMode === 'grid'
                                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                : "space-y-4"
                            }
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {mentors.map((mentor, index) => (
                                <motion.div
                                    key={mentor.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className={`bg-[var(--card)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-all cursor-pointer group ${viewMode === 'list' ? 'flex items-center p-6' : 'p-6'
                                        }`}
                                    onClick={() => handleMentorClick(mentor.id)}
                                >
                                    {viewMode === 'grid' ? (
                                        <>
                                            {/* Mentor Image */}
                                            <div className="relative aspect-video bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden rounded-lg mb-4">
                                                {mentor.user.profileImage ? (
                                                    <img
                                                        src={mentor.user.profileImage}
                                                        alt={lang === 'ar' ? mentor.user.arabicName || mentor.user.name : mentor.user.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            // Fallback to gradient with initials if image fails to load
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent) {
                                                                const fallback = parent.querySelector('.fallback-content') as HTMLElement;
                                                                if (fallback) fallback.style.display = 'flex';
                                                            }
                                                        }}
                                                    />
                                                ) : null}

                                                {/* Fallback content */}
                                                <div
                                                    className="fallback-content absolute inset-0 w-full h-full flex items-center justify-center"
                                                    style={{ display: mentor.user.profileImage ? 'none' : 'flex' }}
                                                >
                                                    <AvatarPlaceholder 
                                                        name={mentor.user.name} 
                                                        size={96} 
                                                        className="rounded-full"
                                                    />
                                                </div>

                                                {/* Hover overlay */}
                                                <motion.div
                                                    className="absolute inset-0 bg-background bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                >
                                                    <div className="text-center">
                                                        <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                                                            <DynamicIcon name="Play" className="w-8 h-8 text-foreground ml-1" />
                                                        </div>
                                                        <span className="text-foreground text-sm font-medium">
                                                            {lang === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                                                        </span>
                                                    </div>
                                                </motion.div>

                                                {/* Verification badge */}
                                                {mentor.verified && (
                                                    <div className="absolute top-4 right-4">
                                                        <div className="bg-green-500 text-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                                            <DynamicIcon name="CheckCircle" className="w-4 h-4" />
                                                            {lang === 'ar' ? 'موثق' : 'Verified'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Mentor Info */}
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-xl font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                                    {lang === 'ar' ? mentor.user.arabicName || mentor.user.name : mentor.user.name}
                                                </h3>
                                                <div className="flex items-center gap-1">
                                                    <DynamicIcon name="Star" className="w-4 h-4 text-yellow-500 fill-current" />
                                                    <span className="text-[var(--muted-foreground)] text-sm">{mentor.averageRating.toFixed(1)}</span>
                                                </div>
                                            </div>

                                            <p className="text-sm font-medium mb-3 text-[var(--primary)]">
                                                {mentor.expertise || (lang === 'ar' ? 'متخصص' : 'Specialist')}
                                            </p>

                                            {/* Bio */}
                                            {mentor.user.bio && (
                                                <p className="text-[var(--muted-foreground)] text-sm mb-4 leading-relaxed line-clamp-2">
                                                    {mentor.user.bio}
                                                </p>
                                            )}

                                            {/* Stats */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[var(--muted-foreground)] text-sm">
                                                    <DynamicIcon name="Users" className="w-4 h-4" />
                                                    <span>{mentor.totalStudents.toLocaleString()} {lang === 'ar' ? 'متابع' : 'students'}</span>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="text-foreground rounded-sm hover:opacity-90 bg-[var(--primary)]"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleMentorClick(mentor.id)
                                                    }}
                                                >
                                                    {lang === 'ar' ? 'عرض الملف' : 'View Profile'}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* List View */}
                                            <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-foreground font-bold">
                                                    {(mentor.user.arabicName || mentor.user.name).charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                                                        <h3 className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                                                            {lang === 'ar' ? mentor.user.arabicName || mentor.user.name : mentor.user.name}
                                                        </h3>
                                                        {mentor.verified && (
                                                            <DynamicIcon name="CheckCircle" className="w-4 h-4 text-green-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-4 rtl:space-x-reverse text-sm text-[var(--muted-foreground)]">
                                                        <span>{mentor.totalCourses} {currentT.courses}</span>
                                                        <span>{mentor.totalStudents} {currentT.students}</span>
                                                        {mentor.averageRating > 0 && (
                                                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                                                <DynamicIcon name="Star" className="w-3 h-3 text-yellow-400 fill-current" />
                                                                <span>{mentor.averageRating.toFixed(1)}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(`/mentors/${mentor.id}`)
                                                }}
                                                variant="outline"
                                            >
                                                {currentT.viewProfile}
                                            </Button>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-12">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        {lang === 'ar' ? 'السابق' : 'Previous'}
                                    </Button>

                                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
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
                                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                                    size="sm"
                                                    className="w-10 h-10"
                                                    onClick={() => setCurrentPage(pageNum)}
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
                                        {lang === 'ar' ? 'التالي' : 'Next'}
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
