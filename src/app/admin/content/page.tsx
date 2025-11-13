'use client'

import React, { useState, useEffect } from 'react'
import {
    BookOpen,
    Search,
    Filter,
    Plus,
    Download,
    MoreHorizontal,
    Edit,
    Eye,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    AlertTriangle,
    Users,
    Star,
    DollarSign,
    Calendar,
    Play,
    FileText
} from 'lucide-react'
import { ContentStatus } from '@prisma/client'
import CourseDetailsModal from '@/components/admin/CourseDetailsModal'

interface Course {
    id: string
    title: string
    titleAr: string
    description: string
    thumbnail: string | null
    creatorId: string
    category: string
    skillLevel: string
    duration: number
    language: string
    price: number
    status: 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED'
    publishedAt: string | null
    totalViews: number
    totalEnrollments: number
    rating: number
    createdAt: string
    updatedAt: string
    creator: {
        id: string
        user: {
            name: string
            email: string
            arabicName: string | null
        }
    }
    _count: {
        lessons: number
        enrollments: number
    }
}

const statusColors = {
    DRAFT: 'bg-muted text-gray-800 border-border',
    UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PUBLISHED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    ARCHIVED: 'bg-muted text-muted-foreground border-border'
}

const statusIcons = {
    DRAFT: FileText,
    UNDER_REVIEW: Clock,
    PUBLISHED: CheckCircle,
    REJECTED: XCircle,
    ARCHIVED: AlertTriangle
}

export default function ContentPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')
    const [creatorFilter, setCreatorFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        fetchCourses()
    }, [])

    const fetchCourses = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/content')
            if (!response.ok) {
                throw new Error('Failed to fetch courses')
            }
            const data = await response.json()
            setCourses(data.courses)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleViewCourse = (courseId: string) => {
        setSelectedCourseId(courseId)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedCourseId(null)
    }

    const handleCourseUpdate = (courseId: string, newStatus: ContentStatus) => {
        setCourses(prevCourses =>
            prevCourses.map(course =>
                course.id === courseId
                    ? { ...course, status: newStatus }
                    : course
            )
        )
    }

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.titleAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.creator.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || course.status === statusFilter
        const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter
        const matchesCreator = creatorFilter === 'all' || course.creatorId === creatorFilter

        return matchesSearch && matchesStatus && matchesCategory && matchesCreator
    })

    const sortedCourses = [...filteredCourses].sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortBy) {
            case 'title':
                aValue = a.title.toLowerCase()
                bValue = b.title.toLowerCase()
                break
            case 'creator':
                aValue = a.creator.user.name.toLowerCase()
                bValue = b.creator.user.name.toLowerCase()
                break
            case 'enrollments':
                aValue = a.totalEnrollments
                bValue = b.totalEnrollments
                break
            case 'rating':
                aValue = a.rating
                bValue = b.rating
                break
            case 'price':
                aValue = a.price
                bValue = b.price
                break
            case 'views':
                aValue = a.totalViews
                bValue = b.totalViews
                break
            case 'createdAt':
            case 'updatedAt':
            default:
                aValue = new Date(a[sortBy as keyof Course] as string).getTime()
                bValue = new Date(b[sortBy as keyof Course] as string).getTime()
                break
        }

        if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const getStatusIcon = (status: Course['status']) => {
        const Icon = statusIcons[status]
        return <Icon className="w-4 h-4" />
    }

    const getUniqueCreators = () => {
        const creators = courses.map(course => ({
            id: course.creatorId,
            name: course.creator.user.name
        }))
        return creators.filter((creator, index, self) =>
            index === self.findIndex(c => c.id === creator.id)
        )
    }

    const getUniqueCategories = () => {
        return [...new Set(courses.map(course => course.category))]
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">Error: {error}</p>
                <button
                    onClick={fetchCourses}
                    className="mt-2 text-red-600 hover:text-red-800 underline"
                >
                    Try again
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
                    <p className="text-muted-foreground mt-1">Review, approve, and manage all course content</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2 text-foreground hover:bg-background">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 text-foreground rounded-lg px-4 py-2 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                        Add Course
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Courses</p>
                            <p className="text-2xl font-semibold text-foreground">{courses.length}</p>
                        </div>
                        <BookOpen className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Published</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {courses.filter(c => c.status === 'PUBLISHED').length}
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Review</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {courses.filter(c => c.status === 'UNDER_REVIEW').length}
                            </p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Enrollments</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {courses.reduce((sum, c) => sum + c.totalEnrollments, 0)}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Avg Rating</p>
                            <p className="text-2xl font-semibold text-foreground">
                                {courses.length > 0 ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1) : '0.0'}
                            </p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-background rounded-lg border border-border p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search courses by title, creator, or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="UNDER_REVIEW">Pending Review</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="ARCHIVED">Archived</option>
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Categories</option>
                        {getUniqueCategories().map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>

                    {/* Creator Filter */}
                    <select
                        value={creatorFilter}
                        onChange={(e) => setCreatorFilter(e.target.value)}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Creators</option>
                        {getUniqueCreators().map(creator => (
                            <option key={creator.id} value={creator.id}>{creator.name}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        value={`${sortBy}-${sortOrder}`}
                        onChange={(e) => {
                            const [field, order] = e.target.value.split('-')
                            setSortBy(field)
                            setSortOrder(order as 'asc' | 'desc')
                        }}
                        className="border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="createdAt-desc">Newest First</option>
                        <option value="createdAt-asc">Oldest First</option>
                        <option value="updatedAt-desc">Recently Updated</option>
                        <option value="title-asc">Title A-Z</option>
                        <option value="enrollments-desc">Most Popular</option>
                        <option value="rating-desc">Highest Rated</option>
                        <option value="price-desc">Highest Price</option>
                    </select>
                </div>
            </div>

            {/* Courses Table */}
            <div className="bg-background rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-background border-b border-border">
                            <tr>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Course</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Creator</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Performance</th>
                                <th className="text-left py-3 px-4 font-medium text-foreground">Details</th>
                                <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortedCourses.map((course) => (
                                <tr key={course.id} className="hover:bg-background">
                                    <td className="py-3 px-4">
                                        <div className="flex items-start gap-3">
                                            {course.thumbnail && (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-16 h-12 object-cover rounded-lg border"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground truncate">{course.title}</div>
                                                <div className="text-sm text-muted-foreground truncate">{course.titleAr}</div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                                    <span>{course.category}</span>
                                                    <span>•</span>
                                                    <span>{course.skillLevel}</span>
                                                    <span>•</span>
                                                    <span>{formatDuration(course.duration)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium text-foreground">{course.creator.user.name}</div>
                                            <div className="text-sm text-muted-foreground">{course.creator.user.email}</div>
                                            {course.creator.user.arabicName && (
                                                <div className="text-sm text-muted-foreground">{course.creator.user.arabicName}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusColors[course.status]}`}>
                                            {getStatusIcon(course.status)}
                                            {course.status.replace('_', ' ')}
                                        </span>
                                        {course.publishedAt && (
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Published {formatDate(course.publishedAt)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                <span>{course.totalEnrollments} enrollments</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                <span>{course.totalViews} views</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3" />
                                                <span>{course.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-sm text-muted-foreground">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1">
                                                <Play className="w-3 h-3" />
                                                <span>{course._count.lessons} lessons</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                <span>{formatCurrency(course.price)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                <span>{formatDate(course.createdAt)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => handleViewCourse(course.id)}
                                                className="p-1 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button className="p-1 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            {course.status === 'UNDER_REVIEW' && (
                                                <>
                                                    <button className="p-1 text-muted-foreground hover:text-green-600 hover:bg-green-50 rounded">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded">
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            <button className="p-1 text-muted-foreground hover:text-muted-foreground hover:bg-background rounded">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sortedCourses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No courses found matching your filters.
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-foreground">
                    Showing {sortedCourses.length} of {courses.length} courses
                </p>
            </div>

            {/* Course Details Modal */}
            {selectedCourseId && (
                <CourseDetailsModal
                    courseId={selectedCourseId}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onUpdate={handleCourseUpdate}
                />
            )}
        </div>
    )
}
