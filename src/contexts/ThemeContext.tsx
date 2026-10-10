'use client'

import { ReactNode, useCallback, useEffect, useState } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

type Theme = 'light' | 'dark'

interface ThemeContextType {
    theme: Theme
    toggleTheme: () => void
}

/**
 * Theme state is owned by next-themes (see the root layout). This provider is
 * kept so existing `<ThemeProvider>` usages keep working without creating a
 * second, competing source of truth for the `dark` class.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    return <>{children}</>
}

export function useTheme(): ThemeContextType {
    const { resolvedTheme, setTheme } = useNextTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    // Before hydration the theme is unknown; default to dark (the app's primary mode)
    const theme: Theme = mounted && resolvedTheme === 'light' ? 'light' : 'dark'

    const toggleTheme = useCallback(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark')
    }, [theme, setTheme])

    return { theme, toggleTheme }
}
