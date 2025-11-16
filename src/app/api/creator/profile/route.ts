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
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                        arabicName: true,
                        role: true
                    }
                },
                courses: {
                    select: {
                        id: true,
                        title: true,
                        arabicTitle: true,
                        thumbnail: true,
                        status: true,
                        studentsCount: true,
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

        return NextResponse.json({
            success: true,
            creator: {
                id: creator.id,
                user: creator.user,
                expertise: creator.expertise,
                languages: creator.languages,
                timezone: creator.timezone,
                bio: creator.bio,
                arabicBio: creator.arabicBio,
                kycStatus: creator.kycStatus,
                contractSigned: creator.contractSigned,
                totalEarnings: creator.totalEarnings,
                totalSubscribers: creator.totalSubscribers,
                availableForMeetings: creator.availableForMeetings,
                meetingTypes: creator.meetingTypes,
                hourlyRate: creator.hourlyRate,
                socialLinks: creator.socialLinks,
                certifications: creator.certifications,
                courses: creator.courses,
                courseCount: creator._count.courses,
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
            bio, 
            arabicBio, 
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
                bio: bio !== undefined ? bio : existingCreator.bio,
                arabicBio: arabicBio !== undefined ? arabicBio : existingCreator.arabicBio,
                expertise: expertise !== undefined ? expertise : existingCreator.expertise,
                languages: languages !== undefined ? languages : existingCreator.languages,
                timezone: timezone !== undefined ? timezone : existingCreator.timezone,
                socialLinks: socialLinks !== undefined ? socialLinks : existingCreator.socialLinks,
                availableForMeetings: availableForMeetings !== undefined ? availableForMeetings : existingCreator.availableForMeetings,
                meetingTypes: meetingTypes !== undefined ? meetingTypes : existingCreator.meetingTypes,
                hourlyRate: hourlyRate !== undefined ? hourlyRate : existingCreator.hourlyRate,
                updatedAt: new Date()
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        profileImage: true,
                        arabicName: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            creator: {
                id: updatedCreator.id,
                user: updatedCreator.user,
                bio: updatedCreator.bio,
                arabicBio: updatedCreator.arabicBio,
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
