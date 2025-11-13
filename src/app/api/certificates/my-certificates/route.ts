import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/certificates/my-certificates
 * Get all certificates for the authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const certificates = await prisma.certificate.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                course: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        thumbnail: true,
                        category: true,
                        level: true,
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
            },
            orderBy: {
                issueDate: 'desc'
            }
        })

        return NextResponse.json({
            certificates,
            count: certificates.length
        })

    } catch (error) {
        console.error('Error fetching certificates:', error)
        return NextResponse.json(
            { error: 'Failed to fetch certificates' },
            { status: 500 }
        )
    }
}
