import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all pending message requests for the user
    const messageRequests = await prisma.messageRequest.findMany({
      where: {
        recipientId: session.user.id,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            arabicName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedRequests = messageRequests.map((request) => ({
      id: request.id,
      message: request.message,
      createdAt: request.createdAt,
      sender: {
        id: request.sender.id,
        name: request.sender.name || request.sender.arabicName || request.sender.email,
        email: request.sender.email,
        image: request.sender.profileImage,
        arabicName: request.sender.arabicName,
      },
    }))

    return NextResponse.json({
      requests: formattedRequests,
      count: formattedRequests.length,
    })
  } catch (error) {
    console.error('Error fetching message requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message requests' },
      { status: 500 }
    )
  }
}
