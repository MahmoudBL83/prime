import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: creatorId } = await params;

        // Get educational resources for this instructor
        const [digitalResources, courseMaterials] = await Promise.all([
            // Digital resources from channel posts with downloadable content
            prisma.channelPost.findMany({
                where: {
                    channel: { creatorId },
                    OR: [
                        { mediaUrl: { not: null } },
                        { type: { in: ['VIDEO', 'IMAGE', 'DOCUMENT'] } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    mediaUrl: true,
                    type: true,
                    createdAt: true,
                    tier: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: 15
            }),

            // Course materials if the instructor has courses
            prisma.course.findMany({
                where: {
                    creatorId: creatorId
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    thumbnail: true,
                    skillLevel: true,
                    duration: true,
                    lessons: {
                        select: {
                            id: true,
                            title: true,
                            videoUrl: true,
                            resources: true
                        }
                    }
                },
                take: 5
            })
        ])

        // Process resources
        const resources = {
            digitalResources: digitalResources.map((post: any) => ({
                id: post.id,
                title: post.title,
                description: post.content?.substring(0, 200) + '...',
                type: 'post',
                mediaUrl: post.mediaUrl,
                postType: post.type,
                createdAt: post.createdAt,
                tier: post.tier
            })),
            courseMaterials: courseMaterials.map((course: any) => ({
                id: course.id,
                title: course.title,
                description: course.description,
                type: 'course',
                thumbnail: course.thumbnail,
                skillLevel: course.skillLevel,
                duration: course.duration,
                lessonCount: course.lessons?.length || 0
            }))
        }

        return NextResponse.json(resources)
    } catch (error) {
        console.error('Get resources error:', error)
        return NextResponse.json(
            { error: 'Failed to get resources' },
            { status: 500 }
        )
    }
}