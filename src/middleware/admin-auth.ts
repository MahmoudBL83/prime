import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function adminMiddleware(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.redirect(new URL('/auth/login', req.url))
        }

        if (session.user.role !== UserRole.ADMIN) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        return NextResponse.next()
    } catch (error) {
        console.error('Admin middleware error:', error)
        return NextResponse.redirect(new URL('/auth/login', req.url))
    }
}

export function withAdminAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        const authResult = await adminMiddleware(req)

        if (authResult.status !== 200) {
            return authResult
        }

        return handler(req)
    }
}
