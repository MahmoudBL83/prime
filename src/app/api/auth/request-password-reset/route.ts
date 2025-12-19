import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const resetSchema = z.object({
    email: z.string().email()
})

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const validation = resetSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
        }

        const { email } = validation.data

        const user = await prisma.user.findUnique({
            where: { email }
        })

        // Security: Always return success even if user not found to prevent enumeration
        if (!user) {
            return NextResponse.json({ success: true, message: 'If an account exists, a reset link has been sent.' })
        }

        // TODO: Integrate with actual email service (SendGrid/AWS SES)
        // For now, we mock the email sending
        console.log(`[MOCK EMAIL] Password reset requested for ${email}. Token: ${Math.random().toString(36).substring(7)}`)

        // In a real app, we would create a verification token in the DB here
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetRequired: true
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Password reset link has been sent to your email.'
        })

    } catch (error) {
        console.error('Password reset request error:', error)
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
    }
}
