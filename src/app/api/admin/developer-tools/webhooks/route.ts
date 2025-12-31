import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { randomBytes } from 'crypto'
import { webhooks, WebhookConfig } from './data'

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json(webhooks)
    } catch (error) {
        console.error('Failed to fetch webhooks:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { name, url, events } = await req.json()

        if (!name || !url || !events || events.length === 0) {
            return NextResponse.json({ error: 'Name, URL, and events are required' }, { status: 400 })
        }

        // Validate URL
        try {
            new URL(url)
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
        }

        const newWebhook: WebhookConfig = {
            id: Date.now().toString(),
            name,
            url,
            events,
            secret: 'whsec_' + randomBytes(32).toString('hex'),
            status: 'active',
            createdAt: new Date().toISOString(),
            failureCount: 0
        }

        webhooks.push(newWebhook)

        return NextResponse.json(newWebhook, { status: 201 })
    } catch (error) {
        console.error('Failed to create webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url)
        const webhookId = url.pathname.split('/').pop()
        const { status } = await req.json()

        if (!webhookId) {
            return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
        }

        const webhook = webhooks.find(w => w.id === webhookId)
        if (!webhook) {
            return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }

        if (status && ['active', 'inactive'].includes(status)) {
            webhook.status = status
        }

        return NextResponse.json(webhook)
    } catch (error) {
        console.error('Failed to update webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || session.user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url)
        const webhookId = url.pathname.split('/').pop()

        if (!webhookId) {
            return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
        }

        const index = webhooks.findIndex(w => w.id === webhookId)
        if (index === -1) {
            return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }

        webhooks.splice(index, 1)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete webhook:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}