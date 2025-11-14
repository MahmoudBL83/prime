import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/application
 * Check creator application status
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user already has a creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (creator) {
            return NextResponse.json({
                hasCreatorProfile: true,
                kycStatus: creator.kycStatus,
                contractSigned: creator.contractSigned
            })
        }

        // Check for existing application
        const application = await prisma.creatorApplication.findUnique({
            where: { userId: session.user.id }
        })

        if (!application) {
            return NextResponse.json({
                hasApplication: false,
                canApply: true
            })
        }

        return NextResponse.json({
            hasApplication: true,
            application: {
                id: application.id,
                status: application.status,
                expertise: application.expertise,
                experienceYears: application.experienceYears,
                sampleContentUrl: application.sampleContentUrl,
                portfolioUrl: application.portfolioUrl,
                reviewNotes: application.reviewNotes,
                reviewedAt: application.reviewedAt,
                rejectionReason: application.rejectionReason,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt
            }
        })
    } catch (error) {
        console.error('Error fetching application:', error)
        return NextResponse.json(
            { error: 'Failed to fetch application status' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/creator/application
 * Submit a new creator application
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

        // Validation
        if (!expertise || expertise.trim().length < 10) {
            return NextResponse.json({ 
                error: 'Please provide a detailed description of your expertise (minimum 10 characters)' 
            }, { status: 400 })
        }

        if (!experienceYears || experienceYears < 0) {
            return NextResponse.json({ 
                error: 'Please specify your years of experience' 
            }, { status: 400 })
        }

        if (!sampleContentUrl || !isValidUrl(sampleContentUrl)) {
            return NextResponse.json({ 
                error: 'Please provide a valid URL to your sample content (YouTube, Vimeo, Drive, etc.)' 
            }, { status: 400 })
        }

        if (!motivation || motivation.trim().length < 50) {
            return NextResponse.json({ 
                error: 'Please provide a detailed explanation of why you want to become a creator (minimum 50 characters)' 
            }, { status: 400 })
        }

        // Check if user already has a creator profile
        const existingCreator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (existingCreator) {
            return NextResponse.json({ 
                error: 'You already have a creator profile' 
            }, { status: 400 })
        }

        // Check for existing application
        const existingApplication = await prisma.creatorApplication.findUnique({
            where: { userId: session.user.id }
        })

        if (existingApplication) {
            // If rejected or resubmit required, allow resubmission
            if (existingApplication.status === 'REJECTED' || existingApplication.status === 'RESUBMIT_REQUIRED') {
                // Update existing application
                const updatedApplication = await prisma.creatorApplication.update({
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
                        reviewedAt: null,
                        reviewedBy: null,
                        rejectionReason: null,
                        updatedAt: new Date()
                    }
                })

                return NextResponse.json({
                    success: true,
                    message: 'Application resubmitted successfully',
                    application: {
                        id: updatedApplication.id,
                        status: updatedApplication.status,
                        createdAt: updatedApplication.createdAt
                    }
                }, { status: 200 })
            }

            return NextResponse.json({ 
                error: 'You already have a pending application. Please wait for review.' 
            }, { status: 400 })
        }

        // Create new application
        const application = await prisma.creatorApplication.create({
            data: {
                userId: session.user.id,
                expertise,
                experienceYears,
                sampleContentUrl,
                portfolioUrl,
                socialProof,
                motivation,
                status: 'PENDING'
            }
        })

        // TODO: Send notification to admin about new application
        // TODO: Send confirmation email to applicant

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully! We will review it within 10 business days.',
            application: {
                id: application.id,
                status: application.status,
                createdAt: application.createdAt
            }
        }, { status: 201 })

    } catch (error) {
        console.error('Error submitting application:', error)
        return NextResponse.json(
            { error: 'Failed to submit application' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/creator/application
 * Update pending application (only if in RESUBMIT_REQUIRED status)
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const application = await prisma.creatorApplication.findUnique({
            where: { userId: session.user.id }
        })

        if (!application) {
            return NextResponse.json({ 
                error: 'No application found' 
            }, { status: 404 })
        }

        if (application.status !== 'RESUBMIT_REQUIRED') {
            return NextResponse.json({ 
                error: 'Application cannot be updated in current status' 
            }, { status: 400 })
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

        const updatedApplication = await prisma.creatorApplication.update({
            where: { userId: session.user.id },
            data: {
                ...(expertise && { expertise }),
                ...(experienceYears && { experienceYears }),
                ...(sampleContentUrl && { sampleContentUrl }),
                ...(portfolioUrl && { portfolioUrl }),
                ...(socialProof && { socialProof }),
                ...(motivation && { motivation }),
                status: 'PENDING',
                reviewNotes: null,
                reviewedAt: null,
                reviewedBy: null,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Application updated and resubmitted successfully',
            application: {
                id: updatedApplication.id,
                status: updatedApplication.status,
                updatedAt: updatedApplication.updatedAt
            }
        })

    } catch (error) {
        console.error('Error updating application:', error)
        return NextResponse.json(
            { error: 'Failed to update application' },
            { status: 500 }
        )
    }
}

// Helper function to validate URLs
function isValidUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString)
        return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
        return false
    }
}
