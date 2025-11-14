import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const analyticsSchema = z.object({
    videoAssetId: z.string().min(1, 'معرف الفيديو مطلوب'),
    event: z.string().min(1, 'نوع الحدث مطلوب'),
    currentTime: z.number().min(0).optional(),
    duration: z.number().positive().optional(),
    quality: z.string().optional(),
    playbackRate: z.number().positive().optional(),
    volume: z.number().min(0).max(1).optional(),
    buffering: z.boolean().optional(),
    sessionId: z.string().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Track video analytics events
 * POST /api/videos/analytics
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول لتتبع الأحداث' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = analyticsSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'بيانات غير صحيحة', details: validation.error.issues },
                { status: 400 }
            );
        }

        const {
            videoAssetId,
            event,
            currentTime,
            duration,
            quality,
            playbackRate,
            volume,
            buffering = false,
            sessionId,
            metadata,
        } = validation.data;

        // Get user agent and IP from headers
        const userAgent = request.headers.get('user-agent') || '';
        const forwarded = request.headers.get('x-forwarded-for');
        const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || '';

        // Determine connection type from user agent (simple heuristic)
        const connectionType = userAgent.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';

        // Generate session ID if not provided
        const eventSessionId = sessionId || `${session.user.id}-${Date.now()}`;

        // Create analytics record
        const analyticsRecord = await prisma.videoAnalytics.create({
            data: {
                videoAssetId,
                userId: session.user.id,
                sessionId: eventSessionId,
                event,
                currentTime,
                duration,
                quality,
                buffering,
                userAgent,
                ipAddress,
                connectionType,
                playbackRate,
                volume,
                metadata,
            },
        });

        return NextResponse.json({
            success: true,
            analyticsId: analyticsRecord.id,
            message: 'تم تسجيل الحدث بنجاح',
        });

    } catch (error) {
        console.error('Failed to track video analytics:', error);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء تسجيل الحدث' },
            { status: 500 }
        );
    }
}

/**
 * Get video analytics data (for creators and admins)
 * GET /api/videos/analytics?videoAssetId=xxx&timeframe=24h
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'يجب تسجيل الدخول' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const videoAssetId = searchParams.get('videoAssetId');
        const timeframe = searchParams.get('timeframe') || '7d';
        const event = searchParams.get('event');

        if (!videoAssetId) {
            return NextResponse.json(
                { error: 'معرف الفيديو مطلوب' },
                { status: 400 }
            );
        }

        // Check authorization - user must be creator of video or admin
        const videoAsset = await prisma.videoAsset.findUnique({
            where: { id: videoAssetId },
            include: {
                creator: {
                    select: { userId: true },
                },
            },
        });

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'الفيديو غير موجود' },
                { status: 404 }
            );
        }

        if (
            session.user.role !== 'ADMIN' &&
            videoAsset.creator.userId !== session.user.id
        ) {
            return NextResponse.json(
                { error: 'ليس لديك صلاحية لعرض إحصائيات هذا الفيديو' },
                { status: 403 }
            );
        }

        // Calculate time range
        const now = new Date();
        let startDate: Date;

        switch (timeframe) {
            case '24h':
                startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Build where clause
        const where: any = {
            videoAssetId,
            timestamp: {
                gte: startDate,
                lte: now,
            },
        };

        if (event) {
            where.event = event;
        }

        // Get analytics data
        const [analytics, eventCounts, qualityStats, deviceStats] = await Promise.all([
            // Raw analytics data
            prisma.videoAnalytics.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: 1000, // Limit to prevent huge responses
            }),

            // Event counts
            prisma.videoAnalytics.groupBy({
                by: ['event'],
                where,
                _count: {
                    id: true,
                },
            }),

            // Quality distribution
            prisma.videoAnalytics.groupBy({
                by: ['quality'],
                where: {
                    ...where,
                    quality: { not: null },
                },
                _count: {
                    id: true,
                },
            }),

            // Device/connection stats
            prisma.videoAnalytics.groupBy({
                by: ['connectionType'],
                where,
                _count: {
                    id: true,
                },
            }),
        ]);

        // Calculate summary statistics
        const totalViews = eventCounts.find(e => e.event === 'play')?._count.id || 0;
        const totalCompletes = eventCounts.find(e => e.event === 'complete')?._count.id || 0;
        const completionRate = totalViews > 0 ? (totalCompletes / totalViews) * 100 : 0;

        // Get unique viewers
        const uniqueViewers = await prisma.videoAnalytics.findMany({
            where: {
                ...where,
                event: 'play',
            },
            distinct: ['userId'],
            select: { userId: true },
        });

        return NextResponse.json({
            summary: {
                totalViews,
                totalCompletes,
                completionRate: Math.round(completionRate * 100) / 100,
                uniqueViewers: uniqueViewers.length,
                timeframe,
                startDate,
                endDate: now,
            },
            eventCounts: eventCounts.map(e => ({
                event: e.event,
                count: e._count.id,
            })),
            qualityStats: qualityStats.map(q => ({
                quality: q.quality,
                count: q._count.id,
            })),
            deviceStats: deviceStats.map(d => ({
                type: d.connectionType,
                count: d._count.id,
            })),
            recentEvents: analytics.slice(0, 50), // Return recent 50 events
        });

    } catch (error) {
        console.error('Failed to get video analytics:', error);
        return NextResponse.json(
            { error: 'فشل في جلب الإحصائيات' },
            { status: 500 }
        );
    }
}
