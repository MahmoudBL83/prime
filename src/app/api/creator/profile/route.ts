import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/profile
 * Get creator profile information
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                courses: {
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        thumbnail: true,
                        status: true,
                        createdAt: true
                    }
                },
                _count: {
                    select: {
                        courses: true
                    }
                }
            }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Get user data separately
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                arabicName: true,
                role: true
            }
        });

        return NextResponse.json({
            success: true,
            creator: {
                id: creator.id,
                user: user,
                expertise: creator.expertise,
                languages: creator.languages,
                timezone: creator.timezone,
                kycStatus: creator.kycStatus,
                contractSigned: creator.contractSigned,
                totalEarnings: creator.totalEarnings,
                totalSubscribers: creator.totalSubscribers,
                availableForMeetings: creator.availableForMeetings,
                meetingTypes: creator.meetingTypes,
                hourlyRate: creator.hourlyRate,
                socialLinks: creator.socialLinks,
                certifications: creator.certifications,
                courses: creator.courses || [],
                courseCount: creator._count?.courses || 0,
                createdAt: creator.createdAt,
                updatedAt: creator.updatedAt
            }
        })

    } catch (error) {
        console.error('Creator profile API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/creator/profile
 * Update basic creator profile information
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { 
            expertise, 
            languages, 
            timezone,
            socialLinks,
            availableForMeetings,
            meetingTypes,
            hourlyRate
        } = body

        // Check if creator exists
        const existingCreator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!existingCreator) {
            return NextResponse.json(
                { error: 'Creator profile not found' },
                { status: 404 }
            )
        }

        // Update creator profile
        const updatedCreator = await prisma.creator.update({
            where: { userId: session.user.id },
            data: {
                expertise: expertise !== undefined ? expertise : existingCreator.expertise,
                languages: languages !== undefined ? languages : existingCreator.languages,
                timezone: timezone !== undefined ? timezone : existingCreator.timezone,
                socialLinks: socialLinks !== undefined ? socialLinks : existingCreator.socialLinks,
                availableForMeetings: availableForMeetings !== undefined ? availableForMeetings : existingCreator.availableForMeetings,
                meetingTypes: meetingTypes !== undefined ? meetingTypes : existingCreator.meetingTypes,
                hourlyRate: hourlyRate !== undefined ? hourlyRate : existingCreator.hourlyRate,
                updatedAt: new Date()
            }
        })

        // Get updated user data separately
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
                arabicName: true
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            creator: {
                id: updatedCreator.id,
                user: user,
                expertise: updatedCreator.expertise,
                languages: updatedCreator.languages,
                timezone: updatedCreator.timezone,
                socialLinks: updatedCreator.socialLinks,
                availableForMeetings: updatedCreator.availableForMeetings,
                meetingTypes: updatedCreator.meetingTypes,
                hourlyRate: updatedCreator.hourlyRate,
                updatedAt: updatedCreator.updatedAt
            }
        })

    } catch (error) {
        console.error('Creator profile update error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
