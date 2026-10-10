'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import {
  Trophy,
  Award,
  TrendingUp,
  Users,
  Target,
  Star,
  Medal,
  Crown
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface LeaderboardEntry {
  id: string
  userId: string
  totalScore: number
  quizScore: number
  projectScore: number
  participationScore: number
  rank: number
  user: {
    id: string
    name: string
    arabicName?: string
    profileImage?: string
  }
}

interface UserPosition {
  id: string
  totalScore: number
  quizScore: number
  projectScore: number
  participationScore: number
  rank: number
  totalParticipants: number
}

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams: Promise<{ courseId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const { data: session } = useSession()
  const t = useTranslations('Leaderboard')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(resolvedSearchParams.courseId || '')

  useEffect(() => {
    if (selectedCourse && session?.user?.id) {
      fetchLeaderboard()
    }
  }, [selectedCourse, session])

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/leaderboard?courseId=${selectedCourse}&userId=${session?.user?.id}&limit=50`
      )
      const data = await response.json()
      setLeaderboard(data.leaderboard || [])
      setUserPosition(data.userPosition)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />
    return <span className="text-gray-500 font-semibold">#{rank}</span>
  }

  const getScoreColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600'
    return 'bg-gradient-to-r from-blue-500 to-blue-700'
  }

  if (!selectedCourse) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
          <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
          <p className="text-gray-600">{t('selectCourse')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
          <h1 className="text-4xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* User's Current Position */}
      {userPosition && (
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('yourRank')}</h2>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">#{userPosition.rank}</div>
                <div>
                  <div className="text-sm opacity-90">
                    {t('outOf')} {userPosition.totalParticipants} {t('participants')}
                  </div>
                  <div className="text-2xl font-bold">{userPosition.totalScore.toFixed(0)} {t('points')}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-1">{t('breakdown')}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <span className="text-sm">{t('quizScore')}: {userPosition.quizScore.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="text-sm">{t('projectScore')}: {userPosition.projectScore.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">{t('participationScore')}: {userPosition.participationScore.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="mb-8 grid grid-cols-3 gap-4 max-w-4xl mx-auto">
          {/* 2nd Place */}
          <div className="order-1 pt-12">
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-2xl p-6 text-center shadow-lg">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-4 border-gray-400">
                {leaderboard[1]?.user.profileImage ? (
                  <img
                    src={leaderboard[1].user.profileImage}
                    alt={leaderboard[1].user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                    {leaderboard[1]?.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <Medal className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <div className="font-bold text-lg">{leaderboard[1]?.user.name}</div>
              <div className="text-2xl font-bold text-gray-700 mt-2">
                {leaderboard[1]?.totalScore.toFixed(0)}
              </div>
              <div className="text-sm text-gray-600">{t('points')}</div>
            </div>
            <div className="bg-gray-400 h-24 rounded-b-lg"></div>
          </div>

          {/* 1st Place */}
          <div className="order-2">
            <div className="bg-gradient-to-b from-yellow-100 to-yellow-200 rounded-t-2xl p-6 text-center shadow-2xl">
              <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-4 border-yellow-500">
                {leaderboard[0]?.user.profileImage ? (
                  <img
                    src={leaderboard[0].user.profileImage}
                    alt={leaderboard[0].user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-yellow-300 flex items-center justify-center text-3xl font-bold text-yellow-700">
                    {leaderboard[0]?.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
              <div className="font-bold text-xl">{leaderboard[0]?.user.name}</div>
              <div className="text-3xl font-bold text-yellow-700 mt-2">
                {leaderboard[0]?.totalScore.toFixed(0)}
              </div>
              <div className="text-sm text-yellow-800">{t('points')}</div>
            </div>
            <div className="bg-yellow-500 h-32 rounded-b-lg"></div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 pt-16">
            <div className="bg-gradient-to-b from-orange-100 to-orange-200 rounded-t-2xl p-6 text-center shadow-lg">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden border-4 border-orange-600">
                {leaderboard[2]?.user.profileImage ? (
                  <img
                    src={leaderboard[2].user.profileImage}
                    alt={leaderboard[2].user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-300 flex items-center justify-center text-2xl font-bold text-orange-700">
                    {leaderboard[2]?.user.name.charAt(0)}
                  </div>
                )}
              </div>
              <Medal className="w-10 h-10 mx-auto mb-2 text-orange-600" />
              <div className="font-bold text-lg">{leaderboard[2]?.user.name}</div>
              <div className="text-2xl font-bold text-orange-700 mt-2">
                {leaderboard[2]?.totalScore.toFixed(0)}
              </div>
              <div className="text-sm text-orange-800">{t('points')}</div>
            </div>
            <div className="bg-orange-600 h-20 rounded-b-lg"></div>
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t('fullRankings')}
          </h2>
        </div>

        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('loading')}</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('noData')}
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  entry.userId === session?.user?.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-16 text-center">
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300">
                    {entry.user.profileImage ? (
                      <img
                        src={entry.user.profileImage}
                        alt={entry.user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                        {entry.user.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name & Score */}
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{entry.user.name}</div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {entry.quizScore.toFixed(0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {entry.projectScore.toFixed(0)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {entry.participationScore.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Total Score */}
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getScoreColor(entry.rank)} bg-clip-text text-transparent`}>
                      {entry.totalScore.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500">{t('points')}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
