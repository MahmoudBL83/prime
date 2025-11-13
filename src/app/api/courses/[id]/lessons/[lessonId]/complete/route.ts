import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendCourseCompletionEmail } from '@/lib/email'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const courseId = resolvedParams.id
        const lessonId = resolvedParams.lessonId

        // Get user details
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, name: true, locale: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: courseId
                }
            }
        })

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
        }

        // Verify lesson exists in this course
        const lesson = await prisma.lesson.findFirst({
            where: {
                id: lessonId,
                courseId: courseId
            },
            select: {
                id: true,
                title: true,
                titleAr: true,
            }
        })

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found in this course' }, { status: 404 })
        }

        // Create or update lesson progress in LessonProgress table
        const lessonProgress = await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: user.id,
                    lessonId: lessonId
                }
            },
            update: {
                completed: true,
                completedAt: new Date()
            },
            create: {
                userId: user.id,
                lessonId: lessonId,
                completed: true,
                completedAt: new Date()
            }
        })

        // Calculate overall course progress
        const totalLessons = await prisma.lesson.count({
            where: { courseId: courseId }
        })

        const completedLessons = await prisma.lessonProgress.count({
            where: {
                userId: user.id,
                lesson: { courseId: courseId },
                completed: true
            }
        })

        const newProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

        // Check if this is a new completion (reached 100%)
        const isNewlyCompleted = newProgress === 100 && !enrollment.completedAt

        // Update enrollment
        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                id: enrollment.id
            },
            data: {
                progress: newProgress,
                lastAccessedAt: new Date(),
                completedAt: newProgress === 100 ? new Date() : enrollment.completedAt
            }
        })

        let certificate = null

        // If newly completed, generate certificate and send email
        if (isNewlyCompleted) {
            try {
                // Generate certificate
                certificate = await generateCertificate(
                    user.id,
                    courseId,
                    enrollment.id
                )

                // Get course details for email
                const course = await prisma.course.findUnique({
                    where: { id: courseId },
                    select: { title: true, titleAr: true }
                })

                if (course && user.email) {
                    // Send completion email
                    await sendCourseCompletionEmail({
                        userEmail: user.email,
                        userName: user.name || 'Student',
                        courseName: user.locale === 'ar' && course.titleAr 
                            ? course.titleAr 
                            : course.title,
                        certificateUrl: certificate?.credentialUrl,
                        completionDate: new Date().toLocaleDateString(
                            user.locale === 'ar' ? 'ar-EG' : 'en-US'
                        ),
                        locale: user.locale || 'en',
                    })

                    console.log(`Sent course completion email to ${user.email}`)
                }
            } catch (certError) {
                console.error('Error generating certificate or sending email:', certError)
                // Don't throw - completion should succeed even if cert/email fails
            }
        }

        return NextResponse.json({
            success: true,
            isCompleted: true,
            progress: updatedEnrollment.progress,
            courseCompleted: newProgress === 100,
            certificate: certificate,
            message: newProgress === 100 
                ? 'Congratulations! Course completed!' 
                : 'Lesson marked as completed'
        })
    } catch (error) {
        console.error('Error marking lesson as completed:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Helper function to generate certificate
async function generateCertificate(
    userId: string,
    courseId: string,
    enrollmentId: string
) {
    try {
        // Check if certificate already exists
        const existingCertificate = await prisma.certificate.findUnique({
            where: { enrollmentId: enrollmentId }
        })

        if (existingCertificate) {
            return existingCertificate
        }

        // Generate unique certificate number (format: CERT-YYYYMMDD-XXXXX)
        const date = new Date()
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
        const randomNum = Math.floor(10000 + Math.random() * 90000)
        const certificateNumber = `CERT-${dateStr}-${randomNum}`

        // Create certificate record
        const certificate = await prisma.certificate.create({
            data: {
                enrollmentId: enrollmentId,
                userId: userId,
                courseId: courseId,
                certificateNumber: certificateNumber,
                completionDate: new Date(),
                credentialUrl: `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${certificateNumber}`,
                isPublic: true
            }
        })

        console.log(`Generated certificate ${certificateNumber} for user ${userId}`)
        return certificate
    } catch (error) {
        console.error('Error generating certificate:', error)
        throw error
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const resolvedParams = await params
        const courseId = resolvedParams.id
        const lessonId = resolvedParams.lessonId

        // Check if user is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: courseId
                }
            }
        })

        if (!enrollment) {
            return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 })
        }

        // Update lesson progress to incomplete
        await prisma.lessonProgress.updateMany({
            where: {
                userId: session.user.id,
                lessonId: lessonId
            },
            data: {
                completed: false,
                completedAt: null
            }
        })

        // Recalculate progress
        const totalLessons = await prisma.lesson.count({
            where: { courseId: courseId }
        })

        const completedLessons = await prisma.lessonProgress.count({
            where: {
                userId: session.user.id,
                lesson: { courseId: courseId },
                completed: true
            }
        })

        const newProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

        // Update enrollment
        const updatedEnrollment = await prisma.enrollment.update({
            where: {
                id: enrollment.id
            },
            data: {
                progress: newProgress,
                lastAccessedAt: new Date(),
                completedAt: newProgress === 100 ? enrollment.completedAt : null
            }
        })

        return NextResponse.json({
            success: true,
            isCompleted: false,
            progress: updatedEnrollment.progress,
            message: 'Lesson marked as incomplete'
        })
    } catch (error) {
        console.error('Error marking lesson as incomplete:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
