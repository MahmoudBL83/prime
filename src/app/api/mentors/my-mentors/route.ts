import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type EnrollmentWithCreator = Prisma.EnrollmentGetPayload<{
  include: {
    course: {
      include: {
        creator: {
          include: {
            user: true
          }
        }
      }
    }
  }
}>

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all mentors that the user is enrolled with
    const enrollments: EnrollmentWithCreator[] = await prisma.enrollment.findMany({
      where: {
        userId: session.user.id,
        course: {
          creator: {
            user: {
              is: {
                role: 'CREATOR',
              },
            },
          },
        },
      },
      include: {
        course: {
          include: {
            creator: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      distinct: ['courseId'],
    })

    // Extract unique mentors
    const mentorsMap = new Map()
    enrollments.forEach((enrollment) => {
      const creator = enrollment.course?.creator
      const creatorUser = creator?.user

      if (creator && creatorUser && !mentorsMap.has(creatorUser.id)) {
        mentorsMap.set(creatorUser.id, {
          id: creatorUser.id,
          name: creatorUser.name || creatorUser.arabicName || creatorUser.email,
          email: creatorUser.email,
          image: creatorUser.profileImage,
          arabicName: creatorUser.arabicName,
          role: creatorUser.role,
        })
      }
    })

    const mentors = Array.from(mentorsMap.values())

    return NextResponse.json({
      mentors,
      count: mentors.length,
    })
  } catch (error) {
    console.error('Error fetching mentors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mentors' },
      { status: 500 }
    )
  }
}
