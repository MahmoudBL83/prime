import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * Video Security API
 * Generates secure, time-limited video URLs with access control
 * GET /api/videos/secure-url
 */

// Secret key for signing URLs (in production, use environment variable)
const VIDEO_SECRET = process.env.VIDEO_SIGNING_SECRET || 'your-secret-key-change-in-production'

// URL expiration time in seconds
const URL_EXPIRY = 3600 // 1 hour

interface SecureVideoOptions {
    videoId: string
    userId: string
    lessonId?: string
    watermarkText?: string
    allowDownload?: boolean
    maxViews?: number
}

function generateSignedUrl(videoUrl: string, options: SecureVideoOptions): string {
    const timestamp = Math.floor(Date.now() / 1000)
    const expiresAt = timestamp + URL_EXPIRY

    // Create signature payload
    const payload = {
        url: videoUrl,
        userId: options.userId,
        videoId: options.videoId,
        exp: expiresAt,
        wm: options.watermarkText ? 1 : 0,
        dl: options.allowDownload ? 1 : 0
    }

    // Generate signature
    const signature = crypto
        .createHmac('sha256', VIDEO_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex')

    // Encode parameters
    const params = new URLSearchParams({
        sig: signature,
        exp: expiresAt.toString(),
        uid: options.userId,
        vid: options.videoId
    })

    // Return signed URL
    return `${videoUrl}?${params.toString()}`
}

function verifySignature(url: string, signature: string, expiresAt: number, userId: string, videoId: string): boolean {
    // Check expiration
    if (Date.now() / 1000 > expiresAt) {
        return false
    }

    // Recreate signature
    const payload = {
        url,
        userId,
        videoId,
        exp: expiresAt
    }

    const expectedSignature = crypto
        .createHmac('sha256', VIDEO_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex')

    return signature === expectedSignature
}

// GET: Generate secure video URL
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const lessonId = searchParams.get('lessonId')

        if (!lessonId) {
            return NextResponse.json(
                { error: 'lessonId is required' },
                { status: 400 }
            )
        }

        // Get lesson with course info
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                course: {
                    include: {
                        enrollments: {
                            where: { userId: session.user.id }
                        },
                        creator: true
                    }
                }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        // Check if user has access
        const isEnrolled = lesson.course.enrollments.length > 0
        const isCreator = lesson.course.creator.userId === session.user.id
        const isAdmin = session.user.role === 'ADMIN'

        if (!isEnrolled && !isCreator && !isAdmin) {
            return NextResponse.json(
                { error: 'You do not have access to this content' },
                { status: 403 }
            )
        }

        // Get user info for watermark
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, name: true }
        })

        // Generate watermark text (email + timestamp)
        const watermarkText = `${user?.email?.split('@')[0]} • ${new Date().toLocaleDateString()}`

        // Generate secure URL
        const secureUrl = generateSignedUrl(lesson.videoUrl, {
            videoId: lesson.id,
            userId: session.user.id,
            lessonId: lesson.id,
            watermarkText,
            allowDownload: false
        })

        // Note: VideoAnalytics requires videoAssetId which we don't have for lesson videos
        // Analytics logging skipped for direct lesson video access

        return NextResponse.json({
            url: secureUrl,
            expiresIn: URL_EXPIRY,
            watermark: watermarkText,
            securityFeatures: {
                signedUrl: true,
                watermark: true,
                downloadBlocked: true,
                screenshotProtection: true,
                devToolsDetection: true
            }
        })
    } catch (error) {
        console.error('Secure URL error:', error)
        return NextResponse.json(
            { error: 'Failed to generate secure URL' },
            { status: 500 }
        )
    }
}

// POST: Log security violations
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { lessonId, violationType, details } = body

        // Log the security violation - using BEHAVIOR_FLAG as closest match
        await prisma.moderationEvent.create({
            data: {
                userId: session.user.id,
                eventType: 'BEHAVIOR_FLAG',
                severity: violationType === 'screenshot' ? 'MEDIUM' : 'LOW',
                status: 'OPEN',
                reason: `Video security violation (DRM): ${violationType}`,
                source: 'VIDEO_PLAYER',
                metadata: {
                    lessonId,
                    violationType,
                    details,
                    userAgent: request.headers.get('user-agent'),
                    timestamp: new Date().toISOString()
                }
            }
        })

        return NextResponse.json({
            logged: true,
            message: 'Security event recorded'
        })
    } catch (error) {
        console.error('Security log error:', error)
        return NextResponse.json(
            { error: 'Failed to log security event' },
            { status: 500 }
        )
    }
}
