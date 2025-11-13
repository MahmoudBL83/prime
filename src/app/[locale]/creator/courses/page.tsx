'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Home,
    Bell,
    BarChart3,
    Video,
    TrendingUp,
    Settings,
    Loader2,
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Users,
    Clock,
    Star,
    DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

interface Course {
    id: string
    title: string
    thumbnail: string | null
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    category: string
    price: number
    enrollments: number
    avgRating: number
    totalRevenue: number
    createdAt: string
    updatedAt: string
}

export default function CreatorCourses() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED'>('ALL')
    const [navigating, setNavigating] = useState(false)
    const [noCreatorProfile, setNoCreatorProfile] = useState(false)
    
    // Bulk operations state
    const [selectedCourses, setSelectedCourses] = useState<string[]>([])
    const [bulkActionLoading, setBulkActionLoading] = useState(false)
    
    // Sorting state
    const [sortBy, setSortBy] = useState<'date' | 'title' | 'enrollments' | 'revenue'>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    useEffect(() => {
        if (session?.user) {
            fetchCourses()
        }
    }, [session])

    const fetchCourses = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/creator/courses')
            if (response.ok) {
                const data = await response.json()
                setCourses(data.courses || [])
                // Check if there's a message indicating no creator profile
                if (data.message && data.message.includes('Creator profile not found')) {
                    setNoCreatorProfile(true)
                }
            } else {
                toast.error(isArabic ? 'فشل تحميل الدورات' : 'Failed to load courses')
            }
        } catch (error) {
            console.error('Failed to fetch courses:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCourse = async (courseId: string) => {
        if (!confirm(isArabic ? 'هل أنت متأكد من حذف هذه الدورة؟' : 'Are you sure you want to delete this course?')) {
            return
        }

        try {
            const response = await fetch(`/api/creator/courses/${courseId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حذف الدورة' : 'Course deleted')
                fetchCourses()
            } else {
                toast.error(isArabic ? 'فشل حذف الدورة' : 'Failed to delete course')
            }
        } catch (error) {
            console.error('Failed to delete course:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    const handleToggleStatus = async (courseId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'
        
        try {
            const response = await fetch(`/api/creator/courses/${courseId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم تحديث حالة الدورة' : 'Course status updated')
                fetchCourses()
            } else {
                toast.error(isArabic ? 'فشل تحديث الحالة' : 'Failed to update status')
            }
        } catch (error) {
            console.error('Failed to toggle status:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        }
    }

    // Bulk action handlers
    const toggleCourseSelection = (courseId: string) => {
        setSelectedCourses(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        )
    }

    const toggleSelectAll = () => {
        if (selectedCourses.length === filteredCourses.length) {
            setSelectedCourses([])
        } else {
            setSelectedCourses(filteredCourses.map(c => c.id))
        }
    }

    const handleBulkDelete = async () => {
        if (!confirm(isArabic 
            ? `هل أنت متأكد من حذف ${selectedCourses.length} دورة؟`
            : `Are you sure you want to delete ${selectedCourses.length} courses?`)) {
            return
        }

        setBulkActionLoading(true)
        try {
            const results = await Promise.all(
                selectedCourses.map(id =>
                    fetch(`/api/creator/courses/${id}`, { method: 'DELETE' })
                )
            )

            const successCount = results.filter(r => r.ok).length
            const failCount = results.length - successCount

            if (successCount > 0) {
                toast.success(isArabic 
                    ? `تم حذف ${successCount} دورة بنجاح`
                    : `Successfully deleted ${successCount} courses`)
                fetchCourses()
                setSelectedCourses([])
            }

            if (failCount > 0) {
                toast.error(isArabic
                    ? `فشل حذف ${failCount} دورة`
                    : `Failed to delete ${failCount} courses`)
            }
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setBulkActionLoading(false)
        }
    }

    const handleBulkStatusChange = async (newStatus: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED') => {
        setBulkActionLoading(true)
        try {
            const results = await Promise.all(
                selectedCourses.map(id =>
                    fetch(`/api/creator/courses/${id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    })
                )
            )

            const successCount = results.filter(r => r.ok).length

            if (successCount > 0) {
                toast.success(isArabic
                    ? `تم تحديث ${successCount} دورة`
                    : `Updated ${successCount} courses`)
                fetchCourses()
                setSelectedCourses([])
            }
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setBulkActionLoading(false)
        }
    }

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || course.status === statusFilter
        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
            case 'title':
                comparison = a.title.localeCompare(b.title)
                break
            case 'enrollments':
                comparison = a.enrollments - b.enrollments
                break
            case 'revenue':
                comparison = a.totalRevenue - b.totalRevenue
                break
            case 'date':
            default:
                comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        
        return sortOrder === 'asc' ? comparison : -comparison
    })

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <h1 className="text-xl font-bold">
                            {isArabic ? 'استوديو المنشئ' : 'Creator Studio'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-accent rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-bold">
                                {session.user.name?.[0]?.toUpperCase() || 'C'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-screen bg-card border-r border-border sticky top-16">
                    <nav className="p-4 space-y-1">
                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/dashboard`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
                        >
                            <BarChart3 className="w-5 h-5" />
                            <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
                            {navigating && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                        </button>

                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all bg-accent text-foreground font-semibold"
                        >
                            <Video className="w-5 h-5" />
                            <span>{isArabic ? 'الدورات' : 'Courses'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/analytics`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
                        >
                            <TrendingUp className="w-5 h-5" />
                            <span>{isArabic ? 'التحليلات' : 'Analytics'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/cohorts`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50"
                        >
                            <Users className="w-5 h-5" />
                            <span>{isArabic ? 'المجموعات التعليمية' : 'Cohorts'}</span>
                        </button>

                        <div className="h-px bg-border my-4" />

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/settings`)
                            }}
                            disabled={navigating}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent/50 transition-all"
                        >
                            <Settings className="w-5 h-5" />
                            <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Header Actions */}
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">
                                    {isArabic ? 'إدارة الدورات' : 'Course Management'}
                                </h1>
                                <p className="text-muted-foreground">
                                    {isArabic ? 'إنشاء وإدارة دوراتك التعليمية' : 'Create and manage your educational courses'}
                                </p>
                            </div>
                            <Button
                                onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {isArabic ? 'إنشاء دورة' : 'Create Course'}
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder={isArabic ? 'البحث في الدورات...' : 'Search courses...'}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            
                            {/* Sort Dropdown */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="date">{isArabic ? 'التاريخ' : 'Date'}</option>
                                <option value="title">{isArabic ? 'العنوان' : 'Title'}</option>
                                <option value="enrollments">{isArabic ? 'التسجيلات' : 'Enrollments'}</option>
                                <option value="revenue">{isArabic ? 'الإيرادات' : 'Revenue'}</option>
                            </select>
                            
                            {/* Sort Order Toggle */}
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="p-2 border border-border rounded-lg hover:bg-accent transition-colors"
                                title={sortOrder === 'asc' ? (isArabic ? 'تصاعدي' : 'Ascending') : (isArabic ? 'تنازلي' : 'Descending')}
                            >
                                {sortOrder === 'asc' ? '↑' : '↓'}
                            </button>
                            
                            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                                <button
                                    onClick={() => setStatusFilter('ALL')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        statusFilter === 'ALL' ? 'bg-accent font-semibold' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    {isArabic ? 'الكل' : 'All'}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('PUBLISHED')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        statusFilter === 'PUBLISHED' ? 'bg-accent font-semibold' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    {isArabic ? 'منشور' : 'Published'}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('DRAFT')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        statusFilter === 'DRAFT' ? 'bg-accent font-semibold' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    {isArabic ? 'مسودة' : 'Draft'}
                                </button>
                                <button
                                    onClick={() => setStatusFilter('ARCHIVED')}
                                    className={`px-4 py-2 rounded-md transition-colors ${
                                        statusFilter === 'ARCHIVED' ? 'bg-accent font-semibold' : 'hover:bg-accent/50'
                                    }`}
                                >
                                    {isArabic ? 'مؤرشف' : 'Archived'}
                                </button>
                            </div>
                        </div>

                        {/* Bulk Actions Bar */}
                        {selectedCourses.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="font-semibold">
                                        {selectedCourses.length} {isArabic ? 'دورة محددة' : 'selected'}
                                    </span>
                                    <button
                                        onClick={() => setSelectedCourses([])}
                                        className="text-sm text-muted-foreground hover:text-foreground"
                                    >
                                        {isArabic ? 'إلغاء التحديد' : 'Clear selection'}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => handleBulkStatusChange('PUBLISHED')}
                                        disabled={bulkActionLoading}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {isArabic ? 'نشر' : 'Publish'}
                                    </Button>
                                    <Button
                                        onClick={() => handleBulkStatusChange('DRAFT')}
                                        disabled={bulkActionLoading}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {isArabic ? 'مسودة' : 'Draft'}
                                    </Button>
                                    <Button
                                        onClick={() => handleBulkStatusChange('ARCHIVED')}
                                        disabled={bulkActionLoading}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {isArabic ? 'أرشفة' : 'Archive'}
                                    </Button>
                                    <Button
                                        onClick={handleBulkDelete}
                                        disabled={bulkActionLoading}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                                    >
                                        {bulkActionLoading ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                {isArabic ? 'حذف' : 'Delete'}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {/* Courses Table */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                            ) : filteredCourses.length === 0 ? (
                                <div className="text-center py-12">
                                    <Video className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                    {noCreatorProfile ? (
                                        <>
                                            <h3 className="text-lg font-semibold mb-2">
                                                {isArabic ? 'لم يتم إعداد ملف المنشئ' : 'Creator Profile Not Set Up'}
                                            </h3>
                                            <p className="text-muted-foreground mb-4">
                                                {isArabic 
                                                    ? 'يرجى إكمال إعداد ملف المنشئ الخاص بك قبل إنشاء الدورات' 
                                                    : 'Please complete your creator profile setup before creating courses'}
                                            </p>
                                            <Button
                                                onClick={() => router.push(`/${locale}/creator/settings`)}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                                            >
                                                <Settings className="w-4 h-4 mr-2" />
                                                {isArabic ? 'إعداد الملف الشخصي' : 'Setup Profile'}
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <h3 className="text-lg font-semibold mb-2">
                                                {isArabic ? 'لا توجد دورات' : 'No courses found'}
                                            </h3>
                                            <p className="text-muted-foreground mb-4">
                                                {isArabic ? 'ابدأ بإنشاء دورتك الأولى' : 'Start by creating your first course'}
                                            </p>
                                            <Button
                                                onClick={() => router.push(`/${locale}/creator/courses/create`)}
                                                className="bg-gradient-to-r from-purple-600 to-pink-600"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                {isArabic ? 'إنشاء دورة' : 'Create Course'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left p-4 w-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                                                        onChange={toggleSelectAll}
                                                        className="w-4 h-4 rounded border-border"
                                                    />
                                                </th>
                                                <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                                                    {isArabic ? 'الدورة' : 'Course'}
                                                </th>
                                                <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                                                    {isArabic ? 'الحالة' : 'Status'}
                                                </th>
                                                <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                                                    {isArabic ? 'الطلاب' : 'Students'}
                                                </th>
                                                <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                                                    {isArabic ? 'التقييم' : 'Rating'}
                                                </th>
                                                <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                                                    {isArabic ? 'الإيرادات' : 'Revenue'}
                                                </th>
                                                <th className="text-left p-4 font-semibold text-sm text-muted-foreground">
                                                    {isArabic ? 'الإجراءات' : 'Actions'}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCourses.map((course) => (
                                                <motion.tr
                                                    key={course.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="border-b border-border hover:bg-accent/50 transition-colors"
                                                >
                                                    <td className="p-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedCourses.includes(course.id)}
                                                            onChange={() => toggleCourseSelection(course.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 rounded border-border"
                                                        />
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-muted">
                                                                {course.thumbnail ? (
                                                                    <Image
                                                                        src={course.thumbnail}
                                                                        alt={course.title}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Video className="w-6 h-6 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-semibold line-clamp-1">
                                                                    {course.title}
                                                                </h3>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {course.category}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <Badge
                                                            variant={
                                                                course.status === 'PUBLISHED'
                                                                    ? 'default'
                                                                    : course.status === 'DRAFT'
                                                                    ? 'secondary'
                                                                    : 'outline'
                                                            }
                                                        >
                                                            {course.status === 'PUBLISHED'
                                                                ? isArabic ? 'منشور' : 'Published'
                                                                : course.status === 'DRAFT'
                                                                ? isArabic ? 'مسودة' : 'Draft'
                                                                : isArabic ? 'مؤرشف' : 'Archived'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="w-4 h-4 text-muted-foreground" />
                                                            <span>{course.enrollments}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            <span>{course.avgRating.toFixed(1)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <DollarSign className="w-4 h-4 text-green-500" />
                                                            <span className="font-semibold">
                                                                ${course.totalRevenue}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => router.push(`/${locale}/creator/courses/${course.id}/edit`)}
                                                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                                                title={isArabic ? 'تعديل' : 'Edit'}
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleStatus(course.id, course.status)}
                                                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                                                title={
                                                                    course.status === 'PUBLISHED'
                                                                        ? isArabic ? 'إخفاء' : 'Unpublish'
                                                                        : isArabic ? 'نشر' : 'Publish'
                                                                }
                                                            >
                                                                {course.status === 'PUBLISHED' ? (
                                                                    <EyeOff className="w-4 h-4" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteCourse(course.id)}
                                                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                                                                title={isArabic ? 'حذف' : 'Delete'}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
