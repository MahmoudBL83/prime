'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
    Star,
    Users,
    BookOpen,
    Clock,
    MapPin,
    Globe,
    Award,
    Calendar,
    MessageCircle,
    CheckCircle,
    Search,
    Filter,
    SortAsc,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { useTranslationsSafe, useLocaleSafe } from '@/hooks/useTranslationsSafe'
import { useNavigationLoading } from '@/hooks/useNavigationLoading'

interface Instructor {
    id: string
    userId: string // Add userId field
    user: {
        id: string // Add id field to user
        name: string
        arabicName: string
        bio: string
        profileImage: string | null
    }
    kycStatus: string
    expertise: string
    hourlyRate: number
    availableForMeetings: boolean
    languages: string
    stats: {
        totalCourses: number
        totalStudents: number
        averageRating: number
        totalFollowers: number
        yearsOfExperience: number
    }
}

export default function InstructorsPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const { navigateWithLoading, isLoading } = useNavigationLoading()
    const currentLocale = useLocaleSafe()
    const { t } = useTranslationsSafe('instructors')
    const { t: tCommon } = useTranslationsSafe('common')

    const [instructors, setInstructors] = useState<Instructor[]>([])
    const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<'rating' | 'students' | 'experience' | 'price'>('rating')

    useEffect(() => {
        fetchInstructors()
    }, [])

    useEffect(() => {
        filterAndSortInstructors()
    }, [searchTerm, sortBy, instructors])

    const fetchInstructors = async () => {
        try {
            const response = await fetch('/api/instructors')
            if (response.ok) {
                const data = await response.json()
                setInstructors(data.instructors)
                setFilteredInstructors(data.instructors)
            } else {
                console.error('Failed to fetch instructors')
            }
        } catch (error) {
            console.error('Error fetching instructors:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterAndSortInstructors = () => {
        let filtered = instructors.filter(instructor => {
            const name = getInstructorName(instructor).toLowerCase()
            const expertise = instructor.expertise.toLowerCase()
            const searchLower = searchTerm.toLowerCase()
            
            // Basic search filter
            let matchesSearch = name.includes(searchLower) || expertise.includes(searchLower)
            
            // Special filter logic
            if (searchTerm.includes('verified')) {
                matchesSearch = instructor.kycStatus === 'VERIFIED'
            }
            
            if (searchTerm.includes('available')) {
                matchesSearch = matchesSearch && instructor.availableForMeetings
            }
            
            if (searchTerm.includes('top-rated')) {
                matchesSearch = matchesSearch && instructor.stats.averageRating >= 4.5
            }
            
            // If no special filters, use basic search
            if (!searchTerm.includes('verified') && !searchTerm.includes('available') && !searchTerm.includes('top-rated') && searchTerm) {
                matchesSearch = name.includes(searchLower) || expertise.includes(searchLower)
            } else if (!searchTerm) {
                matchesSearch = true
            }
            
            return matchesSearch
        })

        // Sort instructors
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'rating':
                    return b.stats.averageRating - a.stats.averageRating
                case 'students':
                    return b.stats.totalStudents - a.stats.totalStudents
                case 'experience':
                    return b.stats.yearsOfExperience - a.stats.yearsOfExperience
                case 'price':
                    return a.hourlyRate - b.hourlyRate
                default:
                    return 0
            }
        })

        setFilteredInstructors(filtered)
    }

    const handleMessageInstructor = async (instructorId: string) => {
        try {
            // Find the instructor to get their user ID
            const instructor = instructors.find(i => i.id === instructorId);
            if (!instructor) {
                console.error('Instructor not found');
                navigateWithLoading('/messaging', 'messaging');
                return;
            }

            // Get current user ID from session
            const currentUserId = session?.user?.id;
            if (!currentUserId) {
                console.error('No user session found');
                navigateWithLoading('/messaging', 'messaging');
                return;
            }

            // Use the instructor's user ID for the conversation
            const instructorUserId = instructor.user.id;
            console.log('Creating conversation with:', { currentUserId, instructorUserId });

            // Create or find existing conversation with the instructor
            const response = await fetch('/api/messaging/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'DIRECT',
                    participantIds: [currentUserId, instructorUserId], // Use instructor's user ID
                }),
            });

            if (response.ok) {
                const conversation = await response.json();
                // Navigate to messaging page with conversation ID in URL
                navigateWithLoading(`/messaging?conversation=${conversation.id}`, 'messaging');
            } else {
                const errorData = await response.text();
                console.error('Failed to create conversation:', response.status, errorData);
                // Fallback to regular messaging page
                navigateWithLoading('/messaging', 'messaging');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
            // Fallback to regular messaging page
            navigateWithLoading('/messaging', 'messaging');
        }
    };

    const getInstructorName = (instructor: Instructor) => {
        return currentLocale === 'ar' && instructor.user.arabicName 
            ? instructor.user.arabicName 
            : instructor.user.name
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">{tCommon('loading')}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {/* Header */}
            <div className="relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative bg-gradient-to-br from-gray-900 via-purple-900/30 to-blue-900/30 py-24 px-6">
                    <div className="max-w-7xl mx-auto text-center">
                        <motion.div
                            initial={{ opacity: 0, y: -30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="mb-6"
                        >
                            <div className="inline-flex items-center gap-2 bg-purple-600/20 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-3 mb-8">
                                <Award className="w-5 h-5 text-purple-400" />
                                <span className="text-purple-200 font-medium">Premium Learning Experience</span>
                            </div>
                            
                            <h1 className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent mb-6 leading-tight">
                                Meet Our Expert
                                <br />
                                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                    Instructors
                                </span>
                            </h1>
                        </motion.div>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="text-xl lg:text-2xl text-purple-100/80 max-w-4xl mx-auto mb-12 leading-relaxed"
                        >
                            Connect with world-class educators, industry professionals, and certified experts 
                            who are passionate about transforming lives through knowledge
                        </motion.p>
                        
                        {/* Enhanced Search Bar */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="max-w-3xl mx-auto"
                        >
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-blue-600/50 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                <div className="relative bg-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-2">
                                    <div className="flex items-center">
                                        <div className="flex items-center pl-6 pr-4">
                                            <Search className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <Input
                                            type="text"
                                            placeholder="Search by name, expertise, or specialization..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="flex-1 bg-transparent border-none text-white placeholder-gray-400 text-lg py-4 focus:outline-none focus:ring-0"
                                        />
                                        <div className="pr-2">
                                            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                                                Search
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        
                        {/* Stats */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto"
                        >
                            <div className="text-center">
                                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">50+</div>
                                <div className="text-purple-300 text-sm uppercase tracking-wider">Expert Instructors</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">10k+</div>
                                <div className="text-purple-300 text-sm uppercase tracking-wider">Happy Students</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">4.9</div>
                                <div className="text-purple-300 text-sm uppercase tracking-wider">Average Rating</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl lg:text-4xl font-bold text-white mb-2">24/7</div>
                                <div className="text-purple-300 text-sm uppercase tracking-wider">Support</div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Filters and Sort */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col lg:flex-row gap-6 mb-8">
                    {/* Results Count */}
                    <div className="flex items-center text-white">
                        <span className="text-gray-400">Found </span>
                        <span className="font-bold text-2xl mx-2 text-purple-400">{filteredInstructors.length}</span>
                        <span className="text-gray-400">expert instructors</span>
                    </div>
                    
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-gray-800/80 backdrop-blur-sm text-white border border-gray-600/50 rounded-xl px-6 py-3 pr-10 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none cursor-pointer transition-all duration-200 hover:bg-gray-700/80"
                            >
                                <option value="rating">⭐ Highest Rated</option>
                                <option value="students">👥 Most Students</option>
                                <option value="experience">🎓 Most Experienced</option>
                                <option value="price">💰 Lowest Price</option>
                            </select>
                            <SortAsc className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        
                        {/* Quick Filters */}
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={searchTerm.includes('verified') ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (searchTerm.includes('verified')) {
                                        setSearchTerm(searchTerm.replace('verified', '').trim())
                                    } else {
                                        setSearchTerm(searchTerm + ' verified')
                                    }
                                }}
                                className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                                    searchTerm.includes('verified') 
                                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                                        : 'bg-transparent border-gray-600 text-gray-300 hover:border-green-500 hover:text-green-400 hover:bg-green-500/10'
                                }`}
                            >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified Only
                            </Button>
                            
                            <Button
                                variant={searchTerm.includes('available') ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    const filtered = instructors.filter(i => i.availableForMeetings)
                                    if (searchTerm.includes('available')) {
                                        setSearchTerm(searchTerm.replace('available', '').trim())
                                    } else {
                                        setSearchTerm('available')
                                    }
                                }}
                                className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                                    searchTerm.includes('available') 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                                        : 'bg-transparent border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10'
                                }`}
                            >
                                <Calendar className="w-3 h-3 mr-1" />
                                Available Now
                            </Button>
                            
                            <Button
                                variant={searchTerm.includes('top-rated') ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                    if (searchTerm.includes('top-rated')) {
                                        setSearchTerm(searchTerm.replace('top-rated', '').trim())
                                    } else {
                                        const topRated = instructors.filter(i => i.stats.averageRating >= 4.5)
                                        setSearchTerm('top-rated')
                                    }
                                }}
                                className={`rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ${
                                    searchTerm.includes('top-rated') 
                                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-500' 
                                        : 'bg-transparent border-gray-600 text-gray-300 hover:border-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10'
                                }`}
                            >
                                <Star className="w-3 h-3 mr-1" />
                                4.5+ Rating
                            </Button>
                        </div>
                    </div>
                    
                    {/* Clear Filters */}
                    {(searchTerm || sortBy !== 'rating') && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearchTerm('')
                                setSortBy('rating')
                            }}
                            className="text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl px-4 py-2 transition-all duration-200"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Instructors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6 lg:gap-8">
                    {filteredInstructors.map((instructor, index) => (
                        <motion.div
                            key={instructor.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
                            className="group relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 overflow-hidden hover:border-purple-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20"
                        >
                            {/* Loading Overlay */}
                            {isLoading(`instructor-${instructor.id}`) && (
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-3xl flex items-center justify-center z-20">
                                    <div className="flex flex-col items-center gap-4 text-white">
                                        <div className="w-10 h-10 border-3 border-purple-300/30 border-t-purple-400 rounded-full animate-spin"></div>
                                        <span className="text-sm font-medium">Loading profile...</span>
                                    </div>
                                </div>
                            )}

                            {/* Header Section with Profile */}
                            <div className="relative p-6 lg:p-8 bg-gradient-to-br from-purple-600/10 via-blue-600/10 to-indigo-600/10 backdrop-blur-sm">
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                                
                                <div className="relative z-10">
                                    {/* Profile Image & Basic Info */}
                                    <div className="flex items-start gap-4 lg:gap-5 mb-6">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border-2 border-purple-400/50 shadow-xl group-hover:border-purple-400 transition-colors">
                                                {instructor.user.profileImage ? (
                                                    <img 
                                                        src={instructor.user.profileImage} 
                                                        alt={getInstructorName(instructor)}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                                        <span className="text-white text-xl lg:text-2xl font-bold">
                                                            {getInstructorName(instructor).charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {instructor.kycStatus === 'VERIFIED' && (
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-800 shadow-lg">
                                                    <CheckCircle className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                                <h3 className="text-lg lg:text-xl font-bold text-white truncate group-hover:text-purple-200 transition-colors">
                                                    {getInstructorName(instructor)}
                                                </h3>
                                                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-lg flex-shrink-0">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-yellow-400 text-sm font-semibold">
                                                        {instructor.stats.averageRating.toFixed(1)}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 mb-3">
                                                <Award className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                                <p className="text-purple-300 text-sm font-semibold truncate">
                                                    {instructor.expertise}
                                                </p>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                <div className="flex items-center gap-1 text-blue-300">
                                                    <Users className="w-3 h-3" />
                                                    <span>{instructor.stats.totalStudents}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-green-300">
                                                    <BookOpen className="w-3 h-3" />
                                                    <span>{instructor.stats.totalCourses}</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-300">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{instructor.stats.yearsOfExperience}y</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Bio */}
                                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2 mb-4 group-hover:text-gray-200 transition-colors">
                                        {instructor.user.bio || "Passionate educator dedicated to sharing knowledge and empowering students to achieve their goals."}
                                    </p>
                                    
                                    {/* Languages */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <Globe className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                        <span className="text-indigo-300 text-sm font-medium truncate">
                                            {instructor.languages}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div className="px-6 lg:px-8 py-6 bg-gray-900/40 backdrop-blur-sm">
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-center">
                                        <div className="text-xl lg:text-2xl font-bold text-white mb-1">
                                            {instructor.stats.totalStudents}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wide">Students</div>
                                    </div>
                                    <div className="text-center border-x border-gray-700/50">
                                        <div className="text-xl lg:text-2xl font-bold text-white mb-1">
                                            {instructor.stats.totalCourses}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wide">Courses</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl lg:text-2xl font-bold text-white mb-1">
                                            {instructor.stats.totalFollowers}
                                        </div>
                                        <div className="text-xs text-gray-400 uppercase tracking-wide">Followers</div>
                                    </div>
                                </div>

                                {/* Price & Availability */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        {instructor.hourlyRate && (
                                            <>
                                                <span className="text-xl lg:text-2xl font-bold text-green-400">
                                                    ${instructor.hourlyRate}
                                                </span>
                                                <span className="text-gray-400 text-sm">/hour</span>
                                            </>
                                        )}
                                    </div>
                                    
                                    {instructor.availableForMeetings && (
                                        <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
                                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                            <span className="text-green-300 text-xs font-medium">Available</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigateWithLoading(`/instructors/${instructor.id}`, `instructor-${instructor.id}`);
                                        }}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25"
                                    >
                                        View Profile
                                    </Button>
                                    
                                    <div className="flex gap-3">
                                        {instructor.availableForMeetings && (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigateWithLoading(`/instructors/${instructor.id}/book-meeting`, `book-${instructor.id}`);
                                                }}
                                                variant="outline"
                                                className="px-4 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 rounded-xl transition-all duration-300"
                                                disabled={isLoading(`book-${instructor.id}`)}
                                            >
                                                {isLoading(`book-${instructor.id}`) ? (
                                                    <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-400 rounded-full animate-spin"></div>
                                                ) : (
                                                    <Calendar className="w-4 h-4" />
                                                )}
                                            </Button>
                                        )}
                                        
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMessageInstructor(instructor.id);
                                            }}
                                            variant="outline"
                                            className="px-4 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500 rounded-xl transition-all duration-300"
                                            disabled={isLoading('messaging')}
                                        >
                                            {isLoading('messaging') ? (
                                                <div className="w-4 h-4 border-2 border-gray-300/30 border-t-gray-400 rounded-full animate-spin"></div>
                                            ) : (
                                                <MessageCircle className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Hover Effect Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
                        </motion.div>
                    ))}
                </div>

                {filteredInstructors.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                            <Search className="w-12 h-12 text-gray-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">No instructors found</h3>
                        <p className="text-gray-400 mb-6">
                            Try adjusting your search terms or filters
                        </p>
                        <Button 
                            onClick={() => {
                                setSearchTerm('')
                                setSortBy('rating')
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>

            {/* Call to Action */}
            {instructors.length > 0 && (
                <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 py-20 px-6 mt-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            Want to Become an Instructor?
                        </h2>
                        <p className="text-xl text-purple-200 mb-8">
                            Join our community of expert instructors and share your knowledge with students worldwide
                        </p>
                        <LoadingButton 
                            size="lg"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                            onClick={() => navigateWithLoading('/creator/onboarding', 'apply-teach')}
                            loading={isLoading('apply-teach')}
                            loadingText="Loading application..."
                        >
                            Apply to Teach
                        </LoadingButton>
                    </div>
                </div>
            )}
        </div>
    )
}