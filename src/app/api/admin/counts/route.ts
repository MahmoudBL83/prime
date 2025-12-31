import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get counts for badges - using existing models or mock for now
        const [
            editorialCount,
            bansCount,
            appealsCount,
            supportCount,
            dmcaCount,
            channelsCount,
            payoutsCount
        ] = await Promise.all([
            // Editorial: pending courses
            prisma.course.count({ where: { status: 'UNDER_REVIEW' } }),
            // Bans: mock for now
            Promise.resolve(4),
            // Appeals: mock for now
            Promise.resolve(3),
            // Support: mock for now
            Promise.resolve(3),
            // DMCA: mock for now
            Promise.resolve(2),
            // Channels: mock for now
            Promise.resolve(5),
            // Payouts: mock for now
            Promise.resolve(1)
        ])

        return NextResponse.json({
            editorial: editorialCount,
            bans: bansCount,
            appeals: appealsCount,
            support: supportCount,
            dmca: dmcaCount,
            channels: channelsCount,
            payouts: payoutsCount
        })
    } catch (error) {
        console.error('Failed to fetch admin counts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}