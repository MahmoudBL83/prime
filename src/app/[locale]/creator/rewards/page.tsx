'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    Award,
    Trophy,
    Gift,
    Plus,
    Edit,
    Trash2,
    Users,
    Calendar,
    DollarSign,
    Target,
    TrendingUp,
    Crown,
    Star,
    Loader2,
    X,
    Check,
    AlertCircle,
    ArrowLeft,
    Home,
    Settings,
    Eye,
    Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { CreatorSidebar, CreatorHeader } from '@/components/creator'

interface Reward {
    id: string
    title: string
    titleAr?: string
    description: string
    descriptionAr?: string
    type: 'SCHOLARSHIP' | 'PRIZE' | 'BADGE' | 'CERTIFICATE'
    value?: number
    currency?: string
    maxWinners?: number
    startDate?: string
    endDate?: string
    isActive: boolean
    status: 'UPCOMING' | 'ACTIVE' | 'ENDED'
    currentWinners: number
    courseId?: string
    courseTitle?: string
    courseTitleAr?: string
    imageUrl?: string
}

export default function CreatorRewardsPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [rewards, setRewards] = useState<Reward[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all')

    useEffect(() => {
        if (session?.user) {
            fetchRewards()
        }
    }, [session])

    const fetchRewards = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/creator/rewards')
            if (response.ok) {
                const data = await response.json()
                setRewards(data.rewards || [])
            } else {
                toast.error(isArabic ? 'فشل تحميل المكافآت' : 'Failed to load rewards')
            }
        } catch (error) {
            console.error('Failed to fetch rewards:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const filteredRewards = rewards.filter(reward => {
        if (filter === 'all') return true
        if (filter === 'active') return reward.status === 'ACTIVE'
        if (filter === 'ended') return reward.status === 'ENDED'
        return true
    })

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'SCHOLARSHIP':
                return <DollarSign className="w-5 h-5" />
            case 'PRIZE':
                return <Gift className="w-5 h-5" />
            case 'BADGE':
                return <Award className="w-5 h-5" />
            case 'CERTIFICATE':
                return <Trophy className="w-5 h-5" />
            default:
                return <Star className="w-5 h-5" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                        {isArabic ? 'نشط' : 'Active'}
                    </Badge>
                )
            case 'UPCOMING':
                return (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {isArabic ? 'قريباً' : 'Upcoming'}
                    </Badge>
                )
            case 'ENDED':
                return (
                    <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                        {isArabic ? 'منتهي' : 'Ended'}
                    </Badge>
                )
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <CreatorHeader title="Rewards" titleAr="المكافآت" />
                <div className="flex">
                    <CreatorSidebar />
                    <main className="flex-1 p-8 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <CreatorHeader 
                title="Rewards & Scholarships" 
                titleAr="المكافآت والمنح الدراسية"
                rightContent={
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {isArabic ? 'إنشاء مكافأة' : 'Create Reward'}
                    </Button>
                }
            />
            
            <div className="flex">
                <CreatorSidebar />
                
                <main className="flex-1 p-8">
                    {/* Page Description */}
                    <div className="mb-8">
                        <p className="text-muted-foreground">
                            {isArabic
                                ? 'قم بإنشاء وإدارة المكافآت للطلاب المتفوقين'
                                : 'Create and manage rewards for top-performing students'}
                        </p>
                    </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Trophy className="w-8 h-8 text-purple-400" />
                            <span className="text-2xl font-bold text-white">{rewards.length}</span>
                        </div>
                        <h3 className="text-gray-400 text-sm">{isArabic ? 'إجمالي المكافآت' : 'Total Rewards'}</h3>
                    </div>

                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Target className="w-8 h-8 text-green-400" />
                            <span className="text-2xl font-bold text-white">
                                {rewards.filter(r => r.status === 'ACTIVE').length}
                            </span>
                        </div>
                        <h3 className="text-gray-400 text-sm">{isArabic ? 'نشط' : 'Active'}</h3>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Users className="w-8 h-8 text-yellow-400" />
                            <span className="text-2xl font-bold text-white">
                                {rewards.reduce((sum, r) => sum + r.currentWinners, 0)}
                            </span>
                        </div>
                        <h3 className="text-gray-400 text-sm">{isArabic ? 'الفائزون' : 'Winners'}</h3>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-3">
                            <DollarSign className="w-8 h-8 text-blue-400" />
                            <span className="text-2xl font-bold text-white">
                                {rewards
                                    .filter(r => r.value)
                                    .reduce((sum, r) => sum + (r.value || 0), 0)
                                    .toLocaleString()}
                            </span>
                        </div>
                        <h3 className="text-gray-400 text-sm">{isArabic ? 'إجمالي القيمة' : 'Total Value'}</h3>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-6">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        {isArabic ? 'الكل' : 'All'}
                    </Button>
                    <Button
                        variant={filter === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('active')}
                    >
                        {isArabic ? 'نشط' : 'Active'}
                    </Button>
                    <Button
                        variant={filter === 'ended' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('ended')}
                    >
                        {isArabic ? 'منتهي' : 'Ended'}
                    </Button>
                </div>

                {/* Rewards List */}
                {filteredRewards.length === 0 ? (
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-12 text-center">
                        <Trophy className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                            {isArabic ? 'لا توجد مكافآت' : 'No Rewards Yet'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {isArabic
                                ? 'قم بإنشاء أول مكافأة لتحفيز طلابك'
                                : 'Create your first reward to motivate your students'}
                        </p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {isArabic ? 'إنشاء مكافأة' : 'Create Reward'}
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRewards.map((reward) => (
                            <motion.div
                                key={reward.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group"
                            >
                                {/* Image/Icon */}
                                <div className="h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                    {reward.imageUrl ? (
                                        <Image
                                            src={reward.imageUrl}
                                            alt={reward.title}
                                            width={200}
                                            height={160}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <div className="text-purple-400">
                                            {getTypeIcon(reward.type)}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1">
                                                {isArabic && reward.titleAr ? reward.titleAr : reward.title}
                                            </h3>
                                            {reward.courseTitle && (
                                                <p className="text-sm text-gray-400">
                                                    {isArabic && reward.courseTitleAr ? reward.courseTitleAr : reward.courseTitle}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(reward.status)}
                                    </div>

                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {isArabic && reward.descriptionAr ? reward.descriptionAr : reward.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {reward.value && (
                                            <div className="bg-green-500/10 rounded-lg p-3">
                                                <div className="text-green-400 text-xs mb-1">{isArabic ? 'القيمة' : 'Value'}</div>
                                                <div className="text-white font-semibold">
                                                    {reward.value.toLocaleString()} {reward.currency}
                                                </div>
                                            </div>
                                        )}
                                        <div className="bg-purple-500/10 rounded-lg p-3">
                                            <div className="text-purple-400 text-xs mb-1">{isArabic ? 'الفائزون' : 'Winners'}</div>
                                            <div className="text-white font-semibold">
                                                {reward.currentWinners}
                                                {reward.maxWinners && ` / ${reward.maxWinners}`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => router.push(`/${locale}/creator/rewards/${reward.id}`)}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            {isArabic ? 'عرض' : 'View'}
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                </main>
            </div>

            {/* Create Reward Modal - Simplified for now */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 rounded-2xl p-6 max-w-lg w-full border border-gray-700"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {isArabic ? 'إنشاء مكافأة جديدة' : 'Create New Reward'}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="text-center py-8">
                            <Sparkles className="w-12 h-12 mx-auto text-purple-400 mb-4" />
                            <p className="text-gray-400">
                                {isArabic
                                    ? 'سيتم إضافة نموذج إنشاء المكافأة قريباً'
                                    : 'Reward creation form coming soon'}
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}
