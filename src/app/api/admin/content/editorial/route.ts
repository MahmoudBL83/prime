import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const section = searchParams.get('section');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');

        // Build filter
        const where: Record<string, unknown> = {};
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }
        if (section && section !== 'all') {
            where.featuredSection = section.toUpperCase();
        }

        // Fetch featured content with stats
        const [
            featuredContent,
            total,
            nominatedCount,
            reviewingCount,
            approvedCount,
            scheduledCount,
            publishedCount,
            rejectedCount
        ] = await Promise.all([
            prisma.featuredContent.findMany({
                where,
                take: pageSize,
                skip: (page - 1) * pageSize,
                orderBy: { nominatedAt: 'desc' },
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            category: true,
                            price: true,
                            rating: true
                        }
                    },
                    nominator: {
                        select: { id: true, name: true }
                    },
                    reviewer: {
                        select: { id: true, name: true }
                    }
                }
            }),
            prisma.featuredContent.count({ where }),
            prisma.featuredContent.count({ where: { status: 'NOMINATED' } }),
            prisma.featuredContent.count({ where: { status: 'UNDER_REVIEW' } }),
            prisma.featuredContent.count({ where: { status: 'APPROVED' } }),
            prisma.featuredContent.count({ where: { status: 'SCHEDULED' } }),
            prisma.featuredContent.count({ where: { status: 'PUBLISHED' } }),
            prisma.featuredContent.count({ where: { status: 'REJECTED' } })
        ]);

        // Calculate average conversion lift from published content
        const publishedWithPerformance = await prisma.featuredContent.findMany({
            where: { status: 'PUBLISHED' },
            select: { performanceData: true }
        });
        
        let totalConversionLift = 0;
        let count = 0;
        publishedWithPerformance.forEach(c => {
            const perf = c.performanceData as { conversionLift?: number } | null;
            if (perf?.conversionLift) {
                totalConversionLift += perf.conversionLift;
                count++;
            }
        });
        const avgConversionLift = count > 0 ? Math.round(totalConversionLift / count) : 0;

        // Format content
        const formattedContent = featuredContent.map((content: any) => ({
            id: content.id,
            courseId: content.course?.id,
            courseTitle: content.course?.title,
            category: content.course?.category || 'General',
            price: content.course?.price,
            rating: content.course?.rating,
            nominatedBy: content.nominator?.name || 'System',
            nominatedAt: content.nominatedAt?.toISOString(),
            status: content.status.toLowerCase(),
            featuredSection: content.featuredSection?.toLowerCase() || null,
            scheduledDate: content.scheduledDate?.toISOString() || null,
            publishedDate: content.publishedDate?.toISOString() || null,
            // quality checks are not modeled in the DB; return safe defaults
            qualityChecks: (content.performanceData as any)?.qualityChecks || {
                productionQuality: true,
                learningOutcomes: true,
                marketDemand: true,
                uniqueness: true
            },
            curatorNotes: content.curatorNotes,
            reviewedBy: content.reviewer ? {
                id: content.reviewer.id,
                name: content.reviewer.name
            } : null,
            reviewedAt: content.reviewedAt?.toISOString() || null,
            performanceData: content.performanceData || null,
            updatedAt: content.reviewedAt?.toISOString() || content.nominatedAt?.toISOString() || null
        }));

        return NextResponse.json({
            content: formattedContent,
            stats: {
                totalNominated: nominatedCount,
                underReview: reviewingCount,
                approved: approvedCount,
                scheduled: scheduledCount,
                published: publishedCount,
                rejected: rejectedCount,
                avgConversionLift
            },
            meta: {
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (error) {
        console.error('Editorial API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch editorial content' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, contentId, courseId, ...data } = body;

        if (action === 'nominate') {
            // Check if course already has a featured content entry
            const existing = await prisma.featuredContent.findFirst({
                where: { courseId }
            });

            if (existing) {
                return NextResponse.json({ 
                    error: 'Course already in editorial pipeline' 
                }, { status: 400 });
            }

            const newContent = await prisma.featuredContent.create({
                data: {
                    courseId,
                    nominatedBy: session.user.id,
                    status: 'NOMINATED',
                    curatorNotes: data.notes,
                    performanceData: data.performanceData || null
                }
            });

            return NextResponse.json({ success: true, content: newContent });
        }

        if (action === 'review') {
            const updated = await prisma.featuredContent.update({
                where: { id: contentId },
                data: {
                    status: 'UNDER_REVIEW',
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            });

            return NextResponse.json({ success: true, content: updated });
        }

        if (action === 'approve') {
            const updated = await prisma.featuredContent.update({
                where: { id: contentId },
                data: {
                    status: 'APPROVED',
                    curatorNotes: data.notes,
                    performanceData: data.performanceData || null,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            });

            return NextResponse.json({ success: true, content: updated });
        }

        if (action === 'reject') {
            const updated = await prisma.featuredContent.update({
                where: { id: contentId },
                data: {
                    status: 'REJECTED',
                    curatorNotes: data.notes,
                    reviewedBy: session.user.id,
                    reviewedAt: new Date()
                }
            });

            return NextResponse.json({ success: true, content: updated });
        }

        if (action === 'schedule') {
            const updated = await prisma.featuredContent.update({
                where: { id: contentId },
                data: {
                    status: 'SCHEDULED',
                    featuredSection: data.section?.toUpperCase(),
                    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
                    curatorNotes: data.notes
                }
            });

            return NextResponse.json({ success: true, content: updated });
        }

        if (action === 'publish') {
            const updated = await prisma.featuredContent.update({
                where: { id: contentId },
                data: {
                    status: 'PUBLISHED',
                    featuredSection: data.section?.toUpperCase(),
                    publishedDate: new Date()
                }
            });

            return NextResponse.json({ success: true, content: updated });
        }

        if (action === 'unpublish') {
            const updated = await prisma.featuredContent.update({
                where: { id: contentId },
                data: {
                    status: 'APPROVED',
                    featuredSection: null,
                    publishedDate: null
                }
            });

            return NextResponse.json({ success: true, content: updated });
        }

        if (action === 'update-performance') {
            const updated = await prisma.featuredContent.update({
                where: { id: contentId },
                data: {
                    performanceData: data.performanceData
                }
            });

            return NextResponse.json({ success: true, content: updated });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Editorial action error:', error);
        return NextResponse.json(
            { error: 'Failed to process editorial action' },
            { status: 500 }
        );
    }
}
