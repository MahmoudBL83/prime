'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthModalProvider } from '@/contexts/AuthModalContext'

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <AuthModalProvider>
                    {children}
                    <Toaster position="top-right" />
                </AuthModalProvider>
            </ThemeProvider>
        </SessionProvider>
    )
}
