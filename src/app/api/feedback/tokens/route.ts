import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/feedback/tokens
 * Generate anonymous feedback tokens for non-authenticated users
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, purpose } = body

        // Validate required fields
        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Generate a unique token (simplified - in production you'd want JWT or database storage)
        const token = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

        // Store the token using Report model as a workaround
        // Note: This is a temporary solution - ideally would have FeedbackToken model
        const feedbackToken = await prisma.report.create({
            data: {
                reporterId: 'anonymous', // Special ID for anonymous tokens
                type: 'FEEDBACK_TOKEN',
                targetId: email, // Store email in targetId
                reason: JSON.stringify({
                    token,
                    purpose: purpose || 'feedback',
                    expiresAt,
                    used: false
                }),
                status: 'PENDING'
            }
        })

        const tokenData = JSON.parse(feedbackToken.reason)

        return NextResponse.json({
            success: true,
            message: 'Feedback token generated successfully',
            token: tokenData.token,
            expiresAt: tokenData.expiresAt
        })

    } catch (error) {
        console.error('Feedback token generation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/feedback/tokens?token=xxx
 * Validate a feedback token
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        // Find and validate the token using Report model
        const feedbackToken = await prisma.report.findFirst({
            where: {
                type: 'FEEDBACK_TOKEN',
                reason: {
                    contains: token // Search for token in the JSON reason field
                }
            }
        })

        if (!feedbackToken) {
            return NextResponse.json(
                { error: 'Invalid token' },
                { status: 404 }
            )
        }

        const tokenData = JSON.parse(feedbackToken.reason)

        if (tokenData.used) {
            return NextResponse.json(
                { error: 'Token has already been used' },
                { status: 400 }
            )
        }

        if (new Date(tokenData.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: 'Token has expired' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            valid: true,
            email: feedbackToken.targetId, // Email is stored in targetId
            purpose: tokenData.purpose,
            expiresAt: tokenData.expiresAt
        })

    } catch (error) {
        console.error('Feedback token validation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/feedback/tokens
 * Invalidate/use a feedback token
 */
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { token } = body

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        // Find and mark token as used
        const feedbackToken = await prisma.report.findFirst({
            where: {
                type: 'FEEDBACK_TOKEN',
                reason: {
                    contains: token
                }
            }
        })

        if (!feedbackToken) {
            return NextResponse.json(
                { error: 'Token not found' },
                { status: 404 }
            )
        }

        const tokenData = JSON.parse(feedbackToken.reason)
        tokenData.used = true
        tokenData.usedAt = new Date()

        // Update the token data
        const updatedToken = await prisma.report.update({
            where: { id: feedbackToken.id },
            data: { 
                reason: JSON.stringify(tokenData),
                status: 'RESOLVED' // Mark as resolved when used
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Token invalidated successfully'
        })

    } catch (error: any) {
        if (error?.code === 'P2025') {
            return NextResponse.json(
                { error: 'Token not found' },
                { status: 404 }
            )
        }

        console.error('Feedback token invalidation error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
