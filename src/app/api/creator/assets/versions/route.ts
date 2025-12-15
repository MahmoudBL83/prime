import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

/**
 * Asset Versioning API for Creators
 * Track and manage versions of course assets (videos, documents, etc.)
 * GET/POST /api/creator/assets/versions
 */

const createVersionSchema = z.object({
    assetId: z.string(),
    version: z.string(),
    url: z.string().url(),
    notes: z.string().optional(),
    isActive: z.boolean().default(false)
})

// GET: List asset versions for a lesson or asset
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const lessonId = searchParams.get('lessonId')
        const assetId = searchParams.get('assetId')

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        // Get asset versions from lesson resources
        if (lessonId) {
            const lesson = await prisma.lesson.findFirst({
                where: {
                    id: lessonId,
                    course: { creatorId: creator.id }
                },
                include: {
                    course: { select: { id: true, title: true } }
                }
            })

            if (!lesson) {
                return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
            }

            const resources = (lesson.resources as any) || {}
            const versions = resources.videoVersions || []

            return NextResponse.json({
                lessonId,
                lessonTitle: lesson.title,
                courseId: lesson.course.id,
                courseTitle: lesson.course.title,
                currentVideoUrl: lesson.videoUrl,
                versions: versions.map((v: any, index: number) => ({
                    ...v,
                    isActive: v.url === lesson.videoUrl,
                    versionNumber: versions.length - index
                }))
            })
        }

        // Get all versioned assets for creator
        const lessons = await prisma.lesson.findMany({
            where: {
                course: { creatorId: creator.id },
                resources: { not: undefined }
            },
            select: {
                id: true,
                title: true,
                videoUrl: true,
                resources: true,
                course: { select: { id: true, title: true } }
            }
        })

        const assetsWithVersions = lessons
            .filter(l => {
                const resources = l.resources as any
                return resources?.videoVersions?.length > 0
            })
            .map(l => ({
                lessonId: l.id,
                lessonTitle: l.title,
                courseId: l.course.id,
                courseTitle: l.course.title,
                versionCount: ((l.resources as any)?.videoVersions || []).length
            }))

        return NextResponse.json({
            assets: assetsWithVersions,
            totalVersionedAssets: assetsWithVersions.length
        })
    } catch (error) {
        console.error('Asset versions GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch asset versions' },
            { status: 500 }
        )
    }
}

// POST: Create a new asset version
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { lessonId, url, notes, setAsActive } = body

        if (!lessonId || !url) {
            return NextResponse.json(
                { error: 'lessonId and url are required' },
                { status: 400 }
            )
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: { creatorId: creator.id }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        // Get current versions
        const resources = (lesson.resources as any) || {}
        const versions = resources.videoVersions || []

        // Add current video as a version if not already versioned
        if (versions.length === 0 && lesson.videoUrl) {
            versions.push({
                id: `v-${Date.now()}-0`,
                version: 'v1.0',
                url: lesson.videoUrl,
                notes: 'Original version',
                createdAt: lesson.createdAt.toISOString(),
                createdBy: session.user.id
            })
        }

        // Add new version
        const newVersion = {
            id: `v-${Date.now()}`,
            version: `v${versions.length + 1}.0`,
            url,
            notes: notes || '',
            createdAt: new Date().toISOString(),
            createdBy: session.user.id
        }

        versions.unshift(newVersion) // Add to beginning (newest first)

        // Update resources
        resources.videoVersions = versions

        // Update lesson
        const updateData: any = { resources }
        if (setAsActive) {
            updateData.videoUrl = url
        }

        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: updateData
        })

        return NextResponse.json({
            version: newVersion,
            totalVersions: versions.length,
            isActive: setAsActive,
            message: 'Version created successfully'
        }, { status: 201 })
    } catch (error) {
        console.error('Asset versions POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create asset version' },
            { status: 500 }
        )
    }
}

// PATCH: Activate a specific version or update version notes
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id || session.user.role !== 'CREATOR') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { lessonId, versionId, action, notes } = body

        if (!lessonId || !versionId || !action) {
            return NextResponse.json(
                { error: 'lessonId, versionId, and action are required' },
                { status: 400 }
            )
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
        }

        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: { creatorId: creator.id }
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
        }

        const resources = (lesson.resources as any) || {}
        const versions = resources.videoVersions || []

        const versionIndex = versions.findIndex((v: any) => v.id === versionId)
        if (versionIndex === -1) {
            return NextResponse.json({ error: 'Version not found' }, { status: 404 })
        }

        switch (action) {
            case 'activate': {
                // Set this version as active
                const version = versions[versionIndex]
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { videoUrl: version.url }
                })
                return NextResponse.json({
                    message: `Version ${version.version} is now active`,
                    activeUrl: version.url
                })
            }

            case 'update_notes': {
                versions[versionIndex].notes = notes
                resources.videoVersions = versions
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { resources }
                })
                return NextResponse.json({
                    message: 'Version notes updated'
                })
            }

            case 'delete': {
                // Don't allow deleting active version
                if (versions[versionIndex].url === lesson.videoUrl) {
                    return NextResponse.json(
                        { error: 'Cannot delete active version' },
                        { status: 400 }
                    )
                }
                versions.splice(versionIndex, 1)
                resources.videoVersions = versions
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { resources }
                })
                return NextResponse.json({
                    message: 'Version deleted'
                })
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }
    } catch (error) {
        console.error('Asset versions PATCH error:', error)
        return NextResponse.json(
            { error: 'Failed to update asset version' },
            { status: 500 }
        )
    }
}
