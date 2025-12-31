import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'

// Import the webhooks array (in production, this would be from a database)
import { webhooks } from '../../data'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: webhookId } = await params
        const webhook = webhooks.find(w => w.id === webhookId)

        if (!webhook) {
            return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }

        // Create test payload
        const testPayload = {
            event: 'test.webhook',
            timestamp: new Date().toISOString(),
            data: {
                message: 'This is a test webhook from Prime Admin',
                admin: session.user.email,
                webhookId: webhook.id
            }
        }

        try {
            // Send test webhook
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': 'test_signature', // In production, generate proper signature
                    'X-Webhook-Event': 'test.webhook'
                },
                body: JSON.stringify(testPayload)
            })

            // Update webhook stats
            webhook.lastTriggered = new Date().toISOString()
            if (!response.ok) {
                webhook.failureCount++
                if (webhook.failureCount >= 3) {
                    webhook.status = 'failed'
                }
            } else {
                webhook.failureCount = 0
                webhook.status = 'active'
            }

            return NextResponse.json({
                success: response.ok,
                status: response.status,
                message: response.ok ? 'Test webhook sent successfully' : 'Test webhook failed'
            })
        } catch (error) {
            // Update failure stats
            webhook.failureCount++
            if (webhook.failureCount >= 3) {
                webhook.status = 'failed'
            }

            return NextResponse.json({
                success: false,
                error: 'Failed to send webhook',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, { status: 500 })
        }
    } catch (error) {
        console.error('Failed to test webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}