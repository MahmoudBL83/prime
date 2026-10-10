'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

import LeaderboardTable from '@/components/gamification/LeaderboardTable'

export default function LeaderboardPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [currentUserRank, setCurrentUserRank] = useState<any>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
            return
        }
        if (status === 'authenticated') {
            fetchLeaderboard()
        }
    }, [status])

    const fetchLeaderboard = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/gamification/leaderboard?type=xp&limit=50')
            if (res.ok) {
                const data = await res.json()
                setEntries(data.leaderboard || [])
                setCurrentUserRank(data.currentUserRank || null)
            }
        } catch (err) {
            console.error(err)
            toast.error('Failed to load leaderboard')
        } finally {
            setLoading(false)
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await fetchLeaderboard()
        setRefreshing(false)
        toast.success('Leaderboard refreshed')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0a84ff] mx-auto mb-3" />
                    <p className="text-muted-foreground">Loading leaderboard...</p>
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
                            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
                            <p className="text-muted-foreground">See top creators and learners by XP</p>
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

            <div className="max-w-7xl mx-auto px-6 py-8">
                <LeaderboardTable entries={entries} type="xp" currentUserId={session?.user?.id} currentUserRank={currentUserRank} />
            </div>
        </div>
    )
}

// Prevent static generation for pages that use session data
export const dynamic = 'force-dynamic'

export const runtime = 'edge'
