'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Home,
    Play,
    Bell,
    DollarSign,
    TrendingUp,
    Users,
    Video,
    BarChart3,
    Settings,
    Loader2,
    Download,
    CreditCard,
    Wallet,
    Calendar,
    CheckCircle,
    Clock,
    X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'

interface EarningsData {
    availableBalance: number
    pendingBalance: number
    totalEarned: number
    nextPayoutDate: string
    transactions: {
        id: string
        type: string
        amount: number
        description: string
        date: string
        status: 'COMPLETED' | 'PENDING' | 'FAILED'
    }[]
    revenueByCategory: {
        CATEGORY_A: number
        CATEGORY_B: number
        CATEGORY_C: number
    }
}

export default function CreatorEarn() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [earnings, setEarnings] = useState<EarningsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [requestingPayout, setRequestingPayout] = useState(false)
    const [navigating, setNavigating] = useState(false)

    useEffect(() => {
        if (session?.user) {
            fetchEarnings()
        }
    }, [session])

    const fetchEarnings = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/creator/earnings')
            if (response.ok) {
                const data = await response.json()
                setEarnings(data)
            }
        } catch (error) {
            console.error('Failed to fetch earnings:', error)
            toast.error(isArabic ? 'فشل تحميل الأرباح' : 'Failed to load earnings')
        } finally {
            setLoading(false)
        }
    }

    const handleRequestPayout = async () => {
        if (!earnings || earnings.availableBalance < 50) {
            toast.error(isArabic ? 'الحد الأدنى للسحب $50' : 'Minimum payout is $50')
            return
        }

        setRequestingPayout(true)
        try {
            const response = await fetch('/api/creator/earnings/payout', {
                method: 'POST'
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم طلب الدفع!' : 'Payout requested!')
                fetchEarnings()
            } else {
                toast.error(isArabic ? 'فشل الطلب' : 'Request failed')
            }
        } catch (error) {
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setRequestingPayout(false)
        }
    }

    if (!session?.user) {
        router.push(`/${locale}/login`)
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.back()}
                                className="p-2 hover:bg-accent rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => router.push(`/${locale}`)}
                                className="p-2 hover:bg-accent rounded-full transition-colors"
                            >
                                <Home className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="h-8 w-px bg-border" />

                        <Link href={`/${locale}/creator/dashboard`} className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                            <span className="text-xl font-bold">
                                {isArabic ? 'استوديو المنشئ' : 'Creator Studio'}
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-accent rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            {session.user.image ? (
                                <Image src={session.user.image} alt="" width={40} height={40} className="rounded-full" />
                            ) : (
                                <span className="text-white font-bold">
                                    {session.user.name?.[0]?.toUpperCase() || 'C'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-screen bg-card border-r border-border sticky top-16">
                    <nav className="p-4 space-y-1">
                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/dashboard`)
                            }}
                            disabled={navigating}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50 ${
                                navigating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <BarChart3 className="w-5 h-5" />
                            <span>{isArabic ? 'لوحة التحكم' : 'Dashboard'}</span>
                            {navigating && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/content`)
                            }}
                            disabled={navigating}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50 ${
                                navigating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <Video className="w-5 h-5" />
                            <span>{isArabic ? 'المحتوى' : 'Content'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/analytics`)
                            }}
                            disabled={navigating}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50 ${
                                navigating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <TrendingUp className="w-5 h-5" />
                            <span>{isArabic ? 'التحليلات' : 'Analytics'}</span>
                        </button>

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/community`)
                            }}
                            disabled={navigating}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-muted-foreground hover:bg-accent/50 ${
                                navigating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <Users className="w-5 h-5" />
                            <span>{isArabic ? 'المجتمع' : 'Community'}</span>
                        </button>

                        <button
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-accent text-foreground font-semibold transition-all"
                        >
                            <DollarSign className="w-5 h-5" />
                            <span>{isArabic ? 'الأرباح' : 'Earn'}</span>
                        </button>

                        <div className="h-px bg-border my-4" />

                        <button
                            onClick={() => {
                                setNavigating(true)
                                router.push(`/${locale}/creator/settings`)
                            }}
                            disabled={navigating}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent/50 transition-all ${
                                navigating ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            <Settings className="w-5 h-5" />
                            <span>{isArabic ? 'الإعدادات' : 'Settings'}</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2">
                            {isArabic ? 'الأرباح' : 'Earnings'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isArabic ? 'إدارة أرباحك وطلب الدفعات' : 'Manage your earnings and request payouts'}
                        </p>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-purple-500 mb-4" />
                            <p className="text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
                        </div>
                    ) : (
                        <>
                            {/* Balance Cards */}
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-500/30 rounded-xl p-6"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">
                                            {isArabic ? 'الرصيد المتاح' : 'Available Balance'}
                                        </span>
                                        <Wallet className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div className="text-4xl font-bold mb-4">
                                        ${earnings?.availableBalance?.toFixed(2) || '0.00'}
                                    </div>
                                    <Button
                                        onClick={handleRequestPayout}
                                        disabled={requestingPayout || (earnings?.availableBalance || 0) < 50}
                                        className="w-full bg-green-600 hover:bg-green-700"
                                    >
                                        {requestingPayout ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                {isArabic ? 'جاري الطلب...' : 'Requesting...'}
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-2" />
                                                {isArabic ? 'طلب دفعة' : 'Request Payout'}
                                            </>
                                        )}
                                    </Button>
                                    {(earnings?.availableBalance || 0) < 50 && (
                                        <p className="text-xs text-muted-foreground mt-2 text-center">
                                            {isArabic ? 'الحد الأدنى $50' : 'Minimum $50'}
                                        </p>
                                    )}
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-card border border-border rounded-xl p-6"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">
                                            {isArabic ? 'قيد المعالجة' : 'Pending'}
                                        </span>
                                        <Clock className="w-5 h-5 text-yellow-500" />
                                    </div>
                                    <div className="text-4xl font-bold mb-2">
                                        ${earnings?.pendingBalance?.toFixed(2) || '0.00'}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {isArabic ? 'سيتم الدفع قريباً' : 'Will be paid soon'}
                                    </p>
                                </motion.div>

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className="bg-card border border-border rounded-xl p-6"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">
                                            {isArabic ? 'إجمالي الأرباح' : 'Total Earned'}
                                        </span>
                                        <DollarSign className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div className="text-4xl font-bold mb-2">
                                        ${earnings?.totalEarned?.toFixed(2) || '0.00'}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {isArabic ? 'طوال الوقت' : 'All time'}
                                    </p>
                                </motion.div>
                            </div>

                            {/* Revenue by Category */}
                            <div className="bg-card border border-border rounded-xl p-6 mb-8">
                                <h2 className="text-xl font-bold mb-6">
                                    {isArabic ? 'الإيرادات حسب الفئة' : 'Revenue by Category'}
                                </h2>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <h3 className="font-semibold mb-2 text-blue-500">
                                            {isArabic ? 'الفئة أ - مكتبة الدورات' : 'Category A - Course Library'}
                                        </h3>
                                        <p className="text-2xl font-bold">
                                            ${earnings?.revenueByCategory?.CATEGORY_A?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {isArabic ? 'من الاشتراكات' : 'From subscriptions'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <h3 className="font-semibold mb-2 text-purple-500">
                                            {isArabic ? 'الفئة ب - الدورات المميزة' : 'Category B - Signature Courses'}
                                        </h3>
                                        <p className="text-2xl font-bold">
                                            ${earnings?.revenueByCategory?.CATEGORY_B?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {isArabic ? 'من الدورات المتميزة' : 'From premium courses'}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-pink-500/10 border border-pink-500/30 rounded-lg">
                                        <h3 className="font-semibold mb-2 text-pink-500">
                                            {isArabic ? 'الفئة ج - قنوات العضوية' : 'Category C - Membership Channels'}
                                        </h3>
                                        <p className="text-2xl font-bold">
                                            ${earnings?.revenueByCategory?.CATEGORY_C?.toFixed(2) || '0.00'}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {isArabic ? 'من الاشتراكات الشخصية' : 'From channel subscriptions'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <h2 className="text-xl font-bold mb-6">
                                    {isArabic ? 'سجل المعاملات' : 'Transaction History'}
                                </h2>

                                {earnings?.transactions && earnings.transactions.length > 0 ? (
                                    <div className="space-y-4">
                                        {earnings.transactions.map((transaction) => (
                                            <div key={transaction.id} className="flex items-center justify-between p-4 bg-accent rounded-lg">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                        transaction.status === 'COMPLETED' ? 'bg-green-500/20' :
                                                        transaction.status === 'PENDING' ? 'bg-yellow-500/20' :
                                                        'bg-red-500/20'
                                                    }`}>
                                                        {transaction.status === 'COMPLETED' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                                        {transaction.status === 'PENDING' && <Clock className="w-5 h-5 text-yellow-500" />}
                                                        {transaction.status === 'FAILED' && <X className="w-5 h-5 text-red-500" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">{transaction.description}</h3>
                                                        <p className="text-sm text-muted-foreground">{transaction.date}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-bold text-green-500">
                                                        +${transaction.amount.toFixed(2)}
                                                    </div>
                                                    <Badge variant={transaction.status === 'COMPLETED' ? 'default' : 'secondary'}>
                                                        {transaction.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        {isArabic ? 'لا توجد معاملات بعد' : 'No transactions yet'}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    )
}
