'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import {
  MessageCircle,
  Users,
  BookOpen,
  Target,
  Heart,
  ArrowLeft,
  Calendar,
  Video,
  Search,
  Filter,
  Sparkles,
  Clock,
  TrendingUp,
  Award,
  Zap,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface StudyBuddyMatch {
  id: string
  status: string
  compatibilityScore?: number
  sharedSubjects?: string[]
  sharedGoals?: string[]
  createdAt: string
  updatedAt: string
  chatRoomId?: string | null
  otherUser: {
    id: string
    name: string
    arabicName?: string | null
    profileImage?: string | null
    bio?: string | null
    interests: string[]
    goals: string[]
    skillLevel: string | null
    learningMode?: string | null
  }
}

export default function StudyBuddyMatchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'
  const isArabic = locale === 'ar'

  const [matches, setMatches] = useState<StudyBuddyMatch[]>([])
  const [filteredMatches, setFilteredMatches] = useState<StudyBuddyMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'compatibility'>('recent')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/login`)
      return
    }

    if (status === 'authenticated') {
      fetchMatches()
    }
  }, [status, router, locale])

  useEffect(() => {
    filterAndSortMatches()
  }, [matches, searchQuery, filterStatus, sortBy])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/study-buddy/matches')
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      } else {
        toast.error(isArabic ? 'فشل تحميل التطابقات' : 'Failed to load matches')
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortMatches = () => {
    let filtered = [...matches]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(match => {
        const user = match.otherUser
        const userName = isArabic && user.arabicName ? user.arabicName : user.name
        return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.sharedSubjects?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
          match.sharedGoals?.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
      })
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(match => match.status.toLowerCase() === filterStatus.toLowerCase())
    }

    // Apply sorting
    if (sortBy === 'compatibility') {
      filtered.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    setFilteredMatches(filtered)
  }

  const getMatchedUser = (match: StudyBuddyMatch) => {
    return match.otherUser
  }

  const calculateDaysSinceMatch = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-xl text-purple-200">
            {isArabic ? 'جار تحميل التطابقات...' : 'Loading matches...'}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Enhanced Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/dashboard`}>
              <Button variant="ghost" className="text-white hover:bg-white/10">
                <ArrowLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Heart className="w-10 h-10 text-pink-400 fill-pink-400 animate-pulse" />
                {isArabic ? 'شركاء الدراسة' : 'Study Buddies'}
              </h1>
              <p className="text-gray-400 mt-1">
                {isArabic ? 'تواصل وتعلم معًا' : 'Connect and learn together'}
              </p>
            </div>
          </div>
          <Link href={`/${locale}/study-buddy`}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4 h-4 mr-2" />
              {isArabic ? 'البحث عن المزيد' : 'Find More'}
            </Button>
          </Link>
        </motion.div>

        {/* Enhanced Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-md border-purple-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300 mb-1">{isArabic ? 'إجمالي التطابقات' : 'Total Matches'}</p>
                <p className="text-3xl font-bold text-white">{matches.length}</p>
              </div>
              <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Users className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-md border-green-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300 mb-1">{isArabic ? 'نشط' : 'Active'}</p>
                <p className="text-3xl font-bold text-white">
                  {matches.filter(m => m.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <Zap className="w-7 h-7 text-green-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-pink-900/40 to-pink-800/40 backdrop-blur-md border-pink-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-pink-300 mb-1">{isArabic ? 'هذا الأسبوع' : 'This Week'}</p>
                <p className="text-3xl font-bold text-white">
                  {matches.filter(m => new Date(m.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-pink-500/20 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-pink-400" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/40 backdrop-blur-md border-yellow-500/30 p-6 hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300 mb-1">{isArabic ? 'أفضل توافق' : 'Best Match'}</p>
                <p className="text-3xl font-bold text-white">
                  {Math.max(...matches.map(m => m.compatibilityScore || 0), 0).toFixed(0)}%
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Star className="w-7 h-7 text-yellow-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Search and Filter Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'ابحث عن شركاء...' : 'Search buddies...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">{isArabic ? 'جميع الحالات' : 'All Status'}</option>
                <option value="active">{isArabic ? 'نشط' : 'Active'}</option>
                <option value="inactive">{isArabic ? 'غير نشط' : 'Inactive'}</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recent' | 'compatibility')}
                className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="recent">{isArabic ? 'الأحدث' : 'Most Recent'}</option>
                <option value="compatibility">{isArabic ? 'التوافق' : 'Best Match'}</option>
              </select>
            </div>
          </Card>
        </motion.div>

        {/* Matches List */}
        <AnimatePresence>
          {filteredMatches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-12 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  {searchQuery || filterStatus !== 'all'
                    ? (isArabic ? 'لا توجد نتائج' : 'No Results')
                    : (isArabic ? 'لا توجد تطابقات حتى الآن' : 'No Matches Yet')}
                </h2>
                <p className="text-gray-300 mb-6">
                  {searchQuery || filterStatus !== 'all'
                    ? (isArabic ? 'جرب تغيير معايير البحث' : 'Try changing your search criteria')
                    : (isArabic ? 'ابدأ في البحث عن شركاء الدراسة للعثور على تطابقك المثالي!' : 'Start swiping to find your perfect study buddy!')}
                </p>
                <Link href={`/${locale}/study-buddy`}>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                    {isArabic ? 'ابدأ البحث' : 'Start Swiping'}
                  </Button>
                </Link>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match, index) => {
                const matchedUser = getMatchedUser(match)
                const userName = isArabic && matchedUser.arabicName 
                  ? matchedUser.arabicName 
                  : matchedUser.name
                const daysSince = calculateDaysSinceMatch(match.createdAt)

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-gray-800/80 backdrop-blur-md border-gray-700/50 p-6 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all group">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Profile Image with Status Ring */}
                        <div className="flex-shrink-0 relative">
                          <div className={`w-28 h-28 rounded-full overflow-hidden border-4 ${
                            match.status === 'ACTIVE' ? 'border-green-500/50' : 'border-gray-500/30'
                          } group-hover:scale-110 transition-transform`}>
                            {matchedUser.profileImage ? (
                              <Image
                                src={matchedUser.profileImage}
                                alt={userName}
                                width={112}
                                height={112}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <Users className="w-14 h-14 text-white" />
                              </div>
                            )}
                          </div>
                          {/* Status Indicator */}
                          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 border-gray-800 ${
                            match.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'
                          } flex items-center justify-center`}>
                            {match.status === 'ACTIVE' && (
                              <Zap className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Match Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3 gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-white">{userName}</h3>
                                {match.compatibilityScore && match.compatibilityScore > 80 && (
                                  <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-400/30">
                                    <Star className="w-3 h-3 mr-1" />
                                    {isArabic ? 'توافق عالي' : 'Top Match'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {isArabic ? 'تطابق منذ' : 'Matched'}{' '}
                                  {daysSince === 0 
                                    ? (isArabic ? 'اليوم' : 'today')
                                    : daysSince === 1
                                    ? (isArabic ? 'أمس' : 'yesterday')
                                    : `${daysSince} ${isArabic ? 'أيام' : 'days ago'}`
                                  }
                                </span>
                                {match.compatibilityScore && (
                                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                                    <Award className="w-3 h-3 mr-1" />
                                    {match.compatibilityScore.toFixed(0)}% {isArabic ? 'توافق' : 'Match'}
                                  </Badge>
                                )}
                                <Badge
                                  className={
                                    match.status === 'ACTIVE'
                                      ? 'bg-green-500/20 text-green-300 border-green-400/30'
                                      : 'bg-gray-500/20 text-gray-300 border-gray-400/30'
                                  }
                                >
                                  {match.status}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Bio */}
                          {matchedUser.bio && (
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{matchedUser.bio}</p>
                          )}

                          {/* Skill Level & Learning Mode */}
                          {(matchedUser.skillLevel || matchedUser.learningMode) && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {matchedUser.skillLevel && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                                  📊 {matchedUser.skillLevel}
                                </Badge>
                              )}
                              {matchedUser.learningMode && (
                                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-400/30">
                                  🎯 {matchedUser.learningMode}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Shared Subjects */}
                          {match.sharedSubjects && match.sharedSubjects.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <span className="text-sm font-semibold text-white">
                                  {isArabic ? 'المواد المشتركة' : 'Shared Subjects'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {match.sharedSubjects.slice(0, 5).map((subject, idx) => (
                                  <Badge
                                    key={idx}
                                    className="bg-blue-500/20 text-blue-300 border-blue-400/30 hover:bg-blue-500/30 transition-colors"
                                  >
                                    {subject}
                                  </Badge>
                                ))}
                                {match.sharedSubjects.length > 5 && (
                                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/30">
                                    +{match.sharedSubjects.length - 5}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Shared Goals */}
                          {match.sharedGoals && match.sharedGoals.length > 0 && (
                            <div className="mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-purple-400" />
                                <span className="text-sm font-semibold text-white">
                                  {isArabic ? 'الأهداف المشتركة' : 'Shared Goals'}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {match.sharedGoals.slice(0, 3).map((goal, idx) => (
                                  <Badge
                                    key={idx}
                                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 hover:bg-purple-500/30 transition-colors"
                                  >
                                    {goal}
                                  </Badge>
                                ))}
                                {match.sharedGoals.length > 3 && (
                                  <Badge className="bg-gray-500/20 text-gray-300 border-gray-400/30">
                                    +{match.sharedGoals.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Button
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 shadow-lg"
                              onClick={() => router.push(`/${locale}/study-buddy/workspace?matchId=${match.id}`)}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              {isArabic ? 'مساحة العمل' : 'Workspace'}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-green-500/50 text-green-300 hover:bg-green-500/10"
                              onClick={() => router.push(`/${locale}/messaging?userId=${matchedUser.id}`)}
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              {isArabic ? 'دردشة' : 'Chat'}
                            </Button>
                            <Button 
                              variant="outline"
                              className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
                            >
                              <Calendar className="w-4 h-4 mr-2" />
                              {isArabic ? 'جلسة' : 'Session'}
                            </Button>
                            <Button 
                              variant="outline"
                              className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              {isArabic ? 'فيديو' : 'Video'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
