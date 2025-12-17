'use client'

import { motion } from 'framer-motion'
import { Lock, Heart, MessageCircle, Play } from 'lucide-react'
import Image from 'next/image'

interface ContentPost {
    id: string
    type: 'VIDEO' | 'IMAGE' | 'TEXT'
    thumbnail?: string
    title: string
    tier?: string // Single subscription model - all subscribers get access
    likes: number
    comments: number
    isLocked: boolean
}

interface OnlyFansContentFeedProps {
    posts: ContentPost[]
    isSubscribed?: boolean // Single subscription model
    onPostClick: (postId: string) => void
    locale?: string
}

export default function OnlyFansContentFeed({
    posts,
    isSubscribed = false,
    onPostClick,
    locale = 'en'
}: OnlyFansContentFeedProps) {
    const isArabic = locale === 'ar'

    // Single subscription model - subscribers can access all posts
    const canAccess = () => {
        return isSubscribed
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, i) => {
                const locked = !canAccess()
                
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
                                                    {isArabic ? 'للمشتركين فقط' : 'Subscribers Only'}
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
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
    )
}
