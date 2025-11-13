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
            // Digital resources from posts with downloadable content
            prisma.post.findMany({
                where: {
                    channel: { creatorId },
                    OR: [
                        { mediaUrls: { not: null } },
                        { attachments: { not: null } }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    mediaUrls: true,
                    attachments: true,
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
                    instructorId: creatorId
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    thumbnail: true,
                    level: true,
                    duration: true,
                    modules: {
                        select: {
                            id: true,
                            title: true,
                            lessons: {
                                select: {
                                    id: true,
                                    title: true,
                                    type: true,
                                    videoUrl: true,
                                    content: true,
                                    resources: true
                                }
                            }
                        }
                    }
                },
                take: 5
            })
        ])

        // Process resources
        const resources = {
            digitalResources: digitalResources.map(post => ({
                id: post.id,
                title: post.title,
                description: post.content?.substring(0, 200) + '...',
                type: 'post',
                mediaUrls: post.mediaUrls ? JSON.parse(post.mediaUrls as string) : [],
                attachments: post.attachments ? JSON.parse(post.attachments as string) : [],
                createdAt: post.createdAt,
                tier: post.tier
            })),
            courseMaterials: courseMaterials.map(course => ({
                id: course.id,
                title: course.title,
                description: course.description,
                type: 'course',
                thumbnail: course.thumbnail,
                level: course.level,
                duration: course.duration,
                moduleCount: course.modules?.length || 0,
                lessonCount: course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0
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