'use client'

import { usePathname } from 'next/navigation'
import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import Providers from '@/components/providers'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isAdminLogin = pathname === '/admin/login'

    // Render a bare layout (no sidebar/guard) for the admin login page
    if (isAdminLogin) {
        return (
            <Providers>
                {children}
            </Providers>
        )
    }

    return (
        <Providers>
            <AdminGuard>
                <div className="h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
                    <AdminSidebar />
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <main className="flex-1 overflow-y-auto p-8">
                            {children}
                        </main>
                    </div>
                </div>
            </AdminGuard>
        </Providers>
    )
}
