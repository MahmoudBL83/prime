import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type CourseEnrollmentSelection = {
  courseId: string
}

type EnrollmentWithUser = {
  userId: string
  user: {
    id: string
    name: string | null
    email: string
    profileImage: string | null
    arabicName: string | null
  }
}

type RecommendedUser = {
  id: string
  name: string
  email: string
  image: string | null
  arabicName: string | null
  mutualConnections: number
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's existing conversations to exclude
    const existingConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        participants: {
          where: {
            userId: {
              not: session.user.id,
            },
          },
          select: {
            userId: true,
          },
        },
      },
    })

    const existingUserIds = new Set(
      existingConversations.flatMap((conv) =>
        conv.participants.map((p) => p.userId)
      )
    )
    existingUserIds.add(session.user.id)

    // Get users from same courses (potential connections)
    const userCourses: CourseEnrollmentSelection[] = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        courseId: true,
      },
    })

    const courseIds = userCourses.map((c) => c.courseId)

    // Find users enrolled in same courses
    const sameCourseUsers = await prisma.enrollment.findMany({
      where: {
        courseId: {
          in: courseIds,
        },
        userId: {
          notIn: Array.from(existingUserIds),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            arabicName: true,
          },
        },
      },
      distinct: ['userId'],
      take: 20,
    }) as EnrollmentWithUser[]

    // Calculate mutual connections and format response
    const recommendedUsers: RecommendedUser[] = await Promise.all(
      sameCourseUsers.map(async (enrollment: EnrollmentWithUser) => {
        // Count mutual connections (users both have conversations with)
        const mutualConnectionsCount = await prisma.conversation.count({
          where: {
            AND: [
              {
                participants: {
                  some: {
                    userId: session.user.id,
                  },
                },
              },
              {
                participants: {
                  some: {
                    userId: enrollment.userId,
                  },
                },
              },
            ],
          },
        })

        return {
          id: enrollment.user.id,
          name: enrollment.user.name || enrollment.user.arabicName || enrollment.user.email,
          email: enrollment.user.email,
          image: enrollment.user.profileImage,
          arabicName: enrollment.user.arabicName,
          mutualConnections: mutualConnectionsCount,
        } as RecommendedUser
      })
    )

    // Sort by mutual connections (descending)
    recommendedUsers.sort(
      (a: RecommendedUser, b: RecommendedUser) => b.mutualConnections - a.mutualConnections
    )

    return NextResponse.json({
      users: recommendedUsers.slice(0, 15),
      count: recommendedUsers.length,
    })
  } catch (error) {
    console.error('Error fetching recommended users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommended users' },
      { status: 500 }
    )
  }
}
