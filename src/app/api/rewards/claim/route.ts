import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/rewards/claim - Claim a reward
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { winnerId } = body

    if (!winnerId) {
      return NextResponse.json(
        { error: 'winnerId required' },
        { status: 400 }
      )
    }

    // Verify winner belongs to current user
    const winner = await prisma.rewardWinner.findUnique({
      where: { id: winnerId },
      include: { reward: true }
    })

    if (!winner) {
      return NextResponse.json({ error: 'Winner not found' }, { status: 404 })
    }

    if (winner.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (winner.status === 'CLAIMED') {
      return NextResponse.json(
        { error: 'Already claimed' },
        { status: 400 }
      )
    }

    if (winner.status === 'EXPIRED') {
      return NextResponse.json(
        { error: 'Reward expired' },
        { status: 400 }
      )
    }

    // Update to claimed
    const updated = await prisma.rewardWinner.update({
      where: { id: winnerId },
      data: {
        status: 'CLAIMED',
        claimedAt: new Date()
      },
      include: {
        reward: true,
        user: {
          select: {
            id: true,
            name: true,
            arabicName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ winner: updated })
  } catch (error) {
    console.error('Error claiming reward:', error)
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    )
  }
}
