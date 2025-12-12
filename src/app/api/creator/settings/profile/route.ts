import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/creator/settings/profile
 * Fetch creator profile settings
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

        // First verify the user exists
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json(
                { 
                    error: 'Session expired or invalid',
                    message: 'Your session is no longer valid. Please sign out and sign in again.',
                    code: 'STALE_SESSION',
                    action: 'SIGN_IN_REQUIRED'
                },
                { status: 401 }
            )
        }

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profileImage: true,
                        arabicName: true,
                        bio: true
                    }
                }
            }
        })

        if (!creator) {
            return NextResponse.json({
                success: true,
                creator: null,
                message: 'Creator profile not found. Please create one.'
            })
        }

        return NextResponse.json({
            success: true,
            creator: {
                id: creator.id,
                expertise: creator.expertise,
                languages: creator.languages,
                timezone: creator.timezone,
                kycStatus: creator.kycStatus,
                availableForMeetings: creator.availableForMeetings,
                meetingTypes: creator.meetingTypes,
                hourlyRate: creator.hourlyRate,
                socialLinks: creator.socialLinks,
                certifications: creator.certifications,
                monthlyPrice: creator.monthlyPrice,
                user: creator.user
            }
        })

    } catch (error) {
        console.error('Failed to fetch profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/creator/settings/profile
 * Update creator profile settings including profile image
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        console.log('Session:', session ? 'Found' : 'Not found')
        console.log('Session user:', session?.user)

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
            profileImage,
            socialLinks,
            availableForMeetings,
            meetingTypes,
            hourlyRate,
            name,
            arabicName,
            bio,
            monthlyPrice
        } = body

        console.log('Session user ID:', session.user.id)
        console.log('Request body:', { expertise, languages, timezone, profileImage: profileImage ? 'provided' : 'not provided' })

        // First, verify the user exists
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        console.log('User found:', user ? 'Yes' : 'No')

        if (!user) {
            console.error('User not found for ID:', session.user.id)
            console.error('This indicates a stale session. User needs to sign in again.')
            return NextResponse.json(
                { 
                    error: 'Session expired or invalid',
                    message: 'Your session is no longer valid. Please sign out and sign in again.',
                    code: 'STALE_SESSION',
                    userId: session.user.id,
                    action: 'SIGN_IN_REQUIRED'
                },
                { status: 401 }
            )
        }

        // Update user profile fields if provided
        const userUpdateData: any = {}
        if (profileImage !== undefined) userUpdateData.profileImage = profileImage
        if (name !== undefined) userUpdateData.name = name
        if (arabicName !== undefined) userUpdateData.arabicName = arabicName
        if (bio !== undefined) userUpdateData.bio = bio
        
        if (Object.keys(userUpdateData).length > 0) {
            await prisma.user.update({
                where: { id: session.user.id },
                data: userUpdateData
            })
        }

        // Get or create creator profile
        let creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        console.log('Creator found:', creator ? 'Yes' : 'No')

        if (!creator) {
            // Create a new creator profile if it doesn't exist
            try {
                console.log('Creating new creator profile for user:', session.user.id)
                
                creator = await prisma.creator.create({
                    data: {
                        user: {
                            connect: {
                                id: session.user.id
                            }
                        },
                        expertise: expertise || '',
                        languages: languages || '',
                        timezone: timezone || 'UTC',
                        kycStatus: 'NOT_STARTED',
                        contractSigned: false,
                        totalEarnings: 0,
                        totalSubscribers: 0,
                        availableForMeetings: availableForMeetings ?? true,
                        meetingTypes: meetingTypes || [],
                        hourlyRate: hourlyRate || 0,
                        socialLinks: socialLinks || {}
                    }
                })

                console.log('Creator profile created successfully:', creator.id)

                return NextResponse.json({
                    success: true,
                    message: 'Creator profile created successfully',
                    creator: {
                        id: creator.id,
                        expertise: creator.expertise,
                        languages: creator.languages,
                        timezone: creator.timezone,
                        availableForMeetings: creator.availableForMeetings,
                        meetingTypes: creator.meetingTypes,
                        hourlyRate: creator.hourlyRate,
                        socialLinks: creator.socialLinks
                    }
                })
            } catch (createError: any) {
                console.error('Failed to create creator profile:', createError)
                console.error('Error code:', createError.code)
                console.error('Error meta:', createError.meta)
                return NextResponse.json(
                    { 
                        error: 'Failed to create creator profile. Please contact support.',
                        code: createError.code,
                        details: createError.message
                    },
                    { status: 500 }
                )
            }
        }

        // Update existing creator profile
        const creatorUpdateData: any = {}
        if (expertise !== undefined) creatorUpdateData.expertise = expertise
        if (languages !== undefined) creatorUpdateData.languages = languages
        if (timezone !== undefined) creatorUpdateData.timezone = timezone
        if (availableForMeetings !== undefined) creatorUpdateData.availableForMeetings = availableForMeetings
        if (meetingTypes !== undefined) creatorUpdateData.meetingTypes = meetingTypes
        if (hourlyRate !== undefined) creatorUpdateData.hourlyRate = hourlyRate
        if (socialLinks !== undefined) creatorUpdateData.socialLinks = socialLinks
        if (monthlyPrice !== undefined) creatorUpdateData.monthlyPrice = monthlyPrice

        const updatedCreator = await prisma.creator.update({
            where: { id: creator.id },
            data: creatorUpdateData,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        profileImage: true,
                        arabicName: true,
                        bio: true
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            creator: {
                id: updatedCreator.id,
                expertise: updatedCreator.expertise,
                languages: updatedCreator.languages,
                timezone: updatedCreator.timezone,
                availableForMeetings: updatedCreator.availableForMeetings,
                meetingTypes: updatedCreator.meetingTypes,
                hourlyRate: updatedCreator.hourlyRate,
                socialLinks: updatedCreator.socialLinks,
                user: updatedCreator.user
            }
        })

    } catch (error) {
        console.error('Failed to update profile:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
