import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { submitProject } from '@/services/leaderboardService'
import { prisma } from '@/lib/prisma'

// GET /api/projects?courseId=xxx&userId=xxx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId') || session.user.id

    const where: any = {}
    if (courseId) where.courseId = courseId
    if (userId) where.userId = userId

    const submissions = await prisma.projectSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            profileImage: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            titleAr: true
          }
        }
      }
    })

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Submit project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, projectId, title, description, fileUrls } = body

    if (!courseId || !projectId || !title) {
      return NextResponse.json(
        { error: 'courseId, projectId, and title required' },
        { status: 400 }
      )
    }

    const submission = await submitProject(
      session.user.id,
      courseId,
      projectId,
      { title, description, fileUrls }
    )

    return NextResponse.json({ submission })
  } catch (error) {
    console.error('Error submitting project:', error)
    return NextResponse.json(
      { error: 'Failed to submit project' },
      { status: 500 }
    )
  }
}
