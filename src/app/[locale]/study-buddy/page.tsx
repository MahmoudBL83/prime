'use client'

import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'
import {
    CalendarPlus,
    ChevronRight,
    Heart,
    LayoutGrid,
    MessageCircle,
    RefreshCw,
    SlidersHorizontal,
    Users,
    Video,
    X,
} from 'lucide-react'
import { VideoCallInitiator } from '@/components/study-buddy/VideoCallInitiator'
import { SessionSchedulerModal } from '@/components/study-buddy/SessionSchedulerModal'
import { SwipeDeck } from '@/components/study-buddy/tinder/SwipeDeck'
import { BuddyPhoto } from '@/components/study-buddy/tinder/BuddyPhoto'
import { MatchCelebration } from '@/components/study-buddy/tinder/MatchCelebration'
import {
    TINDER_GRADIENT,
    firstNameOf,
    formatSkillLevel,
    type BuddyCandidate,
    type BuddyMatch,
    type SwipeAction,
} from '@/components/study-buddy/tinder/types'

interface ViewerProfile {
    id: string
    name: string
    profileImage?: string | null
}

type MobileView = 'discover' | 'matches'
type SidebarTab = 'matches' | 'messages'

// Passed profiles are remembered per viewer so they don't come straight back
const PASS_MEMORY_DAYS = 14

function passedStorageKey(viewerId: string) {
    return `prime.studyBuddy.passed.${viewerId}`
}

function readPassed(viewerId: string): Record<string, number> {
    try {
        const raw = localStorage.getItem(passedStorageKey(viewerId))
        if (!raw) return {}
        const parsed = JSON.parse(raw) as Record<string, number>
        const cutoff = Date.now() - PASS_MEMORY_DAYS * 24 * 60 * 60 * 1000
        return Object.fromEntries(Object.entries(parsed).filter(([, at]) => at > cutoff))
    } catch {
        return {}
    }
}

function writePassed(viewerId: string, passed: Record<string, number>) {
    try {
        localStorage.setItem(passedStorageKey(viewerId), JSON.stringify(passed))
    } catch {
        // storage unavailable (private mode) - passes are just not remembered
    }
}

function StudyBuddyScreen() {
    const locale = useLocale()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session } = useSession()
    const isGerman = locale === 'de'
    const L = (en: string, de: string) => (isGerman ? de : en)

    const viewerId = session?.user?.id
    const [viewer, setViewer] = useState<ViewerProfile | null>(null)
    const [deck, setDeck] = useState<BuddyCandidate[]>([])
    const [matches, setMatches] = useState<BuddyMatch[]>([])
    const [loadingDeck, setLoadingDeck] = useState(true)
    const [loadingMatches, setLoadingMatches] = useState(true)
    const [deckError, setDeckError] = useState<string | null>(null)
    const [profileIncomplete, setProfileIncomplete] = useState<string[] | null>(null)
    const [passHistory, setPassHistory] = useState<BuddyCandidate[]>([])
    const [celebrating, setCelebrating] = useState<BuddyCandidate | null>(null)
    const [mobileView, setMobileView] = useState<MobileView>(searchParams.get('tab') === 'matches' ? 'matches' : 'discover')
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>('matches')
    const [selectedMatch, setSelectedMatch] = useState<BuddyMatch | null>(null)
    const [videoCallMatch, setVideoCallMatch] = useState<BuddyMatch | null>(null)
    const [scheduleMatch, setScheduleMatch] = useState<BuddyMatch | null>(null)

    const viewerName = viewer?.name || session?.user?.name || 'You'
    const viewerImage = viewer?.profileImage ?? null

    const acceptedMatches = useMemo(() => matches.filter((m) => m.status === 'accepted'), [matches])
    const likesSent = useMemo(() => matches.filter((m) => m.status === 'pending' && m.likedByMe), [matches])
    const likedYouCount = useMemo(() => deck.filter((c) => c.likedYou).length, [deck])

    const loadMatches = useCallback(async () => {
        setLoadingMatches(true)
        try {
            const response = await fetch('/api/study-buddy/matches')
            if (response.ok) {
                const data = await response.json()
                setMatches(data.matches || [])
            }
        } catch {
            // the sidebar simply stays empty; swiping still works
        } finally {
            setLoadingMatches(false)
        }
    }, [])

    const loadDeck = useCallback(async () => {
        setLoadingDeck(true)
        setDeckError(null)
        try {
            const response = await fetch('/api/study-buddy/match?limit=40')
            const data = await response.json().catch(() => ({}))

            if (response.status === 401) {
                router.push(`/${locale}/auth/login?from=${encodeURIComponent(`/${locale}/study-buddy`)}`)
                return
            }
            if (!response.ok) {
                if (data.code === 'PROFILE_INCOMPLETE' || data.code === 'USER_NOT_FOUND') {
                    setProfileIncomplete(data.missingFieldsDetail || data.missingFields || [])
                } else {
                    setDeckError(data.error || L('Could not load study buddies.', 'Lernpartner konnten nicht geladen werden.'))
                }
                setDeck([])
                return
            }

            setProfileIncomplete(null)
            const passed = viewerId ? readPassed(viewerId) : {}
            const candidates: BuddyCandidate[] = (data.matches || []).filter((c: BuddyCandidate) => !passed[c.id])
            setDeck(candidates)
        } catch {
            setDeckError(L('Network error. Check your connection.', 'Netzwerkfehler. Bitte Verbindung prüfen.'))
        } finally {
            setLoadingDeck(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewerId, locale, router])

    // Initial load: profile, deck and matches in parallel
    useEffect(() => {
        if (!viewerId) return
        fetch('/api/study-buddy/profile')
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => data?.profile && setViewer(data.profile))
            .catch(() => undefined)
        loadDeck()
        loadMatches()
    }, [viewerId, loadDeck, loadMatches])

    const handleSwipe = useCallback(
        async (candidate: BuddyCandidate, action: SwipeAction) => {
            // Optimistic: the card is already gone, the request happens in the background
            setDeck((current) => current.filter((c) => c.id !== candidate.id))

            if (action === 'pass') {
                setPassHistory((history) => [...history.slice(-19), candidate])
                if (viewerId) {
                    const passed = readPassed(viewerId)
                    passed[candidate.id] = Date.now()
                    writePassed(viewerId, passed)
                }
                return
            }

            // Likes cannot be rewound (they reach the other learner right away)
            setPassHistory([])

            try {
                const response = await fetch('/api/study-buddy/swipe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetUserId: candidate.id, action }),
                })
                const data = await response.json().catch(() => ({}))
                if (!response.ok) {
                    toast.error(data.error || L('Could not send your like. Try again.', 'Like konnte nicht gesendet werden.'))
                    setDeck((current) => [candidate, ...current])
                    return
                }
                if (data.isMutual) {
                    setCelebrating(candidate)
                    loadMatches()
                } else {
                    if (action === 'superlike') {
                        toast.success(L(`Super Like sent to ${firstNameOf(candidate.name)} ⭐`, `Super Like an ${firstNameOf(candidate.name)} gesendet ⭐`))
                    }
                    loadMatches()
                }
            } catch {
                toast.error(L('Network error. Your like was not sent.', 'Netzwerkfehler. Like wurde nicht gesendet.'))
                setDeck((current) => [candidate, ...current])
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [viewerId, loadMatches]
    )

    const handleRewind = useCallback(() => {
        const last = passHistory[passHistory.length - 1]
        if (!last) return
        setPassHistory((history) => history.slice(0, -1))
        setDeck((current) => [last, ...current.filter((c) => c.id !== last.id)])
        if (viewerId) {
            const passed = readPassed(viewerId)
            delete passed[last.id]
            writePassed(viewerId, passed)
        }
    }, [passHistory, viewerId])

    const showLikesFirst = () => {
        setDeck((current) => [...current.filter((c) => c.likedYou), ...current.filter((c) => !c.likedYou)])
        setMobileView('discover')
    }

    const resetPassed = () => {
        if (viewerId) writePassed(viewerId, {})
        setPassHistory([])
        loadDeck()
    }

    const openChat = (userId: string) => router.push(`/${locale}/messaging?userId=${userId}`)

    // -----------------------------------------------------------------------
    // Pieces
    // -----------------------------------------------------------------------

    const radar = (title: string, subtitle: string, actions?: ReactNode) => (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <div className="relative grid h-56 w-56 place-items-center">
                {[0, 1, 2].map((i) => (
                    <span
                        key={i}
                        className="animate-radar absolute inset-0 rounded-full bg-[#fd267d]/25"
                        style={{ animationDelay: `${i * 0.8}s` }}
                    />
                ))}
                <div className="relative h-24 w-24 overflow-hidden rounded-full shadow-2xl ring-4 ring-white dark:ring-white/90">
                    <BuddyPhoto name={viewerName} src={viewerImage} initialsClassName="text-[34px]" />
                </div>
            </div>
            <h3 className="mt-6 text-xl font-bold text-foreground">{title}</h3>
            <p className="mt-2 max-w-xs text-[15px] text-muted-foreground">{subtitle}</p>
            {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
        </div>
    )

    const gradientButton = (label: string, onClick: () => void, icon?: ReactNode) => (
        <button
            type="button"
            onClick={onClick}
            className="flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
            style={{ background: TINDER_GRADIENT }}
        >
            {icon}
            {label}
        </button>
    )

    const outlineButton = (label: string, onClick: () => void, icon?: ReactNode) => (
        <button
            type="button"
            onClick={onClick}
            className="flex h-11 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold uppercase tracking-wide text-foreground transition hover:bg-foreground/[0.05] active:scale-[0.98]"
        >
            {icon}
            {label}
        </button>
    )

    let emptyState: ReactNode
    if (loadingDeck) {
        emptyState = radar(L('Finding study buddies…', 'Suche Lernpartner…'), L('Looking for learners who match your goals.', 'Wir suchen Lernende mit passenden Zielen.'))
    } else if (profileIncomplete) {
        emptyState = radar(
            L('Complete your profile to start swiping', 'Vervollständige dein Profil'),
            profileIncomplete.length > 0
                ? profileIncomplete.join(' · ')
                : L('Add your interests, goals and skill level so we can find your matches.', 'Füge Interessen, Ziele und Level hinzu.'),
            gradientButton(L('Edit profile', 'Profil bearbeiten'), () => router.push(`/${locale}/profile`), <SlidersHorizontal className="h-4 w-4" />)
        )
    } else if (deckError) {
        emptyState = radar(L('Something went wrong', 'Etwas ist schiefgelaufen'), deckError, gradientButton(L('Try again', 'Erneut versuchen'), loadDeck, <RefreshCw className="h-4 w-4" />))
    } else {
        emptyState = radar(
            L("There's no one new around you", 'Gerade keine neuen Lernpartner'),
            L('Check back soon — new learners join every day. You can also review people you passed on.', 'Schau bald wieder vorbei. Du kannst auch übersprungene Profile erneut ansehen.'),
            <>
                {gradientButton(L('Refresh', 'Aktualisieren'), loadDeck, <RefreshCw className="h-4 w-4" />)}
                {outlineButton(L('Show passed', 'Übersprungene zeigen'), resetPassed)}
            </>
        )
    }

    const matchTiles = (columns: string) => (
        <div className={`grid gap-3 ${columns}`}>
            {likedYouCount > 0 && (
                <button
                    type="button"
                    onClick={showLikesFirst}
                    className="relative flex aspect-[3/4] flex-col items-center justify-center overflow-hidden rounded-xl p-2 text-center text-black shadow-md transition hover:brightness-105"
                    style={{ background: 'linear-gradient(160deg, #ffd56b, #f5b748 55%, #e79a1d)' }}
                >
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-white/40 text-lg font-black">{likedYouCount}</span>
                    <span className="mt-2 text-[13px] font-extrabold leading-tight">{likedYouCount === 1 ? L('Like', 'Like') : L('Likes', 'Likes')}</span>
                    <Heart className="absolute bottom-2 right-2 h-4 w-4" fill="black" />
                </button>
            )}
            {acceptedMatches.map((match) => (
                <button
                    key={match.id}
                    type="button"
                    onClick={() => setSelectedMatch(match)}
                    className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted shadow-md"
                >
                    <BuddyPhoto
                        name={match.otherUser.name}
                        src={match.otherUser.profileImage}
                        initialsClassName="text-[34px]"
                        className="transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-8 text-left">
                        <p className="truncate text-[13px] font-bold text-white">{firstNameOf(match.otherUser.name)}</p>
                    </div>
                </button>
            ))}
            {likesSent.map((match) => (
                <div key={match.id} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted opacity-60" title={L('Waiting for them to like you back', 'Wartet auf Antwort')}>
                    <BuddyPhoto name={match.otherUser.name} src={match.otherUser.profileImage} initialsClassName="text-[34px]" className="grayscale" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-8 text-left">
                        <p className="truncate text-[12px] font-semibold text-white/90">{firstNameOf(match.otherUser.name)} · {L('sent', 'gesendet')}</p>
                    </div>
                </div>
            ))}
        </div>
    )

    const matchesEmpty = !loadingMatches && acceptedMatches.length === 0 && likesSent.length === 0 && likedYouCount === 0

    const matchesPanel = (columns: string) =>
        loadingMatches && matches.length === 0 ? (
            <div className={`grid gap-3 ${columns}`}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
                ))}
            </div>
        ) : matchesEmpty ? (
            <div className="flex flex-col items-center px-4 py-10 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl text-white shadow-lg" style={{ background: TINDER_GRADIENT }}>
                    <Heart className="h-8 w-8" fill="white" />
                </div>
                <h4 className="mt-4 text-[17px] font-bold text-foreground">{L('Start matching', 'Leg los')}</h4>
                <p className="mt-1.5 text-sm text-muted-foreground">
                    {L('Matches will appear here once you and another learner like each other.', 'Matches erscheinen hier, sobald ihr euch gegenseitig liked.')}
                </p>
            </div>
        ) : (
            matchTiles(columns)
        )

    const messagesPanel =
        acceptedMatches.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-muted-foreground">
                {L('No conversations yet. Match with someone to start chatting.', 'Noch keine Unterhaltungen.')}
            </p>
        ) : (
            <ul className="-mx-2">
                {acceptedMatches.map((match) => (
                    <li key={match.id}>
                        <button
                            type="button"
                            onClick={() => openChat(match.otherUser.id)}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-foreground/[0.05]"
                        >
                            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                                <BuddyPhoto name={match.otherUser.name} src={match.otherUser.profileImage} initialsClassName="text-[20px]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-foreground">{match.otherUser.name}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {match.chatRoomId
                                        ? L('Continue your conversation', 'Unterhaltung fortsetzen')
                                        : L(`Say hi to ${firstNameOf(match.otherUser.name)} 👋`, `Sag Hallo zu ${firstNameOf(match.otherUser.name)} 👋`)}
                                </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </li>
                ))}
            </ul>
        )

    return (
        <div className="relative flex h-[calc(100dvh-52px)] overflow-hidden bg-background">
            {/* Sidebar (desktop) */}
            <aside className="hidden w-[340px] shrink-0 flex-col border-r border-border bg-card/40 lg:flex xl:w-[372px]">
                <header className="flex h-[68px] items-center justify-between gap-3 px-4 text-white" style={{ background: TINDER_GRADIENT }}>
                    <Link href={`/${locale}/profile`} className="flex min-w-0 items-center gap-3 rounded-full py-1 pr-3 transition hover:bg-black/10">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/80">
                            <BuddyPhoto name={viewerName} src={viewerImage} initialsClassName="text-[15px]" />
                        </div>
                        <span className="truncate text-[17px] font-bold">{L('My Profile', 'Mein Profil')}</span>
                    </Link>
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                loadDeck()
                                loadMatches()
                            }}
                            className="grid h-10 w-10 place-items-center rounded-full bg-black/15 transition hover:bg-black/25"
                            title={L('Refresh', 'Aktualisieren')}
                            aria-label={L('Refresh', 'Aktualisieren')}
                        >
                            <RefreshCw className="h-[18px] w-[18px]" />
                        </button>
                        <Link
                            href={`/${locale}/messaging`}
                            className="grid h-10 w-10 place-items-center rounded-full bg-black/15 transition hover:bg-black/25"
                            title={L('Messages', 'Nachrichten')}
                            aria-label={L('Messages', 'Nachrichten')}
                        >
                            <MessageCircle className="h-[18px] w-[18px]" />
                        </Link>
                    </div>
                </header>

                <nav className="flex gap-6 border-b border-border px-5">
                    {(['matches', 'messages'] as SidebarTab[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setSidebarTab(tab)}
                            className={`relative py-3.5 text-[15px] font-bold transition-colors ${sidebarTab === tab ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {tab === 'matches' ? L('Matches', 'Matches') : L('Messages', 'Nachrichten')}
                            {tab === 'matches' && acceptedMatches.length > 0 && (
                                <span className="ml-1.5 rounded-full bg-[#fd267d] px-1.5 py-0.5 text-[11px] text-white">{acceptedMatches.length}</span>
                            )}
                            {sidebarTab === tab && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full" style={{ background: TINDER_GRADIENT }} />}
                        </button>
                    ))}
                </nav>

                <div className="flex-1 overflow-y-auto p-4">
                    {sidebarTab === 'matches' ? matchesPanel('grid-cols-3') : messagesPanel}
                </div>
            </aside>

            {/* Main */}
            <main className="relative flex min-w-0 flex-1 flex-col">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(253,38,125,0.10),transparent_60%)]" />

                {/* Mobile switcher */}
                <div className="relative z-10 flex items-center justify-between gap-3 px-4 pt-3 lg:hidden">
                    <div className="flex rounded-full bg-muted p-1">
                        {(['discover', 'matches'] as MobileView[]).map((view) => (
                            <button
                                key={view}
                                type="button"
                                onClick={() => setMobileView(view)}
                                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition ${mobileView === view ? 'bg-background text-foreground shadow' : 'text-muted-foreground'}`}
                            >
                                {view === 'discover' ? <LayoutGrid className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                {view === 'discover' ? L('Discover', 'Entdecken') : L('Matches', 'Matches')}
                                {view === 'matches' && acceptedMatches.length > 0 && (
                                    <span className="rounded-full bg-[#fd267d] px-1.5 text-[11px] text-white">{acceptedMatches.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <Link href={`/${locale}/messaging`} className="grid h-10 w-10 place-items-center rounded-full bg-muted text-foreground" aria-label={L('Messages', 'Nachrichten')}>
                        <MessageCircle className="h-5 w-5" />
                    </Link>
                </div>

                {mobileView === 'matches' ? (
                    <div className="relative z-10 flex-1 overflow-y-auto p-4 lg:hidden">
                        <h2 className="mb-3 text-lg font-extrabold text-foreground">{L('Your matches', 'Deine Matches')}</h2>
                        {matchesPanel('grid-cols-3 sm:grid-cols-4')}
                        {acceptedMatches.length > 0 && (
                            <>
                                <h2 className="mb-2 mt-6 text-lg font-extrabold text-foreground">{L('Messages', 'Nachrichten')}</h2>
                                {messagesPanel}
                            </>
                        )}
                    </div>
                ) : null}

                <div className={`relative z-10 min-h-0 flex-1 flex-col items-center px-4 pb-5 pt-4 lg:flex lg:pt-8 ${mobileView === 'matches' ? 'hidden' : 'flex'}`}>
                    <div className="flex h-full w-full max-w-[400px] flex-col" style={{ maxHeight: 760 }}>
                        <SwipeDeck
                            candidates={loadingDeck ? [] : deck}
                            onSwipe={handleSwipe}
                            onRewind={handleRewind}
                            canRewind={passHistory.length > 0}
                            emptyState={emptyState}
                        />
                    </div>
                </div>
            </main>

            {/* Match details sheet */}
            {selectedMatch && (
                <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
                    <div className="animate-in-fade absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
                    <div className="animate-in-slide-down relative w-full max-w-sm overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:rounded-3xl">
                        <div className="relative h-72">
                            <BuddyPhoto name={selectedMatch.otherUser.name} src={selectedMatch.otherUser.profileImage} initialsClassName="text-[96px]" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-20">
                                <h3 className="text-[28px] font-extrabold leading-tight text-white">
                                    {firstNameOf(selectedMatch.otherUser.name)}
                                    {selectedMatch.otherUser.skillLevel && (
                                        <span className="ml-2 text-[20px] font-light">{formatSkillLevel(selectedMatch.otherUser.skillLevel)}</span>
                                    )}
                                </h3>
                                <p className="text-sm text-white/80">
                                    {L('Matched', 'Gematcht')} {new Date(selectedMatch.createdAt).toLocaleDateString(isGerman ? 'de-DE' : 'en-US', { month: 'short', day: 'numeric' })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedMatch(null)}
                                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/40 text-white backdrop-blur"
                                aria-label={L('Close', 'Schließen')}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-2.5 p-5">
                            {selectedMatch.otherUser.interests.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                    {selectedMatch.otherUser.interests.slice(0, 6).map((interest) => (
                                        <span key={interest} className="rounded-full border border-border px-3 py-1 text-[13px] font-semibold text-foreground">
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => openChat(selectedMatch.otherUser.id)}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-full font-bold text-white shadow-lg transition hover:brightness-110"
                                style={{ background: TINDER_GRADIENT }}
                            >
                                <MessageCircle className="h-5 w-5" /> {L('Send a message', 'Nachricht senden')}
                            </button>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setVideoCallMatch(selectedMatch)
                                        setSelectedMatch(null)
                                    }}
                                    className="flex flex-col items-center gap-1 rounded-2xl border border-border py-3 text-xs font-semibold text-foreground transition hover:bg-foreground/[0.05]"
                                >
                                    <Video className="h-5 w-5 text-[#1be4a1]" /> {L('Video call', 'Videoanruf')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScheduleMatch(selectedMatch)
                                        setSelectedMatch(null)
                                    }}
                                    className="flex flex-col items-center gap-1 rounded-2xl border border-border py-3 text-xs font-semibold text-foreground transition hover:bg-foreground/[0.05]"
                                >
                                    <CalendarPlus className="h-5 w-5 text-[#f5b748]" /> {L('Schedule', 'Planen')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.push(`/${locale}/study-buddy/workspace?matchId=${selectedMatch.id}`)}
                                    className="flex flex-col items-center gap-1 rounded-2xl border border-border py-3 text-xs font-semibold text-foreground transition hover:bg-foreground/[0.05]"
                                >
                                    <Users className="h-5 w-5 text-[#1786ff]" /> {L('Workspace', 'Workspace')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <MatchCelebration
                candidate={celebrating}
                viewerName={viewerName}
                viewerImage={viewerImage}
                onMessage={() => {
                    const target = celebrating
                    setCelebrating(null)
                    if (target) openChat(target.id)
                }}
                onClose={() => setCelebrating(null)}
            />

            {videoCallMatch && viewer?.id && (
                <VideoCallInitiator
                    studyBuddy={{
                        id: videoCallMatch.otherUser.id,
                        name: videoCallMatch.otherUser.name,
                        arabicName: videoCallMatch.otherUser.arabicName || undefined,
                        profileImage: videoCallMatch.otherUser.profileImage || undefined,
                        isOnline: true,
                    }}
                    currentUserId={viewer.id}
                    onClose={() => setVideoCallMatch(null)}
                />
            )}

            {scheduleMatch && (
                <SessionSchedulerModal
                    isOpen={!!scheduleMatch}
                    onClose={() => setScheduleMatch(null)}
                    studyBuddy={{
                        id: scheduleMatch.otherUser.id,
                        name: scheduleMatch.otherUser.name,
                        arabicName: scheduleMatch.otherUser.arabicName || undefined,
                        profileImage: scheduleMatch.otherUser.profileImage || undefined,
                    }}
                    matchId={scheduleMatch.id}
                />
            )}
        </div>
    )
}

export default function StudyBuddyPage() {
    return (
        <Suspense fallback={<div className="h-[calc(100dvh-52px)] bg-background" />}>
            <StudyBuddyScreen />
        </Suspense>
    )
}
