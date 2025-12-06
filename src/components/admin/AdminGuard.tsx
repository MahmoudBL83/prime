'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { UserRole } from '@prisma/client'
import { Loader2, Shield } from 'lucide-react'

interface AdminGuardProps {
    children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const isAdminLogin = pathname === '/admin/login'

    useEffect(() => {
        if (isAdminLogin) return
        if (status === 'loading') return // Still loading

        if (!session) {
            router.push('/en/auth/login')
            return
        }

        if (session.user.role !== UserRole.ADMIN) {
            router.push('/en/dashboard')
            return
        }
    }, [session, status, router, isAdminLogin])

    // Allow admin login route to bypass guard after hooks are registered
    if (isAdminLogin) {
        return <>{children}</>
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="text-center">
                    <div className="relative mb-6">
                        <div className="w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <p className="text-foreground text-lg font-medium">Loading Admin Panel...</p>
                    <p className="text-muted-foreground text-sm mt-2">Verifying credentials</p>
                </div>
            </div>
        )
    }

    if (!session || session.user.role !== UserRole.ADMIN) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="text-center bg-red-600/10 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 max-w-md">
                    <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
                    <p className="text-muted-foreground mb-6">
                        You don't have permission to access the admin panel.
                    </p>
                    <button
                        onClick={() => router.push('/en/dashboard')}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-foreground rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
