'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { animated, to as interpolate, useSpring } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

// Dynamic icon imports for better performance
const IconComponents = {
  Heart: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Heart })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  X: dynamic(() => import('lucide-react').then(mod => ({ default: mod.X })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  Sparkles: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Sparkles })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  BookOpen: dynamic(() => import('lucide-react').then(mod => ({ default: mod.BookOpen })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  Clock: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Clock })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  MessageCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.MessageCircle })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  TrendingUp: dynamic(() => import('lucide-react').then(mod => ({ default: mod.TrendingUp })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  Trophy: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Trophy })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  Users: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Users })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
  ArrowLeft: dynamic(() => import('lucide-react').then(mod => ({ default: mod.ArrowLeft })), {
    ssr: false,
    loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
  }),
}

interface SwipeCandidate {
  id: string
  name: string
  arabicName?: string
  profileImage?: string
  bio?: string
  interests?: string[]
  goals?: string[]
  skillLevel?: string
  enrolledCourses: {
    id: string
    title: string
    titleAr?: string
  }[]
  studyPreferences?: {
    timezone?: string
    communicationStyle?: string
    learningStyle?: string
    preferredStudyTimes?: string
  }
  compatibilityScore: number
}

export default function StudyBuddySwipePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string || 'en'
  const isArabic = locale === 'ar'

  const [candidates, setCandidates] = useState<SwipeCandidate[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [swiping, setSwiping] = useState(false)
  const [matchModal, setMatchModal] = useState<any>(null)

  // Animation springs
  const [{ x, y, rotateZ, scale }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotateZ: 0,
    scale: 1
  }))

  const currentCandidate = candidates[currentIndex]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/${locale}/auth/login`)
      return
    }

    if (status === 'authenticated') {
      fetchCandidates()
    }
  }, [status, router, locale])

  const fetchCandidates = async () => {
    try {
      const response = await fetch('/api/study-buddy/swipe/candidates?limit=20')
      if (response.ok) {
        const data = await response.json()
        setCandidates(data.candidates)
      } else {
        toast.error(isArabic ? 'فشل تحميل المرشحين' : 'Failed to load candidates')
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (swiping || !currentCandidate) return

    setSwiping(true)
    const action = direction === 'right' ? 'LIKE' : 'PASS'

    // Animate card off screen
    api.start({
      x: direction === 'right' ? 500 : -500,
      rotateZ: direction === 'right' ? 20 : -20,
      scale: 0.8,
      config: { tension: 200, friction: 20 }
    })

    try {
      const response = await fetch('/api/study-buddy/swipe/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          swipedId: currentCandidate.id,
          action
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.matched) {
          // Show match modal
          setMatchModal(data.match)
          
          // Confetti effect
          toast.success(
            isArabic ? '🎉 لديك تطابق جديد!' : '🎉 It\'s a Match!',
            {
              icon: '❤️',
              duration: 5000
            }
          )
        }

        // Move to next candidate after animation
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1)
          api.start({ x: 0, y: 0, rotateZ: 0, scale: 1, immediate: true })
          setSwiping(false)
        }, 300)
      } else {
        toast.error(isArabic ? 'فشلت العملية' : 'Action failed')
        api.start({ x: 0, y: 0, rotateZ: 0, scale: 1 })
        setSwiping(false)
      }
    } catch (error) {
      console.error('Swipe error:', error)
      toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
      api.start({ x: 0, y: 0, rotateZ: 0, scale: 1 })
      setSwiping(false)
    }
  }

  // Drag gesture
  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [xDir], velocity: [vx] }) => {
      const trigger = vx > 0.2
      const dir = xDir < 0 ? -1 : 1

      if (!active && trigger) {
        handleSwipe(dir === 1 ? 'right' : 'left')
      } else {
        api.start({
          x: active ? mx : 0,
          y: active ? my : 0,
          rotateZ: active ? mx / 20 : 0,
          scale: active ? 1.05 : 1,
          immediate: active
        })
      }
    },
    { axis: 'x' }
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-xl text-purple-200">
            {isArabic ? 'جار تحميل المرشحين...' : 'Loading candidates...'}
          </p>
        </div>
      </div>
    )
  }

  if (currentIndex >= candidates.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-8">
            <Suspense fallback={<div className="w-12 h-12 animate-pulse bg-gray-300 rounded" />}>
              <IconComponents.Sparkles className="w-12 h-12 text-white" />
            </Suspense>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {isArabic ? 'لا يوجد المزيد من المرشحين' : 'No More Candidates'}
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            {isArabic 
              ? 'لقد راجعت جميع المرشحين المتاحين. تحقق لاحقًا للحصول على تطابقات جديدة!'
              : 'You\'ve reviewed all available candidates. Check back later for new matches!'}
          </p>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setCurrentIndex(0)
                fetchCandidates()
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
            >
              {isArabic ? 'إعادة التحميل' : 'Reload Candidates'}
            </Button>
            <Link href={`/${locale}/dashboard`}>
              <Button variant="outline" className="ml-4">
                <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded mr-2" />}>
                  <IconComponents.ArrowLeft className="w-4 h-4 mr-2" />
                </Suspense>
                {isArabic ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!currentCandidate) {
    return null
  }

  const candidateName = isArabic && currentCandidate.arabicName 
    ? currentCandidate.arabicName 
    : currentCandidate.name

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md mx-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="ghost" className="text-white">
              <Suspense fallback={<div className="w-5 h-5 animate-pulse bg-gray-300 rounded" />}>
                <IconComponents.ArrowLeft className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
              </Suspense>
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Suspense fallback={<div className="w-6 h-6 animate-pulse bg-gray-300 rounded" />}>
              <IconComponents.Heart className="w-6 h-6 text-pink-400" />
            </Suspense>
            {isArabic ? 'البحث عن شريك دراسة' : 'Find Study Buddy'}
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="text-white text-sm">
            {currentIndex + 1} / {candidates.length}
          </div>
          <div className="flex-1 max-w-xs h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / candidates.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Swipeable Card */}
        <div className="relative h-[600px] mb-8">
          <animated.div
            {...bind()}
            style={{
              x,
              y,
              rotateZ,
              scale,
              touchAction: 'none'
            }}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            <Card className="h-full bg-gray-800/80 backdrop-blur-md border-gray-700/50 overflow-hidden">
              {/* Profile Image */}
              <div className="relative h-64 bg-gradient-to-br from-purple-900/50 to-blue-900/50">
                {currentCandidate.profileImage ? (
                  <Image
                    src={currentCandidate.profileImage}
                    alt={candidateName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Suspense fallback={<div className="w-24 h-24 animate-pulse bg-gray-300 rounded" />}>
                      <IconComponents.Users className="w-24 h-24 text-white/30" />
                    </Suspense>
                  </div>
                )}
                
                {/* Compatibility Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-lg font-bold">
                    {currentCandidate.compatibilityScore}% {isArabic ? 'توافق' : 'Match'}
                  </Badge>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[336px]">
                {/* Name and Skill Level */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{candidateName}</h2>
                  {currentCandidate.skillLevel && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                      {currentCandidate.skillLevel}
                    </Badge>
                  )}
                </div>

                {/* Bio */}
                {currentCandidate.bio && (
                  <p className="text-gray-300 text-sm">{currentCandidate.bio}</p>
                )}

                {/* Enrolled Courses */}
                {currentCandidate.enrolledCourses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />}>
                        <IconComponents.BookOpen className="w-4 h-4 text-purple-400" />
                      </Suspense>
                      <span className="text-sm font-semibold text-white">
                        {isArabic ? 'الدورات المسجل فيها' : 'Enrolled Courses'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.enrolledCourses.slice(0, 3).map((course) => (
                        <Badge
                          key={course.id}
                          className="bg-blue-500/20 text-blue-300 border-blue-400/30"
                        >
                          {isArabic && course.titleAr ? course.titleAr : course.title}
                        </Badge>
                      ))}
                      {currentCandidate.enrolledCourses.length > 3 && (
                        <Badge className="bg-gray-700/50 text-gray-300">
                          +{currentCandidate.enrolledCourses.length - 3} {isArabic ? 'المزيد' : 'more'}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {currentCandidate.interests && currentCandidate.interests.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />}>
                        <IconComponents.Sparkles className="w-4 h-4 text-pink-400" />
                      </Suspense>
                      <span className="text-sm font-semibold text-white">
                        {isArabic ? 'الاهتمامات' : 'Interests'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {currentCandidate.interests.slice(0, 5).map((interest, idx) => (
                        <Badge
                          key={idx}
                          className="bg-pink-500/20 text-pink-300 border-pink-400/30"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study Preferences */}
                {currentCandidate.studyPreferences && (
                  <div className="grid grid-cols-2 gap-3">
                    {currentCandidate.studyPreferences.timezone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />}>
                          <IconComponents.Clock className="w-4 h-4 text-cyan-400" />
                        </Suspense>
                        <span className="text-gray-300">{currentCandidate.studyPreferences.timezone}</span>
                      </div>
                    )}
                    {currentCandidate.studyPreferences.communicationStyle && (
                      <div className="flex items-center gap-2 text-sm">
                        <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />}>
                          <IconComponents.MessageCircle className="w-4 h-4 text-green-400" />
                        </Suspense>
                        <span className="text-gray-300 capitalize">{currentCandidate.studyPreferences.communicationStyle}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </animated.div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => handleSwipe('left')}
            disabled={swiping}
            className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 hover:bg-red-500/30 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Suspense fallback={<div className="w-8 h-8 animate-pulse bg-gray-300 rounded" />}>
              <IconComponents.X className="w-8 h-8 text-red-500" />
            </Suspense>
          </button>

          <button
            onClick={() => handleSwipe('right')}
            disabled={swiping}
            className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50"
          >
            <Suspense fallback={<div className="w-10 h-10 animate-pulse bg-gray-300 rounded" />}>
              <IconComponents.Heart className="w-10 h-10 text-white fill-white" />
            </Suspense>
          </button>
        </div>

        {/* Swipe Hint */}
        <p className="text-center text-gray-400 text-sm mt-6">
          {isArabic 
            ? 'اسحب يمينًا للإعجاب أو يسارًا للتمرير'
            : 'Swipe right to like or left to pass'}
        </p>
      </div>

      {/* Match Modal */}
      {matchModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-gray-800/90 border-purple-500/50 p-8 max-w-md w-full text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isArabic ? 'لديك تطابق!' : 'It\'s a Match!'}
              </h2>
              <p className="text-gray-300">
                {isArabic 
                  ? 'أنت وشريك دراستك الجديد أعجبتما ببعضكما البعض!'
                  : 'You and your new study buddy both liked each other!'}
              </p>
            </div>

            <div className="flex justify-center gap-4 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500">
                {session?.user && (session.user as any)?.image ? (
                  <Image
                    src={(session.user as any).image}
                    alt={session.user.name || 'You'}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-900 flex items-center justify-center">
                    <Suspense fallback={<div className="w-12 h-12 animate-pulse bg-gray-300 rounded" />}>
                      <IconComponents.Users className="w-12 h-12 text-white" />
                    </Suspense>
                  </div>
                )}
              </div>
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-pink-500">
                {matchModal.otherUser?.profileImage ? (
                  <Image
                    src={matchModal.otherUser.profileImage}
                    alt={matchModal.otherUser.name}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-pink-900 flex items-center justify-center">
                    <Suspense fallback={<div className="w-12 h-12 animate-pulse bg-gray-300 rounded" />}>
                      <IconComponents.Users className="w-12 h-12 text-white" />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                onClick={() => {
                  setMatchModal(null)
                  router.push(`/${locale}/study-buddy/matches`)
                }}
              >
                <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded mr-2" />}>
                  <IconComponents.MessageCircle className="w-4 h-4 mr-2" />
                </Suspense>
                {isArabic ? 'ابدأ الدردشة' : 'Start Chatting'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMatchModal(null)}
              >
                {isArabic ? 'استمر في التمرير' : 'Keep Swiping'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
