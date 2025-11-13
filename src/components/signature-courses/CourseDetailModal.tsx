'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Star,
  Users,
  Clock,
  Award,
  BookOpen,
  Target,
  Sparkles,
  ChevronDown,
  Crown,
  Trophy,
  Video,
  FileText,
  MessageSquare,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Lesson {
  id: string
  title: string
  duration: string
  description: string
  thumbnail?: string
  order: number
  moduleId?: string
}

interface Module {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

interface CourseDetailModalProps {
  isOpen: boolean
  onClose: () => void
  course: {
    id: string
    title: string
    description: string
    thumbnail?: string
    instructor: {
      name: string
      profileImage?: string
    }
    duration: string
    enrollmentCount: number
    rating: number
    ratingCount: number
    price: number
    level: string
    category: string
    hasWorkbook: boolean
    hasCohort: boolean
    hasExpertQA: boolean
    hasCapstone: boolean
  }
  isRTL: boolean
  onAddToList: () => void
  isInList: boolean
  onStartCourse: () => void
}

export default function CourseDetailModal({
  isOpen,
  onClose,
  course,
  isRTL,
  onAddToList,
  isInList,
  onStartCourse,
}: CourseDetailModalProps) {
  const [isMuted, setIsMuted] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'lessons' | 'reviews'>('overview')
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<string>('all')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null)

  const t = {
    en: {
      play: 'Play',
      addToList: 'Add to My List',
      removeFromList: 'Remove from List',
      like: 'Like',
      dislike: 'Not for me',
      overview: 'Overview',
      lessons: 'Lessons',
      reviews: 'Reviews',
      instructor: 'Instructor',
      students: 'students',
      rating: 'rating',
      duration: 'Total Duration',
      level: 'Level',
      category: 'Category',
      features: 'What You\'ll Get',
      workbooks: 'Downloadable Workbooks',
      cohort: 'Live Cohort Learning',
      expertQA: 'Expert Q&A Sessions',
      capstone: 'Capstone Project',
      certificate: 'Certificate of Completion',
      similarCourses: 'More Like This',
      aboutCourse: 'About This Course',
      whatYouLearn: 'What You\'ll Learn',
      episode: 'Lesson',
      part: 'Part',
    },
    ar: {
      play: 'تشغيل',
      addToList: 'إضافة إلى قائمتي',
      removeFromList: 'إزالة من القائمة',
      like: 'أعجبني',
      dislike: 'ليس لي',
      overview: 'نظرة عامة',
      lessons: 'الدروس',
      reviews: 'المراجعات',
      instructor: 'المدرس',
      students: 'طالب',
      rating: 'تقييم',
      duration: 'المدة الإجمالية',
      level: 'المستوى',
      category: 'الفئة',
      features: 'ما ستحصل عليه',
      workbooks: 'كتب عمل قابلة للتنزيل',
      cohort: 'تعلم جماعي مباشر',
      expertQA: 'جلسات أسئلة وأجوبة',
      capstone: 'مشروع نهائي',
      certificate: 'شهادة إتمام',
      similarCourses: 'دورات مشابهة',
      aboutCourse: 'عن هذه الدورة',
      whatYouLearn: 'ما ستتعلمه',
      episode: 'درس',
      part: 'جزء',
    },
  }

  const currentT = isRTL ? t.ar : t.en

  // Fetch lessons when modal opens and lessons tab is selected
  useEffect(() => {
    if (isOpen && selectedTab === 'lessons' && modules.length === 0) {
      fetchLessons()
    }
  }, [isOpen, selectedTab])

  const fetchLessons = async () => {
    setIsLoadingLessons(true)
    
    // Generate demo modules and lessons
    const demoModules: Module[] = Array.from({ length: 3 }, (_, moduleIndex) => {
      const moduleLessons: Lesson[] = Array.from({ length: 5 }, (_, lessonIndex) => ({
        id: `lesson-${moduleIndex}-${lessonIndex + 1}`,
        title: `${currentT.episode} ${lessonIndex + 1}: ${course.title}`,
        duration: `${Math.floor(Math.random() * 30) + 15}m`,
        description: `Learn essential concepts and practical skills in this comprehensive lesson.`,
        order: lessonIndex + 1,
        moduleId: `module-${moduleIndex + 1}`
      }))
      
      return {
        id: `module-${moduleIndex + 1}`,
        title: `${currentT.part} ${moduleIndex + 1}`,
        order: moduleIndex + 1,
        lessons: moduleLessons
      }
    })
    
    console.log('🎬 Generated demo modules:', demoModules)
    console.log('📚 Total lessons:', demoModules.flatMap(m => m.lessons).length)
    
    setModules(demoModules)
    setSelectedModule(demoModules[0]?.id || 'module-1')
    setLessons(demoModules.flatMap(m => m.lessons))
    setIsLoadingLessons(false)
    
    console.log('✅ Selected module set to:', demoModules[0]?.id)
  }

  const getRandomNetflixImage = (index: number) => {
    return `/images/courses/netflix${(index % 6) + 1}.jpg`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <motion.div
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-5xl my-8 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#181818] rounded-lg overflow-hidden shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 w-10 h-10 bg-[#181818] hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Hero Section with Background */}
              <div className="relative h-[500px] w-full">
                {/* Background Image */}
                <img
                  src={getRandomNetflixImage(course.id.charCodeAt(0))}
                  alt={course.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#181818]/80 via-transparent to-transparent" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-8 pb-12">
                  {/* Netflix Logo Badge */}
                  <div className="mb-4">
                    <Badge className="bg-[#E50914] text-white border-0 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      SIGNATURE COURSE
                    </Badge>
                  </div>

                  {/* Title */}
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-4 max-w-2xl">
                    {course.title}
                  </h2>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 mb-6 text-sm">
                    <span className="text-green-500 font-bold text-lg">
                      {(course.rating * 10).toFixed(0)}% Match
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-semibold">{course.rating}</span>
                      <span className="text-gray-400">({course.ratingCount})</span>
                    </div>
                    <span className="text-gray-300">{course.duration}</span>
                    <span className="border border-gray-500 px-2 py-0.5 text-gray-300 text-xs">
                      {course.level}
                    </span>
                    <Badge className="bg-yellow-600 text-white border-0">
                      <Trophy className="w-3 h-3 mr-1" />
                      {isRTL ? 'شهادة' : 'Certificate'}
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={onStartCourse}
                      className="bg-white hover:bg-gray-200 text-black font-bold px-8 py-3"
                    >
                      <Play className="w-5 h-5 mr-2" fill="black" />
                      {currentT.play}
                    </Button>
                    
                    <button
                      onClick={onAddToList}
                      className="w-11 h-11 bg-transparent hover:bg-gray-700 border-2 border-gray-400 hover:border-white rounded-full flex items-center justify-center transition-colors"
                    >
                      {isInList ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <Plus className="w-5 h-5 text-white" />
                      )}
                    </button>

                    <button className="w-11 h-11 bg-transparent hover:bg-gray-700 border-2 border-gray-400 hover:border-white rounded-full flex items-center justify-center transition-colors">
                      <ThumbsUp className="w-5 h-5 text-white" />
                    </button>

                    <button className="w-11 h-11 bg-transparent hover:bg-gray-700 border-2 border-gray-400 hover:border-white rounded-full flex items-center justify-center transition-colors">
                      <ThumbsDown className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex-1"></div>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="w-11 h-11 bg-transparent hover:bg-gray-700 border-2 border-gray-400 hover:border-white rounded-full flex items-center justify-center transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-6 px-8 pt-6 border-b border-gray-700">
                {['overview', 'lessons', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab as typeof selectedTab)}
                    className={`pb-3 text-sm font-semibold transition-colors relative ${
                      selectedTab === tab
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {currentT[tab as keyof typeof currentT]}
                    {selectedTab === tab && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-[#E50914]"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-8 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                {/* Overview Tab */}
                {selectedTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <p className="text-gray-300 text-base leading-relaxed">{course.description}</p>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600">
                        {course.instructor.profileImage ? (
                          <img src={course.instructor.profileImage} alt={course.instructor.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
                            {course.instructor.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">{currentT.instructor}</p>
                        <p className="text-white font-semibold">{course.instructor.name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lessons Tab */}
                {selectedTab === 'lessons' && (
                  <div className="space-y-4">
                    {/* Module Selector - Netflix Style */}
                    {modules.length > 1 && (
                      <div className="mb-6 flex items-center gap-3">
                        <select
                          value={selectedModule}
                          onChange={(e) => {
                            console.log('📦 Module changed to:', e.target.value)
                            setSelectedModule(e.target.value)
                          }}
                          className="bg-[#2a2a2a] text-white border border-gray-600 rounded px-4 py-2 text-sm font-semibold cursor-pointer hover:bg-[#333] focus:outline-none focus:ring-2 focus:ring-white"
                        >
                          {modules.map((module) => (
                            <option key={module.id} value={module.id}>
                              {module.title} ({module.lessons.length} {isRTL ? 'دروس' : 'lessons'})
                            </option>
                          ))}
                        </select>
                        <span className="text-gray-400 text-sm">
                          {modules.find(m => m.id === selectedModule)?.lessons.length || 0} {isRTL ? 'دروس' : 'lessons'}
                        </span>
                      </div>
                    )}

                    {isLoadingLessons ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        {/* Display lessons from selected module */}
                        {(() => {
                          const filteredLessons = modules
                            .filter(m => m.id === selectedModule)
                            .flatMap(m => m.lessons)
                          
                          console.log('🎯 Selected Module:', selectedModule)
                          console.log('📦 Available Modules:', modules.map(m => m.id))
                          console.log('📝 Filtered Lessons:', filteredLessons.length)
                          
                          return filteredLessons.map((lesson, index) => (
                            <div
                              key={lesson.id}
                              className="bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
                              onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                            >
                              <div className="flex items-center gap-4 p-4">
                                {/* Lesson Number */}
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">{index + 1}</span>
                                </div>

                                {/* Thumbnail */}
                                <div className="relative w-32 h-20 flex-shrink-0 bg-gray-900 rounded overflow-hidden">
                                  <img
                                    src={getRandomNetflixImage(index)}
                                    alt={lesson.title}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-white" fill="white" />
                                  </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-white font-semibold mb-1 truncate">{lesson.title}</h4>
                                  <p className="text-gray-400 text-sm line-clamp-2">{lesson.description}</p>
                                </div>

                                {/* Duration */}
                                <div className="flex-shrink-0 text-gray-400 text-sm">{lesson.duration}</div>

                                {/* Expand Icon */}
                                <ChevronDown
                                  className={`w-5 h-5 text-gray-400 transition-transform ${
                                    expandedLesson === lesson.id ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>

                              {/* Expanded Content */}
                              <AnimatePresence>
                                {expandedLesson === lesson.id && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-gray-700 px-4 py-3 bg-gray-900/50"
                                  >
                                    <p className="text-gray-300 text-sm mb-3">{lesson.description}</p>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        onStartCourse()
                                      }}
                                      className="bg-white hover:bg-gray-200 text-black font-semibold"
                                    >
                                      <Play className="w-4 h-4 mr-2" />
                                      {currentT.play}
                                    </Button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))
                        })()}
                      </>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {selectedTab === 'reviews' && (
                  <div className="space-y-4">
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {isRTL ? 'المراجعات قادمة قريباً' : 'Reviews coming soon'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
