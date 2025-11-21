'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import {
  Gift,
  Award,
  DollarSign,
  Crown,
  BookOpen,
  Star,
  Calendar,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface Reward {
  id: string
  title: string
  titleAr?: string
  description: string
  descriptionAr?: string
  type: string
  value?: number
  currency?: string
  courseId?: string
  maxWinners?: number
  startDate?: string
  endDate?: string
  isActive: boolean
  imageUrl?: string
  course?: {
    id: string
    title: string
    titleAr?: string
  }
  winners: Array<{
    id: string
    userId: string
    rank?: number
    status: string
    awardedAt: string
    claimedAt?: string
    user: {
      id: string
      name: string
      arabicName?: string
      profileImage?: string
    }
  }>
}

const REWARD_TYPE_ICONS: Record<string, any> = {
  SCHOLARSHIP: Award,
  PRIZE: Gift,
  DISCOUNT: DollarSign,
  CERTIFICATE: BookOpen,
  BADGE: Star,
  COURSE_ACCESS: Crown
}

const REWARD_TYPE_COLORS: Record<string, string> = {
  SCHOLARSHIP: 'from-yellow-400 to-yellow-600',
  PRIZE: 'from-pink-400 to-pink-600',
  DISCOUNT: 'from-green-400 to-green-600',
  CERTIFICATE: 'from-blue-400 to-blue-600',
  BADGE: 'from-purple-400 to-purple-600',
  COURSE_ACCESS: 'from-indigo-400 to-indigo-600'
}

export default function RewardsPage() {
  const { data: session } = useSession()
  const t = useTranslations('Rewards')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [claiming, setClaiming] = useState<string | null>(null)

  useEffect(() => {
    fetchRewards()
  }, [])

  const fetchRewards = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rewards')
      const data = await response.json()
      setRewards(data.rewards || [])
    } catch (error) {
      console.error('Failed to fetch rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaimReward = async (winnerId: string) => {
    try {
      setClaiming(winnerId)
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId })
      })

      if (!response.ok) {
        throw new Error('Failed to claim reward')
      }

      // Refresh rewards
      await fetchRewards()
      alert(t('claimSuccess'))
    } catch (error) {
      console.error('Failed to claim reward:', error)
      alert(t('claimError'))
    } finally {
      setClaiming(null)
    }
  }

  const getRewardIcon = (type: string) => {
    return REWARD_TYPE_ICONS[type] || Gift
  }

  const getRewardColor = (type: string) => {
    return REWARD_TYPE_COLORS[type] || 'from-gray-400 to-gray-600'
  }

  const isUserWinner = (reward: Reward) => {
    return reward.winners.some(w => w.userId === session?.user?.id)
  }

  const getUserWinner = (reward: Reward) => {
    return reward.winners.find(w => w.userId === session?.user?.id)
  }

  const getTimeRemaining = (endDate: string) => {
    const now = new Date()
    const end = new Date(endDate)
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) return t('expired')

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h ${t('remaining')}`
    return `${hours}h ${t('remaining')}`
  }

  const filteredRewards = selectedType
    ? rewards.filter(r => r.type === selectedType)
    : rewards

  const activeRewards = filteredRewards.filter(r => r.isActive)
  const userRewards = rewards.filter(r => isUserWinner(r))

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <Gift className="w-12 h-12 text-pink-500" />
          <h1 className="text-4xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-gray-600">{t('subtitle')}</p>
      </div>

      {/* My Rewards Section */}
      {userRewards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-500" />
            {t('myRewards')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRewards.map(reward => {
              const winner = getUserWinner(reward)
              const Icon = getRewardIcon(reward.type)

              return (
                <div
                  key={reward.id}
                  className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-10 h-10 text-yellow-600" />
                    {winner?.status === 'CLAIMED' ? (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {t('claimed')}
                      </span>
                    ) : (
                      <button
                        onClick={() => winner && handleClaimReward(winner.id)}
                        disabled={claiming === winner?.id}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {claiming === winner?.id ? t('claiming') : t('claimNow')}
                      </button>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{reward.title}</h3>
                  <p className="text-gray-700 mb-4">{reward.description}</p>

                  {reward.value && (
                    <div className="text-2xl font-bold text-yellow-600 mb-2">
                      {reward.value} {reward.currency}
                    </div>
                  )}

                  {winner?.rank && (
                    <div className="text-sm text-gray-600 mb-2">
                      🏆 {t('rank')}: #{winner.rank}
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    {t('awardedOn')} {new Date(winner!.awardedAt).toLocaleDateString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter by Type */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedType(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !selectedType
              ? 'bg-pink-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('allTypes')}
        </button>
        {Object.keys(REWARD_TYPE_ICONS).map(type => {
          const Icon = getRewardIcon(type)
          const count = rewards.filter(r => r.type === type).length
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedType === type
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {type} ({count})
            </button>
          )
        })}
      </div>

      {/* Available Rewards */}
      <h2 className="text-2xl font-bold mb-6">{t('availableRewards')}</h2>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      ) : activeRewards.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{t('noRewards')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeRewards.map(reward => {
            const Icon = getRewardIcon(reward.type)
            const colorClass = getRewardColor(reward.type)
            const spotsLeft = reward.maxWinners
              ? reward.maxWinners - reward.winners.length
              : null

            return (
              <div
                key={reward.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Reward Image */}
                {reward.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={reward.imageUrl}
                      alt={reward.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`h-48 bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                    <Icon className="w-24 h-24 text-white opacity-90" />
                  </div>
                )}

                {/* Reward Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-6 h-6 text-gray-700" />
                      <span className="text-sm font-medium text-gray-600">{reward.type}</span>
                    </div>
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-semibold">
                        {spotsLeft} {t('spotsLeft')}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{reward.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{reward.description}</p>

                  {reward.value && (
                    <div className="text-3xl font-bold text-gray-800 mb-4">
                      {reward.value} {reward.currency}
                    </div>
                  )}

                  {reward.course && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <BookOpen className="w-4 h-4" />
                      <span>{reward.course.title}</span>
                    </div>
                  )}

                  {reward.endDate && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeRemaining(reward.endDate)}</span>
                    </div>
                  )}

                  {/* Winners List */}
                  {reward.winners.length > 0 && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {t('winners')} ({reward.winners.length})
                      </div>
                      <div className="flex -space-x-2">
                        {reward.winners.slice(0, 5).map(winner => (
                          <div
                            key={winner.id}
                            className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
                            title={winner.user.name}
                          >
                            {winner.user.profileImage ? (
                              <img
                                src={winner.user.profileImage}
                                alt={winner.user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                                {winner.user.name.charAt(0)}
                              </div>
                            )}
                          </div>
                        ))}
                        {reward.winners.length > 5 && (
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-semibold">
                            +{reward.winners.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
