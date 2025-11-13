import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Fetch liked courses
        const interactions = await prisma.courseInteraction.findMany({
            where: {
                userId: session.user.id,
                liked: true
            },
            include: {
                course: {
                    include: {
                        creator: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
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
                updatedAt: 'desc'
            }
        })

        const courses = interactions.map(interaction => interaction.course)

        return NextResponse.json({
            success: true,
            courses,
            count: courses.length
        })
    } catch (error) {
        console.error('Error fetching liked courses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch liked courses' },
            { status: 500 }
        )
    }
}
