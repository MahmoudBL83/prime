'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect to main admin panel at /admin
export default function AdminRedirectPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/admin')
    }, [router])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
                <p className="text-white">Redirecting to Admin Panel...</p>
            </div>
        </div>
    )
}
