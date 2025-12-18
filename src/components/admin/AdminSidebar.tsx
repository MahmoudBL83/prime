'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
    Gavel
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

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
        href: '/admin/withdrawals',
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

    return (
        <div className="flex h-full w-72 flex-col bg-background/40 backdrop-blur-xl border-r border-border">
            {/* Logo & Brand */}
            <div className="flex h-20 shrink-0 items-center px-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                        <h1 className="text-foreground text-lg font-bold">Admin Panel</h1>
                        <p className="text-xs text-muted-foreground">Control Center</p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-white/5 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent"
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
                                                'group flex items-center justify-between gap-x-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200',
                                                isActive
                                                    ? 'bg-gradient-to-r from-red-600/20 to-pink-600/20 text-foreground border border-red-500/30 shadow-lg shadow-red-500/10'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                                            )}
                                        >
                                            <div className="flex items-center gap-x-3">
                                                <item.icon
                                                    className={cn(
                                                        'h-5 w-5 shrink-0 transition-colors',
                                                        isActive ? 'text-red-400' : 'text-muted-foreground group-hover:text-foreground'
                                                    )}
                                                />
                                                <span>{item.name}</span>
                                            </div>
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
                                    'w-full flex items-center gap-x-3 px-3 py-2 text-sm rounded-xl transition-all border',
                                    notificationsActive
                                        ? 'text-foreground bg-gradient-to-r from-red-600/20 to-pink-600/20 border-red-500/30'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border-transparent'
                                )}
                            >
                                <Bell className="h-5 w-5" />
                                <span>Notifications</span>
                            </Link>

                            {/* Divider */}
                            <div className="border-t border-border my-2"></div>

                            {/* User Profile */}
                            <div className="bg-white/5 border border-border rounded-xl p-3">
                                <div className="flex items-center gap-x-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-foreground font-bold">
                                        {session?.user?.name?.[0]?.toUpperCase() || 'A'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">
                                            {session?.user?.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            Administrator
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="w-full flex items-center justify-center gap-x-2 px-3 py-2 text-sm text-foreground bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 rounded-lg transition-all"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
        </div>
    )
}
