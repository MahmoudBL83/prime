import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/creator/apply
 * Submit creator application
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const {
            expertise,
            experienceYears,
            sampleContentUrl,
            portfolioUrl,
            socialProof,
            motivation
        } = body

        // Validate required fields
        if (!expertise || !motivation) {
            return NextResponse.json(
                { error: 'Expertise and motivation are required' },
                { status: 400 }
            )
        }

        // Check if user already has an application
        const existingApplication = await prisma.creatorApplication.findUnique({
            where: { userId: session.user.id }
        })

        if (existingApplication) {
            // Update existing application if it was rejected or requires resubmission
            if (existingApplication.status === 'REJECTED' || existingApplication.status === 'RESUBMIT_REQUIRED') {
                const updated = await prisma.creatorApplication.update({
                    where: { userId: session.user.id },
                    data: {
                        expertise,
                        experienceYears,
                        sampleContentUrl,
                        portfolioUrl,
                        socialProof,
                        motivation,
                        status: 'PENDING',
                        reviewNotes: null,
                        rejectionReason: null,
                        updatedAt: new Date()
                    }
                })

                return NextResponse.json({
                    message: 'Application resubmitted successfully',
                    application: updated
                })
            }

            return NextResponse.json(
                {
                    error: 'You already have a pending or approved application',
                    status: existingApplication.status
                },
                { status: 400 }
            )
        }

        // Create new application
        const application = await prisma.creatorApplication.create({
            data: {
                userId: session.user.id,
                expertise,
                experienceYears: experienceYears ? parseInt(experienceYears) : null,
                sampleContentUrl,
                portfolioUrl,
                socialProof,
                motivation,
                status: 'PENDING'
            }
        })

        return NextResponse.json({
            message: 'Application submitted successfully',
            application
        })

    } catch (error) {
        console.error('Creator application error:', error)
        return NextResponse.json(
            { error: 'Failed to submit application' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/creator/apply
 * Remove current user's creator application so they can reapply
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const existingApplication = await prisma.creatorApplication.findUnique({
            where: { userId: session.user.id }
        })

        if (!existingApplication) {
            return NextResponse.json(
                { error: 'No application found' },
                { status: 404 }
            )
        }

        await prisma.creatorApplication.delete({
            where: { userId: session.user.id }
        })

        return NextResponse.json({
            message: 'Application removed successfully'
        })

    } catch (error) {
        console.error('Delete creator application error:', error)
        return NextResponse.json(
            { error: 'Failed to remove application' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/creator/apply
 * Get current user's creator application status
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const application = await prisma.creatorApplication.findUnique({
            where: { userId: session.user.id }
        })

        if (!application) {
            return NextResponse.json({
                hasApplication: false,
                application: null
            })
        }

        return NextResponse.json({
            hasApplication: true,
            application
        })

    } catch (error) {
        console.error('Get creator application error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch application' },
            { status: 500 }
        )
    }
}
