import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/creator/settings/payout
 * Update payout information
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
        const { bankName, bankAccountIBAN } = body

        // Get creator profile
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        if (!creator) {
            return NextResponse.json(
                { error: 'Creator profile not found. Please set up your creator profile first.' },
                { status: 404 }
            )
        }

        // Validate required fields
        if (!bankName || !bankAccountIBAN) {
            return NextResponse.json(
                { error: 'Bank name and IBAN are required' },
                { status: 400 }
            )
        }

        // Update payout information
        await prisma.creator.update({
            where: { id: creator.id },
            data: {
                bankName,
                bankAccountIBAN
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Payout information updated successfully'
        })

    } catch (error) {
        console.error('Failed to update payout information:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
