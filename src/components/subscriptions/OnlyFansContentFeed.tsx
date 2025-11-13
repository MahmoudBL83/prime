'use client'

import { motion } from 'framer-motion'
import { Lock, Heart, MessageCircle, Play } from 'lucide-react'
import Image from 'next/image'

interface ContentPost {
    id: string
    type: 'VIDEO' | 'IMAGE' | 'TEXT'
    thumbnail?: string
    title: string
    tier: 'FREE' | 'BASIC' | 'PREMIUM' | 'VIP'
    likes: number
    comments: number
    isLocked: boolean
}

interface OnlyFansContentFeedProps {
    posts: ContentPost[]
    userTier?: 'BASIC' | 'PREMIUM' | 'VIP' | null
    onPostClick: (postId: string) => void
    locale?: string
}

export default function OnlyFansContentFeed({
    posts,
    userTier,
    onPostClick,
    locale = 'en'
}: OnlyFansContentFeedProps) {
    const isArabic = locale === 'ar'

    const canAccess = (postTier: string) => {
        if (postTier === 'FREE') return true
        if (!userTier) return false
        
        const tierLevel = { BASIC: 1, PREMIUM: 2, VIP: 3 }
        return tierLevel[userTier] >= tierLevel[postTier as keyof typeof tierLevel]
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, i) => {
                const locked = !canAccess(post.tier)
                
                return (
                    <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onPostClick(post.id)}
                        className="relative group cursor-pointer"
                    >
                        <div className="aspect-square bg-background rounded-xl overflow-hidden">
                            {post.thumbnail && (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={post.thumbnail}
                                        alt={post.title}
                                        fill
                                        className={`object-cover transition-transform group-hover:scale-110 ${
                                            locked ? 'blur-xl' : ''
                                        }`}
                                    />
                                    
                                    {locked && (
                                        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <Lock className="w-12 h-12 text-purple-400 mx-auto mb-2" />
                                                <p className="text-foreground font-bold text-sm">
                                                    {post.tier} {isArabic ? 'فقط' : 'Only'}
                                                </p>
                                                <p className="text-purple-300 text-xs mt-1">
                                                    {isArabic ? 'اشترك للفتح' : 'Subscribe to unlock'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {post.type === 'VIDEO' && !locked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/90 rounded-full p-4">
                                                <Play className="w-8 h-8 text-foreground fill-black" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-3">
                            <h3 className="text-foreground font-semibold text-sm line-clamp-2 mb-2">
                                {post.title}
                            </h3>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    <span>{post.likes}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MessageCircle className="w-4 h-4" />
                                    <span>{post.comments}</span>
                                </div>
                                {post.tier !== 'FREE' && (
                                    <div className={`ml-auto px-2 py-0.5 rounded text-xs font-bold ${
                                        post.tier === 'VIP' ? 'bg-yellow-500/20 text-yellow-400' :
                                        post.tier === 'PREMIUM' ? 'bg-purple-500/20 text-purple-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {post.tier}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
