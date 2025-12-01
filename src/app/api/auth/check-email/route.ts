import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true }
        })

        return NextResponse.json({ exists: !!user })
    } catch (error) {
        console.error('Email check error:', error)
        return NextResponse.json({ exists: false })
    }
}
