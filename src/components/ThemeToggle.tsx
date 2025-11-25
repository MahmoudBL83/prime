'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
    const [mounted, setMounted] = useState(false)
    
    useEffect(() => {
        setMounted(true)
    }, [])

    // Prevent hydration mismatch - don't call useTheme until mounted
    if (!mounted) {
        return <div className="w-12 h-12" />
    }
    
    return <ThemeToggleButton />
}

function ThemeToggleButton() {
    const { theme, toggleTheme } = useTheme()

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center text-muted-foreground dark:text-white/70 hover:text-foreground dark:hover:text-white transition-colors"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </button>
    )
}
