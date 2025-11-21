import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Get video assets - supports both creator and public views
 * GET /api/videos
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - status: Filter by status (UPLOADING, PROCESSING, READY, FAILED)
 * - courseId: Filter by course
 * - lessonId: Filter by lesson
 * - search: Search in title/description (multi-language)
 * - sortBy: Sort field (createdAt, views, duration, title)
 * - sortOrder: Sort direction (asc, desc)
 * - creatorOnly: Show only creator's videos (requires auth)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const courseId = searchParams.get('courseId');
        const lessonId = searchParams.get('lessonId');
        const search = searchParams.get('search');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const creatorOnly = searchParams.get('creatorOnly') === 'true';

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        // Filter by creator if creatorOnly=true
        if (creatorOnly) {
            if (!session?.user?.id) {
                return NextResponse.json(
                    { error: 'Authentication required for creatorOnly filter' },
                    { status: 401 }
                );
            }

            const creator = await prisma.creator.findUnique({
                where: { userId: session.user.id },
                select: { id: true }
            });

            if (!creator) {
                return NextResponse.json({
                    videos: [],
                    pagination: { page, limit, total: 0, totalPages: 0 }
                });
            }

            where.creatorId = creator.id;
        } else {
            // Public videos only (unless creator viewing their own)
            where.status = 'READY';
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        // Filter by course
        if (courseId) {
            where.courseId = courseId;
        }

        // Filter by lesson
        if (lessonId) {
            where.lessonId = lessonId;
        }

        // Search in title and description
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { titleAr: { contains: search, mode: 'insensitive' } },
                { titleDe: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { descriptionAr: { contains: search, mode: 'insensitive' } },
                { descriptionDe: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Build orderBy
        const orderBy: any = {};
        if (sortBy === 'title') {
            orderBy.title = sortOrder;
        } else if (sortBy === 'duration') {
            orderBy.duration = sortOrder;
        } else {
            orderBy.createdAt = sortOrder;
        }

        // Get videos with pagination
        const [videos, total] = await Promise.all([
            prisma.videoAsset.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    title: true,
                    titleAr: true,
                    titleDe: true,
                    description: true,
                    descriptionAr: true,
                    descriptionDe: true,
                    thumbnailUrl: true,
                    duration: true,
                    maxResolution: true,
                    fileSize: true,
                    status: true,
                    originalFilename: true,
                    aspectRatio: true,
                    errors: true,
                    muxPlaybackId: true,
                    createdAt: true,
                    updatedAt: true,
                    creator: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    name: true,
                                    profileImage: true
                                }
                            }
                        }
                    },
                    course: {
                        select: {
                            id: true,
                            title: true,
                            titleAr: true
                        }
                    },
                    lesson: {
                        select: {
                            id: true,
                            title: true,
                            titleAr: true
                        }
                    },
                    qualities: {
                        select: {
                            quality: true,
                            fileSize: true
                        },
                        orderBy: {
                            bitrate: 'desc'
                        }
                    },
                    _count: {
                        select: {
                            comments: true,
                            reactions: true,
                            watchHistory: true,
                            progress: true,
                            analytics: true
                        }
                    }
                }
            }),
            prisma.videoAsset.count({ where })
        ]);

        // Format response with engagement metrics
        const formattedVideos = videos.map((video: any) => {
            const baseVideo = {
                id: video.id,
                title: video.title,
                titleAr: video.titleAr,
                titleDe: video.titleDe,
                description: video.description,
                descriptionAr: video.descriptionAr,
                descriptionDe: video.descriptionDe,
                thumbnailUrl: video.thumbnailUrl,
                duration: video.duration,
                maxResolution: video.maxResolution,
                fileSize: video.fileSize,
                status: video.status,
                originalFilename: video.originalFilename,
                aspectRatio: video.aspectRatio,
                muxPlaybackId: video.muxPlaybackId,
                creator: {
                    id: video.creator.id,
                    name: video.creator.user.name,
                    avatarUrl: video.creator.user.profileImage
                },
                course: video.course,
                lesson: video.lesson,
                qualities: video.qualities,
                engagement: {
                    commentsCount: video._count.comments,
                    reactionsCount: video._count.reactions,
                    viewsCount: video._count.watchHistory,
                    watchCount: video._count.watchHistory,
                    progressCount: video._count.progress,
                    analyticsCount: video._count.analytics
                },
                createdAt: video.createdAt,
                updatedAt: video.updatedAt,
                errors: video.errors
            };

            // Add upload/processing progress if applicable
            if (video.status === 'UPLOADING' || video.status === 'PROCESSING') {
                return {
                    ...baseVideo,
                    progress: video.status === 'UPLOADING' ? {
                        type: 'upload',
                        note: 'Parse from metadata field'
                    } : {
                        type: 'processing',
                        note: 'Parse from metadata field'
                    }
                };
            }

            return baseVideo;
        });

        return NextResponse.json({
            videos: formattedVideos,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            filters: {
                status,
                courseId,
                lessonId,
                search,
                sortBy,
                sortOrder,
                creatorOnly
            }
        });

    } catch (error) {
        console.error('Failed to fetch videos:', error);
        return NextResponse.json(
            { error: 'Failed to fetch videos' },
            { status: 500 }
        );
    }
}
