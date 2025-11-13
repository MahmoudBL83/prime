'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    BookOpen,
    Users,
    TrendingUp,
    Star,
    DollarSign,
    Search,
    ArrowUpDown
} from 'lucide-react'

interface CourseMetrics {
    id: string
    title: string
    thumbnail: string | null
    status: string
    metrics: {
        totalEnrollments: number
        activeStudents: number
        completionRate: number
        averageRating: number
        totalReviews: number
        revenue: number
    }
}

interface CoursePerformanceTableProps {
    courses: CourseMetrics[]
    loading?: boolean
}

export default function CoursePerformanceTable({
    courses,
    loading = false
}: CoursePerformanceTableProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'enrollments' | 'revenue' | 'rating' | 'completion'>('enrollments')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    const handleSort = (field: typeof sortBy) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(field)
            setSortOrder('desc')
        }
    }

    // Filter and sort courses
    const filteredCourses = courses
        .filter(course =>
            course.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            let aValue = 0, bValue = 0

            switch (sortBy) {
                case 'enrollments':
                    aValue = a.metrics.totalEnrollments
                    bValue = b.metrics.totalEnrollments
                    break
                case 'revenue':
                    aValue = a.metrics.revenue
                    bValue = b.metrics.revenue
                    break
                case 'rating':
                    aValue = a.metrics.averageRating
                    bValue = b.metrics.averageRating
                    break
                case 'completion':
                    aValue = a.metrics.completionRate
                    bValue = b.metrics.completionRate
                    break
            }

            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
        })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0
        }).format(value)
    }

    if (loading) {
        return (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-48 bg-card rounded" />
                    <div className="h-12 bg-card rounded" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-card rounded" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900/50 backdrop-blur-sm border border-border rounded-xl p-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    <span>Course Performance</span>
                </h3>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                                Course
                            </th>
                            <th
                                className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('enrollments')}
                            >
                                <div className="flex items-center justify-center space-x-1">
                                    <Users className="w-4 h-4" />
                                    <span>Students</span>
                                    <ArrowUpDown className="w-3 h-3" />
                                </div>
                            </th>
                            <th
                                className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('completion')}
                            >
                                <div className="flex items-center justify-center space-x-1">
                                    <TrendingUp className="w-4 h-4" />
                                    <span>Completion</span>
                                    <ArrowUpDown className="w-3 h-3" />
                                </div>
                            </th>
                            <th
                                className="text-center py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('rating')}
                            >
                                <div className="flex items-center justify-center space-x-1">
                                    <Star className="w-4 h-4" />
                                    <span>Rating</span>
                                    <ArrowUpDown className="w-3 h-3" />
                                </div>
                            </th>
                            <th
                                className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('revenue')}
                            >
                                <div className="flex items-center justify-end space-x-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Revenue</span>
                                    <ArrowUpDown className="w-3 h-3" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course, index) => (
                                <motion.tr
                                    key={course.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border-b border-border/50 hover:bg-gray-800/30 transition-colors"
                                >
                                    {/* Course Info */}
                                    <td className="py-4 px-4">
                                        <div className="flex items-center space-x-3">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-12 h-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 bg-card rounded-lg flex items-center justify-center">
                                                    <BookOpen className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-foreground font-medium line-clamp-1">
                                                    {course.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {course.metrics.activeStudents} active
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Enrollments */}
                                    <td className="py-4 px-4 text-center">
                                        <span className="text-foreground font-semibold">
                                            {course.metrics.totalEnrollments}
                                        </span>
                                    </td>

                                    {/* Completion Rate */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-16 bg-card rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                    style={{ width: `${course.metrics.completionRate}%` }}
                                                />
                                            </div>
                                            <span className="text-foreground text-sm font-medium w-10">
                                                {course.metrics.completionRate}%
                                            </span>
                                        </div>
                                    </td>

                                    {/* Rating */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                            <span className="text-foreground font-semibold">
                                                {course.metrics.averageRating.toFixed(1)}
                                            </span>
                                            <span className="text-muted-foreground text-sm">
                                                ({course.metrics.totalReviews})
                                            </span>
                                        </div>
                                    </td>

                                    {/* Revenue */}
                                    <td className="py-4 px-4 text-right">
                                        <span className="text-green-500 font-semibold">
                                            {formatCurrency(course.metrics.revenue)}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-muted-foreground">
                                    {searchQuery ? 'No courses found' : 'No courses yet'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            {filteredCourses.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}</span>
                    <span>
                        Total Revenue: <strong className="text-green-500">{formatCurrency(filteredCourses.reduce((sum, c) => sum + c.metrics.revenue, 0))}</strong>
                    </span>
                </div>
            )}
        </motion.div>
    )
}
