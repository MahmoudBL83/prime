'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    Search,
    X,
    BookOpen,
    Users,
    Radio,
    FileText,
    Loader2,
    TrendingUp,
    Clock,
    Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'

interface SearchResult {
    id: string
    type: 'course' | 'creator' | 'live' | 'resource'
    title: string
    titleAr?: string
    titleDe?: string
    description?: string;
    thumbnail?: string
    creator?: {
        name: string
        arabicName?: string
        nameDe?: string
        profileImage?: string
    }
    [key: string]: any
}

interface SearchResults {
    courses: SearchResult[]
    creators: SearchResult[]
    liveSessions: SearchResult[]
    resources: SearchResult[]
    totalCount: number
}

interface GlobalSearchProps {
    placeholder?: string
    className?: string
}

export default function GlobalSearch({ placeholder, className }: GlobalSearchProps) {
    const router = useRouter()
    const params = useParams()
    const locale = (params.locale as string) || 'en'
    const isGerman = locale === 'de'

    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeTab, setActiveTab] = useState<'all' | 'courses' | 'creators' | 'live' | 'resources'>('all')
    const [results, setResults] = useState<SearchResults | null>(null)
    const [loading, setLoading] = useState(false)
    const [recentSearches, setRecentSearches] = useState<string[]>([])

    const searchRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches')
        if (saved) {
            setRecentSearches(JSON.parse(saved))
        }
    }, [])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Keyboard shortcut (Cmd+K or Ctrl+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
                inputRef.current?.focus()
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const performSearch = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults(null)
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/global-search?q=${encodeURIComponent(searchQuery)}&type=${activeTab}`)
            if (response.ok) {
                const data = await response.json()
                setResults(data)
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setLoading(false)
        }
    }, [activeTab])

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
        }
        debounceRef.current = setTimeout(() => {
            performSearch(query)
        }, 300)

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current)
            }
        }
    }, [query, performSearch])

    const saveRecentSearch = (search: string) => {
        const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5)
        setRecentSearches(updated)
        localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    const handleResultClick = (result: SearchResult) => {
        saveRecentSearch(query)
        setIsOpen(false)
        setQuery('')

        switch (result.type) {
            case 'course':
                router.push(`/${locale}/courses/${result.id}`)
                break
            case 'creator':
                router.push(`/${locale}/mentors/${result.userId}`)
                break
            case 'live':
                router.push(`/${locale}/sessions/${result.id}`)
                break
            case 'resource':
                router.push(`/${locale}/posts/${result.id}`)
                break
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'course': return <BookOpen className="w-4 h-4" />
            case 'creator': return <Users className="w-4 h-4" />
            case 'live': return <Radio className="w-4 h-4" />
            case 'resource': return <FileText className="w-4 h-4" />
            default: return null
        }
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, { en: string, de: string }> = {
            course: { en: 'Course', de: 'Kurs' },
            creator: { en: 'Creator', de: 'Mentor' },
            live: { en: 'Live Session', de: 'Live-Sitzung' },
            resource: { en: 'Resource', de: 'Ressource' }
        }
        return isGerman ? labels[type]?.de : labels[type]?.en
    }

    const tabs = [
        { key: 'all', label: isGerman ? 'Alle' : 'All' },
        { key: 'courses', label: isGerman ? 'Kurse' : 'Courses' },
        { key: 'creators', label: isGerman ? 'Mentoren' : 'Creators' },
        { key: 'live', label: isGerman ? 'Live' : 'Live' },
        { key: 'resources', label: isGerman ? 'Ressourcen' : 'Resources' },
    ]

    const allResults = results ? [
        ...results.courses,
        ...results.creators,
        ...results.liveSessions,
        ...results.resources
    ] : []

    return (
        <div ref={searchRef} className={`relative ${className}`}>
            {/* Search Trigger Button */}
            <button
                onClick={() => {
                    setIsOpen(true)
                    setTimeout(() => inputRef.current?.focus(), 100)
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
            >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">
                    {placeholder || (isGerman ? 'Suchen...' : 'Search...')}
                </span>
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-gray-700 rounded text-xs">
                    <span>⌘</span>
                    <span>K</span>
                </kbd>
            </button>

            {/* Search Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20">
                    <div className="w-full max-w-2xl mx-4 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={isGerman ? 'Suchen Sie nach Kursen, Mentoren, Sitzungen...' : 'Search courses, instructors, sessions...'}
                                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
                                autoFocus
                            />
                            {loading && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
                            <button onClick={() => setIsOpen(false)}>
                                <X className="w-5 h-5 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${activeTab === tab.key
                                        ? 'bg-purple-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Results */}
                        <div className="max-h-96 overflow-y-auto">
                            {/* Recent Searches (when no query) */}
                            {!query && recentSearches.length > 0 && (
                                <div className="p-4">
                                    <p className="text-xs text-gray-500 uppercase mb-2">
                                        {isGerman ? 'Letzte Suchen' : 'Recent Searches'}
                                    </p>
                                    <div className="space-y-1">
                                        {recentSearches.map((search, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setQuery(search)}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-300 hover:bg-gray-800 rounded-lg"
                                            >
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                {search}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Search Results */}
                            {query && allResults.length > 0 && (
                                <div className="p-2">
                                    {allResults.map((result) => (
                                        <button
                                            key={`${result.type}-${result.id}`}
                                            onClick={() => handleResultClick(result)}
                                            className="flex items-start gap-3 w-full p-3 text-left hover:bg-gray-800 rounded-lg transition-colors"
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-12 h-12 bg-gray-700 rounded-lg flex-shrink-0 overflow-hidden">
                                                {result.thumbnail || result.profileImage ? (
                                                    <Image
                                                        src={result.thumbnail || result.profileImage}
                                                        alt=""
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        {getTypeIcon(result.type)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white font-medium truncate">
                                                        {isGerman && result.titleDe ? result.titleDe : result.title || result.name}
                                                    </span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {getTypeLabel(result.type)}
                                                    </Badge>
                                                </div>
                                                {result.creator && (
                                                    <p className="text-sm text-gray-400 truncate">
                                                        {isGerman && result.creator.nameDe
                                                            ? result.creator.nameDe
                                                            : result.creator.name}
                                                    </p>
                                                )}
                                                {result.rating && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-yellow-500">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        {result.rating.toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* No Results */}
                            {query && query.length >= 2 && !loading && allResults.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>{isGerman ? 'Keine Ergebnisse gefunden' : 'No results found'}</p>
                                    <p className="text-sm mt-1">
                                        {isGerman ? 'Versuchen Sie es mit anderen Suchbegriffen' : 'Try searching with different keywords'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500 flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">↵</kbd>
                                {isGerman ? 'auswählen' : 'to select'}
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded">esc</kbd>
                                {isGerman ? 'schließen' : 'to close'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
