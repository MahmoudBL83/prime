'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

import XPProgressBar from '@/components/gamification/XPProgressBar'
import BadgeDisplay from '@/components/gamification/BadgeDisplay'
import AchievementCard from '@/components/gamification/AchievementCard'

export default function AchievementsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [xpData, setXpData] = useState<any>(null)
    const [achievements, setAchievements] = useState<any[]>([])
    const [badges, setBadges] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
            return
        }
        if (status === 'authenticated') {
            fetchAll()
        }
    }, [status])

    const fetchAll = async () => {
        setLoading(true)
        try {
            const [xpRes, achRes, badgeRes] = await Promise.all([
                fetch('/api/gamification/xp'),
                fetch('/api/gamification/achievements'),
                fetch('/api/gamification/badges')
            ])

            if (xpRes.ok) setXpData(await xpRes.json())
            if (achRes.ok) setAchievements((await achRes.json()).achievements || [])
            if (badgeRes.ok) setBadges((await badgeRes.json()).badges || [])
        } catch (err) {
            console.error(err)
            toast.error('Failed to load achievements data')
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchAll()
        setRefreshing(false)
        toast.success('Achievements refreshed')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0a84ff] mx-auto mb-3" />
                    <p className="text-muted-foreground">Loading achievements...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-gray-900/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => router.push('/creator/dashboard')} className="p-2 hover:bg-card rounded-md">
                            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
                            <p className="text-muted-foreground">Track your badges, XP, and milestones</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button onClick={handleRefresh} className="px-3 py-2 bg-card rounded-md flex items-center space-x-2">
                            <RefreshCw className={`${refreshing ? 'animate-spin' : ''} w-4 h-4 text-muted-foreground`} />
                            <span className="text-muted-foreground">Refresh</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* XP Card */}
                <div className="bg-gray-900/50 border border-border rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Your Progress</h2>
                            <p className="text-sm text-muted-foreground">Level up by earning XP from lessons, quizzes and achievements</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total XP</p>
                            <p className="text-2xl font-bold text-foreground">{xpData?.xp?.lifetimeXP?.toLocaleString() ?? 0}</p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <XPProgressBar
                            currentXP={xpData?.xp?.totalXP ?? 0}
                            totalXP={xpData?.xp?.lifetimeXP ?? 0}
                            currentLevel={xpData?.xp?.currentLevel ?? 1}
                            xpToNextLevel={xpData?.xp?.xpToNextLevel ?? 100}
                            levelProgress={xpData?.xp?.levelProgress ?? 0}
                        />
                    </div>
                </div>

                {/* Badges Grid */}
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Badges</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {badges.map((b: any) => (
                            <BadgeDisplay
                                key={b.id}
                                title={b.title}
                                titleAr={b.titleAr}
                                description={b.description}
                                descriptionAr={b.descriptionAr}
                                icon={b.icon}
                                color={b.color}
                                rarity={b.rarity}
                                isEarned={b.isEarned}
                                progress={b.progress}
                                earnedAt={b.earnedAt}
                                xpReward={b.xpReward}
                            />
                        ))}
                    </div>
                </div>

                {/* Achievements List */}
                <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Achievements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {achievements.map((a: any, i: number) => (
                            <AchievementCard
                                key={a.id}
                                type={a.type}
                                title={a.title}
                                titleAr={a.titleAr}
                                description={a.description}
                                descriptionAr={a.descriptionAr}
                                points={a.points}
                                unlockedAt={new Date(a.unlockedAt)}
                                course={a.course}
                                delay={i * 0.03}
                            />
                        ))}

                        {achievements.length === 0 && (
                            <div className="p-6 bg-gray-900/40 rounded-xl text-center">
                                <p className="text-muted-foreground">No achievements yet. Complete courses and activities to unlock them.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'
