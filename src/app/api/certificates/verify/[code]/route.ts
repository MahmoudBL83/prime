import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/certificates/verify/[code]
 * Public endpoint to verify certificate authenticity
 * No authentication required
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params

        if (!code) {
            return NextResponse.json(
                { error: 'Certificate code is required' },
                { status: 400 }
            )
        }

        // Find certificate by code
        // Code format: YEAR-RANDOM (extracted from CERT-YEAR-RANDOM)
        const certificateNumber = `CERT-${code}`

        const certificate = await prisma.certificate.findUnique({
            where: {
                certificateNumber: certificateNumber
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        arabicName: true,
                        profileImage: true
                        // Don't expose email publicly
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        thumbnail: true,
                        category: true,
                        skillLevel: true,
                        creator: {
                            select: {
                                user: {
                                    select: {
                                        name: true,
                                        arabicName: true,
                                        profileImage: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!certificate) {
            return NextResponse.json(
                {
                    valid: false,
                    error: 'Certificate not found'
                },
                { status: 404 }
            )
        }

        // Check if certificate is public
        if (!certificate.isPublic) {
            return NextResponse.json(
                {
                    valid: false,
                    error: 'This certificate is private'
                },
                { status: 403 }
            )
        }

        return NextResponse.json({
            valid: true,
            certificate: {
                certificateNumber: certificate.certificateNumber,
                studentName: certificate.user.name,
                studentNameAr: certificate.user.arabicName,
                courseName: certificate.course.title,
                courseNameAr: certificate.course.titleAr,
                courseCategory: certificate.course.category,
                courseLevel: certificate.course.skillLevel,
                instructorName: certificate.course.creator.user.name,
                instructorNameAr: certificate.course.creator.user.arabicName,
                completionDate: certificate.completionDate,
                issueDate: certificate.issueDate,
                grade: certificate.grade,
                verificationUrl: certificate.credentialUrl,
                thumbnail: certificate.course.thumbnail
            },
            message: 'Certificate verified successfully'
        })

    } catch (error) {
        console.error('Error verifying certificate:', error)
        return NextResponse.json(
            { error: 'Failed to verify certificate' },
            { status: 500 }
        )
    }
}
