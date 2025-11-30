import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ACTIVE_MATCH_STATUSES = ['accepted', 'ACCEPTED', 'ACTIVE']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all study buddy matches for the user
    const studyBuddyMatches = await prisma.studyBuddyMatch.findMany({
      where: {
        status: {
          in: ACTIVE_MATCH_STATUSES,
        },
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            arabicName: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            arabicName: true,
          },
        },
      },
    })

    // Extract unique study buddies (excluding current user)
    const buddiesMap = new Map()
    studyBuddyMatches.forEach((match) => {
      const buddy = match.user1Id === session.user.id ? match.user2 : match.user1
      if (buddy && !buddiesMap.has(buddy.id)) {
        buddiesMap.set(buddy.id, {
          id: buddy.id,
          name: buddy.name || buddy.arabicName || buddy.email,
          email: buddy.email,
          image: buddy.profileImage,
          arabicName: buddy.arabicName,
        })
      }
    })

    const buddies = Array.from(buddiesMap.values())

    return NextResponse.json({
      buddies,
      count: buddies.length,
    })
  } catch (error) {
    console.error('Error fetching study buddies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch study buddies' },
      { status: 500 }
    )
  }
}
