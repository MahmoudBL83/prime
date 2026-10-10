'use client'

import { useState } from 'react'

const GRADIENTS: Array<[string, string]> = [
    ['#fd267d', '#ff7854'],
    ['#6a5af9', '#d66efd'],
    ['#0ea5e9', '#6366f1'],
    ['#f59e0b', '#ef4444'],
    ['#10b981', '#0ea5e9'],
    ['#ec4899', '#8b5cf6'],
    ['#14b8a6', '#3b82f6'],
    ['#f97316', '#db2777'],
]

function hashString(value: string): number {
    let hash = 0
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0
    }
    return Math.abs(hash)
}

export function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Generated "initials" avatars look like flat placeholders on a full-bleed card */
function isPlaceholderImage(src: string | null | undefined): boolean {
    return !src || /dicebear\.com\/[^/]+\/initials/i.test(src) || /ui-avatars\.com/i.test(src)
}

interface BuddyPhotoProps {
    name: string
    src?: string | null
    className?: string
    /** Font size class for the initials fallback */
    initialsClassName?: string
}

/**
 * A learner's photo, or a rich gradient with initials when there is no real photo.
 * Plain <img> on purpose: profile photos can come from any host.
 */
export function BuddyPhoto({ name, src, className = '', initialsClassName = 'text-[120px]' }: BuddyPhotoProps) {
    const [failed, setFailed] = useState(false)

    if (!isPlaceholderImage(src) && !failed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={src as string}
                alt={name}
                draggable={false}
                loading="lazy"
                decoding="async"
                onError={() => setFailed(true)}
                className={`h-full w-full object-cover ${className}`}
            />
        )
    }

    const [from, to] = GRADIENTS[hashString(name) % GRADIENTS.length]
    return (
        <div
            role="img"
            aria-label={name}
            className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
            style={{
                backgroundImage: `radial-gradient(120% 80% at 18% 8%, rgba(255,255,255,0.28), transparent 55%), radial-gradient(90% 70% at 90% 100%, rgba(0,0,0,0.35), transparent 60%), linear-gradient(150deg, ${from}, ${to})`,
            }}
        >
            <span className={`select-none font-black tracking-tight text-white/90 drop-shadow-[0_6px_24px_rgba(0,0,0,0.25)] ${initialsClassName}`}>
                {initialsOf(name)}
            </span>
        </div>
    )
}
