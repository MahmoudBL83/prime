import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export { POST } from '../enroll/route'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params;
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: session.user.id,
                    courseId: id,
                },
            },
        })

        return NextResponse.json({ enrollment })
    } catch (error) {
        console.error('Enrollment check error:', error)
        return NextResponse.json(
            { error: 'Failed to check enrollment' },
            { status: 500 }
        )
    }
}
