'use client'

import { memo, useState, type MouseEvent, type ReactNode } from 'react'
import { formatDistanceToNowStrict } from 'date-fns'
import { Bookmark, CheckCircle2, Heart, Image as ImageIcon, Lock, MessageCircle, Play, Video } from 'lucide-react'

export interface FeedPostData {
    id: string
    type: string
    content: string
    contentAr?: string | null
    mediaUrl?: string | null
    thumbnailUrl?: string | null
    publishedAt?: string | null
    createdAt?: string
    tier?: string
    hasAccess?: boolean
    _count?: { likes?: number; comments?: number }
    channel: {
        id?: string
        creator: {
            id: string
            userId: string
            user: {
                id: string
                name: string
                arabicName?: string | null
                profileImage?: string | null
            }
        }
    }
}

interface FeedPostProps {
    post: FeedPostData
    isArabic: boolean
    liked: boolean
    bookmarked: boolean
    canBookmark: boolean
    commentsOpen: boolean
    onLike: () => void
    onToggleComments: (event: MouseEvent) => void
    onTip: () => void
    onBookmark: () => void
    onOpenCreator: () => void
    onOpenPost: () => void
    onSubscribe: () => void
    /** The "..." menu (rendered by the page so it keeps its hide/report logic) */
    menu: ReactNode
    onToggleMenu: (event: MouseEvent) => void
    children?: ReactNode
}

const ONLYFANS_BLUE = '#00aff0'
const LONG_TEXT = 280

export function handleOf(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function formatPostTime(value?: string | null) {
    if (!value) return ''
    const date = new Date(value)
    const ageMs = Date.now() - date.getTime()
    if (ageMs < 7 * 24 * 60 * 60 * 1000) {
        return `${formatDistanceToNowStrict(date)} ago`
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function CreatorAvatar({ name, src, size = 48 }: { name: string; src?: string | null; size?: number }) {
    const [failed, setFailed] = useState(false)
    const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')

    return (
        <div
            className="relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#00aff0] to-[#0a84ff]"
            style={{ width: size, height: size }}
        >
            {src && !failed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white">{initials}</span>
            )}
        </div>
    )
}

/** A post in the OnlyFans-style home feed */
export const FeedPost = memo(function FeedPost({
    post,
    isArabic,
    liked,
    bookmarked,
    canBookmark,
    commentsOpen,
    onLike,
    onToggleComments,
    onTip,
    onBookmark,
    onOpenCreator,
    onOpenPost,
    onSubscribe,
    menu,
    onToggleMenu,
    children,
}: FeedPostProps) {
    const [expanded, setExpanded] = useState(false)
    const [mediaFailed, setMediaFailed] = useState(false)
    const creator = post.channel.creator
    const displayName = isArabic && creator.user.arabicName ? creator.user.arabicName : creator.user.name
    const text = (isArabic && post.contentAr ? post.contentAr : post.content) || ''
    const isLong = text.length > LONG_TEXT
    const shownText = isLong && !expanded ? `${text.slice(0, LONG_TEXT).trimEnd()}…` : text
    const locked = post.hasAccess === false
    const likes = post._count?.likes || 0
    const comments = post._count?.comments || 0
    const mediaSrc = post.thumbnailUrl || post.mediaUrl
    const isVideo = post.type === 'VIDEO'
    const hasMedia = (post.type === 'IMAGE' || isVideo) && !!mediaSrc && !mediaFailed

    return (
        <article className="border-b border-border px-4 pb-3 pt-4 transition-colors hover:bg-foreground/[0.015]">
            {/* Author */}
            <header className="flex items-start gap-3">
                <button type="button" onClick={onOpenCreator} className="shrink-0" aria-label={displayName}>
                    <CreatorAvatar name={creator.user.name} src={creator.user.profileImage} />
                </button>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={onOpenCreator} className="truncate text-[15px] font-bold text-foreground hover:underline">
                            {displayName}
                        </button>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-white" fill={ONLYFANS_BLUE} />
                    </div>
                    <button type="button" onClick={onOpenCreator} className="block truncate text-sm text-muted-foreground">
                        @{handleOf(creator.user.name)}
                    </button>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                    <time dateTime={post.publishedAt || post.createdAt}>{formatPostTime(post.publishedAt || post.createdAt)}</time>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={onToggleMenu}
                            className="grid h-8 w-8 place-items-center rounded-full transition-colors hover:bg-foreground/[0.06]"
                            aria-label="Post options"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <circle cx="5" cy="12" r="1.8" />
                                <circle cx="12" cy="12" r="1.8" />
                                <circle cx="19" cy="12" r="1.8" />
                            </svg>
                        </button>
                        {menu}
                    </div>
                </div>
            </header>

            {/* Text */}
            {text && (
                <div className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-foreground">
                    {shownText}
                    {isLong && (
                        <button type="button" onClick={() => setExpanded((open) => !open)} className="ml-1 font-semibold" style={{ color: ONLYFANS_BLUE }}>
                            {expanded ? (isArabic ? 'أقل' : 'less') : (isArabic ? 'المزيد' : 'more')}
                        </button>
                    )}
                </div>
            )}

            {/* Media */}
            {locked ? (
                <div className="relative -mx-4 mt-3 overflow-hidden bg-muted">
                    <div className="relative aspect-[4/3] w-full">
                        {post.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={post.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl" />
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-black/10 to-black/40">
                            <div className="grid h-14 w-14 place-items-center rounded-full bg-black/35 backdrop-blur">
                                <Lock className="h-7 w-7 text-white" />
                            </div>
                            <div className="flex items-center gap-3 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                {isVideo ? <Video className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                                {isVideo ? (isArabic ? 'فيديو' : 'Video') : (isArabic ? 'صورة' : 'Photo')}
                            </div>
                        </div>
                    </div>
                    <div className="bg-card p-3">
                        <button
                            type="button"
                            onClick={onSubscribe}
                            className="flex h-11 w-full items-center justify-center rounded-full text-sm font-bold uppercase tracking-wide text-white transition hover:brightness-110"
                            style={{ background: ONLYFANS_BLUE }}
                        >
                            {isArabic ? 'اشترك لمشاهدة المنشورات' : "Subscribe to see user's posts"}
                        </button>
                    </div>
                </div>
            ) : hasMedia ? (
                <button type="button" onClick={onOpenPost} className="relative -mx-4 mt-3 block w-[calc(100%+2rem)] overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={mediaSrc as string}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={() => setMediaFailed(true)}
                        className="max-h-[560px] w-full object-cover"
                    />
                    {isVideo && (
                        <span className="absolute inset-0 grid place-items-center">
                            <span className="grid h-16 w-16 place-items-center rounded-full bg-black/55 backdrop-blur-sm">
                                <Play className="ml-1 h-8 w-8 text-white" fill="white" />
                            </span>
                        </span>
                    )}
                </button>
            ) : null}

            {/* Actions */}
            <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                <button
                    type="button"
                    onClick={onLike}
                    aria-pressed={liked}
                    aria-label={liked ? 'Unlike' : 'Like'}
                    className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                    style={liked ? { color: ONLYFANS_BLUE } : undefined}
                >
                    <Heart className={`h-6 w-6 transition-transform ${liked ? 'scale-110' : ''}`} fill={liked ? ONLYFANS_BLUE : 'none'} />
                </button>
                <button
                    type="button"
                    onClick={onToggleComments}
                    aria-expanded={commentsOpen}
                    aria-label="Comments"
                    className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                    style={commentsOpen ? { color: ONLYFANS_BLUE } : undefined}
                >
                    <MessageCircle className="h-6 w-6" />
                </button>
                <button
                    type="button"
                    onClick={onTip}
                    className="flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold uppercase tracking-wide transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="9.5" strokeWidth="1.8" />
                        <path strokeLinecap="round" strokeWidth="1.8" d="M14.5 9.5c-.4-1-1.4-1.6-2.5-1.6-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2.1c1.4.4 2.5.9 2.5 2.1s-1.1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6.5v1.4M12 16.1v1.4" />
                    </svg>
                    {isArabic ? 'إكرامية' : 'Send tip'}
                </button>
                <div className="flex-1" />
                {canBookmark && (
                    <button
                        type="button"
                        onClick={onBookmark}
                        aria-pressed={bookmarked}
                        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
                        className="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                        style={bookmarked ? { color: ONLYFANS_BLUE } : undefined}
                    >
                        <Bookmark className="h-6 w-6" fill={bookmarked ? ONLYFANS_BLUE : 'none'} />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-3 px-1 text-sm">
                <span className="font-bold text-foreground">
                    {likes} {isArabic ? 'إعجاب' : likes === 1 ? 'like' : 'likes'}
                </span>
                {comments > 0 && (
                    <button type="button" onClick={onToggleComments} className="text-muted-foreground transition-colors hover:text-foreground">
                        {comments} {isArabic ? 'تعليق' : comments === 1 ? 'comment' : 'comments'}
                    </button>
                )}
            </div>

            {children}
        </article>
    )
})
