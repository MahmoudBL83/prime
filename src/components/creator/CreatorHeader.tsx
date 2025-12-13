'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Home, Bell, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CreatorHeaderProps {
    title?: string
    titleAr?: string
    showBack?: boolean
    showHome?: boolean
    rightContent?: React.ReactNode
}

export function CreatorHeader({
    title,
    titleAr,
    showBack = true,
    showHome = true,
    rightContent
}: CreatorHeaderProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    return (
        <header className="sticky top-0 z-50 bg-card border-b border-border">
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                    {showBack && (
                        <button
                            onClick={() => router.back()}
                            className="p-1.5 sm:p-2 hover:bg-accent rounded-full transition-colors flex-shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}
                    {showHome && (
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-1.5 sm:p-2 hover:bg-accent rounded-full transition-colors flex-shrink-0"
                        >
                            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    )}
                    
                    <div className="h-6 sm:h-8 w-px bg-border" />
                    
                    <Link href={`/${locale}/creator/dashboard`} className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Play className="w-4 h-4 sm:w-6 sm:h-6 text-white fill-white" />
                        </div>
                        <span className="text-sm sm:text-lg md:text-xl font-bold hidden sm:block truncate">
                            {isArabic ? 'استوديو المنشئ' : 'Creator Studio'}
                        </span>
                    </Link>

                    {(title || titleAr) && (
                        <>
                            <div className="h-4 sm:h-6 w-px bg-border hidden md:block" />
                            <h1 className="text-sm sm:text-base md:text-lg font-semibold hidden md:block truncate">
                                {isArabic ? titleAr || title : title}
                            </h1>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
                    {rightContent}
                    
                    <button className="p-1.5 sm:p-2 hover:bg-accent rounded-full transition-colors">
                        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center overflow-hidden">
                        {session?.user && (session.user as any)?.image ? (
                            <Image 
                                src={(session.user as any).image} 
                                alt="" 
                                width={40} 
                                height={40} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white font-bold text-xs sm:text-sm">
                                {session?.user?.name?.[0]?.toUpperCase() || 'C'}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
