'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { BuddyPhoto } from './BuddyPhoto'
import { TINDER_GRADIENT, firstNameOf, type BuddyCandidate } from './types'

interface MatchCelebrationProps {
    candidate: BuddyCandidate | null
    viewerName: string
    viewerImage?: string | null
    onMessage: () => void
    onClose: () => void
}

export function MatchCelebration({ candidate, viewerName, viewerImage, onMessage, onClose }: MatchCelebrationProps) {
    // Confetti burst + Esc to close
    useEffect(() => {
        if (!candidate) return
        let cancelled = false
        import('canvas-confetti')
            .then(({ default: confetti }) => {
                if (cancelled) return
                const colors = ['#fd267d', '#ff7854', '#1be4a1', '#1786ff', '#ffffff']
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.35 }, colors, disableForReducedMotion: true })
                setTimeout(() => {
                    if (!cancelled) confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 }, colors, disableForReducedMotion: true })
                }, 250)
            })
            .catch(() => undefined)

        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKey)
        return () => {
            cancelled = true
            window.removeEventListener('keydown', handleKey)
        }
    }, [candidate, onClose])

    return (
        <AnimatePresence>
            {candidate && (
                <motion.div
                    key={candidate.id}
                    className="fixed inset-0 z-[90] flex items-center justify-center p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="It's a match"
                >
                    {/* Blurred photo backdrop */}
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute inset-0 scale-110 opacity-70 blur-2xl">
                            <BuddyPhoto name={candidate.name} src={candidate.profileImage} initialsClassName="text-[300px]" />
                        </div>
                        <div className="absolute inset-0 bg-black/70" />
                    </div>

                    <motion.div
                        className="relative flex w-full max-w-md flex-col items-center text-center"
                        initial={{ scale: 0.7, y: 40, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                    >
                        <h2
                            className="bg-gradient-to-r from-[#1be4a1] via-[#2ee6c5] to-[#2bc0e4] bg-clip-text pb-2 text-[60px] font-black italic leading-none tracking-tight text-transparent sm:text-[72px]"
                            style={{ fontFamily: '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive' }}
                        >
                            It&apos;s a Match!
                        </h2>
                        <p className="mt-2 text-[17px] text-white/85">
                            You and {firstNameOf(candidate.name)} both want to study together.
                        </p>

                        <div className="mt-9 flex items-center justify-center">
                            <motion.div
                                initial={{ x: -60, rotate: -14, opacity: 0 }}
                                animate={{ x: 0, rotate: -8, opacity: 1 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
                                className="h-32 w-32 overflow-hidden rounded-full shadow-2xl ring-4 ring-white sm:h-36 sm:w-36"
                            >
                                <BuddyPhoto name={viewerName} src={viewerImage} initialsClassName="text-[48px]" />
                            </motion.div>
                            <motion.div
                                initial={{ x: 60, rotate: 14, opacity: 0 }}
                                animate={{ x: 0, rotate: 8, opacity: 1 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
                                className="-ml-5 h-32 w-32 overflow-hidden rounded-full shadow-2xl ring-4 ring-white sm:h-36 sm:w-36"
                            >
                                <BuddyPhoto name={candidate.name} src={candidate.profileImage} initialsClassName="text-[48px]" />
                            </motion.div>
                        </div>

                        <div className="mt-10 flex w-full flex-col gap-3">
                            <button
                                type="button"
                                onClick={onMessage}
                                className="flex h-14 items-center justify-center gap-2 rounded-full text-[16px] font-bold uppercase tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(253,38,125,0.7)] transition hover:brightness-110 active:scale-[0.98]"
                                style={{ background: TINDER_GRADIENT }}
                            >
                                <MessageCircle className="h-5 w-5" />
                                Send a message
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-14 rounded-full border-2 border-white/70 text-[16px] font-bold uppercase tracking-wide text-white transition hover:bg-white/10 active:scale-[0.98]"
                            >
                                Keep swiping
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
