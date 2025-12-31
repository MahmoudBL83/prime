'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    UserCheck,
    FileText,
    DollarSign,
    Settings,
    LogOut,
    User,
    BarChart3,
    BookOpen,
    Shield,
    Bell,
    Search,
    Trophy,
    MessageSquare,
    AlertTriangle,
    Wallet,
    History,
    Gavel,
    Megaphone,
    LucideIcon,
    Code
} from 'lucide-react'

interface NavigationItem {
    name: string
    href: string
    icon: LucideIcon
    badge?: number | null
}

const navigation: NavigationItem[] = [
    {
        name: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        name: 'Users',
        href: '/admin/users',
        icon: Users,
        badge: null
    },
    {
        name: 'Creators',
        href: '/admin/creators',
        icon: UserCheck,
        badge: null
    },
    {
        name: 'Courses',
        href: '/admin/courses',
        icon: BookOpen,
        badge: null
    },
    {
        name: 'Content Review',
        href: '/admin/content/reviews',
        icon: BookOpen,
        badge: null
    },
    {
        name: 'Moderation',
        href: '/admin/moderation',
        icon: Shield,
        badge: null
    },
    {
        name: 'Editorial',
        href: '/admin/content/editorial',
        icon: Trophy,
        badge: 2
    },
    {
        name: 'Rewards',
        href: '/admin/rewards',
        icon: Trophy,
        badge: null
    },
    {
        name: 'Communication',
        href: '/admin/communication',
        icon: Megaphone,
        badge: null
    },
    {
        name: 'Strikes',
        href: '/admin/strikes',
        icon: Gavel,
        badge: null
    },
    {
        name: 'Bans',
        href: '/admin/safety/bans',
        icon: Shield,
        badge: 4
    },
    {
        name: 'Appeals',
        href: '/admin/safety/appeals',
        icon: AlertTriangle,
        badge: 3
    },
    {
        name: 'Support',
        href: '/admin/support',
        icon: MessageSquare,
        badge: 3
    },
    {
        name: 'DMCA',
        href: '/admin/dmca',
        icon: AlertTriangle,
        badge: 2
    },
    {
        name: 'Study Buddies',
        href: '/admin/study-buddies',
        icon: Users,
        badge: null
    },
    {
        name: 'Channels',
        href: '/admin/channels',
        icon: Users,
        badge: 5
    },
    {
        name: 'Signature',
        href: '/admin/signature',
        icon: BookOpen,
        badge: null
    },
    {
        name: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
    },
    {
        name: 'Financial',
        href: '/admin/financial',
        icon: DollarSign,
    },
    {
        name: 'Payouts',
        href: '/admin/financial/payouts',
        icon: DollarSign,
        badge: 1
    },
    {
        name: 'Withdrawals',
        href: '/admin/payouts',
        icon: Wallet,
        badge: null
    },
    {
        name: 'Audit Log',
        href: '/admin/audit-log',
        icon: History,
        badge: null
    },
    {
        name: 'Permissions',
        href: '/admin/permissions',
        icon: Shield,
        badge: null
    },
    {
        name: 'Settings',
        href: '/admin/settings',
        icon: Settings,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()
    const notificationsActive = pathname.startsWith('/admin/notifications')

    const [badges, setBadges] = useState({
        editorial: 0,
        bans: 0,
        appeals: 0,
        support: 0,
        dmca: 0,
        channels: 0,
        payouts: 0
    })

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const response = await fetch('/api/admin/counts')
                if (response.ok) {
                    const data = await response.json()
                    setBadges(data)
                }
            } catch (error) {
                console.error('Failed to fetch badge counts:', error)
            }
        }

        fetchBadges()
    }, [])

    const navigation: NavigationItem[] = [
        {
            name: 'Dashboard',
            href: '/admin',
            icon: LayoutDashboard,
        },
        {
            name: 'Users',
            href: '/admin/users',
            icon: Users,
            badge: null
        },
        {
            name: 'Creators',
            href: '/admin/creators',
            icon: UserCheck,
            badge: null
        },
        {
            name: 'Courses',
            href: '/admin/courses',
            icon: BookOpen,
            badge: null
        },
        {
            name: 'Content Review',
            href: '/admin/content/reviews',
            icon: BookOpen,
            badge: null
        },
        {
            name: 'Moderation',
            href: '/admin/moderation',
            icon: Shield,
            badge: null
        },
        {
            name: 'Editorial',
            href: '/admin/content/editorial',
            icon: Trophy,
            badge: badges.editorial || null
        },
        {
            name: 'Rewards',
            href: '/admin/rewards',
            icon: Trophy,
            badge: null
        },
        {
            name: 'Communication',
            href: '/admin/communication',
            icon: Megaphone,
            badge: null
        },
        {
            name: 'Strikes',
            href: '/admin/strikes',
            icon: Gavel,
            badge: null
        },
        {
            name: 'Bans',
            href: '/admin/safety/bans',
            icon: Shield,
            badge: badges.bans || null
        },
        {
            name: 'Appeals',
            href: '/admin/safety/appeals',
            icon: AlertTriangle,
            badge: badges.appeals || null
        },
        {
            name: 'Support',
            href: '/admin/support',
            icon: MessageSquare,
            badge: badges.support || null
        },
        {
            name: 'DMCA',
            href: '/admin/dmca',
            icon: AlertTriangle,
            badge: badges.dmca || null
        },
        {
            name: 'Study Buddies',
            href: '/admin/study-buddies',
            icon: Users,
            badge: null
        },
        {
            name: 'Channels',
            href: '/admin/channels',
            icon: Users,
            badge: badges.channels || null
        },
        {
            name: 'Signature',
            href: '/admin/signature',
            icon: BookOpen,
            badge: null
        },
        {
            name: 'Advanced Analytics',
            href: '/admin/advanced-analytics',
            icon: BarChart3,
            badge: null
        },
        {
            name: 'Financial',
            href: '/admin/financial',
            icon: DollarSign,
        },
        {
            name: 'Payouts',
            href: '/admin/financial/payouts',
            icon: DollarSign,
            badge: badges.payouts || null
        },
        {
            name: 'Withdrawals',
            href: '/admin/payouts',
            icon: Wallet,
            badge: null
        },
        {
            name: 'Audit Log',
            href: '/admin/audit-log',
            icon: History,
            badge: null
        },
        {
            name: 'Permissions',
            href: '/admin/permissions',
            icon: Shield,
            badge: null
        },
        {
            name: 'Marketing Tools',
            href: '/admin/marketing-tools',
            icon: Megaphone,
            badge: null
        },
    ]

    return (
        <div className="flex h-full w-72 flex-col bg-background/40 backdrop-blur-xl border-r border-border">
            {/* Logo & Brand */}
            <div className="flex h-20 shrink-0 items-center px-6 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-white/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-white text-lg font-bold tracking-tight">Prime Admin</h1>
                        <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold opacity-80">Management Suite</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-4">
                <div className="relative group">
                    <div className="absolute inset-0 bg-red-500/5 blur-lg group-focus-within:bg-red-500/10 transition-all rounded-xl" />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-red-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search dashboard..."
                        className="relative w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:bg-white/10 transition-all"
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-1 flex-col px-4 overflow-y-auto">
                <ul role="list" className="flex flex-1 flex-col gap-y-2">
                    <li>
                        <ul role="list" className="space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href))

                                return (
                                    <motion.li
                                        key={item.name}
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'group flex items-center justify-between gap-x-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 border',
                                                isActive
                                                    ? 'bg-white/10 text-white border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                                                    : 'text-muted-foreground hover:text-white hover:bg-white/5 border-transparent'
                                            )}
                                        >
                                            <div className="flex items-center gap-x-3">
                                                <div className={cn(
                                                    'p-1.5 rounded-lg transition-all duration-200',
                                                    isActive
                                                        ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg shadow-red-500/20'
                                                        : 'bg-white/5 text-muted-foreground group-hover:text-white group-hover:bg-white/10'
                                                )}>
                                                    <item.icon className="h-4 w-4 shrink-0" />
                                                </div>
                                                <span>{item.name}</span>
                                            </div>
                                            {item.badge && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-[10px] font-bold text-red-400 border border-red-500/30">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </motion.li>
                                )
                            })}
                        </ul>
                    </li>

                    {/* User Profile & Logout */}
                    <li className="mt-auto pb-4">
                        <div className="space-y-2">
                            {/* Notifications */}
                            <Link
                                href="/admin/notifications"
                                className={cn(
                                    'w-full flex items-center gap-x-3 px-3 py-2.5 text-sm rounded-xl transition-all border group',
                                    notificationsActive
                                        ? 'text-white bg-white/10 border-white/20'
                                        : 'text-muted-foreground hover:text-white hover:bg-white/5 border-transparent'
                                )}
                            >
                                <div className={cn(
                                    'p-1.5 rounded-lg transition-all',
                                    notificationsActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5'
                                )}>
                                    <Bell className="h-4 w-4" />
                                </div>
                                <span>Notifications</span>
                            </Link>

                            {/* Divider */}
                            <div className="border-t border-border my-2"></div>

                            {/* User Profile */}
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl shadow-black/20">
                                <div className="flex items-center gap-x-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ring-1 ring-white/20">
                                        {session?.user?.name?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">
                                            {session?.user?.name}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                                                Super Admin
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="w-full h-10 flex items-center justify-center gap-x-2 px-3 py-2 text-xs font-bold text-red-400 hover:text-white bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-600 rounded-xl transition-all transform active:scale-95"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
