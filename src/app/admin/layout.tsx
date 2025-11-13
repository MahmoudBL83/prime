import { AdminGuard } from '@/components/admin/AdminGuard'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import Providers from '@/components/providers'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Providers>
            <AdminGuard>
                <div className="h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
                    <AdminSidebar />
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                        <main className="flex-1 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                </div>
            </AdminGuard>
        </Providers>
    )
}
