import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await req.json()
        const {
            name,
            arabicName,
            bio,
            expertise,
            profileImage,
            coverImage,
            socialLinks,
            basicMonthlyPrice,
            premiumMonthlyPrice,
            vipMonthlyPrice
        } = body

        // Check if user exists first
        const existingUser = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!existingUser) {
            console.error('User not found:', session.user.id)
            return NextResponse.json(
                { error: 'User not found in database' },
                { status: 404 }
            )
        }

        console.log('Updating profile for user ID:', session.user.id)

        // Update User table (use upsert to handle edge cases)
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                profileImage: profileImage || null,
                arabicName: arabicName || null,
                bio: bio || null,
            }
        })

        // Check if user is a creator
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id },
            include: { channels: true }
        })

        if (creator) {
            // Update Creator table
            await prisma.creator.update({
                where: { id: creator.id },
                data: {
                    expertise,
                    socialLinks: socialLinks ? JSON.stringify(socialLinks) : undefined,
                    basicMonthlyPrice: basicMonthlyPrice || null,
                    premiumMonthlyPrice: premiumMonthlyPrice || null,
                    vipMonthlyPrice: vipMonthlyPrice || null,
                }
            })

            // Update or create CreatorChannel if it exists
            if (creator.channels && creator.channels.length > 0) {
                await prisma.creatorChannel.update({
                    where: { id: creator.channels[0].id },
                    data: {
                        name: name,
                        nameAr: arabicName || null,
                        description: bio || null,
                        coverImage: coverImage || null,
                    }
                })
            } else {
                // Create CreatorChannel if doesn't exist
                await prisma.creatorChannel.create({
                    data: {
                        creatorId: creator.id,
                        name: name,
                        nameAr: arabicName || null,
                        description: bio || null,
                        coverImage: coverImage || null,
                        tiers: {
                            bronze: { price: basicMonthlyPrice || 49, benefits: [] },
                            silver: { price: premiumMonthlyPrice || 99, benefits: [] },
                            gold: { price: vipMonthlyPrice || 199, benefits: [] }
                        }
                    }
                })
            }
        }

        return NextResponse.json({
            success: true,
            user: updatedUser
        })

    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        )
    }
}
