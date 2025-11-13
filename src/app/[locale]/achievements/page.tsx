'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import {
  Award,
  Trophy,
  Star,
  Zap,
  Target,
  Users,
  BookOpen,
  TrendingUp,
  Heart,
  CheckCircle
} from 'lucide-react'

interface Achievement {
  id: string
  type: string
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  icon?: string
  points: number
  courseId?: string
  unlockedAt: string
  course?: {
    id: string
    title: string
    titleAr?: string
  }
}

const ACHIEVEMENT_ICONS: Record<string, any> = {
  FIRST_COURSE_COMPLETED: BookOpen,
  QUIZ_MASTER: Trophy,
  PERFECT_SCORE: Target,
  FAST_LEARNER: Zap,
  CONSISTENT_LEARNER: TrendingUp,
  TOP_PERFORMER: Star,
  PEER_REVIEWER: Users,
  COMMUNITY_HELPER: Heart,
  CERTIFICATE_EARNED: Award,
  STREAK_MILESTONE: CheckCircle
}

const ACHIEVEMENT_COLORS: Record<string, string> = {
  FIRST_COURSE_COMPLETED: 'from-green-400 to-green-600',
  QUIZ_MASTER: 'from-yellow-400 to-yellow-600',
  PERFECT_SCORE: 'from-red-400 to-red-600',
  FAST_LEARNER: 'from-purple-400 to-purple-600',
  CONSISTENT_LEARNER: 'from-blue-400 to-blue-600',
  TOP_PERFORMER: 'from-pink-400 to-pink-600',
  PEER_REVIEWER: 'from-indigo-400 to-indigo-600',
  COMMUNITY_HELPER: 'from-orange-400 to-orange-600',
  CERTIFICATE_EARNED: 'from-teal-400 to-teal-600',
  STREAK_MILESTONE: 'from-cyan-400 to-cyan-600'
}

export default function AchievementsPage() {
  const { data: session } = useSession()
  const t = useTranslations('Achievements')
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [grouped, setGrouped] = useState<Record<string, Achievement[]>>({})
  const [totalPoints, setTotalPoints] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchAchievements()
    }
  }, [session])

  const fetchAchievements = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/achievements?userId=${session?.user?.id}`)
      const data = await response.json()
      setAchievements(data.achievements || [])
      setGrouped(data.grouped || {})
      setTotalPoints(data.totalPoints || 0)
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAchievementIcon = (type: string) => {
    const IconComponent = ACHIEVEMENT_ICONS[type] || Award
    return IconComponent
  }

  const getAchievementColor = (type: string) => {
    return ACHIEVEMENT_COLORS[type] || 'from-gray-400 to-gray-600'
  }

  const filteredAchievements = selectedType
    ? achievements.filter(a => a.type === selectedType)
    : achievements

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <Award className="w-12 h-12 text-yellow-500" />
          <h1 className="text-4xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <Trophy className="w-10 h-10 mb-3" />
          <div className="text-4xl font-bold mb-1">{achievements.length}</div>
          <div className="text-sm opacity-90">{t('totalAchievements')}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <Star className="w-10 h-10 mb-3" />
          <div className="text-4xl font-bold mb-1">{totalPoints}</div>
          <div className="text-sm opacity-90">{t('totalPoints')}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <Target className="w-10 h-10 mb-3" />
          <div className="text-4xl font-bold mb-1">{Object.keys(grouped).length}</div>
          <div className="text-sm opacity-90">{t('categories')}</div>
        </div>
      </div>

      {/* Filter by Type */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !selectedType
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('allTypes')}
        </button>
        {Object.keys(grouped).map(type => {
          const Icon = getAchievementIcon(type)
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {type.replace(/_/g, ' ')} ({grouped[type].length})
            </button>
          )
        })}
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{t('noAchievements')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map(achievement => {
            const Icon = getAchievementIcon(achievement.type)
            const colorClass = getAchievementColor(achievement.type)

            return (
              <div
                key={achievement.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Badge Header */}
                <div className={`bg-gradient-to-r ${colorClass} p-6 text-white`}>
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="w-12 h-12" />
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold">
                      +{achievement.points} pts
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{achievement.title}</h3>
                  {achievement.titleAr && (
                    <p className="text-sm opacity-90">{achievement.titleAr}</p>
                  )}
                </div>

                {/* Badge Details */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{achievement.description}</p>
                  {achievement.descriptionAr && (
                    <p className="text-gray-600 text-sm mb-4 italic">{achievement.descriptionAr}</p>
                  )}

                  {achievement.course && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <BookOpen className="w-4 h-4" />
                      <span>{achievement.course.title}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t('unlockedOn')}</span>
                    <span className="font-semibold text-gray-700">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Sparkle Effect */}
                <div className="absolute top-4 right-4 animate-pulse">
                  <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Locked Achievements (Future Feature) */}
      <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center">
        <div className="inline-flex items-center gap-2 text-gray-400 mb-3">
          <Award className="w-8 h-8" />
          <span className="text-xl font-semibold">{t('moreToUnlock')}</span>
        </div>
        <p className="text-gray-500">
          {t('keepLearning')}
        </p>
      </div>
    </div>
  )
}
