import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile } from 'fs/promises'
import { join } from 'path'

/**
 * GET /api/creator/courses/[id]
 * Get a single course
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId } = await params

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Get the course
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        // Verify ownership
        if (course.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        return NextResponse.json({
            success: true,
            course
        })

    } catch (error) {
        console.error('Failed to fetch course:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/creator/courses/[id]
 * Update a course
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId } = await params

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Verify course belongs to creator
        const existingCourse = await prisma.course.findUnique({
            where: { id: courseId }
        })

        if (!existingCourse) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        if (existingCourse.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        const formData = await request.formData()
        const title = formData.get('title') as string
        const titleAr = formData.get('titleAr') as string
        const description = formData.get('description') as string
        const descriptionAr = formData.get('descriptionAr') as string
        const category = formData.get('category') as string
        const skillLevel = formData.get('skillLevel') as string
        const duration = parseInt(formData.get('duration') as string || '0')
        const language = formData.get('language') as string
        const contentCategory = formData.get('contentCategory') as string
        const price = parseFloat(formData.get('price') as string)
        const thumbnail = formData.get('thumbnail') as File | null

        // Handle thumbnail upload if new one provided
        let thumbnailUrl = existingCourse.thumbnail
        if (thumbnail && thumbnail.size > 0) {
            const bytes = await thumbnail.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            const timestamp = Date.now()
            const filename = `${timestamp}-${thumbnail.name.replace(/\s/g, '-')}`
            const uploadDir = join(process.cwd(), 'public', 'uploads', 'courses')
            const filepath = join(uploadDir, filename)
            
            try {
                const { mkdir } = await import('fs/promises')
                await mkdir(uploadDir, { recursive: true })
                await writeFile(filepath, buffer)
                thumbnailUrl = `/uploads/courses/${filename}`
            } catch (error) {
                console.error('Failed to save thumbnail:', error)
            }
        }

        // Update course
        const updatedCourse = await prisma.course.update({
            where: { id: courseId },
            data: {
                title,
                titleAr: titleAr || title,
                description,
                descriptionAr: descriptionAr || description,
                category,
                skillLevel,
                duration,
                language,
                contentCategory: contentCategory as any,
                price,
                ...(thumbnailUrl && { thumbnail: thumbnailUrl })
            }
        })

        return NextResponse.json({
            success: true,
            course: updatedCourse,
            message: 'Course updated successfully'
        })

    } catch (error) {
        console.error('Failed to update course:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/creator/courses/[id]
 * Delete a course
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { id: courseId } = await params

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Verify course belongs to creator
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                _count: {
                    select: {
                        enrollments: true
                    }
                }
            }
        })

        if (!course) {
            return NextResponse.json(
                { error: 'Course not found' },
                { status: 404 }
            )
        }

        if (course.creatorId !== creator.id) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }

        // Check if course has enrollments
        if (course._count.enrollments > 0) {
            return NextResponse.json(
                { error: 'Cannot delete course with active enrollments. Archive it instead.' },
                { status: 400 }
            )
        }

        // Delete the course and all related data in a transaction
        await prisma.$transaction(async (tx) => {
            // Delete course interactions (likes, my list)
            await tx.courseInteraction.deleteMany({
                where: { courseId }
            })

            // Delete lessons and their related data
            await tx.lesson.deleteMany({
                where: { courseId }
            })

            // Delete quizzes
            await tx.quiz.deleteMany({
                where: { courseId }
            })

            // Delete assignments
            await tx.assignment.deleteMany({
                where: { courseId }
            })

            // Delete reviews
            await tx.review.deleteMany({
                where: { courseId }
            })

            // Delete course reviews (admin reviews)
            await tx.courseReview.deleteMany({
                where: { courseId }
            })

            // Delete video assets
            await tx.videoAsset.deleteMany({
                where: { courseId }
            })

            // Delete certificates
            await tx.certificate.deleteMany({
                where: { courseId }
            })

            // Delete leaderboard entries
            await tx.leaderboardEntry.deleteMany({
                where: { courseId }
            })

            // Delete achievements (course-specific)
            await tx.achievement.deleteMany({
                where: { courseId }
            })

            // Delete rewards (course-specific)
            await tx.reward.deleteMany({
                where: { courseId }
            })

            // Delete signature course proposals
            await tx.signatureCourseProposal.deleteMany({
                where: { courseId }
            })

            // Delete signature course workbooks
            await tx.signatureCourseWorkbook.deleteMany({
                where: { courseId }
            })

            // Delete signature course cohorts
            await tx.signatureCourseCohort.deleteMany({
                where: { courseId }
            })

            // Delete expert Q&A sessions
            await tx.expertQASession.deleteMany({
                where: { courseId }
            })

            // Delete capstone projects
            await tx.capstoneProject.deleteMany({
                where: { courseId }
            })

            // Finally, delete the course itself
            await tx.course.delete({
                where: { id: courseId }
            })
        })

        return NextResponse.json({
            success: true,
            message: 'Course deleted successfully'
        })

    } catch (error) {
        console.error('Failed to delete course:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
