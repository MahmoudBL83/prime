import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Create a new version of a lesson
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { lessonId, changes, versionNote } = body

        if (!lessonId || !changes) {
            return NextResponse.json(
                { error: 'Lesson ID and changes are required' },
                { status: 400 }
            )
        }

        // Get current lesson
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: {
                    creatorId: creator.id
                }
            }
        })

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found or access denied' },
                { status: 404 }
            )
        }

        // Get current version number
        const latestVersion = await prisma.lessonVersion.findFirst({
            where: { lessonId },
            orderBy: { version: 'desc' }
        })

        const newVersionNumber = (latestVersion?.version || 0) + 1

        // Create version snapshot
        const version = await prisma.lessonVersion.create({
            data: {
                lessonId,
                version: newVersionNumber,
                title: lesson.title,
                titleAr: lesson.titleAr,
                description: lesson.description,
                descriptionAr: lesson.descriptionAr,
                contentType: lesson.contentType,
                videoUrl: lesson.videoUrl,
                documentUrl: lesson.documentUrl,
                duration: lesson.duration,
                transcript: lesson.transcript,
                changes: versionNote || 'Content updated',
                createdBy: session.user.id
            }
        })

        // Update lesson with new content
        await prisma.lesson.update({
            where: { id: lessonId },
            data: changes
        })

        return NextResponse.json({
            success: true,
            message: 'New version created successfully',
            data: {
                versionId: version.id,
                versionNumber: newVersionNumber,
                lessonId: lesson.id
            }
        })
    } catch (error) {
        console.error('Error creating version:', error)
        return NextResponse.json(
            { error: 'Failed to create version' },
            { status: 500 }
        )
    }
}

// GET - Get version history for a lesson
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const lessonId = searchParams.get('lessonId')

        if (!lessonId) {
            return NextResponse.json(
                { error: 'Lesson ID is required' },
                { status: 400 }
            )
        }

        // Verify ownership
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                course: {
                    creatorId: creator.id
                }
            },
            select: {
                id: true,
                title: true,
                updatedAt: true
            }
        })

        if (!lesson) {
            return NextResponse.json(
                { error: 'Lesson not found or access denied' },
                { status: 404 }
            )
        }

        // Get all versions
        const versions = await prisma.lessonVersion.findMany({
            where: { lessonId },
            orderBy: { version: 'desc' },
            include: {
                creator: {
                    select: {
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                lesson: {
                    id: lesson.id,
                    title: lesson.title,
                    lastUpdated: lesson.updatedAt
                },
                versions: versions.map(v => ({
                    id: v.id,
                    version: v.version,
                    title: v.title,
                    changes: v.changes,
                    createdAt: v.createdAt,
                    createdBy: v.creator?.user?.name || 'Unknown'
                })),
                totalVersions: versions.length
            }
        })
    } catch (error) {
        console.error('Error fetching versions:', error)
        return NextResponse.json(
            { error: 'Failed to fetch versions' },
            { status: 500 }
        )
    }
}

// PUT - Restore a specific version
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { versionId } = body

        if (!versionId) {
            return NextResponse.json(
                { error: 'Version ID is required' },
                { status: 400 }
            )
        }

        // Get version
        const version = await prisma.lessonVersion.findUnique({
            where: { id: versionId },
            include: {
                lesson: {
                    include: {
                        course: true
                    }
                }
            }
        })

        if (!version || version.lesson.course.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Version not found or access denied' },
                { status: 404 }
            )
        }

        // Create a new version snapshot of current state before restoring
        const latestVersion = await prisma.lessonVersion.findFirst({
            where: { lessonId: version.lessonId },
            orderBy: { version: 'desc' }
        })

        const newVersionNumber = (latestVersion?.version || 0) + 1

        await prisma.lessonVersion.create({
            data: {
                lessonId: version.lessonId,
                version: newVersionNumber,
                title: version.lesson.title,
                titleAr: version.lesson.titleAr,
                description: version.lesson.description,
                descriptionAr: version.lesson.descriptionAr,
                contentType: version.lesson.contentType,
                videoUrl: version.lesson.videoUrl,
                documentUrl: version.lesson.documentUrl,
                duration: version.lesson.duration,
                transcript: version.lesson.transcript,
                changes: `Restored from version ${version.version}`,
                createdBy: session.user.id
            }
        })

        // Restore lesson to version state
        await prisma.lesson.update({
            where: { id: version.lessonId },
            data: {
                title: version.title,
                titleAr: version.titleAr,
                description: version.description,
                descriptionAr: version.descriptionAr,
                contentType: version.contentType,
                videoUrl: version.videoUrl,
                documentUrl: version.documentUrl,
                duration: version.duration,
                transcript: version.transcript
            }
        })

        return NextResponse.json({
            success: true,
            message: `Lesson restored to version ${version.version}`,
            data: {
                lessonId: version.lessonId,
                restoredVersion: version.version,
                newVersion: newVersionNumber
            }
        })
    } catch (error) {
        console.error('Error restoring version:', error)
        return NextResponse.json(
            { error: 'Failed to restore version' },
            { status: 500 }
        )
    }
}

// DELETE - Delete a version (keep at least one)
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        const { searchParams } = new URL(request.url)
        const versionId = searchParams.get('versionId')

        if (!versionId) {
            return NextResponse.json(
                { error: 'Version ID is required' },
                { status: 400 }
            )
        }

        // Get version
        const version = await prisma.lessonVersion.findUnique({
            where: { id: versionId },
            include: {
                lesson: {
                    include: {
                        course: true
                    }
                }
            }
        })

        if (!version || version.lesson.course.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Version not found or access denied' },
                { status: 404 }
            )
        }

        // Check if this is the only version
        const versionCount = await prisma.lessonVersion.count({
            where: { lessonId: version.lessonId }
        })

        if (versionCount <= 1) {
            return NextResponse.json(
                { error: 'Cannot delete the only version' },
                { status: 400 }
            )
        }

        // Delete version
        await prisma.lessonVersion.delete({
            where: { id: versionId }
        })

        return NextResponse.json({
            success: true,
            message: 'Version deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting version:', error)
        return NextResponse.json(
            { error: 'Failed to delete version' },
            { status: 500 }
        )
    }
}
