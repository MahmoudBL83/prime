'use client'

import { useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    BarChart3,
    Video,
    TrendingUp,
    Users,
    Settings,
    DollarSign,
    FileText,
    MessageSquare,
    Calendar,
    User,
    Loader2,
    Gift,
    Radio
} from 'lucide-react'

interface SidebarItem {
    id: string
    icon: React.ComponentType<{ className?: string }>
    labelEn: string
    labelAr: string
    href: string
}

const sidebarItems: SidebarItem[] = [
    { id: 'dashboard', icon: BarChart3, labelEn: 'Dashboard', labelAr: 'لوحة التحكم', href: '/creator/dashboard' },
    { id: 'courses', icon: Video, labelEn: 'Courses', labelAr: 'الدورات', href: '/creator/courses' },
    { id: 'content', icon: FileText, labelEn: 'Content', labelAr: 'المحتوى', href: '/creator/content' },
    { id: 'analytics', icon: TrendingUp, labelEn: 'Analytics', labelAr: 'التحليلات', href: '/creator/analytics' },
    { id: 'cohorts', icon: Users, labelEn: 'Cohorts', labelAr: 'المجموعات التعليمية', href: '/creator/cohorts' },
    { id: 'live', icon: Radio, labelEn: 'Live Sessions', labelAr: 'الجلسات المباشرة', href: '/creator/live' },
    { id: 'community', icon: MessageSquare, labelEn: 'Community', labelAr: 'المجتمع', href: '/creator/community' },
    { id: 'earn', icon: DollarSign, labelEn: 'Earnings', labelAr: 'الأرباح', href: '/creator/earnings' },
    { id: 'rewards', icon: Gift, labelEn: 'Rewards', labelAr: 'المكافآت', href: '/creator/rewards' },
]

const bottomItems: SidebarItem[] = [
    { id: 'profile', icon: User, labelEn: 'Profile', labelAr: 'الملف الشخصي', href: '/creator/profile' },
    { id: 'settings', icon: Settings, labelEn: 'Settings', labelAr: 'الإعدادات', href: '/creator/settings' },
]

interface CreatorSidebarProps {
    className?: string
}

export function CreatorSidebar({ className = '' }: CreatorSidebarProps) {
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [navigating, setNavigating] = useState<string | null>(null)

    const isActive = (href: string) => {
        const fullPath = `/${locale}${href}`
        return pathname === fullPath || pathname.startsWith(fullPath + '/')
    }

    const handleNavigation = (item: SidebarItem) => {
        if (isActive(item.href)) return
        setNavigating(item.id)
        router.push(`/${locale}${item.href}`)
    }

    return (
        <aside className={`hidden lg:block w-56 xl:w-64 min-h-screen bg-card border-r border-border sticky top-16 ${className}`}>
            <nav className="p-3 xl:p-4 space-y-1">
                {sidebarItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item)}
                        disabled={navigating === item.id}
                        className={`w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-lg transition-all text-sm xl:text-base ${isActive(item.href)
                                ? 'bg-accent text-foreground font-semibold'
                                : 'text-muted-foreground hover:bg-accent/50'
                            }`}
                    >
                        <item.icon className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" />
                        <span className="truncate">{isArabic ? item.labelAr : item.labelEn}</span>
                        {navigating === item.id && (
                            <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                        )}
                    </button>
                ))}

                <div className="h-px bg-border my-3 xl:my-4" />

                {bottomItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item)}
                        disabled={navigating === item.id}
                        className={`w-full flex items-center gap-2 xl:gap-3 px-3 xl:px-4 py-2.5 xl:py-3 rounded-lg transition-all text-sm xl:text-base ${isActive(item.href)
                                ? 'bg-accent text-foreground font-semibold'
                                : 'text-muted-foreground hover:bg-accent/50'
                            }`}
                    >
                        <item.icon className="w-4 h-4 xl:w-5 xl:h-5 flex-shrink-0" />
                        <span className="truncate">{isArabic ? item.labelAr : item.labelEn}</span>
                        {navigating === item.id && (
                            <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                        )}
                    </button>
                ))}
            </nav>
        </aside>
    )
}

// Compact sidebar for mobile/tablet
export function CreatorSidebarMobile({ className = '' }: CreatorSidebarProps) {
    const router = useRouter()
    const params = useParams()
    const pathname = usePathname()
    const locale = params.locale as string

    const [navigating, setNavigating] = useState<string | null>(null)

    const isActive = (href: string) => {
        const fullPath = `/${locale}${href}`
        return pathname === fullPath || pathname.startsWith(fullPath + '/')
    }

    const handleNavigation = (item: SidebarItem) => {
        if (isActive(item.href)) return
        setNavigating(item.id)
        router.push(`/${locale}${item.href}`)
    }

    const allItems = [...sidebarItems.slice(0, 5), ...bottomItems.slice(0, 1)]

    return (
        <div className={`lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-bottom ${className}`}>
            <nav className="flex items-center justify-around px-1 sm:px-2 py-1.5 sm:py-2">
                {allItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => handleNavigation(item)}
                        disabled={navigating === item.id}
                        className={`flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all min-w-[60px] sm:min-w-[70px] ${isActive(item.href)
                                ? 'text-purple-500 bg-purple-500/10'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {navigating === item.id ? (
                            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                        ) : (
                            <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                        <span className="text-[9px] sm:text-[10px] font-medium truncate max-w-full">
                            {item.labelEn.split(' ')[0]}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    )
}
