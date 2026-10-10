'use client'

import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react'
import { animate, motion, useMotionValue, useTransform, type MotionValue, type PanInfo } from 'framer-motion'
import { ArrowDown, Flame, Heart, Info, RotateCcw, Sparkles, Star, Target, X, Zap } from 'lucide-react'
import { BuddyPhoto } from './BuddyPhoto'
import {
    SWIPE_COLORS,
    firstNameOf,
    formatLearningMode,
    formatSkillLevel,
    type BuddyCandidate,
    type SwipeAction,
} from './types'

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

interface SwipeCardHandle {
    swipe: (action: SwipeAction) => void
}

interface SwipeCardProps {
    candidate: BuddyCandidate
    depth: number
    expanded: boolean
    onToggleExpanded: () => void
    onSwiped: (action: SwipeAction) => void
}

const SWIPE_DISTANCE = 110
const SWIPE_VELOCITY = 650

const BREAKDOWN_LABELS: Array<[keyof NonNullable<BuddyCandidate['compatibilityBreakdown']>, string]> = [
    ['interestsScore', 'Interests'],
    ['goalsScore', 'Goals'],
    ['communicationScore', 'Communication'],
    ['learningStyleScore', 'Learning style'],
    ['scheduleScore', 'Schedule'],
    ['skillLevelScore', 'Skill level'],
]

function Chip({ label, highlighted }: { label: string; highlighted?: boolean }) {
    return (
        <span
            className={`rounded-full px-3 py-1 text-[13px] font-semibold backdrop-blur-sm ${highlighted
                ? 'bg-white text-black'
                : 'border border-white/35 bg-black/25 text-white'
                }`}
        >
            {label}
        </span>
    )
}

function Stamp({ label, color, className, opacity }: { label: ReactNode; color: string; className: string; opacity: MotionValue<number> }) {
    return (
        <motion.div
            style={{ opacity, color, borderColor: color }}
            className={`pointer-events-none absolute z-30 rounded-xl border-[5px] px-3 py-0.5 text-center font-black uppercase tracking-[0.08em] ${className}`}
        >
            {label}
        </motion.div>
    )
}

const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
    { candidate, depth, expanded, onToggleExpanded, onSwiped },
    ref
) {
    const isTop = depth === 0
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotate = useTransform(x, [-320, 0, 320], [-14, 0, 14])
    const likeOpacity = useTransform(x, [24, SWIPE_DISTANCE], [0, 1])
    const nopeOpacity = useTransform(x, [-SWIPE_DISTANCE, -24], [1, 0])
    const superOpacity = useTransform(y, [-SWIPE_DISTANCE, -30], [1, 0])
    const flyingRef = useRef(false)

    const flyOut = useCallback(
        (action: SwipeAction) => {
            if (flyingRef.current) return
            flyingRef.current = true
            const width = typeof window !== 'undefined' ? window.innerWidth : 1200
            const height = typeof window !== 'undefined' ? window.innerHeight : 900
            const transition = { duration: 0.38, ease: [0.32, 0.72, 0, 1] as const }

            const animations =
                action === 'superlike'
                    ? [animate(y, -height, transition), animate(x, x.get() * 0.4, transition)]
                    : [
                        animate(x, (action === 'like' ? 1 : -1) * (width + 260), transition),
                        animate(y, y.get() + 50, transition),
                    ]

            Promise.all(animations).then(() => onSwiped(action))
        },
        [onSwiped, x, y]
    )

    useImperativeHandle(ref, () => ({ swipe: flyOut }), [flyOut])

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const { offset, velocity } = info
        if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) return flyOut('like')
        if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) return flyOut('pass')
        if (offset.y < -SWIPE_DISTANCE * 1.2 || velocity.y < -SWIPE_VELOCITY * 1.3) return flyOut('superlike')
        const spring = { type: 'spring' as const, stiffness: 420, damping: 30 }
        animate(x, 0, spring)
        animate(y, 0, spring)
    }

    const firstName = firstNameOf(candidate.name)
    const skill = formatSkillLevel(candidate.skillLevel)
    const mode = formatLearningMode(candidate.learningMode)
    const shared = new Set(candidate.sharedInterests.map((i) => i.toLowerCase()))
    const chips = [
        ...candidate.sharedInterests,
        ...candidate.interests.filter((i) => !shared.has(i.toLowerCase())),
    ].slice(0, 5)

    return (
        <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ scale: 1 - depth * 0.045, y: depth * 14, opacity: depth > 2 ? 0 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ zIndex: 30 - depth, pointerEvents: isTop ? 'auto' : 'none' }}
            aria-hidden={!isTop}
        >
            <motion.div
                className={`relative h-full w-full ${isTop && !expanded ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{ x, y, rotate, touchAction: isTop && !expanded ? 'none' : 'auto' }}
                drag={isTop && !expanded}
                dragMomentum={false}
                dragElastic={1}
                onDragEnd={handleDragEnd}
            >
                <div className="relative h-full w-full select-none overflow-hidden rounded-[22px] bg-[#111] shadow-[0_22px_60px_-18px_rgba(0,0,0,0.65)] ring-1 ring-black/5 dark:ring-white/10">
                    {/* Photo */}
                    <div
                        className="absolute inset-x-0 top-0 transition-[height] duration-300 ease-out"
                        style={{ height: expanded ? '44%' : '100%' }}
                    >
                        <BuddyPhoto name={candidate.name} src={candidate.profileImage} initialsClassName="text-[128px]" />
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
                    </div>

                    {/* Match score */}
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md">
                        <Flame className="h-4 w-4 text-[#ff7854]" fill="#ff7854" />
                        {Math.round(candidate.compatibilityScore)}% match
                    </div>

                    {candidate.likedYou && (
                        <div className="absolute left-4 top-4 z-20 flex items-center gap-1 rounded-full bg-[#f5b748] px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-black shadow-lg">
                            <Heart className="h-3.5 w-3.5" fill="black" />
                            Likes you
                        </div>
                    )}

                    {!expanded ? (
                        <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/75 to-transparent px-5 pb-6 pt-28">
                            <div className="flex items-end justify-between gap-3">
                                <div className="min-w-0">
                                    <h3 className="truncate text-[32px] font-extrabold leading-[1.1] tracking-tight text-white">
                                        {firstName}
                                        {skill && <span className="ml-2 text-[24px] font-light text-white/90">{skill}</span>}
                                    </h3>
                                    <div className="mt-1.5 flex items-center gap-2 text-[15px] text-white/85">
                                        <span className="h-2.5 w-2.5 rounded-full bg-[#1be4a1] shadow-[0_0_8px_#1be4a1]" />
                                        {mode || 'Looking for a study buddy'}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onPointerDownCapture={(e) => e.stopPropagation()}
                                    onClick={onToggleExpanded}
                                    className="mb-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 text-white backdrop-blur-md transition hover:bg-white/30"
                                    aria-label={`Open ${firstName}'s profile`}
                                >
                                    <Info className="h-5 w-5" />
                                </button>
                            </div>
                            {candidate.bio && (
                                <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-white/80">{candidate.bio}</p>
                            )}
                            {chips.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5">
                                    {chips.map((chip) => (
                                        <Chip key={chip} label={chip} highlighted={shared.has(chip.toLowerCase())} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="absolute inset-x-0 bottom-0 z-10 overflow-y-auto overscroll-contain bg-white px-5 pb-10 pt-6 text-neutral-900 dark:bg-[#111] dark:text-white"
                            style={{ top: '44%' }}
                        >
                            <h3 className="text-[28px] font-extrabold leading-tight tracking-tight">
                                {candidate.name}
                                {skill && <span className="ml-2 text-[22px] font-light opacity-80">{skill}</span>}
                            </h3>
                            {mode && <p className="mt-1 text-[15px] opacity-70">{mode}</p>}

                            {candidate.bio && (
                                <section className="mt-5">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.08em] opacity-60">About me</h4>
                                    <p className="mt-1.5 text-[15px] leading-relaxed opacity-90">{candidate.bio}</p>
                                </section>
                            )}

                            {candidate.reasonsForMatch && candidate.reasonsForMatch.length > 0 && (
                                <section className="mt-5 rounded-2xl bg-neutral-100 p-4 dark:bg-white/[0.06]">
                                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] opacity-70">
                                        <Sparkles className="h-4 w-4 text-[#fd267d]" /> Why you&apos;ll click
                                    </h4>
                                    <ul className="mt-2 space-y-1.5">
                                        {candidate.reasonsForMatch.slice(0, 4).map((reason) => (
                                            <li key={reason} className="flex gap-2 text-[14px] leading-snug opacity-90">
                                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fd267d]" />
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {candidate.goals.length > 0 && (
                                <section className="mt-5">
                                    <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] opacity-60">
                                        <Target className="h-4 w-4" /> Learning goals
                                    </h4>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {candidate.goals.map((goal) => {
                                            const isShared = candidate.sharedGoals.some((g) => g.toLowerCase() === goal.toLowerCase())
                                            return (
                                                <span
                                                    key={goal}
                                                    className={`rounded-full px-3 py-1 text-[13px] font-semibold ${isShared
                                                        ? 'text-white'
                                                        : 'border border-neutral-300 dark:border-white/20'
                                                        }`}
                                                    style={isShared ? { background: '#fd267d' } : undefined}
                                                >
                                                    {goal}
                                                </span>
                                            )
                                        })}
                                    </div>
                                </section>
                            )}

                            {candidate.interests.length > 0 && (
                                <section className="mt-5">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.08em] opacity-60">Interests</h4>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {candidate.interests.map((interest) => (
                                            <span
                                                key={interest}
                                                className={`rounded-full px-3 py-1 text-[13px] font-semibold ${shared.has(interest.toLowerCase())
                                                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                                                    : 'border border-neutral-300 dark:border-white/20'
                                                    }`}
                                            >
                                                {interest}
                                            </span>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {candidate.compatibilityBreakdown && (
                                <section className="mt-5">
                                    <h4 className="text-xs font-bold uppercase tracking-[0.08em] opacity-60">Compatibility</h4>
                                    <div className="mt-2 space-y-2.5">
                                        {BREAKDOWN_LABELS.map(([key, label]) => {
                                            const value = Math.round(candidate.compatibilityBreakdown?.[key] ?? 0)
                                            return (
                                                <div key={key} className="flex items-center gap-3 text-[13px]">
                                                    <span className="w-28 shrink-0 opacity-75">{label}</span>
                                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{ width: `${value}%`, background: 'linear-gradient(90deg, #ff7854, #fd267d)' }}
                                                        />
                                                    </div>
                                                    <span className="w-9 text-right font-semibold tabular-nums">{value}%</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            )}
                        </div>
                    )}

                    {expanded && (
                        <button
                            type="button"
                            onClick={onToggleExpanded}
                            className="absolute right-5 z-30 grid h-11 w-11 place-items-center rounded-full text-white shadow-xl transition hover:scale-105"
                            style={{ top: 'calc(44% - 22px)', background: SWIPE_COLORS.nope }}
                            aria-label="Close profile"
                        >
                            <ArrowDown className="h-6 w-6" strokeWidth={3} />
                        </button>
                    )}

                    {/* Swipe feedback stamps */}
                    <Stamp label="Like" color={SWIPE_COLORS.like} opacity={likeOpacity} className="left-6 top-14 -rotate-[18deg] text-[42px]" />
                    <Stamp label="Nope" color={SWIPE_COLORS.nope} opacity={nopeOpacity} className="right-6 top-14 rotate-[18deg] text-[42px]" />
                    <Stamp
                        label={<>Super<br />Like</>}
                        color={SWIPE_COLORS.superlike}
                        opacity={superOpacity}
                        className="bottom-44 left-1/2 -translate-x-1/2 -rotate-[8deg] text-[34px] leading-[0.95]"
                    />
                </div>
            </motion.div>
        </motion.div>
    )
})

// ---------------------------------------------------------------------------
// Action buttons
// ---------------------------------------------------------------------------

function ActionButton({
    color,
    size,
    label,
    onClick,
    disabled,
    children,
}: {
    color: string
    size: 'sm' | 'lg'
    label: string
    onClick: () => void
    disabled?: boolean
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            title={label}
            style={{ '--c': color } as CSSProperties}
            className={`group grid place-items-center rounded-full border border-border bg-card text-[var(--c)] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] transition-all duration-200 hover:scale-110 hover:border-transparent hover:bg-[var(--c)] hover:text-white active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${size === 'lg' ? 'h-[68px] w-[68px]' : 'h-[52px] w-[52px]'}`}
        >
            {children}
        </button>
    )
}

// ---------------------------------------------------------------------------
// Deck
// ---------------------------------------------------------------------------

interface SwipeDeckProps {
    candidates: BuddyCandidate[]
    onSwipe: (candidate: BuddyCandidate, action: SwipeAction) => void
    onRewind?: () => void
    canRewind?: boolean
    emptyState: ReactNode
}

export function SwipeDeck({ candidates, onSwipe, onRewind, canRewind = false, emptyState }: SwipeDeckProps) {
    const topCardRef = useRef<SwipeCardHandle>(null)
    const [expanded, setExpanded] = useState(false)
    const top = candidates[0]

    // A new top card always starts collapsed
    useEffect(() => {
        setExpanded(false)
    }, [top?.id])

    const swipeTop = useCallback((action: SwipeAction) => {
        if (!top) return
        setExpanded(false)
        topCardRef.current?.swipe(action)
    }, [top])

    // Tinder keyboard shortcuts
    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
            if (!top) return
            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault()
                    swipeTop('pass')
                    break
                case 'ArrowRight':
                    event.preventDefault()
                    swipeTop('like')
                    break
                case 'Enter':
                    event.preventDefault()
                    swipeTop('superlike')
                    break
                case 'ArrowUp':
                    event.preventDefault()
                    setExpanded(true)
                    break
                case 'ArrowDown':
                    event.preventDefault()
                    setExpanded(false)
                    break
                case 'Backspace':
                    if (canRewind && onRewind) {
                        event.preventDefault()
                        onRewind()
                    }
                    break
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [top, swipeTop, canRewind, onRewind])

    const visible = candidates.slice(0, 3)

    return (
        <div className="flex h-full w-full flex-col items-center">
            <div className="relative w-full max-w-[400px] flex-1">
                {visible.length === 0
                    ? emptyState
                    : visible
                        .map((candidate, depth) => (
                            <SwipeCard
                                key={candidate.id}
                                ref={depth === 0 ? topCardRef : undefined}
                                candidate={candidate}
                                depth={depth}
                                expanded={depth === 0 && expanded}
                                onToggleExpanded={() => setExpanded((open) => !open)}
                                onSwiped={(action) => onSwipe(candidate, action)}
                            />
                        ))
                        .reverse()}
            </div>

            {/* Action bar */}
            <div className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
                <ActionButton color={SWIPE_COLORS.rewind} size="sm" label="Rewind" onClick={() => onRewind?.()} disabled={!canRewind}>
                    <RotateCcw className="h-6 w-6" strokeWidth={2.75} />
                </ActionButton>
                <ActionButton color={SWIPE_COLORS.nope} size="lg" label="Nope" onClick={() => swipeTop('pass')} disabled={!top}>
                    <X className="h-9 w-9" strokeWidth={3.25} />
                </ActionButton>
                <ActionButton color={SWIPE_COLORS.superlike} size="sm" label="Super Like" onClick={() => swipeTop('superlike')} disabled={!top}>
                    <Star className="h-6 w-6" strokeWidth={0} fill="currentColor" />
                </ActionButton>
                <ActionButton color={SWIPE_COLORS.like} size="lg" label="Like" onClick={() => swipeTop('like')} disabled={!top}>
                    <Heart className="h-8 w-8" strokeWidth={0} fill="currentColor" />
                </ActionButton>
                <ActionButton
                    color={SWIPE_COLORS.profile}
                    size="sm"
                    label={expanded ? 'Close profile' : 'Open profile'}
                    onClick={() => setExpanded((open) => !open)}
                    disabled={!top}
                >
                    <Zap className="h-6 w-6" strokeWidth={0} fill="currentColor" />
                </ActionButton>
            </div>

            {/* Keyboard hints (desktop) */}
            <div className="mt-4 hidden items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground lg:flex">
                {[
                    ['Nope', '←'],
                    ['Like', '→'],
                    ['Super Like', '⏎'],
                    ['Open profile', '↑'],
                    ['Close profile', '↓'],
                ].map(([label, key]) => (
                    <span key={label} className="flex items-center gap-1.5 whitespace-nowrap">
                        <kbd className="grid h-6 min-w-6 place-items-center rounded-md border border-border bg-card px-1.5 font-sans text-[12px] text-foreground">
                            {key}
                        </kbd>
                        {label}
                    </span>
                ))}
            </div>
        </div>
    )
}
