import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface Params {
    params: Promise<{
        videoId: string
    }>
}

export async function PUT(request: Request, { params }: Params) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { videoId } = await params
        const body = await request.json()

        // Get creator ID
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        const videoAsset = await prisma.videoAsset.findFirst({
            where: {
                id: videoId,
                creatorId: creator.id
            }
        })

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'Video not found or access denied' },
                { status: 404 }
            )
        }

        // Extract updatable fields
        const {
            title,
            titleAr,
            titleDe,
            description,
            descriptionAr,
            descriptionDe,
            thumbnailUrl,
            courseId,
            lessonId
        } = body

        // Validate course ownership if changing courseId
        if (courseId && courseId !== videoAsset.courseId) {
            const course = await prisma.course.findFirst({
                where: {
                    id: courseId,
                    creatorId: creator.id
                }
            })

            if (!course) {
                return NextResponse.json(
                    { error: 'Course not found or access denied' },
                    { status: 404 }
                )
            }
        }

        // Validate lesson belongs to course
        if (lessonId) {
            const lesson = await prisma.lesson.findFirst({
                where: {
                    id: lessonId,
                    courseId: courseId || videoAsset.courseId || undefined
                }
            })

            if (!lesson) {
                return NextResponse.json(
                    { error: 'Lesson not found or does not belong to course' },
                    { status: 404 }
                )
            }
        }

        // Update video asset
        const updatedAsset = await prisma.videoAsset.update({
            where: { id: videoId },
            data: {
                ...(title !== undefined && { title }),
                ...(titleAr !== undefined && { titleAr }),
                ...(titleDe !== undefined && { titleDe }),
                ...(description !== undefined && { description }),
                ...(descriptionAr !== undefined && { descriptionAr }),
                ...(descriptionDe !== undefined && { descriptionDe }),
                ...(thumbnailUrl !== undefined && { thumbnailUrl }),
                ...(courseId !== undefined && { courseId }),
                ...(lessonId !== undefined && { lessonId })
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Video updated successfully',
            video: {
                id: updatedAsset.id,
                title: updatedAsset.title,
                titleAr: updatedAsset.titleAr,
                description: updatedAsset.description,
                descriptionAr: updatedAsset.descriptionAr,
                thumbnailUrl: updatedAsset.thumbnailUrl,
                courseId: updatedAsset.courseId,
                lessonId: updatedAsset.lessonId,
                updatedAt: updatedAsset.updatedAt
            }
        })
    } catch (error) {
        console.error('Error updating video:', error)
        return NextResponse.json(
            { error: 'Failed to update video' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request, { params }: Params) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { videoId } = await params

        // Get creator ID
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            select: { id: true }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        const videoAsset = await prisma.videoAsset.findFirst({
            where: {
                id: videoId,
                creatorId: creator.id
            }
        })

        if (!videoAsset) {
            return NextResponse.json(
                { error: 'Video not found or access denied' },
                { status: 404 }
            )
        }

        // Delete video and all related data (cascade deletes handled by Prisma)
        await prisma.videoAsset.delete({
            where: { id: videoId }
        })

        // TODO: Delete actual video files from storage
        // - Delete video file
        // - Delete quality variants
        // - Delete thumbnails
        // - Delete subtitle files

        return NextResponse.json({
            success: true,
            message: 'Video deleted successfully'
        })
    } catch (error) {
        console.error('Error deleting video:', error)
        return NextResponse.json(
            { error: 'Failed to delete video' },
            { status: 500 }
        )
    }
}
