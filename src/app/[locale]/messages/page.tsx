'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Send,
    MessageCircle,
    User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslationsSafe, useLocaleSafe } from '@/hooks/useTranslationsSafe'
import { toast } from 'react-hot-toast'

export default function MessagesPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const { t: tCommon } = useTranslationsSafe('common')

    useEffect(() => {
        if (!session?.user) {
            router.push('/auth/login')
            return
        }
    }, [session?.user, router])

    if (!session?.user) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">{tCommon('loading')}</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/80 to-blue-900/80 backdrop-blur-sm py-6 px-6 border-b border-white/10">
                <div className="max-w-6xl mx-auto">
                    <Button
                        variant="ghost"
                        className="text-white mb-4"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {tCommon('back')}
                    </Button>

                    <h1 className="text-3xl font-bold text-white mb-2">
                        Messages
                    </h1>
                    <p className="text-purple-300">
                        Connect with your instructors and fellow learners
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-6 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Messaging System is being integrated
                    </h2>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        We're currently building a secure, real-time messaging platform to enhance your interaction with instructors and the community.
                    </p>
                    <div className="space-y-4 text-left max-w-md mx-auto">
                        <div className="flex items-center gap-3 text-gray-300">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Real-time messaging with instructors
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Group discussions with course participants
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            File sharing and multimedia support
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            Message history and search
                        </div>
                    </div>
                    <Button
                        onClick={() => router.push('/instructors')}
                        className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        Browse Instructors
                    </Button>
                </div>
            </div>
        </div>
    )
}