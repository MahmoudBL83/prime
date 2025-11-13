'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Check, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function JoinGroupPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = (params.locale as string) || 'en'
    const inviteCode = params.inviteCode as string
    const isArabic = locale === 'ar'

    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [groupInfo, setGroupInfo] = useState<any>(null)
    const [error, setError] = useState('')
    const [alreadyMember, setAlreadyMember] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/${locale}/login?redirect=/join-group/${inviteCode}`)
            return
        }

        if (status === 'authenticated' && inviteCode) {
            fetchGroupInfo()
        }
    }, [status, inviteCode, locale, router])

    const fetchGroupInfo = async () => {
        try {
            const response = await fetch(`/api/groups/invite-info/${inviteCode}`)
            if (response.ok) {
                const data = await response.json()
                setGroupInfo(data.group)
                setAlreadyMember(data.alreadyMember)
            } else {
                setError(isArabic ? 'رابط الدعوة غير صالح أو منتهي الصلاحية' : 'Invalid or expired invite link')
            }
        } catch (error) {
            console.error('Error fetching group info:', error)
            setError(isArabic ? 'حدث خطأ في تحميل معلومات المجموعة' : 'Error loading group information')
        } finally {
            setLoading(false)
        }
    }

    const handleJoinGroup = async () => {
        setJoining(true)
        try {
            const response = await fetch('/api/groups/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inviteCode })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم الانضمام إلى المجموعة!' : 'Successfully joined the group!')
                router.push(`/${locale}/messaging`)
            } else {
                const data = await response.json()
                toast.error(data.error || (isArabic ? 'فشل الانضمام إلى المجموعة' : 'Failed to join group'))
            }
        } catch (error) {
            console.error('Error joining group:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setJoining(false)
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                        {isArabic ? 'جاري التحميل...' : 'Loading...'}
                    </p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
                >
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {isArabic ? 'رابط غير صالح' : 'Invalid Link'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {error}
                    </p>
                    <button
                        onClick={() => router.push(`/${locale}/messaging`)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all"
                    >
                        {isArabic ? 'العودة إلى الرسائل' : 'Go to Messages'}
                    </button>
                </motion.div>
            </div>
        )
    }

    if (alreadyMember) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {isArabic ? 'أنت بالفعل عضو!' : 'Already a Member!'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isArabic 
                            ? `أنت بالفعل عضو في ${groupInfo?.name || 'هذه المجموعة'}`
                            : `You're already a member of ${groupInfo?.name || 'this group'}`
                        }
                    </p>
                    <button
                        onClick={() => router.push(`/${locale}/messaging`)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all flex items-center gap-2 mx-auto"
                    >
                        {isArabic ? 'فتح المحادثة' : 'Open Chat'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8 text-center">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {isArabic ? 'دعوة للانضمام' : 'Group Invitation'}
                    </h1>
                    <p className="text-blue-100">
                        {isArabic ? 'تمت دعوتك للانضمام إلى مجموعة' : 'You\'ve been invited to join a group'}
                    </p>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Group Info */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {groupInfo?.name || (isArabic ? 'مجموعة' : 'Group')}
                        </h2>
                        {groupInfo?.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {groupInfo.description}
                            </p>
                        )}
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>{groupInfo?.memberCount || 0} {isArabic ? 'أعضاء' : 'members'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3 mb-6">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isArabic ? 'تواصل مع الأعضاء الآخرين' : 'Connect with other members'}
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isArabic ? 'شارك الملفات والموارد' : 'Share files and resources'}
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-500" />
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isArabic ? 'ابقَ على اطلاع بالتحديثات' : 'Stay updated with announcements'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleJoinGroup}
                            disabled={joining}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {joining ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    {isArabic ? 'جاري الانضمام...' : 'Joining...'}
                                </>
                            ) : (
                                <>
                                    {isArabic ? 'انضم الآن' : 'Join Now'}
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}/messaging`)}
                            className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all"
                        >
                            {isArabic ? 'ربما لاحقاً' : 'Maybe Later'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
