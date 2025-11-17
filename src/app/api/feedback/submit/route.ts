import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/feedback/submit
 * Submit user feedback
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { 
            type, 
            subject, 
            message, 
            rating,
            category,
            pageUrl,
            userAgent,
            additionalData
        } = body

        // Validate required fields
        if (!type || !message) {
            return NextResponse.json(
                { error: 'Type and message are required' },
                { status: 400 }
            )
        }

        // Validate type
        const validTypes = ['bug', 'feature', 'improvement', 'question', 'complaint', 'compliment']
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid feedback type' },
                { status: 400 }
            )
        }

        // Validate rating if provided
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return NextResponse.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Get user information
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Create feedback record using Report model (adapted for feedback)
        const feedback = await prisma.report.create({
            data: {
                reporterId: user.id,
                type: 'FEEDBACK', // Using FEEDBACK as a type
                targetId: 'PLATFORM', // Generic target for platform feedback
                reason: JSON.stringify({
                    type: type,
                    subject: subject || `${type.charAt(0).toUpperCase() + type.slice(1)} Feedback`,
                    message: message,
                    rating: rating,
                    category: category || 'general',
                    pageUrl: pageUrl,
                    userAgent: userAgent || request.headers.get('user-agent'),
                    additionalData: additionalData,
                    priority: rating && rating <= 2 ? 'high' : 'normal'
                }),
                status: 'PENDING'
            }
        })

        // Parse the feedback data from reason field
        const feedbackData = JSON.parse(feedback.reason)
        
        // For high priority feedback (low ratings), you might want to trigger notifications
        if (feedbackData.priority === 'high') {
            // TODO: Send notification to support team
            console.log(`High priority feedback received from ${user.email}: ${feedbackData.subject}`)
        }

        return NextResponse.json({
            success: true,
            message: 'Feedback submitted successfully',
            feedback: {
                id: feedback.id,
                type: feedbackData.type,
                subject: feedbackData.subject,
                status: feedback.status,
                createdAt: feedback.createdAt
            }
        })

    } catch (error) {
        console.error('Feedback submission error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/feedback/submit
 * Get feedback types and categories for form
 */
export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            data: {
                types: [
                    { value: 'bug', label: 'Bug Report', description: 'Report a technical issue or error' },
                    { value: 'feature', label: 'Feature Request', description: 'Suggest a new feature' },
                    { value: 'improvement', label: 'Improvement', description: 'Suggest an improvement to existing features' },
                    { value: 'question', label: 'Question', description: 'Ask a question about the platform' },
                    { value: 'complaint', label: 'Complaint', description: 'Report a problem or concern' },
                    { value: 'compliment', label: 'Compliment', description: 'Share positive feedback' }
                ],
                categories: [
                    { value: 'general', label: 'General' },
                    { value: 'courses', label: 'Courses' },
                    { value: 'ui-ux', label: 'User Interface' },
                    { value: 'performance', label: 'Performance' },
                    { value: 'mobile', label: 'Mobile App' },
                    { value: 'payment', label: 'Payment & Billing' },
                    { value: 'account', label: 'Account & Profile' },
                    { value: 'notifications', label: 'Notifications' },
                    { value: 'accessibility', label: 'Accessibility' },
                    { value: 'security', label: 'Security' }
                ]
            }
        })

    } catch (error) {
        console.error('Feedback config error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
