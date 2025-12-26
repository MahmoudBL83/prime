'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface Creator {
    id: string
    user: {
        id: string
        name: string
        arabicName?: string
        email: string
    }
    totalCourses: number
    totalStudents: number
    averageRating: number
    verified: boolean
    createdAt: string
}

const SPECIALTIES = [
    'Web Development',
    'Mobile Development',
    'Data Science',
    'Machine Learning',
    'Artificial Intelligence',
    'Cloud Computing',
    'DevOps',
    'Cybersecurity',
    'UI/UX Design',
    'Digital Marketing',
    'Business',
    'Photography',
    'Music',
    'Art',
    'Language Learning',
    'Health & Fitness',
]

export default function CreatorsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [creators, setCreators] = useState<Creator[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSpecialty, setSelectedSpecialty] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [lang, setLang] = useState<'en' | 'de'>('en')

    useEffect(() => {
        fetchCreators()
    }, [currentPage, selectedSpecialty, searchTerm])

    const fetchCreators = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '12',
            })

            if (searchTerm) params.append('search', searchTerm)

            const response = await fetch(`/api/creators?${params}`)
            if (response.ok) {
                const data = await response.json()
                setCreators(data.creators)
                setTotalPages(data.pagination.pages)
            } else {
                toast.error('Failed to fetch creators')
            }
        } catch (error) {
            toast.error('Failed to fetch creators')
        } finally {
            setLoading(false)
        }
    }

    const handleCreatorClick = (creatorId: string) => {
        router.push(`/creators/${creatorId}`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setCurrentPage(1)
        fetchCreators()
    }

    const clearFilters = () => {
        setSearchTerm('')
        setSelectedSpecialty('')
        setCurrentPage(1)
    }

    const t = {
        en: {
            title: 'Creator Directory',
            subtitle: 'Discover talented creators and their courses',
            search: 'Search creators...',
            specialty: 'Specialty',
            clearFilters: 'Clear Filters',
            noCreators: 'No creators found matching your criteria.',
            tryDifferent: 'Try adjusting your filters or search term.',
            courses: 'courses',
            students: 'students',
            verified: 'Verified',
            creator: 'Creator',
            allSpecialties: 'All Specialties',
        },
        de: {
            title: 'Verzeichnis der Ersteller',
            subtitle: 'Entdecken Sie talentierte Ersteller und ihre Kurse',
            search: 'Ersteller suchen...',
            specialty: 'Spezialgebiet',
            clearFilters: 'Filter löschen',
            noCreators: 'Keine Ersteller gefunden, die Ihren Kriterien entsprechen.',
            tryDifferent: 'Versuchen Sie, Ihre Filter oder Suchbegriffe anzupassen.',
            courses: 'Kurse',
            students: 'Studenten',
            verified: 'Verifiziert',
            creator: 'Ersteller',
            allSpecialties: 'Alle Spezialgebiete',
        },
    }

    const currentT = t[lang]

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Please sign in to view creators</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-background shadow-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                {currentT.title}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {currentT.subtitle}
                            </p>
                        </div>
                        <button
                            onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
                            className="px-4 py-2 border rounded-md text-sm"
                        >
                            {lang === 'en' ? 'Deutsch' : 'English'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className="bg-background rounded-lg shadow p-6 mb-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder={currentT.search}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-500 text-foreground rounded-md hover:bg-blue-600"
                            >
                                {currentT.search}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {currentT.specialty}
                                </label>
                                <select
                                    value={selectedSpecialty}
                                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                                    className="w-full border rounded-md px-3 py-2"
                                >
                                    <option value="">{currentT.allSpecialties}</option>
                                    {SPECIALTIES.map((specialty) => (
                                        <option key={specialty} value={specialty}>
                                            {specialty}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="w-full px-4 py-2 border border-border rounded-md text-foreground hover:bg-background"
                                >
                                    {currentT.clearFilters}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Creators Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg">Loading...</div>
                    </div>
                ) : creators.length === 0 ? (
                    <div className="bg-background rounded-lg shadow p-8 text-center">
                        <h3 className="text-lg font-semibold mb-2">
                            {currentT.noCreators}
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            {currentT.tryDifferent}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {creators.map((creator) => (
                                <div
                                    key={creator.id}
                                    className="bg-background rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => handleCreatorClick(creator.id)}
                                >
                                    <div className="p-6">
                                        {/* Creator Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {creator.user.arabicName || creator.user.name}
                                                    </h3>
                                                    <div className="flex items-center space-x-1">
                                                        {creator.verified && (
                                                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                        <span className="text-sm text-muted-foreground">{currentT.creator}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t border-gray-100">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                    <span>{creator.totalCourses} {currentT.courses}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    <span>{creator.totalStudents} {currentT.students}</span>
                                                </div>
                                            </div>
                                            {creator.averageRating > 0 && (
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span>{creator.averageRating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* View Profile Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                router.push(`/creators/${creator.id}`)
                                            }}
                                            className="w-full mt-4 px-4 py-2 bg-blue-500 text-foreground rounded-md hover:bg-blue-600 transition-colors text-sm"
                                        >
                                            {lang === 'de' ? 'عرض الملف الشخصي' : 'View Profile'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center mt-8">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                                    >
                                        {lang === 'de' ? 'السابق' : 'Previous'}
                                    </button>

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
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-10 h-10 rounded-md ${currentPage === pageNum
                                                        ? 'bg-blue-500 text-foreground'
                                                        : 'border hover:bg-background'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border rounded-md disabled:opacity-50"
                                    >
                                        {lang === 'de' ? 'التالي' : 'Next'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'
export const runtime = 'edge'
